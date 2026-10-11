const fs = require('fs');
const path = 'thamanicraft-client-ui/src/services/inventoryApi.js';
let content = fs.readFileSync(path, 'utf8');

const newFunc = `
export const createGoodsReceiptQuickRefill = async (receipt) => {
  const response = await fetch(\`\${API_BASE_URL}/goods-receipts/quick-refill\`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(receipt)
  });
  if (!response.ok) throw new Error('Failed to quick refill goods');
  return response.json();
};
`;

content += newFunc;
fs.writeFileSync(path, content);
