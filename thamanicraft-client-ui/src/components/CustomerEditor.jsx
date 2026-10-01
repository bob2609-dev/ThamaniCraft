import { useState } from "react";
import { Alert, Form, Input, Modal } from "antd";
import { saveCustomer } from "../services/salesApi";

export default function CustomerEditor({
  customer,
  quick = false,
  onClose,
  onSaved,
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save(values) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await saveCustomer(customer?.id, {
        ...values,
        version: customer?.version || 0,
      });
      onSaved({ ...values, id: result.id });
      onClose();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      open
      title={customer ? "Edit customer" : "Add customer"}
      onOk={() => form.submit()}
      onCancel={() => !saving && onClose()}
      confirmLoading={saving}
      okText="Save customer"
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      mask={{ closable: !saving }}
    >
      {error && (
        <Alert type="error" title={error} style={{ marginBottom: 16 }} />
      )}
      {quick && (
        <Alert
          type="info"
          title="Only name and phone are required. Other details can be added in Customers later."
          description="Saving creates a customer record even if you do not finish this order."
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        initialValues={customer}
        onFinish={save}
        disabled={saving}
        scrollToFirstError
      >
        <Form.Item
          name="name"
          label="Customer name"
          rules={[{ required: true, whitespace: true }]}
        >
          <Input maxLength={255} autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Phone number"
          rules={[{ required: true, whitespace: true }]}
        >
          <Input maxLength={40} type="tel" autoComplete="tel" />
        </Form.Item>
        {!quick && (
          <>
            <Form.Item
              name="email"
              label="Email (optional)"
              rules={[{ type: "email" }]}
            >
              <Input maxLength={255} autoComplete="email" />
            </Form.Item>
            <Form.Item name="address" label="Address (optional)">
              <Input.TextArea rows={2} maxLength={1000} />
            </Form.Item>
            <Form.Item name="notes" label="Notes (optional)">
              <Input.TextArea rows={3} maxLength={4000} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
