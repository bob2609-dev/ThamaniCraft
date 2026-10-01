const fs = require('fs');
const file = 'thamanicraft-client-ui/src/pages/OrderEntry.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "if(fp.sellingPrice != null) form.setFieldValue(['items',idx,'unitPrice'],Number(fp.sellingPrice));\\n    else if(fp.costPerBaseUnit>0) form.setFieldValue(['items',idx,'unitPrice'],Number(fp.costPerBaseUnit));",
  "if(fp.sellingPrice > 0) form.setFieldValue(['items',idx,'unitPrice'],Number(fp.sellingPrice));\\n    else if(fp.costPerBaseUnit>0) form.setFieldValue(['items',idx,'unitPrice'],Number(fp.costPerBaseUnit));"
);

content = content.replace(
  "Standard: TZS {Number(fp.sellingPrice ?? fp.costPerBaseUnit ?? 0).toFixed(2)}",
  "Standard: TZS {Number(fp.sellingPrice || fp.costPerBaseUnit || 0).toFixed(2)}"
);

fs.writeFileSync(file, content);
console.log('Fixed prices!');
