import requests
import jwt

r = requests.post("http://localhost:8090/api/auth/login", json={"email": "admin@thamanicraft.co.tz", "password": "password"})
token = r.json().get("token")
decoded = jwt.decode(token, options={"verify_signature": False})
print(decoded)
