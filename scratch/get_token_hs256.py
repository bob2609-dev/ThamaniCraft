import jwt
import time
secret = 'byGoGQnH1ZQN1R6A3vQnZlpm4Deif2UKtCWPYrPZu2Jx/PkXgw70BQTt3Sr/5YkE9o7Ghslp3MCvUJXPAGWtpw=='
payload = {
  "sub": "admin@thamanicraft.co.tz",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "role": "OWNER",
  "permissions": ["ADJUST_INVENTORY"],
  "exp": int(time.time()) + 3600
}
import base64
print(jwt.encode(payload, base64.b64decode(secret), algorithm="HS512"))
