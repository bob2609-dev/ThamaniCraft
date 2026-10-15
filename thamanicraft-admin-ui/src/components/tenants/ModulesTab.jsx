import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Switch, 
  Button, 
  Tag, 
  Space, 
  Spin, 
  message, 
  Alert, 
  Row, 
  Col, 
  Popconfirm, 
  Divider, 
  theme 
} from 'antd';
import { 
  Boxes, 
  UtensilsCrossed, 
  Factory, 
  ShoppingCart, 
  Store, 
  Truck, 
  Receipt, 
  Landmark, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  RotateCcw, 
  Save, 
  Sparkles,
  Layers,
  Sliders
} from 'lucide-react';
import { fetchTenantModules, updateTenantModules } from '../../utils/identityApi';
import { AVAILABLE_MODULES } from '../../utils/moduleHelpers';

const { Title, Text, Paragraph } = Typography;

const MODULE_ICONS = {
  inventory: Boxes,
  recipes: UtensilsCrossed,
  production: Factory,
  sales: ShoppingCart,
  pos: Store,
  procurement: Truck,
  expenses: Receipt,
  finance: Landmark,
  customers: Users,
  reports: BarChart3,
};

export default function ModulesTab({ tenantId }) {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(null);
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [activeModules, setActiveModules] = useState(new Set());

  useEffect(() => {
    loadModules();
  }, [tenantId]);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await fetchTenantModules(tenantId);
      setDetails(data);
      setIsOverrideMode(Boolean(data.hasCustomOverrides));
      setActiveModules(new Set(data.effectiveModules || []));
    } catch (err) {
      console.error(err);
      message.error("Failed to load tenant module entitlements");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOverrideMode = (checked) => {
    if (!checked) {
      // Reverting to plan defaults
      handleResetToPlan();
    } else {
      setIsOverrideMode(true);
      // Pre-fill with current effective modules
      setActiveModules(new Set(details?.effectiveModules || []));
      message.info("Custom override mode activated. Customize modules below and save.");
    }
  };

  const handleToggleModule = (moduleKey, checked) => {
    if (!isOverrideMode) {
      setIsOverrideMode(true);
    }
    setActiveModules((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(moduleKey);
      } else {
        next.delete(moduleKey);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!isOverrideMode) setIsOverrideMode(true);
    const all = new Set(AVAILABLE_MODULES.map((m) => m.value));
    setActiveModules(all);
  };

  const handleDeselectAll = () => {
    if (!isOverrideMode) setIsOverrideMode(true);
    setActiveModules(new Set());
  };

  const handleResetToPlan = async () => {
    setSaving(true);
    try {
      const updated = await updateTenantModules(tenantId, null);
      setDetails(updated);
      setIsOverrideMode(false);
      setActiveModules(new Set(updated.effectiveModules || []));
      message.success("Reverted module entitlements to subscription plan defaults");
    } catch (err) {
      console.error(err);
      message.error(err.message || "Failed to reset module entitlements");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const modulesToSave = isOverrideMode ? Array.from(activeModules) : null;
      const updated = await updateTenantModules(tenantId, modulesToSave);
      setDetails(updated);
      setIsOverrideMode(Boolean(updated.hasCustomOverrides));
      setActiveModules(new Set(updated.effectiveModules || []));
      message.success("Tenant module entitlements updated successfully!");
    } catch (err) {
      console.error(err);
      message.error(err.message || "Failed to save module entitlements");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !details) {
    return (
      <Card style={{ textAlign: 'center', padding: 48, borderRadius: 12 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading module entitlements...</Text>
        </div>
      </Card>
    );
  }

  const planModules = new Set(details?.plan?.includedModules || []);
  const activeCount = activeModules.size;
  const totalCount = AVAILABLE_MODULES.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Overview & Mode Selector Card */}
      <Card 
        style={{ 
          borderRadius: 12, 
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)' 
        }}
        styles={{ body: { padding: 24 } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Sliders size={22} color="#D97706" />
              <Title level={4} style={{ margin: 0 }}>Tenant Module Entitlements</Title>
              {isOverrideMode ? (
                <Tag color="orange" style={{ fontWeight: 600 }}>Custom Overrides Active</Tag>
              ) : (
                <Tag color="blue" style={{ fontWeight: 600 }}>Inherited from Plan</Tag>
              )}
            </div>
            <Paragraph type="secondary" style={{ margin: 0, maxWidth: 650 }}>
              Manage active ERP modules and feature access for <strong>{details?.displayName || details?.tenantName}</strong>.
              When custom overrides are enabled, individual modules can be toggled independently of the subscription tier.
            </Paragraph>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, backgroundColor: token.colorFillAlter }}>
            <div>
              <Text strong style={{ display: 'block', fontSize: 13 }}>Custom Module Overrides</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isOverrideMode ? "Overrides plan defaults" : "Syncing with subscription plan"}
              </Text>
            </div>
            <Switch 
              checked={isOverrideMode} 
              onChange={handleToggleOverrideMode}
            />
          </div>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Plan & Entitlement Status Banner */}
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={14}>
            <Space orientation="vertical" size={4}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} color="#3B82F6" />
                <Text type="secondary">Assigned Plan:</Text>
                <Text strong>{details?.plan?.name || 'Default Tier'}</Text>
                <Tag color="cyan">{details?.plan?.code || 'FREE'}</Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Plan defaults grant: <strong>{details?.plan?.includedModules?.length || 0} modules</strong>
                {details?.plan?.includedModules?.length > 0 && ` (${details.plan.includedModules.join(', ')})`}
              </Text>
            </Space>
          </Col>

          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <Space wrap>
              {isOverrideMode && (
                <>
                  <Button size="small" onClick={handleSelectAll}>
                    Enable All
                  </Button>
                  <Button size="small" onClick={handleDeselectAll}>
                    Disable All
                  </Button>
                  <Popconfirm
                    title="Reset to Subscription Plan Defaults?"
                    description="This will clear custom module overrides and restore standard tier features."
                    onConfirm={handleResetToPlan}
                    okText="Reset"
                    cancelText="Cancel"
                  >
                    <Button size="small" icon={<RotateCcw size={14} className="inline mr-1" />}>
                      Reset to Plan
                    </Button>
                  </Popconfirm>
                </>
              )}
              <Button 
                type="primary" 
                icon={<Save size={16} className="inline mr-1" />}
                onClick={handleSave}
                loading={saving}
                style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}
              >
                Save Entitlements
              </Button>
            </Space>
          </Col>
        </Row>

        {isOverrideMode && (
          <Alert
            message="Custom Overrides Active"
            description="Tenant access is currently detached from subscription tier defaults. Changing the subscription plan will not modify module access until reset to plan defaults."
            type="warning"
            showIcon
            style={{ marginTop: 16, borderRadius: 8 }}
          />
        )}
      </Card>

      {/* Modules Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 15 }}>
            Available Modules ({activeCount} / {totalCount} Enabled)
          </Text>
          <Space size={8}>
            <Tag color="green">Active</Tag>
            <Tag color="default">Disabled</Tag>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          {AVAILABLE_MODULES.map((mod) => {
            const isEnabled = activeModules.has(mod.value);
            const inPlan = planModules.has(mod.value);
            const IconComponent = MODULE_ICONS[mod.value] || Boxes;

            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={mod.value}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${isEnabled ? '#D97706' : token.colorBorderSecondary}`,
                    backgroundColor: isEnabled 
                      ? (token.colorBgContainer === '#1E293B' ? 'rgba(217, 119, 6, 0.08)' : 'rgba(217, 119, 6, 0.04)')
                      : token.colorBgContainer,
                    transition: 'all 0.2s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', height: '100%' } }}
                >
                  <div>
                    {/* Header: Icon + Name + Switch */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div 
                          style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 8, 
                            backgroundColor: isEnabled ? 'rgba(217, 119, 6, 0.15)' : token.colorFillSecondary,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}
                        >
                          <IconComponent size={20} color={isEnabled ? '#D97706' : token.colorTextSecondary} />
                        </div>
                        <div>
                          <Text strong style={{ display: 'block', fontSize: 14 }}>
                            {mod.label}
                          </Text>
                          <Tag style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>
                            {mod.value}
                          </Tag>
                        </div>
                      </div>

                      <Switch
                        checked={isEnabled}
                        onChange={(checked) => handleToggleModule(mod.value, checked)}
                      />
                    </div>

                    {/* Description */}
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6, lineHeight: 1.4 }}>
                      {mod.description}
                    </Text>
                  </div>

                  {/* Footer: Source badge */}
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${token.colorBorderSecondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Status</Text>
                    <div>
                      {isEnabled ? (
                        isOverrideMode ? (
                          <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>
                            Custom Enabled
                          </Tag>
                        ) : (
                          <Tag color="green" style={{ margin: 0, fontSize: 11 }}>
                            Included in Plan
                          </Tag>
                        )
                      ) : (
                        <Tag style={{ margin: 0, fontSize: 11, color: '#888' }}>
                          Disabled
                        </Tag>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Floating or Bottom Save Bar */}
      <Card 
        style={{ 
          borderRadius: 12, 
          border: `1px solid ${token.colorBorderSecondary}`,
          backgroundColor: token.colorBgContainer 
        }}
        styles={{ body: { padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 } }}
      >
        <Space size={8}>
          <CheckCircle2 size={18} color="#10B981" />
          <Text strong>{activeCount} modules active for this tenant.</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            ({isOverrideMode ? "Custom override configuration" : "Inherited from " + (details?.plan?.name || "Plan")})
          </Text>
        </Space>

        <Space>
          {isOverrideMode && (
            <Popconfirm
              title="Discard custom overrides and reset to plan?"
              onConfirm={handleResetToPlan}
              okText="Reset"
              cancelText="Cancel"
            >
              <Button icon={<RotateCcw size={14} className="inline mr-1" />}>
                Reset to Plan
              </Button>
            </Popconfirm>
          )}
          <Button 
            type="primary" 
            size="large"
            icon={<Save size={18} className="inline mr-1" />}
            onClick={handleSave}
            loading={saving}
            style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}
          >
            Save Module Entitlements
          </Button>
        </Space>
      </Card>
    </div>
  );
}
