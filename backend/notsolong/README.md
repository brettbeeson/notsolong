## Testing API with httpie:

You can use httpie to test the backend API endpoints. Here are some example commands:
```
# Get a token for a existing user
LOGIN_JSON=$(http --print=b POST http://localhost:8000/api/auth/login email=brettbeeson@fastmail.com password=XXXXXXX)
echo "$LOGIN_JSON" | jq .
# 2. Grab the access token from the JSON (jq recommended)
ACCESS=$(echo "$LOGIN_JSON" | jq -r '.access')

http GET http://localhost:8000/api/auth/me/ "Authorization:Bearer $ACCESS"