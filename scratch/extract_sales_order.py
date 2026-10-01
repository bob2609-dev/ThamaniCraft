import sys
with open('craft-sales-service/src/main/java/tz/co/thamanicraft/sales/SalesService.java', 'r') as f:
    content = f.read()
    
start_idx = content.find('public Map<String,Object> order(UUID id)')
if start_idx == -1:
    print("Method not found")
else:
    end_idx = content.find('public UUID createOrder', start_idx)
    print(content[start_idx:end_idx if end_idx != -1 else start_idx+1000])
