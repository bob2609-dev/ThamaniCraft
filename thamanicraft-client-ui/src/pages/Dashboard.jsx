import React, { useEffect, useState } from "react";
import { Typography, Row, Col, Card, Alert, Spin, Button, Statistic, Select, Space } from "antd";
import {
  ShoppingCartOutlined,
  AppstoreAddOutlined,
  ExperimentOutlined,
  DollarCircleOutlined,
  AlertOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listOrders } from "../services/salesApi";
import { fetchRawMaterials } from "../services/inventoryApi";
import { getExpenses } from "../services/financeApi";
import dayjs from "dayjs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { useTheme } from "../ThemeContext";
import QuickRefillModal from "../components/QuickRefillModal";
import QuickMakeModal from "../components/QuickMakeModal";

const { Title, Text } = Typography;

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [refillVisible, setRefillVisible] = useState(false);
  const [makeVisible, setMakeVisible] = useState(false);
  const [period, setPeriod] = useState("7days");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    sales: [],
    rawMaterials: [],
    expenses: []
  });

  const colors = {
    blue: isDark ? "#60a5fa" : "#1890ff",
    orange: isDark ? "#fbbf24" : "#faad14",
    green: isDark ? "#34d399" : "#10B981",
    red: isDark ? "#ef4444" : "#ff4d4f",
    purple: isDark ? "#c084fc" : "#722ed1"
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [sales, rawMaterials, expenses] = await Promise.all([
          listOrders().catch(() => []),
          fetchRawMaterials().catch(() => []),
          getExpenses().catch(() => []),
        ]);
        setData({ sales, rawMaterials, expenses });
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading)
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  let startDate, format, unit, count, periodLabel;
  switch (period) {
    case 'today': 
      startDate = dayjs().startOf('day'); format = 'HH:00'; unit = 'hour'; count = 24; periodLabel = "Today's"; 
      break;
    case '7days': 
      startDate = dayjs().subtract(6, 'day').startOf('day'); format = 'MMM DD'; unit = 'day'; count = 7; periodLabel = "7-Day"; 
      break;
    case '30days': 
      startDate = dayjs().subtract(29, 'day').startOf('day'); format = 'MMM DD'; unit = 'day'; count = 30; periodLabel = "30-Day"; 
      break;
    case '12months': 
      startDate = dayjs().subtract(11, 'month').startOf('month'); format = 'MMM YYYY'; unit = 'month'; count = 12; periodLabel = "12-Month"; 
      break;
    case 'thisyear': 
      startDate = dayjs().startOf('year'); format = 'MMM YYYY'; unit = 'month'; count = dayjs().month() + 1; periodLabel = "This Year's"; 
      break;
  }

  const periodSales = data.sales.filter(o => dayjs(o.createdAt).isAfter(startDate) && o.status !== "CANCELLED");
  const periodExpenses = (data.expenses || []).filter(e => dayjs(e.expenseDate).isAfter(startDate));
  
  const periodRevenue = periodSales.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const periodProfit = periodSales.reduce((sum, o) => {
    const cost = o.actualCost || o.standardCost || 0;
    return sum + ((Number(o.total) || 0) - cost);
  }, 0);

  const lowStockCount = data.rawMaterials.filter(
    (m) => m.stockQuantity <= (m.reorderLevel || 10)
  ).length;

  const chartDataMap = {};
  for (let i = count - 1; i >= 0; i--) {
    let d;
    if (period === 'today') {
        d = dayjs().startOf('day').add(count - 1 - i, unit).format(format);
    } else {
        d = dayjs().subtract(i, unit).format(format);
    }
    chartDataMap[d] = { date: d, revenue: 0, expenses: 0, profit: 0, netProfit: 0 };
  }

  periodSales.forEach(o => {
    const d = dayjs(o.createdAt).format(format);
    if (chartDataMap[d]) {
        chartDataMap[d].revenue += (Number(o.total) || 0);
        chartDataMap[d].profit += ((Number(o.total) || 0) - (o.actualCost || o.standardCost || 0));
    }
  });

  periodExpenses.forEach(e => {
    const d = dayjs(e.expenseDate).format(format);
    if (chartDataMap[d]) {
        chartDataMap[d].expenses += (Number(e.amount) || 0);
    }
  });

  const chartData = Object.values(chartDataMap).map(d => ({
    ...d,
    netProfit: d.profit - d.expenses
  }));

  const quickActions = [
    {
      title: "New Sale (POS)",
      description: "Quickly checkout customers",
      icon: <ShoppingCartOutlined style={{ fontSize: 24, color: colors.blue }} />,
      bg: isDark ? "rgba(96, 165, 250, 0.15)" : "rgba(24, 144, 255, 0.1)",
      onClick: () => navigate("/sales")
    },
    {
      title: "Quick Refill",
      description: "Add raw materials to inventory",
      icon: <AppstoreAddOutlined style={{ fontSize: 24, color: colors.green }} />,
      bg: isDark ? "rgba(52, 211, 153, 0.15)" : "rgba(16, 185, 129, 0.1)",
      onClick: () => setRefillVisible(true)
    },
    {
      title: "Quick Make",
      description: "Produce finished goods instantly",
      icon: <ExperimentOutlined style={{ fontSize: 24, color: colors.orange }} />,
      bg: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(250, 173, 20, 0.1)",
      onClick: () => setMakeVisible(true)
    },
    {
      title: "Quick Expense",
      description: "Record petty cash and bills",
      icon: <DollarCircleOutlined style={{ fontSize: 24, color: colors.red }} />,
      bg: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 77, 79, 0.1)",
      onClick: () => navigate("/reports")
    }
  ];

  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
      <Space wrap style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, width: "100%" }}>
        <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
        <Select 
          value={period} 
          onChange={setPeriod} 
          style={{ width: 160, height: 40 }}
          options={[
            { value: 'today', label: 'Today' },
            { value: '7days', label: 'Last 7 Days' },
            { value: '30days', label: 'Last 30 Days' },
            { value: '12months', label: 'Last 12 Months' },
            { value: 'thisyear', label: 'This Year' }
          ]}
        />
      </Space>

      {lowStockCount > 0 && (
        <Alert
          message={<strong>Low Stock Alert</strong>}
          description={<>You have <strong>{lowStockCount}</strong> raw material(s) running low on stock. Please check the Inventory page.</>}
          type="warning"
          showIcon
          icon={<AlertOutlined />}
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      {/* Top Banner Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={8}>
          <Card className="glass-panel" style={{ borderRadius: 12 }}>
            <Statistic 
              title={`${periodLabel} Sales Revenue`}
              value={periodRevenue} 
              prefix="TZS"
              valueStyle={{ color: colors.blue, fontWeight: "bold" }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="glass-panel" style={{ borderRadius: 12 }}>
            <Statistic 
              title={`${periodLabel} Gross Profit`}
              value={periodProfit} 
              prefix="TZS"
              valueStyle={{ color: periodProfit >= 0 ? colors.green : colors.red, fontWeight: "bold" }}
              suffix={periodProfit >= 0 ? <ArrowUpOutlined style={{ fontSize: 16 }} /> : null}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="glass-panel" style={{ borderRadius: 12 }}>
            <Statistic 
              title="Low Stock Items" 
              value={lowStockCount} 
              valueStyle={{ color: lowStockCount > 0 ? colors.orange : colors.green, fontWeight: "bold" }} 
            />
          </Card>
        </Col>
      </Row>

      <Title level={4} style={{ marginBottom: 16 }}>Quick Actions</Title>
      
      <Row gutter={[16, 16]}>
        {quickActions.map((action, idx) => (
          <Col xs={24} sm={12} md={6} key={idx}>
            <Card 
              hoverable 
              onClick={action.onClick}
              style={{ borderRadius: 12, height: "100%", transition: "transform 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ 
                  background: action.bg, 
                  padding: 16, 
                  borderRadius: "50%", 
                  marginBottom: 16 
                }}>
                  {action.icon}
                </div>
                <Title level={5} style={{ margin: 0 }}>{action.title}</Title>
                <Text type="secondary" style={{ marginTop: 8 }}>{action.description}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card className="glass-panel" title={`${periodLabel} Revenue vs Expenses`} style={{ borderRadius: 12 }}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#6b7280"} />
                  <YAxis 
                    stroke={isDark ? "#9ca3af" : "#6b7280"} 
                    tickFormatter={(value) => 'TZS ' + Number(value).toLocaleString()}
                  />
                  <Tooltip 
                    formatter={(value) => 'TZS ' + Number(value).toLocaleString()}
                    contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill={colors.blue} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill={colors.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card className="glass-panel" title={`${periodLabel} Gross Profit Trend`} style={{ borderRadius: 12 }}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#6b7280"} />
                  <YAxis 
                    stroke={isDark ? "#9ca3af" : "#6b7280"} 
                    tickFormatter={(value) => 'TZS ' + Number(value).toLocaleString()}
                  />
                  <Tooltip 
                    formatter={(value) => 'TZS ' + Number(value).toLocaleString()}
                    contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="profit" name="Gross Profit" stroke={colors.green} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="netProfit" name="Actual Profit (Net)" stroke={colors.blue} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <QuickRefillModal 
        open={refillVisible} 
        onCancel={() => setRefillVisible(false)} 
        onSuccess={() => {
          fetchRawMaterials().then(d => setData(prev => ({ ...prev, rawMaterials: d })));
        }}
      />
      
      <QuickMakeModal
        open={makeVisible}
        onCancel={() => setMakeVisible(false)}
        onSuccess={() => {
        }}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
