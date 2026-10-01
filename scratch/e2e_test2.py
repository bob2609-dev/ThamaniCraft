import requests
import datetime
import json
import sys

base_url = "http://localhost:8090"
email = "admin@thamanicraft.co.tz"
password = "password"

r_login = requests.post(f"{base_url}/api/auth/login", json={"email": email, "password": password})
token = r_login.json().get("token")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

r_fp = requests.get(f"{base_url}/api/inventory/finished-products", headers=headers)
fps = r_fp.json()
print("FP Base UOM:", fps[0]["baseUom"])

uom_id = fps[0]["baseUom"]["id"]
r_uom = requests.get(f"{base_url}/api/inventory/uom/{uom_id}", headers=headers)
print("UOM endpoint:", r_uom.status_code, r_uom.text)
