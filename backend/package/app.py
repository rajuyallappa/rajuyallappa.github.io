import os
import json
import boto3
import requests
from botocore.exceptions import ClientError

SECRET_NAME = os.environ.get("SECRET_NAME")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")

_cached_api_key = None


def get_openai_api_key():
    global _cached_api_key
    if _cached_api_key:
        return _cached_api_key
    if not SECRET_NAME:
        raise RuntimeError("SECRET_NAME environment variable is not set")
    client = boto3.client("secretsmanager")
    try:
        resp = client.get_secret_value(SecretId=SECRET_NAME)
    except ClientError as e:
        raise
    secret = resp.get("SecretString")
    # If the secret is a JSON object with key "api_key", use that, otherwise treat the whole string as the key
    try:
        parsed = json.loads(secret)
        key = parsed.get("api_key") or parsed.get("OPENAI_API_KEY") or parsed.get("openai_api_key")
        if key:
            _cached_api_key = key
            return _cached_api_key
    except Exception:
        pass
    _cached_api_key = secret
    return _cached_api_key


def make_response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body),
    }


def handler(event, context):
    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Methods": "POST,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": "",
        }

    try:
        payload = {}
        if event.get("body"):
            try:
                payload = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
            except Exception:
                return make_response(400, {"success": False, "error": "Invalid JSON body"})

        message = payload.get("message")
        history = payload.get("history") or []

        if not message:
            return make_response(400, {"success": False, "error": "Missing 'message' in request body"})

        api_key = get_openai_api_key()
        if not api_key:
            return make_response(500, {"success": False, "error": "OpenAI API key not available"})

        # Build messages array for OpenAI
        messages = []
        # Optionally include prior conversation history
        for item in history:
            role = item.get("role") if isinstance(item, dict) else "user"
            content = item.get("content") if isinstance(item, dict) else str(item)
            messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": message})

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        data = {
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "max_tokens": 800,
            "temperature": 0.7,
        }

        resp = requests.post(url, headers=headers, json=data, timeout=30)
        resp.raise_for_status()
        j = resp.json()
        content = ""
        try:
            content = j["choices"][0]["message"]["content"]
        except Exception:
            content = j.get("error", {}).get("message", "No response from OpenAI")

        return make_response(200, {"success": True, "message": content})

    except ClientError as e:
        return make_response(500, {"success": False, "error": str(e)})
    except Exception as e:
        return make_response(500, {"success": False, "error": str(e)})
