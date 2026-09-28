import React, { useEffect, useState } from "react";
import {
  Typography,
  Row,
  Col,
  Card,
  Table,
  Alert,
  Spin,
  Segmented,
  Progress,
  Select,
} from "antd";
import {
  ShopOutlined,
  ExperimentOutlined,
  AppstoreOutlined,
  BuildOutlined,
  FireOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { listOrders } from "../services/salesApi";
import { listWorkOrders } from "../services/productionApi";
import {
  fetchRawMaterials,
  fetchFinishedProducts,
} from "../services/inventoryApi";
import dayjs from "dayjs";
import { useTheme } from "../ThemeContext";

const { Title, Text } = Typography;

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    sales: [],
    workOrders: [],
    rawMaterials: [],
    finishedProducts: [],
  });
  const [dateRange, setDateRange] = useState(30); // 7, 30, 90, 180, 365

  const colors = {
    blue: isDark ? "#60a5fa" : "#1890ff",
    orange: isDark ? "#fbbf24" : "#faad14",
    green: isDark ? "#34d399" : "#10B981",
    indigo: isDark ? "#818cf8" : "#6366F1",
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [sales, workOrders, rawMaterials, finishedProducts] =
          await Promise.all([
            listOrders().catch(() => []),
            listWorkOrders().catch(() => []),
            fetchRawMaterials().catch(() => []),
            fetchFinishedProducts().catch(() => []),
          ]);

        setData({
          sales,
          workOrders,
          rawMaterials,
          finishedProducts,
        });
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading)
    return (
      <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
    );

  const pendingSales = data.sales.filter(
    (o) => o.status === "NEW" || o.status === "CONFIRMED",
  ).length;
  const activeWorkOrders = data.workOrders.filter(
    (w) => w.status === "IN_PROGRESS" || w.status === "COMPLETION_PENDING",
  ).length;
  const lowStockMaterials = data.rawMaterials.filter(
    (m) => m.stockQuantity <= (m.reorderLevel || 10),
  );

  // Global Date Filter
  const startDate = dayjs()
    .subtract(dateRange - 1, "day")
    .startOf("day");
  const filteredSales = data.sales.filter((o) =>
    dayjs(o.createdAt).isAfter(startDate),
  );
  const filteredWorkOrders = data.workOrders.filter((w) =>
    dayjs(w.createdAt).isAfter(startDate),
  );

  const salesByGroup = {};
  if (dateRange <= 30) {
    for (let i = 0; i < dateRange; i++) {
      const d = startDate.add(i, "day").format("YYYY-MM-DD");
      salesByGroup[d] = { revenue: 0, profit: 0 };
    }
  } else {
    let curr = startDate.startOf("month");
    const end = dayjs().endOf("month");
    while (curr.isBefore(end)) {
      salesByGroup[curr.format("YYYY-MM")] = { revenue: 0, profit: 0 };
      curr = curr.add(1, "month");
    }
  }

  filteredSales.forEach((order) => {
    const d = dayjs(order.createdAt);
    const key = dateRange <= 30 ? d.format("YYYY-MM-DD") : d.format("YYYY-MM");
    if (salesByGroup[key]) {
      salesByGroup[key].revenue += Number(order.total) || 0;
      const cost = order.actualCost || order.standardCost || 0;
      salesByGroup[key].profit += (Number(order.total) || 0) - cost;
    }
  });

  const chartData = Object.keys(salesByGroup).map((key) => ({
    date:
      dateRange <= 30
        ? dayjs(key).format("MMM DD")
        : dayjs(key).format("MMM YYYY"),
    revenue: salesByGroup[key].revenue,
    profit: salesByGroup[key].profit,
  }));

  // Sales summary stats
  const totalRevenue = filteredSales.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0,
  );
  const confirmedOrders = filteredSales.filter(
    (o) => o.status === "CONFIRMED" || o.status === "FULFILLED",
  ).length;
  const fulfilledOrders = filteredSales.filter(
    (o) => o.fulfillmentStatus === "FULFILLED",
  ).length;
  const cancelledOrders = filteredSales.filter(
    (o) => o.status === "CANCELLED",
  ).length;

  // Extra Pie Chart Data
  const pieColors = [
    colors.blue,
    colors.green,
    colors.orange,
    "#ef4444",
    colors.indigo,
  ];
  const salesStatusCount = filteredSales.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const salesPieData = Object.keys(salesStatusCount).map((k) => ({
    name: k,
    value: salesStatusCount[k],
  }));

  const woStatusCount = filteredWorkOrders.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] || 0) + 1;
    return acc;
  }, {});
  const woPieData = Object.keys(woStatusCount).map((k) => ({
    name: k,
    value: woStatusCount[k],
  }));

  const orderSummary = [
    {
      label: "Total Revenue",
      value: `TZS ${totalRevenue.toLocaleString()}`,
      color: colors.green,
    },
    { label: "Confirmed", value: confirmedOrders, color: colors.blue },
    { label: "Fulfilled", value: fulfilledOrders, color: colors.green },
    { label: "Cancelled", value: cancelledOrders, color: "#ef4444" },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Operational Dashboard
        </Title>
        <Select
          value={dateRange}
          onChange={setDateRange}
          style={{ width: 160 }}
          options={[
            { label: "Last 7 Days", value: 7 },
            { label: "Last 30 Days", value: 30 },
            { label: "Last 3 Months", value: 90 },
            { label: "Last 6 Months", value: 180 },
            { label: "Last 12 Months", value: 365 },
          ]}
        />
      </div>

      <>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="glass-panel"
              style={{
                borderRadius: "14px",
                border: "1px solid var(--border-subtle)",
              }}
              styles={{ body: { padding: "20px" } }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Pending Sales
                  </Text>
                  <Title
                    level={3}
                    style={{
                      margin: "8px 0 0 0",
                      fontWeight: 700,
                      color: pendingSales > 0 ? colors.blue : "inherit",
                    }}
                  >
                    {pendingSales}
                  </Title>
                </div>
                <div
                  style={{
                    background: isDark
                      ? "rgba(96, 165, 250, 0.15)"
                      : "rgba(24, 144, 255, 0.1)",
                    padding: 10,
                    borderRadius: 10,
                    color: colors.blue,
                  }}
                >
                  <ShopOutlined style={{ fontSize: 20 }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="glass-panel"
              style={{
                borderRadius: "14px",
                border: "1px solid var(--border-subtle)",
              }}
              styles={{ body: { padding: "20px" } }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Active Batches
                  </Text>
                  <Title
                    level={3}
                    style={{
                      margin: "8px 0 0 0",
                      fontWeight: 700,
                      color: activeWorkOrders > 0 ? colors.orange : "inherit",
                    }}
                  >
                    {activeWorkOrders}
                  </Title>
                </div>
                <div
                  style={{
                    background: isDark
                      ? "rgba(251, 191, 36, 0.15)"
                      : "rgba(250, 173, 20, 0.1)",
                    padding: 10,
                    borderRadius: 10,
                    color: colors.orange,
                  }}
                >
                  <ExperimentOutlined style={{ fontSize: 20 }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="glass-panel"
              style={{
                borderRadius: "14px",
                border: "1px solid var(--border-subtle)",
              }}
              styles={{ body: { padding: "20px" } }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Raw Materials
                  </Text>
                  <Title
                    level={3}
                    style={{ margin: "8px 0 0 0", fontWeight: 700 }}
                  >
                    {data.rawMaterials.length}
                  </Title>
                </div>
                <div
                  style={{
                    background: isDark
                      ? "rgba(52, 211, 153, 0.15)"
                      : "rgba(16, 185, 129, 0.1)",
                    padding: 10,
                    borderRadius: 10,
                    color: colors.green,
                  }}
                >
                  <AppstoreOutlined style={{ fontSize: 20 }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="glass-panel"
              style={{
                borderRadius: "14px",
                border: "1px solid var(--border-subtle)",
              }}
              styles={{ body: { padding: "20px" } }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Finished Goods
                  </Text>
                  <Title
                    level={3}
                    style={{ margin: "8px 0 0 0", fontWeight: 700 }}
                  >
                    {data.finishedProducts.length}
                  </Title>
                </div>
                <div
                  style={{
                    background: isDark
                      ? "rgba(129, 140, 248, 0.15)"
                      : "rgba(99, 102, 241, 0.1)",
                    padding: 10,
                    borderRadius: 10,
                    color: colors.indigo,
                  }}
                >
                  <BuildOutlined style={{ fontSize: 20 }} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {lowStockMaterials.length > 0 && (
          <Alert
            message="Low Stock Alerts"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {lowStockMaterials.map((m) => (
                  <li key={m.id}>
                    <strong>{m.name}</strong> - Current Stock: {m.stockQuantity}{" "}
                    {m.uom?.abbreviation || ""} (Reorder at:{" "}
                    {m.reorderLevel || 10})
                  </li>
                ))}
              </ul>
            }
            type="warning"
            showIcon
            style={{
              marginBottom: 24,
              borderRadius: 8,
              border: "1px solid #ffe58f",
            }}
          />
        )}

        <Row gutter={[20, 20]}>
          <Col xs={24} lg={16}>
            <Card
              className="glass-panel"
              style={{
                borderRadius: "16px",
                border: "1px solid var(--border-subtle)",
              }}
              title={
                <span style={{ fontWeight: 600, fontSize: "16px" }}>
                  Sales Revenue & Profit Trajectory
                </span>
              }
            >
              <div style={{ height: 340, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#1E40AF"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1E40AF"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorProfit"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) =>
                        `${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`
                      }
                      dx={-10}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value, name) => [
                        `TZS ${value.toLocaleString()}`,
                        name,
                      ]}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#1E40AF"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Gross Profit"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorProfit)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              className="glass-panel"
              style={{
                height: "100%",
                borderRadius: "16px",
                border: "1px solid var(--border-subtle)",
              }}
              title={
                <span style={{ fontWeight: 600, fontSize: "16px" }}>
                  <FireOutlined style={{ color: "#D97706", marginRight: 8 }} />
                  Sales Summary
                </span>
              }
            >
              {data.sales.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#94A3B8",
                  }}
                >
                  No sales recorded
                </div>
              ) : (
                <div>
                  {orderSummary.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom:
                          idx !== orderSummary.length - 1 ? "20px" : "0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{item.label}</div>
                        <div style={{ fontWeight: 700, color: item.color }}>
                          {item.value}
                        </div>
                      </div>
                      <Progress
                        percent={
                          idx === 0
                            ? 100
                            : Math.round(
                                (Number(item.value) /
                                  Math.max(data.sales.length, 1)) *
                                  100,
                              )
                        }
                        showInfo={false}
                        strokeColor={item.color}
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
          <Col xs={24} lg={12}>
            <Card
              className="glass-panel"
              style={{
                borderRadius: "16px",
                border: "1px solid var(--border-subtle)",
              }}
              title={
                <span style={{ fontWeight: 600, fontSize: "16px" }}>
                  Sales Status Breakdown
                </span>
              }
            >
              <div style={{ height: 300 }}>
                {salesPieData.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94A3B8",
                    }}
                  >
                    No data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {salesPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              className="glass-panel"
              style={{
                borderRadius: "16px",
                border: "1px solid var(--border-subtle)",
              }}
              title={
                <span style={{ fontWeight: 600, fontSize: "16px" }}>
                  Work Order Status
                </span>
              }
            >
              <div style={{ height: 300 }}>
                {woPieData.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94A3B8",
                    }}
                  >
                    No data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={woPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {woPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[(index + 2) % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
          <Col xs={24} lg={12}>
            <Card
              className="glass-panel"
              title={
                <span style={{ fontWeight: 600 }}>Recent Sales Orders</span>
              }
              bordered={false}
              style={{ borderRadius: "16px" }}
            >
              <Table
                dataSource={data.sales.slice(0, 5)}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Order ID",
                    dataIndex: "id",
                    render: (id) => <Text strong>{id.substring(0, 8)}</Text>,
                  },
                  { title: "Customer", dataIndex: "customerName" },
                  {
                    title: "Total (TZS)",
                    dataIndex: "total",
                    render: (val) => Number(val)?.toLocaleString(),
                  },
                  { title: "Status", dataIndex: "status" },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              className="glass-panel"
              title={
                <span style={{ fontWeight: 600 }}>Recent Work Orders</span>
              }
              bordered={false}
              style={{ borderRadius: "16px" }}
            >
              <Table
                dataSource={data.workOrders.slice(0, 5)}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Batch ID",
                    dataIndex: "id",
                    render: (id) => <Text strong>{id.substring(0, 8)}</Text>,
                  },
                  { title: "Recipe", dataIndex: "recipeName" },
                  { title: "Target Qty", dataIndex: "targetQuantity" },
                  { title: "Status", dataIndex: "status" },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <style jsx global>{`
          .glass-panel {
            background: var(--component-background) !important;
            backdrop-filter: blur(10px);
            box-shadow:
              0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
        `}</style>
      </>
    </div>
  );
}
