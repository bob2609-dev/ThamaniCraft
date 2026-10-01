import urllib.request
import json

token_url = "http://localhost:8090/api/identity/tokens"
try:
    req = urllib.request.Request(token_url, method="POST")
    req.add_header('Content-Type', 'application/json')
    data = json.dumps({"username": "owner", "password": "password"}).encode('utf-8')
    with urllib.request.urlopen(req, data=data) as response:
        token = json.loads(response.read().decode())['token']
except Exception as e:
    print("Token fetch failed:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
    exit(1)

def request(url, method, data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Authorization', f'Bearer {token}')
    if data:
        req.add_header('Content-Type', 'application/json')
        data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req, data=data) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        if hasattr(e, 'read'):
            print(e.read().decode())
        else:
            print(e)
        return None

payload = {
    "name": "Test Recipe",
    "description": "",
    "yieldQuantity": 1,
    "yieldUomId": "f0000000-0000-0000-0000-000000000002",
    "laborCostPerBatch": 0,
    "energyCostPerBatch": 0,
    "additionalOverheadPerBatch": 0,
    "suggestedPrice": 45000,
    "items": [
        {
            "rawMaterialId": "e0000000-0000-0000-0000-000000000001",
            "quantityRequired": 1,
            "wasteFactor": 0
        }
    ],
    "productionMode": "BATCH_PRE_MADE"
}

res = request("http://localhost:8090/api/production/recipes", "POST", payload)
print("Created:", res)

if res and 'id' in res:
    recipe = request(f"http://localhost:8090/api/production/recipes/{res['id']}", "GET")
    print("Fetched:", recipe)
