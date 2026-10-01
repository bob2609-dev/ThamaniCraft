const fs = require('fs');
const file = 'thamanicraft-client-ui/src/pages/OrderEntry.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. imports
content = content.replace(
  "import { fetchFinishedProducts } from '../services/inventoryApi';",
  "import { fetchFinishedProducts } from '../services/inventoryApi';\nimport { listRecipes } from '../services/recipeApi';"
);

// 2. state
content = content.replace(
  "const [finishedProducts,setFinishedProducts]=useState([]);",
  "const [finishedProducts,setFinishedProducts]=useState([]);\n  const [recipes,setRecipes]=useState([]);"
);

// 3. fetch recipes
content = content.replace(
  "fetchFinishedProducts().then(data=>{if(active)setFinishedProducts(data);}).catch(()=>{});",
  "fetchFinishedProducts().then(data=>{if(active)setFinishedProducts(data);}).catch(()=>{});\n    listRecipes().then(data=>{if(active)setRecipes(data);}).catch(()=>{});"
);

// 4. save function
content = content.replace(
  "const items=data.items.map(({isFinishedProduct,...rest})=>rest);",
  "const items=data.items.map(({isFinishedProduct,recipeId,...rest})=>rest);"
);

const saveReplace = `        const result=await api.createOrder(payload);
        const recipePromises = [];
        data.items.forEach((item, idx) => {
          if (!item.isFinishedProduct && item.recipeId && result.items && result.items[idx]) {
            recipePromises.push(api.mapOrderRecipe(result.id, result.items[idx].id, { recipeId: item.recipeId }));
          }
        });
        if (recipePromises.length > 0) await Promise.all(recipePromises).catch(e => message.warning('Order saved, but some recipes failed to map automatically.'));
        message.success('Order recorded');navigate(\`/sales/\${result.id}\`);`;

content = content.replace(
  "const result=await api.createOrder(payload);\n        message.success('Order recorded');navigate(`/sales/${result.id}`);",
  saveReplace
);

// 5. Custom Item UI & Price field UI
const oldFormList = `              {isFP ? <>
                <Col xs={24} md={8}>
                  <Form.Item label="Select finished product" rules={[{required:true,message:'Select a finished product'}]}>
                    <Select showSearch optionFilterProp="label" placeholder="Choose a finished product..."
                      value={values.items?.[name]?.finishedProductId}
                      onChange={v=>onFinishedProductSelect(name,v)}
                      options={finishedProducts.map(fp=>({value:fp.id,label:\`\${fp.name}\${fp.sku?' — '+fp.sku:''}\${fp.category?' ('+fp.category+')':''}\`}))} />
                  </Form.Item>
                  <Form.Item {...field} name={[name,'finishedProductId']} hidden><Input /></Form.Item>
                  <Form.Item {...field} name={[name,'finishedProductName']} hidden><Input /></Form.Item>
                </Col>
              </> : null}
              <Col xs={24} md={isFP?10:8}><Form.Item {...field} name={[name,'description']} label="Item / description" rules={[{required:true,whitespace:true}]}><Input maxLength={255} readOnly={isFP} /></Form.Item></Col>
              <Col xs={12} md={4}><Form.Item {...field} name={[name,'quantity']} label="Quantity" rules={[{required:true}]}><InputNumber min={0.0001} max={99999999.9999} precision={4} style={{width:'100%'}} /></Form.Item></Col>
              <Col xs={12} md={4}><Form.Item {...field} name={[name,'unit']} label="Unit" rules={[{required:true,whitespace:true}]}><Input maxLength={40} readOnly={isFP} /></Form.Item></Col>
              <Col xs={18} md={5}><Form.Item {...field} name={[name,'unitPrice']} label="Price (TZS)" rules={[{required:true}]}><InputNumber min={0} max={9999999999.99} precision={2} style={{width:'100%'}} /></Form.Item></Col>`;

const newFormList = `              {isFP ? <>
                <Col xs={24} md={8}>
                  <Form.Item label="Select finished product" rules={[{required:true,message:'Select a finished product'}]}>
                    <Select showSearch optionFilterProp="label" placeholder="Choose a finished product..."
                      value={values.items?.[name]?.finishedProductId}
                      onChange={v=>onFinishedProductSelect(name,v)}
                      options={finishedProducts.map(fp=>({value:fp.id,label:\`\${fp.name}\${fp.sku?' — '+fp.sku:''}\${fp.category?' ('+fp.category+')':''}\`}))} />
                  </Form.Item>
                  <Form.Item {...field} name={[name,'finishedProductId']} hidden><Input /></Form.Item>
                  <Form.Item {...field} name={[name,'finishedProductName']} hidden><Input /></Form.Item>
                </Col>
              </> : <>
                <Col xs={24} md={8}>
                  <Form.Item label="Base Recipe (Optional)">
                    <Select showSearch optionFilterProp="label" placeholder="Select a base recipe..." allowClear
                      value={values.items?.[name]?.recipeId}
                      onChange={v=>{
                        form.setFieldValue(['items',name,'recipeId'],v);
                        if(v) {
                          const r = recipes.find(rc=>rc.id===v);
                          if(r) {
                            form.setFieldValue(['items',name,'description'],r.name);
                            if(r.estimatedCost) form.setFieldValue(['items',name,'unitPrice'],Number(r.estimatedCost));
                          }
                        }
                      }}
                      options={recipes.map(r=>({value:r.id,label:r.name}))} />
                  </Form.Item>
                  <Form.Item {...field} name={[name,'recipeId']} hidden><Input /></Form.Item>
                </Col>
              </>}
              <Col xs={24} md={isFP?10:8}><Form.Item {...field} name={[name,'description']} label="Item / description" rules={[{required:true,whitespace:true}]}><Input maxLength={255} readOnly={isFP} /></Form.Item></Col>
              <Col xs={12} md={4}><Form.Item {...field} name={[name,'quantity']} label="Quantity" rules={[{required:true}]}><InputNumber min={0.0001} max={99999999.9999} precision={4} style={{width:'100%'}} /></Form.Item></Col>
              <Col xs={12} md={4}><Form.Item {...field} name={[name,'unit']} label="Unit" rules={[{required:true,whitespace:true}]}><Input maxLength={40} readOnly={isFP} /></Form.Item></Col>
              <Col xs={18} md={5}>
                <Form.Item {...field} name={[name,'unitPrice']} label="Price (TZS)" rules={[{required:true}]} style={{marginBottom: 4}}>
                  <InputNumber min={0} max={9999999999.99} precision={2} style={{width:'100%'}} />
                </Form.Item>
                {isFP && values.items?.[name]?.finishedProductId && (() => {
                  const fp = finishedProducts.find(p => p.id === values.items[name].finishedProductId);
                  if(!fp) return null;
                  return <Typography.Text type="secondary" style={{fontSize: 12}}>
                    Standard: TZS {Number(fp.sellingPrice ?? fp.costPerBaseUnit ?? 0).toFixed(2)}
                  </Typography.Text>;
                })()}
              </Col>`;

content = content.replace(oldFormList, newFormList);

fs.writeFileSync(file, content);
console.log('OrderEntry.jsx updated successfully.');
