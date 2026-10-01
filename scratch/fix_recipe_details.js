const fs = require('fs');

// 1. Fix OrderCostingSummary.jsx
const fileCosting = 'thamanicraft-client-ui/src/components/OrderCostingSummary.jsx';
let contentCosting = fs.readFileSync(fileCosting, 'utf8');
contentCosting = contentCosting.replace(
  "dataSource={recipe.materials || []}",
  "dataSource={recipe.costing?.lines || []}"
);
contentCosting = contentCosting.replace(
  "{ title: 'Material', dataIndex: 'rawMaterialName' }",
  "{ title: 'Material', dataIndex: 'name' }"
);
// replace Total Cost calculation
contentCosting = contentCosting.replace(
  "render: (_, r) => r.quantity != null && r.unitCost != null ? (Number(r.quantity) * Number(r.unitCost)).toFixed(2) : '—'",
  "dataIndex: 'lineCost', render: v => v != null ? Number(v).toFixed(2) : '—'"
);
// Also add summary row to table if possible, or just a typography text showing batchCost
contentCosting = contentCosting.replace(
  "</Typography.Text>\\n      <Table",
  "</Typography.Text>\\n      <div style={{marginBottom: 8}}><Typography.Text type=\"secondary\">Estimated Cost: TZS {Number(recipe.costing?.batchCost || 0).toFixed(2)}</Typography.Text></div>\\n      <Table"
);
fs.writeFileSync(fileCosting, contentCosting);
console.log('OrderCostingSummary.jsx fixed.');

// 2. Fix OrderEntry.jsx
const fileEntry = 'thamanicraft-client-ui/src/pages/OrderEntry.jsx';
let contentEntry = fs.readFileSync(fileEntry, 'utf8');

// The replacement was:
/*
                          const r = recipes.find(rc=>rc.id===v);
                          if(r) {
                            form.setFieldValue(['items',name,'description'],r.name);
                            if(r.estimatedCost) form.setFieldValue(['items',name,'unitPrice'],Number(r.estimatedCost));
                          }
*/
contentEntry = contentEntry.replace(
  "if(r.estimatedCost) form.setFieldValue(['items',name,'unitPrice'],Number(r.estimatedCost));",
  "import('../services/recipeApi').then(({getRecipe}) => getRecipe(v).then(details => { if(details?.costing?.batchCost) form.setFieldValue(['items',name,'unitPrice'], Number(details.costing.batchCost)); }).catch(()=>{}));"
);

fs.writeFileSync(fileEntry, contentEntry);
console.log('OrderEntry.jsx fixed.');
