const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { sub: "admin", authorities: ["ADJUST_INVENTORY", "ROLE_ADMIN"] }, 
    "yoursecretkeyyoursecretkeyyoursecretkeyyoursecretkeyyoursecretkey"
);

async function test() {
    const res = await fetch("http://localhost:8090/api/inventory/goods-receipts/quick-refill", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            supplierName: "Test Supplier",
            supplierReference: "REF123",
            lines: [
                {
                    rawMaterialId: "00000000-0000-0000-0000-000000000001",
                    receivedUomId: "00000000-0000-0000-0000-000000000001",
                    purchaseQuantity: 7.5,
                    purchaseUnitCost: 0
                }
            ]
        })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}
test();
