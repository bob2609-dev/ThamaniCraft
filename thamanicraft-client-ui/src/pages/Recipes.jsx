import { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Col, Popconfirm, Row, Space, Table, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import * as api from '../services/recipeApi';
import usePermissions from '../hooks/usePermissions';
import { withSorters } from '../utils/tableUtils';
import SearchableTable from '../components/SearchableTable';

export default function Recipes() {
  const { message } = App.useApp();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('CREATE_RECIPES');
  const canView = hasPermission('VIEW_RECIPES');
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { setRecipes(await api.listRecipes()); }
    catch (error) { message.error(error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    if (!canView) return;
    let active = true;
    api.listRecipes().then((data) => { if (active) setRecipes(data); })
      .catch((error) => { if (active) message.error(error.message); });
    return () => { active = false; };
  }, [canView, message]);

  async function archive(id) {
    try { await api.archiveRecipe(id); message.success('Recipe archived'); await load(); }
    catch (error) { message.error(error.message); }
  }
  if (!canView) return <Alert type="warning" message="You do not have permission to view recipes." />;

  return <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
    <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col><Typography.Title level={2} style={{ margin: 0 }}>Recipes &amp; BOM</Typography.Title>
        <Typography.Text>Ingredients, batch yield, and production costs.</Typography.Text></Col>
      <Col>{canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/recipes/new')} loading={loading}>Add recipe</Button>}</Col>
    </Row>
    <Card className="dark:bg-slate-800">
    <SearchableTable rowKey="id" loading={loading} dataSource={recipes} scroll={{ x: 700 }} columns={withSorters([
      { title: 'Recipe', dataIndex: 'name' },
      { title: 'Batch yield', render: (_, recipe) => `${recipe.yieldQuantity} ${recipe.yieldUnit}` },
      { title: 'Est. Batch Cost', render: (_, recipe) => `TZS ${Number(recipe.costing?.batchCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { title: 'Est. Unit Cost', render: (_, recipe) => `TZS ${Number(recipe.costing?.unitCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { title: 'Suggested Price (TZS)', render: (_, recipe) => {
          const suggestedPrice = recipe.suggestedPrice || 0;
          return Number(suggestedPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }},
      { title: 'Auto-Calculated Margin', render: (_, recipe) => {
          const unitCost = recipe.costing?.unitCost || 0;
          const suggestedPrice = recipe.suggestedPrice || 0;
          const margin = (suggestedPrice > 0 && unitCost >= 0) ? ((suggestedPrice - unitCost) / suggestedPrice) * 100 : 0;
          return (
            <Typography.Text style={{ color: margin > 30 ? '#3f8600' : margin > 0 ? '#faad14' : '#cf1322' }}>
              {Number(margin).toFixed(2)} %
            </Typography.Text>
          );
      }},
      { title: 'Created', dataIndex: 'createdAt', render: (date) => date ? new Date(date).toLocaleDateString() : '—' },
      { title: 'Actions', render: (_, recipe) => <Space>
        <Button onClick={() => navigate(`/recipes/${recipe.id}/edit`)}>{canEdit ? 'Edit / Costing' : 'View'}</Button>
        {canEdit && <Popconfirm title="Archive this recipe?" onConfirm={() => archive(recipe.id)}><Button danger>Archive</Button></Popconfirm>}
      </Space> },
    ])} />
    </Card>
  </div>;
}
