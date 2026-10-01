import requests
import datetime
import uuid

base_url = "http://localhost:8090"
login_data = {"email": "admin@thamanicraft.co.tz", "password": "password"}
r_login = requests.post(f"{base_url}/api/auth/login", json=login_data)
token = r_login.json().get("token")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

cust = requests.get(f"{base_url}/api/sales/customers", headers=headers).json()
cust_id = cust[0]['id']

fps = requests.get(f"{base_url}/api/inventory/finished-products", headers=headers).json()
fp = fps[0]

due_at = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()[:16]
unit_name = "piece"

order_payload = {
    "requestId": str(uuid.uuid4()),
    "customerId": cust_id,
    "dueAt": due_at + ":00+03:00",
    "fulfilment": "COLLECTION",
    "deliveryCharge": 0,
    "discountAmount": 0,
    "depositRequired": 0,
    "items": [{
        "finishedProductId": fp['id'],
        "finishedProductName": fp['name'],
        "description": fp['name'],
        "quantity": 1,
        "unit": unit_name,
        "unitPrice": 5000,
        "isFinishedProduct": True
    }]
}

r = requests.post(f"{base_url}/api/sales/orders", json=order_payload, headers=headers)
print("Create:", r.status_code, r.text)
if r.status_code == 201:
    order_id = r.json()['id']
    
    order = requests.get(f"{base_url}/api/sales/orders/{order_id}", headers=headers).json()
    version = order['version']
    
    # Confirm order
    r2 = requests.post(f"{base_url}/api/sales/orders/{order_id}/confirm", json={"version": version, "reason": "Test confirm"}, headers=headers)
    print("Confirm:", r2.status_code, r2.text)

    order = requests.get(f"{base_url}/api/sales/orders/{order_id}", headers=headers).json()
    version = order['version']
    
    # Pay order
    pay = {
        "requestId": str(uuid.uuid4()),
        "amount": 5000,
        "receivedAt": datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z",
        "method": "CASH",
        "reference": "TESTPAY"
    }
    r3 = requests.post(f"{base_url}/api/sales/orders/{order_id}/payments", json=pay, headers=headers)
    print("Pay:", r3.status_code, r3.text)
    
    order = requests.get(f"{base_url}/api/sales/orders/{order_id}", headers=headers).json()
    version = order['version']

    # Fulfill order
    r4 = requests.post(f"{base_url}/api/sales/orders/{order_id}/fulfill", json={"version": version, "carrierOrCollector": "John", "notes": "Test fulfill"}, headers=headers)
    print("Fulfill:", r4.status_code, r4.text)
