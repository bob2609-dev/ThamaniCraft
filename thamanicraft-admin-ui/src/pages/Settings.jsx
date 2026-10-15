import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Typography, Tabs, Card, Form, Input, Button, Table, Modal, Select, message, Space, Tag, Row, Col, Checkbox, Spin, InputNumber, Popconfirm } from 'antd';
import { UserOutlined, SettingOutlined, LockOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { fetchUsers, fetchRoles, fetchPermissions, createUser, updateUser, createRole, updateRole, toggleUserStatus, fetchConfigs, updateConfig } from '../utils/identityApi';
import { fetchGlobalUOMs, createGlobalUOM, updateGlobalUOM, deleteGlobalUOM } from '../utils/inventoryApi';
import { withSorters } from '../utils/tableUtils';
import SearchableTable from '../components/SearchableTable';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const TAB_MAP = {
  configs: '2',
  config: '2',
  system: '2',
  '2': '2',
  uoms: 'uoms',
  uom: 'uoms',
  admins: '3',
  admin: '3',
  users: '3',
  '3': '3',
  roles: '4',
  role: '4',
  rbac: '4',
  security: '4',
  '4': '4',
};

const TAB_REVERSE_MAP = {
  '2': 'configs',
  uoms: 'uoms',
  '3': 'admins',
  '4': 'roles',
};

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = TAB_MAP[tabParam] || '2';

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isUomModalVisible, setIsUomModalVisible] = useState(false);
  const [editingUom, setEditingUom] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  
  const [form] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [uomForm] = Form.useForm();
  
  const [generalSettings, setGeneralSettings] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [u, r, p, configs, uomsData] = await Promise.all([
        fetchUsers().catch(() => []),
        fetchRoles().catch(() => []),
        fetchPermissions().catch(() => []),
        fetchConfigs().catch(() => []),
        fetchGlobalUOMs().catch(() => [])
      ]);
      setUsers(u);
      setRoles(r);
      setPermissions(p);
      setUoms(uomsData);
      
      const settingsMap = {};
      if (configs && configs.length > 0) {
        configs.forEach(c => settingsMap[c.configKey] = c.configValue);
      }
      setGeneralSettings(settingsMap);
      settingsForm.setFieldsValue(settingsMap);
    } catch (e) {
      console.error(e);
      message.error("Failed to load settings data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (values) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success("Platform Admin updated successfully!");
      } else {
        await createUser(values);
        message.success("Platform Admin created successfully!");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      loadAllData();
    } catch (error) {
      message.error(error.message || "Failed to save admin");
    }
  };

  const handleSaveRole = async (values) => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, values);
        message.success("Platform Role updated successfully!");
      } else {
        await createRole(values);
        message.success("Platform Role created successfully!");
      }
      setIsRoleModalVisible(false);
      roleForm.resetFields();
      setEditingRole(null);
      loadAllData();
    } catch (error) {
      message.error(error.message || "Failed to save role");
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await toggleUserStatus(userId);
      message.success("Admin status toggled successfully!");
      loadAllData();
    } catch (error) {
      message.error(error.message || "Failed to toggle admin status");
    }
  };

  const handleSaveGeneralSettings = async (values) => {
    try {
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined) {
          await updateConfig(key, value.toString());
        }
      }
      message.success("Platform settings saved successfully");
      loadAllData();
    } catch (error) {
      message.error("Failed to save settings");
    }
  };

  const handleSaveUom = async (values) => {
    try {
      if (editingUom) {
        await updateGlobalUOM(editingUom.id, values);
        message.success("Global UOM updated successfully");
      } else {
        await createGlobalUOM(values);
        message.success("Global UOM created successfully");
      }
      setIsUomModalVisible(false);
      uomForm.resetFields();
      setEditingUom(null);
      loadAllData();
    } catch (error) {
      message.error("Failed to save UOM");
    }
  };

  const handleDeleteUom = async (id) => {
    try {
      await deleteGlobalUOM(id);
      message.success("Global UOM deleted successfully");
      loadAllData();
    } catch (error) {
      message.error("Failed to delete UOM");
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Role', dataIndex: 'roleName', render: r => <Tag color="blue">{r}</Tag> },
    { title: 'Status', dataIndex: 'isActive', render: active => (
      <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag>
    )},
    { title: 'Action', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => { 
          setEditingUser(record); 
          form.setFieldsValue({
            name: record.name,
            email: record.email,
            roleId: roles.find(r => r.name === record.roleName)?.id
          }); 
          setIsModalVisible(true); 
        }}>
          Edit
        </Button>
        <Button type="link" danger={record.isActive} onClick={() => handleToggleUserStatus(record.id)}>
          {record.isActive ? 'Disable' : 'Enable'}
        </Button>
      </Space>
    )}
  ];

  const roleColumns = [
    { title: 'Role Name', dataIndex: 'name' },
    { title: 'Permissions', dataIndex: 'permissions', render: perms => (
      <span>
        {(perms || []).slice(0, 3).map(p => <Tag key={p.id}>{p.name.split('_')[0]}</Tag>)}
        {(perms || []).length > 3 && <Tag>+{(perms || []).length - 3} more</Tag>}
      </span>
    )},
    { title: 'Action', key: 'action', render: (_, record) => (
      <Button type="link" onClick={() => { 
        setEditingRole(record); 
        roleForm.setFieldsValue({
          name: record.name,
          permissionIds: (record.permissions || []).map(p => p.id)
        }); 
        setIsRoleModalVisible(true); 
      }}>
        Edit
      </Button>
    )}
  ];

  const uomColumns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Symbol', dataIndex: 'symbol' },
    { title: 'Category', dataIndex: 'category' },
    { title: 'Conversion Factor', dataIndex: 'conversionFactor' },
    { title: 'Base Unit', dataIndex: 'baseUnit', render: b => b ? b.name : '-' },
    { title: 'Action', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => { setEditingUom(record); uomForm.setFieldsValue(record); setIsUomModalVisible(true); }}>Edit</Button>
        <Popconfirm title="Are you sure to delete this UOM?" onConfirm={() => handleDeleteUom(record.id)}>
          <Button type="link" danger>Delete</Button>
        </Popconfirm>
      </Space>
    )}
  ];

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const group = perm.name.split('_')[0] || 'OTHER';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  return (
    <div>
      <Title level={2}>Settings</Title>

      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => setSearchParams({ tab: TAB_REVERSE_MAP[key] || key }, { replace: true })}
      >
        <TabPane tab={<span><SettingOutlined /> System Configs</span>} key="2">
          <Card style={{ maxWidth: 600 }}>
            {generalSettings === null ? <Spin /> : (
              <Form 
                form={settingsForm}
                layout="vertical" 
                onFinish={handleSaveGeneralSettings}
              >
                <Form.Item name="platform_name" label="Platform Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="default_currency" label="Base Currency">
                  <Select>
                    <Option value="TZS">TZS - Tanzanian Shilling</Option>
                    <Option value="USD">USD - US Dollar</Option>
                    <Option value="KES">KES - Kenyan Shilling</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="default_timezone" label="Timezone">
                  <Select>
                    <Option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="global_tax_rate" label="Global Tax Rate (%)" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">Save Settings</Button>
                </Form.Item>
              </Form>
            )}
          </Card>
        </TabPane>

        <TabPane tab={<span><NodeIndexOutlined /> Global UOMs</span>} key="uoms">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" onClick={() => { setEditingUom(null); uomForm.resetFields(); setIsUomModalVisible(true); }}>
                + Add UOM
              </Button>
            </div>
            <SearchableTable 
              dataSource={uoms} 
              columns={withSorters(uomColumns)} 
              rowKey="id" 
              loading={loading} 
              pagination={false}
            />
          </Card>
        </TabPane>
        

        <TabPane tab={<span><UserOutlined /> Platform Administrators</span>} key="3">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" onClick={() => { setEditingUser(null); form.resetFields(); setIsModalVisible(true); }}>
                + Create Admin
              </Button>
            </div>
            
            <SearchableTable 
              dataSource={users} 
              columns={withSorters(columns)} 
              rowKey="id" 
              loading={loading} 
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><LockOutlined /> Platform Roles</span>} key="4">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" onClick={() => { setEditingRole(null); roleForm.resetFields(); setIsRoleModalVisible(true); }}>
                + Create Role
              </Button>
            </div>
            
            <SearchableTable 
              dataSource={roles} 
              columns={withSorters(roleColumns)} 
              rowKey="id" 
              loading={loading} 
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal title={editingUser ? "Edit Admin" : "Create New Admin"} open={isModalVisible} onCancel={() => { setIsModalVisible(false); form.resetFields(); setEditingUser(null); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSaveUser}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label={editingUser ? "Password (leave blank to keep current)" : "Password"} rules={[{ required: !editingUser }]}><Input.Password /></Form.Item>
          <Form.Item name="roleId" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select a role">
              {roles.map(r => <Option key={r.id} value={r.id}>{r.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space><Button onClick={() => { setIsModalVisible(false); setEditingUser(null); }}>Cancel</Button><Button type="primary" htmlType="submit">{editingUser ? "Save Changes" : "Create Admin"}</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={editingRole ? "Edit Platform Role" : "Create New Platform Role"} open={isRoleModalVisible} onCancel={() => { setIsRoleModalVisible(false); roleForm.resetFields(); setEditingRole(null); }} footer={null} width={800}>
        <Form form={roleForm} layout="vertical" onFinish={handleSaveRole}>
          <Form.Item name="name" label="Role Name" rules={[{ required: true }]}><Input size="large" placeholder="e.g. Production Manager" /></Form.Item>
          <Form.Item name="permissionIds" label="Permissions" rules={[{ required: true, message: 'Select at least one permission' }]}>
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[24, 24]}>
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <Col xs={24} sm={12} md={8} key={group}>
                    <Text strong style={{ display: 'block', marginBottom: 12, color: 'var(--color-primary)', borderBottom: '1px solid #f0f0f0', paddingBottom: 4 }}>{group}</Text>
                    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                      {perms.map(p => <Checkbox key={p.id} value={p.id}><Text style={{ fontSize: '13px' }}>{p.name.substring(group.length + 1)}</Text></Checkbox>)}
                    </Space>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}><Button onClick={() => { setIsRoleModalVisible(false); setEditingRole(null); }}>Cancel</Button><Button type="primary" htmlType="submit">{editingRole ? "Save Changes" : "Create Role"}</Button></div>
        </Form>
      </Modal>

      <Modal title={editingUom ? "Edit UOM" : "Create Global UOM"} open={isUomModalVisible} onCancel={() => { setIsUomModalVisible(false); uomForm.resetFields(); setEditingUom(null); }} footer={null}>
        <Form form={uomForm} layout="vertical" onFinish={handleSaveUom}>
          <Form.Item name="name" label="Unit Name" rules={[{ required: true }]}><Input placeholder="e.g. Kilogram" /></Form.Item>
          <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}><Input placeholder="e.g. kg" /></Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}><Input placeholder="e.g. Weight" /></Form.Item>
          <Form.Item name="conversionFactor" label="Conversion Factor" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0.0001} step={0.01} /></Form.Item>
          <Form.Item name={['baseUnit', 'id']} label="Base Unit (Optional)">
            <Select placeholder="Select base unit (if any)" allowClear>
              {uoms.filter(u => u.id !== editingUom?.id).map(u => <Option key={u.id} value={u.id}>{u.name} ({u.symbol})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space><Button onClick={() => setIsUomModalVisible(false)}>Cancel</Button><Button type="primary" htmlType="submit">Save UOM</Button></Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
