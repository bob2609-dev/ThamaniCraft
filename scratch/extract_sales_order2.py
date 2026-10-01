import sys
with open('craft-sales-service/src/main/java/tz/co/thamanicraft/sales/SalesService.java', 'r') as f:
    lines = f.readlines()
    
for i, line in enumerate(lines):
    if 'public Map<String,Object> order(UUID id)' in line:
        print("".join(lines[i:i+40]))
        break
