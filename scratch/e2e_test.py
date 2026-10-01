import requests
import datetime
import json
import sys
import uuid

base_url = "http://localhost:8090"
email = "admin@thamanicraft.co.tz"
password = "password"

print("--- 1. Logging in ---")
r_login = requests.post(f"{base_url}/api/auth/login", json={"email": email, "password": password})
if r_login.status_code != 200:
    print("Login failed:", r_login.text)
    sys.exit(1)
token = r_login.json().get("token")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("Login successful.")

print("\n--- 1b. Fetch UOMs ---")
r_uom = requests.get(f"{base_url}/api/inventory/uom", headers=headers)
print("UOMs status:", r_uom.status_code)
print("UOMs text:", r_uom.text)
uoms = r_uom.json() if r_uom.status_code == 200 else []
if not uoms:
    print("No UOMs found!")
    sys.exit(1)
uom_id = uoms[0]["id"]
print(f"Using UOM: {uoms[0]['name']}")

print("\n--- 2. Fetching/Creating Raw Materials ---")
r_rm = requests.get(f"{base_url}/api/inventory/raw-materials", headers=headers)
rms = r_rm.json() if r_rm.status_code == 200 else []
if len(rms) == 0:
    print("Creating Raw Material...")
    rm_data = {
        "name": "E2E Flour",
        "sku": "RM-FLOUR-001",
        "baseUomId": uom_id,
        "categoryId": None,
        "reorderLevel": 10
    }
    r_rm_cr = requests.post(f"{base_url}/api/inventory/raw-materials", json=rm_data, headers=headers)
    print("Create RM Status:", r_rm_cr.status_code)
    if r_rm_cr.status_code in [200, 201]:
        rms = [r_rm_cr.json()]
    else:
        print(r_rm_cr.text)
print(f"Found/Created Raw Material: {rms[0]['name']}")

print("\n--- 3. Quick Refill (Purchase) ---")
if len(rms) > 0:
    refill_data = {
        "lines": [
            {
                "rawMaterialId": rms[0]["id"],
                "receivedUomId": uom_id,
                "purchaseQuantity": 50,
                "purchaseUnitCost": 1000
            }
        ],
        "supplierName": "Test Supplier",
        "supplierReference": "TEST-PO-001",
        "notes": "E2E Test Refill"
    }
    r_refill = requests.post(f"{base_url}/api/inventory/goods-receipts/quick-refill", json=refill_data, headers=headers)
    print("Quick Refill Status:", r_refill.status_code)
    if r_refill.status_code not in [200, 201]:
        print(r_refill.text)

print("\n--- 3b. Fetching/Creating Finished Product ---")
r_fp = requests.get(f"{base_url}/api/inventory/finished-products", headers=headers)
fps = r_fp.json() if r_fp.status_code == 200 else []
if len(fps) == 0:
    print("Creating Finished Product...")
    fp_data = {
        "name": "E2E Bread",
        "sku": "FP-BREAD-001",
        "baseUomId": uom_id,
        "suggestedPrice": 25000
    }
    r_fp_cr = requests.post(f"{base_url}/api/inventory/finished-products", json=fp_data, headers=headers)
    print("Create FP Status:", r_fp_cr.status_code)
    if r_fp_cr.status_code in [200, 201]:
        fps = [r_fp_cr.json()]
    else:
        print(r_fp_cr.text)

print("\n--- 4. Fetching/Creating Recipes ---")
r_rec = requests.get(f"{base_url}/api/production/recipes", headers=headers)
recipes = r_rec.json() if r_rec.status_code == 200 else []

if len(recipes) == 0 and len(fps) > 0 and len(rms) > 0:
    print("Creating a new recipe...")
    recipe_data = {
        "name": "E2E Test Recipe",
        "description": "Created by E2E Test",
        "yieldQuantity": 1,
        "yieldUomId": uom_id,
        "targetMargin": 30,
        "suggestedPrice": 25000,
        "productionMode": "BATCH_PRE_MADE",
        "laborCostPerBatch": 0,
        "energyCostPerBatch": 0,
        "additionalOverheadPerBatch": 0,
        "items": [
            {
                "rawMaterialId": rms[0]["id"],
                "uomId": uom_id,
                "quantityRequired": 2,
                "wasteFactor": 0
            }
        ],
        "finishedProductId": fps[0]["id"]
    }
    r_cre = requests.post(f"{base_url}/api/production/recipes", json=recipe_data, headers=headers)
    print("Create Recipe Status:", r_cre.status_code)
    if r_cre.status_code in [200, 201]:
        recipes = [{"id": r_cre.json()["id"], "yieldQuantity": 1}]
    else:
        print(r_cre.text)

print(f"Found {len(recipes)} Recipes")

print("\n--- 5. Quick Make (Production) ---")
if len(recipes) > 0:
    make_data = {
        "recipeId": recipes[0]["id"],
        "plannedYield": recipes[0]["yieldQuantity"] or 1,
        "reference": "TEST-BATCH-001",
        "notes": "E2E Test Production",
        "version": 0
    }
    r_make = requests.post(f"{base_url}/api/production/work-orders/quick-make", json=make_data, headers=headers)
    print("Quick Make Status:", r_make.status_code)
    if r_make.status_code not in [200, 201]:
        print(r_make.text)

print("\n--- 7. Fetching/Creating Customer ---")
r_cust = requests.get(f"{base_url}/api/sales/customers", headers=headers)
customers = r_cust.json() if r_cust.status_code == 200 else []
if len(customers) == 0:
    cust_data = {
        "name": "Walk-in Customer",
        "phone": "0000000000",
        "email": "",
        "address": "",
        "notes": "",
        "version": 0
    }
    r_cc = requests.post(f"{base_url}/api/sales/customers", json=cust_data, headers=headers)
    print("Create Customer Status:", r_cc.status_code)
    customer_id = r_cc.json()["id"] if r_cc.status_code in [200, 201] else None
else:
    customer_id = customers[0]["id"]
print(f"Using Customer ID: {customer_id}")

print("\n--- 8. Creating Sale Order ---")
if len(fps) > 0 and customer_id:
    now = datetime.datetime.now(datetime.timezone.utc)
    due_at = (now + datetime.timedelta(days=7)).isoformat()
    
    order_data = {
        "requestId": str(uuid.uuid4()),
        "customerId": customer_id,
        "totalAmount": 50000,
        "depositRequired": 0,
        "deliveryCharge": 0,
        "discountAmount": 5000,
        "amountPaid": 45000,
        "paymentMethod": "CASH",
        "dueAt": due_at,
        "fulfilment": "COLLECTION",
        "items": [
            {
                "itemId": fps[0]["id"],
                "itemName": fps[0]["name"],
                "description": fps[0]["name"],
                "quantity": 1,
                "unit": fps[0].get("baseUom", {}).get("symbol", "EA"),
                "unitPrice": fps[0].get("suggestedPrice", 25000),
                "totalPrice": fps[0].get("suggestedPrice", 25000)
            }
        ]
    }
    r_sale = requests.post(f"{base_url}/api/sales/orders", json=order_data, headers=headers)
    print("Sale Order Status:", r_sale.status_code)
    if r_sale.status_code not in [200, 201]:
        print(r_sale.text)
