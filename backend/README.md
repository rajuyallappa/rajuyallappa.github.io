Serverless backend for Raju's portfolio AI chat

Overview
- Python AWS Lambda that proxies to OpenAI Chat Completions API.
- Retrieves OpenAI API key from AWS Secrets Manager.
- Deployed via AWS SAM.

Files
- app.py - Lambda handler
- requirements.txt - Python deps
- template.yaml - SAM template

Required GitHub secrets (add to repo Settings -> Secrets -> Actions):
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (e.g. us-east-2)
- SAM_S3_BUCKET (S3 bucket for SAM packaging)
- AI_SECRET_NAME (name of Secrets Manager secret that holds the OpenAI key)
- ALLOWED_ORIGIN (optional, set to your site URL, e.g. https://rajuyallappa.github.io)

Local deploy (if you prefer):
1. Ensure AWS CLI is configured locally.
2. Create Secrets Manager secret containing the OpenAI key. Example using AWS CLI:
   aws secretsmanager create-secret --name my-openai-key --secret-string '{"api_key":"sk-..."}'
3. Build and deploy with SAM:
   cd backend
   sam build
   sam deploy --stack-name personal-assistant-chatgpt-stack --s3-bucket <your-bucket> --capabilities CAPABILITY_IAM --parameter-overrides SecretName=my-openai-key AllowedOrigin=https://rajuyallappa.github.io

Client integration
- Update VITE_AI_API_URL in your .env to the deployed API Gateway URL (see CloudFormation outputs after deploy) or set ALLOWED_ORIGIN accordingly.

Security
- Do NOT commit the OpenAI key in the repository. Store it in Secrets Manager and reference via AI_SECRET_NAME.
