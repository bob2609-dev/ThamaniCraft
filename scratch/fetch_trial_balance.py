import requests
import json
import os

token_file = 'scratch/tenant_token.txt'
if not os.path.exists(token_file):
    print("Run get_token.py first")
    exit(1)

with open(token_file, 'r') as f:
    token = f.read().strip()

url = "http://localhost:80/api/finance/ledger/trial-balance"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

resp = requests.get(url, headers=headers)
print(resp.status_code)
if resp.status_code == 200:
    print(json.dumps(resp.json(), indent=2))
else:
    print(resp.text)
