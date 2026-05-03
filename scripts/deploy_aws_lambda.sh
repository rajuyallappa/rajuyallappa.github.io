#!/usr/bin/env zsh
set -euo pipefail

# Deploy Python Lambda + HTTP API (API Gateway v2) from local machine
# - Requires AWS CLI configured (credentials & region) and Python 3
# - Does NOT add your OpenAI key; set up the secret later in Secrets Manager
# Usage: ./scripts/deploy_aws_lambda.sh

# Configurable values (edit here or export before running)
REGION=${REGION:-us-east-1}
SECRET_NAME=${SECRET_NAME:-raju-openai-secret}
FUNC_NAME=${FUNC_NAME:-raju-chat-proxy}
ROLE_NAME=${ROLE_NAME:-raju-lambda-role}
API_NAME=${API_NAME:-raju-chat-api}
STAGE=${STAGE:-prod}
ALLOWED_ORIGIN=${ALLOWED_ORIGIN:-https://rajuyallappa.github.io}
RUNTIME=${RUNTIME:-python3.10}
HANDLER=${HANDLER:-app.handler}

echo "Using REGION=$REGION FUNC_NAME=$FUNC_NAME API_NAME=$API_NAME"

command -v aws >/dev/null || { echo "aws CLI not found. Install and configure AWS CLI."; exit 1; }
command -v python3 >/dev/null || { echo "python3 not found."; exit 1; }

# Verify AWS credentials
aws sts get-caller-identity --region "$REGION" >/dev/null || { echo "AWS not configured or cannot call STS in region $REGION."; exit 1; }

# Create IAM role if missing
if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "Creating IAM role $ROLE_NAME"
  cat > /tmp/lambda-trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file:///tmp/lambda-trust.json --region "$REGION"
  aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole --region "$REGION"
  aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite --region "$REGION"
  echo "Waiting for role to propagate..."
  sleep 10
else
  echo "IAM role $ROLE_NAME already exists"
fi

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text --region "$REGION")

# Prepare package
echo "Preparing deployment package"
mkdir -p backend/package
if [ ! -f backend/requirements.txt ]; then
  echo "requests" > backend/requirements.txt
fi
python3 -m pip install -r backend/requirements.txt -t backend/package
cp backend/app.py backend/package/
cd backend/package
zip -r9 ../function.zip . >/dev/null
cd - >/dev/null

# Create or update Lambda function
if aws lambda get-function --function-name "$FUNC_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "Updating existing Lambda function $FUNC_NAME"
  aws lambda update-function-code --function-name "$FUNC_NAME" --zip-file fileb://backend/function.zip --region "$REGION"
  aws lambda update-function-configuration --function-name "$FUNC_NAME" --environment "Variables={SECRET_NAME=$SECRET_NAME,ALLOWED_ORIGIN=$ALLOWED_ORIGIN}" --region "$REGION"
else
  echo "Creating Lambda function $FUNC_NAME"
  aws lambda create-function \
    --function-name "$FUNC_NAME" \
    --runtime "$RUNTIME" \
    --handler "$HANDLER" \
    --zip-file fileb://backend/function.zip \
    --role "$ROLE_ARN" \
    --timeout 30 \
    --environment "Variables={SECRET_NAME=$SECRET_NAME,ALLOWED_ORIGIN=$ALLOWED_ORIGIN}" \
    --region "$REGION"
fi

# Create or reuse HTTP API
API_ID=$(aws apigatewayv2 get-apis --region "$REGION" --query "Items[?Name=='$API_NAME'].ApiId" --output text)
if [ -z "$API_ID" ]; then
  echo "Creating HTTP API $API_NAME"
  API_ID=$(aws apigatewayv2 create-api --name "$API_NAME" --protocol-type HTTP --region "$REGION" --query 'ApiId' --output text)
else
  echo "Reusing API $API_NAME ($API_ID)"
fi

FUNC_ARN=$(aws lambda get-function --function-name "$FUNC_NAME" --query 'Configuration.FunctionArn' --output text --region "$REGION")

# Create integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id "$API_ID" \
  --integration-type AWS_PROXY \
  --integration-uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/${FUNC_ARN}/invocations" \
  --payload-format-version "2.0" \
  --region "$REGION" \
  --query 'IntegrationId' --output text)

# Create route
aws apigatewayv2 create-route --api-id "$API_ID" --route-key "POST /chat" --target "integrations/$INTEGRATION_ID" --region "$REGION" >/dev/null || true

# Deploy
DEPLOYMENT_ID=$(aws apigatewayv2 create-deployment --api-id "$API_ID" --region "$REGION" --query 'DeploymentId' --output text)
aws apigatewayv2 create-stage --api-id "$API_ID" --stage-name "$STAGE" --deployment-id "$DEPLOYMENT_ID" --region "$REGION"

# Grant permission for API Gateway to invoke Lambda
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$REGION")
PERM_RESOURCE_ARN="arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/POST/chat"
set +e
aws lambda add-permission --function-name "$FUNC_NAME" --principal apigateway.amazonaws.com --statement-id apigw-invoke-$(date +%s) --action "lambda:InvokeFunction" --source-arn "$PERM_RESOURCE_ARN" --region "$REGION" >/dev/null 2>&1
set -e

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}/chat"
echo "\nDeployment complete. API endpoint:\n$API_URL\n"

echo "Notes:"
echo " - The Lambda expects a Secrets Manager secret named $SECRET_NAME to contain your OpenAI API key (JSON {\"api_key\":\"...\"} or plain string)."
echo " - To create the secret now, run:\n  aws secretsmanager create-secret --name $SECRET_NAME --secret-string '{\"api_key\":\"<YOUR_KEY>\"}' --region $REGION"
echo " - Update your frontend to POST to: $API_URL"
