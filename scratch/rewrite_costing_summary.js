const fs = require('fs');
const file = 'thamanicraft-client-ui/src/components/OrderCostingSummary.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
content = content.replace(
  "import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd';",
  "import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd';\nimport { useEffect, useState } from 'react';\nimport { getRecipe } from '../services/recipeApi';"
);

// Add RecipeDetails component
const recipeDetailsComponent = `
function RecipeDetails({ recipeId }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recipeId) {
      getRecipe(recipeId).then(setRecipe).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [recipeId]);

  if (loading) return <Typography.Text type="secondary">Loading recipe details...</Typography.Text>;
  if (!recipe) return <Typography.Text type="secondary">Recipe details unavailable.</Typography.Text>;

  return (
    <div style={{ padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 4 }} className="dark:bg-slate-700">
      <Typography.Text strong>Base Recipe: {recipe.name}</Typography.Text>
      <Table 
        size="small"
        dataSource={recipe.materials || []}
        pagination={false}
        rowKey={r => r.rawMaterialId || r.id || Math.random()}
        columns={[
          { title: 'Material', dataIndex: 'rawMaterialName' },
          { title: 'Qty', dataIndex: 'quantity' },
          { title: 'Unit', dataIndex: 'unit' },
          { title: 'Cost/Unit', dataIndex: 'unitCost', render: v => v != null ? Number(v).toFixed(2) : '—' },
          { title: 'Total Cost (TZS)', render: (_, r) => r.quantity != null && r.unitCost != null ? (Number(r.quantity) * Number(r.unitCost)).toFixed(2) : '—' }
        ]}
      />
    </div>
  );
}
`;

content = content.replace("export default function OrderCostingSummary", recipeDetailsComponent + "\nexport default function OrderCostingSummary");

// Update table to be expandable
const tableStart = `      <Table
        rowKey="id"
        dataSource={order.items}
        pagination={false}
        scroll={{ x: 800 }}`;

const tableExpanded = `      <Table
        rowKey="id"
        dataSource={order.items}
        pagination={false}
        scroll={{ x: 800 }}
        expandable={{
          expandedRowRender: (record) => {
            if (record.recipeId) return <RecipeDetails recipeId={record.recipeId} />;
            if (record.finishedProductId) return <Typography.Text type="secondary" className="pl-6">This is a finished product. Its standard cost is managed in Inventory.</Typography.Text>;
            return <Typography.Text type="secondary" className="pl-6">No recipe is mapped for this custom item.</Typography.Text>;
          }
        }}`;

content = content.replace(tableStart, tableExpanded);

fs.writeFileSync(file, content);
console.log('OrderCostingSummary.jsx updated successfully.');
