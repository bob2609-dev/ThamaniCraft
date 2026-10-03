import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import * as api from "../services/salesApi";
import { fetchFinishedProducts } from "../services/inventoryApi";
import { listRecipes } from "../services/recipeApi";
import CustomerEditor from "../components/CustomerEditor";
import OrderPayments from "../components/OrderPayments";
import OrderCostingSummary from "../components/OrderCostingSummary";
import usePermissions from "../hooks/usePermissions";
import { withSorters } from '../utils/tableUtils';
import SearchableTable from '../components/SearchableTable';

export default function OrderEntry() {
  const { id } = useParams(),
    navigate = useNavigate(),
    { message } = App.useApp();
  const { hasPermission } = usePermissions(),
    canView = hasPermission("VIEW_SALES"),
    canEdit = hasPermission("PROCESS_SALES");
  const [form] = Form.useForm(),
    [customers, setCustomers] = useState([]),
    [order, setOrder] = useState(null);
  const [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [quick, setQuick] = useState(false);
  const [requestId] = useState(api.newRequestId);
  const [editing, setEditing] = useState(false),
    [action, setAction] = useState(null),
    [reason, setReason] = useState("");
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [fulfillModal, setFulfillModal] = useState(false),
    [carrier, setCarrier] = useState(""),
    [fulfillNotes, setFulfillNotes] = useState("");
  const [settleModal, setSettleModal] = useState(false),
    [settleReason, setSettleReason] = useState(""),
    [retainedDeposit, setRetainedDeposit] = useState(0),
    [inventoryDisposition, setInventoryDisposition] =
      useState("RETAIN_IN_STOCK");

  function beginEdit() {
    const localDate = new Date(
      new Date(order.dueAt).getTime() + 3 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 16);
    setEditing(true);
    setCustomers([
      {
        id: order.customerId,
        name: order.customerName,
        phone: order.customerPhone,
      },
    ]);
    const items = (order.items || []).map((i) => ({
      ...i,
      isFinishedProduct: !!i.finishedProductId,
    }));
    form.setFieldsValue({ ...order, dueAt: localDate, editReason: "", items });
  }
  async function changeStatus() {
    if (saving || !reason.trim()) return;
    setSaving(true);
    try {
      await api.transitionOrder(id, action, { version: order.version, reason });
      setOrder(await api.getOrder(id));
      setAction(null);
      setReason("");
      message.success("Order status updated");
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function submitFulfill() {
    if (saving) return;
    setSaving(true);
    try {
      await api.fulfillOrder(id, {
        version: order.version,
        carrierOrCollector: carrier,
        notes: fulfillNotes,
      });
      setOrder(await api.getOrder(id));
      setFulfillModal(false);
      setCarrier("");
      setFulfillNotes("");
      message.success("Order marked as fulfilled & finished stock dispatched");
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function submitSettleCancellation() {
    if (saving || !settleReason.trim()) return;
    setSaving(true);
    try {
      await api.settleCancellationOrder(id, {
        version: order.version,
        reason: settleReason,
        retainedDeposit,
        inventoryDisposition,
      });
      setOrder(await api.getOrder(id));
      setSettleModal(false);
      setSettleReason("");
      setRetainedDeposit(0);
      setInventoryDisposition("RETAIN_IN_STOCK");
      message.success("Order cancelled and settled successfully.");
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }
  const values = Form.useWatch([], form) || {};
  const subtotal = (values.items || []).reduce(
    (sum, i) =>
      sum +
      Math.round(Number(i?.quantity || 0) * Number(i?.unitPrice || 0) * 100) /
        100,
    0,
  );
  const total =
    subtotal +
    Number(values.deliveryCharge || 0) -
    Number(values.discountAmount || 0);
  useEffect(() => {
    if (!canView) return;
    let active = true;
    (id ? api.getOrder(id) : api.listCustomers())
      .then((data) => {
        if (active) {
          if (id) setOrder(data);
          else setCustomers(data);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    fetchFinishedProducts()
      .then((data) => {
        if (active) setFinishedProducts(data);
      })
      .catch(() => {});
    listRecipes()
      .then((data) => {
        if (active) setRecipes(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, canView]);

  function onFinishedProductSelect(idx, fpId) {
    const fp = finishedProducts.find((p) => p.id === fpId);
    if (!fp) return;
    const uomName = fp.baseUom?.name || fp.baseUom?.symbol || "unit";
    form.setFieldValue(["items", idx, "description"], fp.name);
    form.setFieldValue(["items", idx, "unit"], uomName);
    form.setFieldValue(["items", idx, "finishedProductId"], fp.id);
    form.setFieldValue(["items", idx, "finishedProductName"], fp.name);
    if (fp.sellingPrice != null)
      form.setFieldValue(["items", idx, "unitPrice"], Number(fp.sellingPrice));
    else if (fp.costPerBaseUnit > 0)
      form.setFieldValue(
        ["items", idx, "unitPrice"],
        Number(fp.costPerBaseUnit),
      );
  }
  function onIsFinishedProductChange(idx, checked) {
    if (!checked) {
      form.setFieldValue(["items", idx, "finishedProductId"], undefined);
      form.setFieldValue(["items", idx, "finishedProductName"], undefined);
    }
  }

  async function save(data) {
    if (saving) return;
    setSaving(true);
    try {
      const items = data.items.map(({ isFinishedProduct, ...rest }) => ({
        ...rest,
        outputPerItem: rest.recipeId ? 1 : undefined,
      }));
      const payload = {
        ...data,
        items,
        requestId,
        dueAt: `${data.dueAt}:00+03:00`,
      };
      if (editing) {
        await api.editOrder(id, {
          version: order.version,
          order: payload,
          reason: data.editReason,
        });
        setOrder(await api.getOrder(id));
        setEditing(false);
        message.success("Order updated");
      } else {
        const result = await api.createOrder(payload);
        // The backend now natively maps recipes on order creation using recipeId and outputPerItem in the payload
        message.success("Order recorded");
        navigate(`/sales/${result.id}`);
      }
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }
  if (!canView || (!id && !canEdit))
    return <Alert type="warning" title="Sales permission required." />;
  const amount = (name, label) => (
    <Col xs={24} md={8}>
      <Form.Item name={name} label={label} rules={[{ required: true }]}>
        <InputNumber
          min={0}
          max={999999999999.99}
          precision={2}
          style={{ width: "100%" }}
        />
      </Form.Item>
    </Col>
  );
  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-500 rounded-lg shadow">
      <Button onClick={() => navigate("/sales")} disabled={saving}>
        Back to orders
      </Button>
      <Typography.Title level={2}>
        {editing ? "Edit order" : id ? "Order details" : "New order"}
      </Typography.Title>
      {error && <Alert type="error" title={error} />}
      <Alert
        type="info"
        title="Agreed deposit is a target, not money received. Record actual receipts under Payments after saving."
        style={{ marginBottom: 16 }}
      />
      {id && !editing ? (
        order && (
          <Card className="dark:bg-slate-800">
            <Space wrap style={{ marginBottom: 16 }}>
              <Typography.Text strong>
                {order.orderNumber} · {order.status}
              </Typography.Text>
              <Tag
                color={
                  order.fulfillmentStatus === "FULFILLED" ? "green" : "orange"
                }
              >
                Fulfillment: {order.fulfillmentStatus || "UNFULFILLED"}
              </Tag>
              {canEdit &&
                Number.isInteger(order.version) &&
                order.status === "NEW" && (
                  <>
                    <Button disabled={saving} onClick={beginEdit}>
                      Edit order
                    </Button>
                    <Button
                      type="primary"
                      disabled={saving}
                      onClick={() => {
                        setReason("Order confirmed");
                        setAction("confirm");
                      }}
                    >
                      Confirm order
                    </Button>
                  </>
                )}
              {canEdit &&
                Number.isInteger(order.version) &&
                order.status === "CONFIRMED" &&
                order.fulfillmentStatus !== "FULFILLED" && (
                  <>
                    <Button
                      type="primary"
                      style={{ backgroundColor: "#52c41a" }}
                      disabled={saving}
                      onClick={() => setFulfillModal(true)}
                    >
                      Mark Delivered / Collected
                    </Button>
                  </>
                )}
              {canEdit &&
                Number.isInteger(order.version) &&
                order.status === "NEW" && (
                  <Button
                    danger
                    disabled={saving}
                    onClick={() => {
                      setReason("");
                      setAction("cancel");
                    }}
                  >
                    Cancel order
                  </Button>
                )}
              {canEdit &&
                Number.isInteger(order.version) &&
                order.status === "CONFIRMED" && (
                  <Button
                    danger
                    disabled={saving}
                    onClick={() => {
                      const hasInProgress = order.items?.some(
                        (i) =>
                          i.workOrderStatus === "IN_PROGRESS" ||
                          i.workOrderStatus === "COMPLETION_PENDING",
                      );
                      if (hasInProgress) {
                        message.error(
                          "Cannot cancel order. There are linked work orders currently IN_PROGRESS or COMPLETION_PENDING. Please complete or abort them in the Production module first.",
                        );
                        return;
                      }
                      setSettleModal(true);
                    }}
                  >
                    Settle & Cancel Order
                  </Button>
                )}
            </Space>
            {!Number.isInteger(order.version) && (
              <Alert
                type="info"
                title="Order editing and status actions require the Sales lifecycle backend update."
              />
            )}
            <Descriptions
              column={2}
              items={[
                { key: "id", label: "Order ID", children: order.id },
                {
                  key: "name",
                  label: "Customer",
                  children: order.customerName,
                },
                { key: "phone", label: "Phone", children: order.customerPhone },
                {
                  key: "email",
                  label: "Email",
                  children: order.customerEmail || "—",
                },
                {
                  key: "due",
                  label: "Due (Dar es Salaam)",
                  children: new Date(order.dueAt).toLocaleString(undefined, {
                    timeZone: "Africa/Dar_es_Salaam",
                  }),
                },
                {
                  key: "fulfilment",
                  label: "Fulfilment mode",
                  children: order.fulfilment,
                },
                {
                  key: "address",
                  label: "Delivery address",
                  children: order.deliveryAddress || "—",
                },
                {
                  key: "subtotal",
                  label: "Subtotal (TZS)",
                  children: order.subtotal,
                },
                {
                  key: "delivery",
                  label: "Delivery charge (TZS)",
                  children: order.deliveryCharge,
                },
                {
                  key: "discount",
                  label: "Discount (TZS)",
                  children: order.discountAmount,
                },
                { key: "total", label: "Total (TZS)", children: order.total },
                {
                  key: "deposit",
                  label: "Agreed deposit (TZS)",
                  children: order.depositRequired,
                },
                {
                  key: "discountNote",
                  label: "Discount note",
                  children: order.discountNote || "—",
                },
                {
                  key: "fulfillmentStatus",
                  label: "Fulfillment status",
                  children: order.fulfillmentStatus || "UNFULFILLED",
                },
                {
                  key: "fulfilledAt",
                  label: "Fulfilled at",
                  children: order.fulfilledAt
                    ? new Date(order.fulfilledAt).toLocaleString(undefined, {
                        timeZone: "Africa/Dar_es_Salaam",
                      })
                    : "—",
                },
                {
                  key: "carrier",
                  label: "Carrier / Collector",
                  children: order.carrierOrCollector || "—",
                },
                {
                  key: "fulfillmentNotes",
                  label: "Fulfillment notes",
                  children: order.fulfillmentNotes || "—",
                },
                { key: "notes", label: "Notes", children: order.notes || "—" },
              ]}
            />
            <OrderCostingSummary
              order={order}
              onChanged={async () => setOrder(await api.getOrder(id))}
            />
            <OrderPayments
              order={order}
              onChanged={async () => setOrder(await api.getOrder(id))}
            />
            <Typography.Title level={4}>Order history</Typography.Title>
            <SearchableTable
              rowKey="id"
              dataSource={order.history || []}
              pagination={false}
              scroll={{ x: 700 }}
              columns={withSorters([
                { title: "Action", dataIndex: "action" },
                { title: "Reason", dataIndex: "reason" },
                { title: "Previous discount", dataIndex: "oldDiscount" },
                { title: "New discount", dataIndex: "newDiscount" },
                { title: "Recorded by", dataIndex: "actor" },
                {
                  title: "Time",
                  dataIndex: "createdAt",
                  render: (v) =>
                    new Date(v).toLocaleString(undefined, {
                      timeZone: "Africa/Dar_es_Salaam",
                    }),
                },
              ])}
            />
            <SearchableTable
              rowKey="id"
              dataSource={order.items}
              pagination={false}
              scroll={{ x: 850 }}
              columns={withSorters([
                {
                  title: "Item",
                  dataIndex: "description",
                  render: (v, r) =>
                    r.finishedProductName ? (
                      <>
                        {v} <Tag color="green">Finished Product</Tag>
                      </>
                    ) : (
                      v
                    ),
                },
                { title: "Quantity", dataIndex: "quantity" },
                { title: "Unit", dataIndex: "unit" },
                { title: "Price (TZS)", dataIndex: "unitPrice" },
                { title: "Total (TZS)", dataIndex: "lineTotal" },
                { title: "Instructions", dataIndex: "instructions" },
                {
                  title: "Work Order",
                  dataIndex: "workOrderId",
                  render: (v, r) =>
                    v ? (
                      <Link
                        to={`/production/${v}`}
                        style={{ color: "#1677ff" }}
                      >
                        View WO →
                      </Link>
                    ) : (
                      "—"
                    ),
                },
              ])}
            />
          </Card>
        )
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={save}
          disabled={saving}
          scrollToFirstError
          initialValues={{
            fulfilment: "COLLECTION",
            deliveryCharge: 0,
            discountAmount: 0,
            depositRequired: 0,
            items: [
              {
                quantity: 1,
                unit: "piece",
                unitPrice: 0,
                isFinishedProduct: false,
              },
            ],
          }}
        >
          <Card
            className="dark:bg-slate-800"
            title="Customer & fulfilment"
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16}>
              <Col xs={24} md={18}>
                <Form.Item
                  name="customerId"
                  label="Customer"
                  rules={[{ required: true }]}
                >
                  <Select
                    disabled={editing}
                    showSearch
                    optionFilterProp="label"
                    options={customers.map((c) => ({
                      value: c.id,
                      label: `${c.name} — ${c.phone}`,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="New customer">
                  <Button disabled={editing} onClick={() => setQuick(true)}>
                    Add customer
                  </Button>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="dueAt"
                  label="Due date & time (Dar es Salaam)"
                  rules={[{ required: true }]}
                >
                  <Input type="datetime-local" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fulfilment"
                  label="Fulfilment"
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { value: "COLLECTION", label: "Collection" },
                      { value: "DELIVERY", label: "Delivery" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="deliveryAddress"
                  label="Delivery address"
                  rules={[
                    {
                      required: values.fulfilment === "DELIVERY",
                      whitespace: true,
                    },
                  ]}
                >
                  <Input.TextArea rows={2} maxLength={1000} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card
            className="dark:bg-slate-800"
            title="Order items"
            style={{ marginBottom: 24 }}
          >
            <Form.List
              name="items"
              rules={[
                {
                  validator: async (_, items) => {
                    if (!items?.length)
                      throw new Error("Add at least one item");
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map(({ key, name, ...field }) => {
                    const isFP = values.items?.[name]?.isFinishedProduct;
                    return (
                      <Row
                        gutter={12}
                        key={key}
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          paddingBottom: 12,
                          marginBottom: 12,
                        }}
                      >
                        <Col xs={24} md={6}>
                          <Form.Item
                            {...field}
                            name={[name, "isFinishedProduct"]}
                            valuePropName="checked"
                            label=" "
                          >
                            <Checkbox
                              onChange={(e) =>
                                onIsFinishedProductChange(
                                  name,
                                  e.target.checked,
                                )
                              }
                            >
                              Finished product
                            </Checkbox>
                          </Form.Item>
                        </Col>
                        {isFP ? (
                          <>
                            <Col xs={24} md={8}>
                              <Form.Item
                                label="Select finished product"
                                rules={[
                                  {
                                    required: true,
                                    message: "Select a finished product",
                                  },
                                ]}
                              >
                                <Select
                                  showSearch
                                  optionFilterProp="label"
                                  placeholder="Choose a finished product..."
                                  value={
                                    values.items?.[name]?.finishedProductId
                                  }
                                  onChange={(v) =>
                                    onFinishedProductSelect(name, v)
                                  }
                                  options={finishedProducts.map((fp) => ({
                                    value: fp.id,
                                    label: `${fp.name}${fp.sku ? " — " + fp.sku : ""}${fp.category ? " (" + fp.category + ")" : ""}`,
                                  }))}
                                />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[name, "finishedProductId"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[name, "finishedProductName"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                            </Col>
                          </>
                        ) : (
                          <>
                            <Col xs={24} md={8}>
                              <Form.Item
                                {...field}
                                name={[name, "recipeId"]}
                                label="Base Recipe (Optional)"
                              >
                                <Select
                                  showSearch
                                  optionFilterProp="label"
                                  placeholder="Select a base recipe..."
                                  allowClear
                                  onChange={(v) => {
                                    if (v) {
                                      const r = recipes.find(
                                        (rc) => rc.id === v,
                                      );
                                      if (r) {
                                        form.setFieldValue(
                                          ["items", name, "description"],
                                          r.name,
                                        );
                                        import("../services/recipeApi").then(
                                          ({ getRecipe }) =>
                                            getRecipe(v)
                                              .then((details) => {
                                                if (details?.costing?.unitCost) {
                                                  const suggestedPrice = details.suggestedPrice || details.costing.unitCost || 0;
                                                  form.setFieldValue(
                                                    [
                                                      "items",
                                                      name,
                                                      "unitPrice",
                                                    ],
                                                    Number(
                                                      suggestedPrice.toFixed(2),
                                                    ),
                                                  );
                                                }
                                              })
                                              .catch(() => {}),
                                        );
                                      }
                                    }
                                  }}
                                  options={recipes.map((r) => ({
                                    value: r.id,
                                    label: r.name,
                                  }))}
                                />
                              </Form.Item>
                            </Col>
                          </>
                        )}
                        <Col xs={24} md={isFP ? 10 : 8}>
                          <Form.Item
                            {...field}
                            name={[name, "description"]}
                            label="Item / description"
                            rules={[{ required: true, whitespace: true }]}
                          >
                            <Input maxLength={255} readOnly={isFP} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Item
                            {...field}
                            name={[name, "quantity"]}
                            label="Quantity"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              min={0.0001}
                              max={99999999.9999}
                              precision={4}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Item
                            {...field}
                            name={[name, "unit"]}
                            label="Unit"
                            rules={[{ required: true, whitespace: true }]}
                          >
                            <Input maxLength={40} readOnly={isFP} />
                          </Form.Item>
                        </Col>
                        <Col xs={18} md={5}>
                          <Form.Item
                            {...field}
                            name={[name, "unitPrice"]}
                            label="Price (TZS)"
                            rules={[{ required: true }]}
                            style={{ marginBottom: 4 }}
                          >
                            <InputNumber
                              min={0}
                              max={9999999999.99}
                              precision={2}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                          {isFP &&
                            values.items?.[name]?.finishedProductId &&
                            (() => {
                              const fp = finishedProducts.find(
                                (p) =>
                                  p.id === values.items[name].finishedProductId,
                              );
                              if (!fp) return null;
                              return (
                                <Typography.Text
                                  type="secondary"
                                  style={{ fontSize: 12 }}
                                >
                                  Standard: TZS{" "}
                                  {Number(
                                    fp.sellingPrice || fp.costPerBaseUnit || 0,
                                  ).toFixed(2)}
                                </Typography.Text>
                              );
                            })()}
                        </Col>
                        <Col xs={6} md={3}>
                          <Form.Item label=" ">
                            <Button danger onClick={() => remove(name)}>
                              Remove
                            </Button>
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...field}
                            name={[name, "instructions"]}
                            label="Special instructions"
                          >
                            <Input.TextArea rows={2} maxLength={1000} />
                          </Form.Item>
                        </Col>
                      </Row>
                    );
                  })}
                  <Form.ErrorList errors={errors} />
                  <Space>
                    <Button
                      onClick={() =>
                        add({
                          quantity: 1,
                          unit: "piece",
                          unitPrice: 0,
                          isFinishedProduct: false,
                        })
                      }
                      disabled={fields.length >= 100 || saving}
                    >
                      Add custom item
                    </Button>
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({
                          quantity: 1,
                          unit: "",
                          unitPrice: 0,
                          isFinishedProduct: true,
                        })
                      }
                      disabled={
                        fields.length >= 100 ||
                        saving ||
                        !finishedProducts.length
                      }
                    >
                      Add finished product
                    </Button>
                  </Space>
                </>
              )}
            </Form.List>
          </Card>
          <Card
            className="dark:bg-slate-800"
            title="Agreed price & notes"
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16}>
              {amount("deliveryCharge", "Delivery charge (TZS)")}
              {amount("discountAmount", "Discount amount (TZS)")}
              {amount("depositRequired", "Agreed deposit (TZS)")}
              <Col span={24}>
                <Form.Item
                  name="discountNote"
                  label="Discount / negotiation note"
                >
                  <Input maxLength={1000} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="notes" label="Order notes">
                  <Input.TextArea rows={3} maxLength={4000} />
                </Form.Item>
              </Col>
            </Row>
            <Typography.Paragraph>
              Subtotal: TZS {subtotal.toFixed(2)} · Total after discount: TZS{" "}
              {total.toFixed(2)}
            </Typography.Paragraph>
            {(total < 0 || Number(values.depositRequired) > total) && (
              <Alert
                type="error"
                title="Discount or agreed deposit exceeds the available total."
              />
            )}
          </Card>
          {editing && (
            <Form.Item
              name="editReason"
              label="Reason for change"
              rules={[{ required: true, whitespace: true }]}
            >
              <Input maxLength={1000} />
            </Form.Item>
          )}
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              disabled={total < 0 || Number(values.depositRequired) > total}
            >
              {editing ? "Save changes" : "Record order"}
            </Button>
            {editing && (
              <Button disabled={saving} onClick={() => setEditing(false)}>
                Discard changes
              </Button>
            )}
          </Space>
        </Form>
      )}
      <Modal
        open={Boolean(action)}
        title={
          action === "cancel" ? "Cancel this order?" : "Confirm this order?"
        }
        confirmLoading={saving}
        closable={!saving}
        mask={{ closable: !saving }}
        cancelButtonProps={{ disabled: saving }}
        okButtonProps={{
          disabled: !reason.trim(),
          danger: action === "cancel",
        }}
        onOk={changeStatus}
        onCancel={() => setAction(null)}
      >
        <Typography.Paragraph>
          {action === "cancel"
            ? "The order will remain in history and cannot be edited. Existing receipts remain recorded; cancellation does not refund money."
            : "Confirmation locks editing. Payments are tracked separately and production linkage is still pending."}
        </Typography.Paragraph>
        <label htmlFor="order-action-reason">Reason</label>
        <Input.TextArea
          id="order-action-reason"
          value={reason}
          disabled={saving}
          maxLength={1000}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
      <Modal
        open={fulfillModal}
        title="Mark Order as Fulfilled / Delivered"
        confirmLoading={saving}
        closable={!saving}
        mask={{ closable: !saving }}
        cancelButtonProps={{ disabled: saving }}
        onOk={submitFulfill}
        onCancel={() => setFulfillModal(false)}
      >
        <Typography.Paragraph>
          Fulfilling this order will deduct finished product inventory stock for
          all mapped finished items.
        </Typography.Paragraph>
        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor="carrier-input"
            style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}
          >
            Carrier / Driver / Collector Name
          </label>
          <Input
            id="carrier-input"
            placeholder="e.g. Bob (Customer) or Bodaboda / Driver Name"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            maxLength={255}
          />
        </div>
        <div>
          <label
            htmlFor="fulfill-notes-input"
            style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}
          >
            Dispatch Notes
          </label>
          <Input.TextArea
            id="fulfill-notes-input"
            placeholder="Additional notes about delivery or collection..."
            value={fulfillNotes}
            onChange={(e) => setFulfillNotes(e.target.value)}
            maxLength={1000}
          />
        </div>
      </Modal>
      <Modal
        open={settleModal}
        title="Settle & Cancel Confirmed Order"
        confirmLoading={saving}
        closable={!saving}
        mask={{ closable: !saving }}
        cancelButtonProps={{ disabled: saving }}
        okButtonProps={{ disabled: !settleReason.trim(), danger: true }}
        onOk={submitSettleCancellation}
        onCancel={() => setSettleModal(false)}
      >
        <Typography.Paragraph>
          Use this to cancel an order that was already confirmed and might have
          payments or production attached. This will record your settlement
          decisions.
        </Typography.Paragraph>
        <div style={{ marginBottom: 12 }}>
          <label
            style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}
          >
            Cancellation Reason
          </label>
          <Input.TextArea
            placeholder="Why is this order being cancelled?"
            value={settleReason}
            onChange={(e) => setSettleReason(e.target.value)}
            maxLength={1000}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label
            style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}
          >
            Amount to Retain (TZS)
          </label>
          <Typography.Text
            type="secondary"
            style={{ display: "block", marginBottom: 4 }}
          >
            Specify how much of the customer's paid money will be kept as a
            cancellation fee. The rest will be marked as Refund Due.
          </Typography.Text>
          <InputNumber
            min={0}
            max={999999999}
            style={{ width: "100%" }}
            value={retainedDeposit}
            onChange={setRetainedDeposit}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label
            style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}
          >
            Finished Goods Disposition
          </label>
          <Typography.Text
            type="secondary"
            style={{ display: "block", marginBottom: 4 }}
          >
            If any items were already produced (completed batches), what should
            happen to that inventory stock?
          </Typography.Text>
          <Select
            style={{ width: "100%" }}
            value={inventoryDisposition}
            onChange={setInventoryDisposition}
            options={[
              {
                value: "RETAIN_IN_STOCK",
                label: "Retain in stock (Available to sell to others)",
              },
              {
                value: "SCRAP",
                label: "Scrap / Write-off (Deduct from inventory immediately)",
              },
            ]}
          />
        </div>
      </Modal>
      {quick && (
        <CustomerEditor
          quick
          onClose={() => setQuick(false)}
          onSaved={(c) => {
            setCustomers((prev) => [...prev, c]);
            form.setFieldValue("customerId", c.id);
          }}
        />
      )}
    </div>
  );
}
