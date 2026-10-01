import { useState } from "react";
import { Alert, App, Form, Input, InputNumber, Modal, Typography } from "antd";
import { correctMaterialCost } from "../services/inventoryApi";

const money = (value) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });

export default function CostCorrectionModal({ material, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { message } = App.useApp();
  const newCost = Form.useWatch("costPerBaseUnit", form);

  async function save() {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await correctMaterialCost(material.id, {
        ...values,
        expectedCost: material.costPerBaseUnit,
        baseUomId: material.baseUom.id,
      });
      message.success("Material cost corrected");
      onSaved(updated);
      onClose();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Edit cost — ${material?.name || ""}`}
      open={Boolean(material)}
      onOk={save}
      onCancel={() => !saving && onClose()}
      okText="Save correction"
      confirmLoading={saving}
      closable={!saving}
      mask={{ closable: !saving }}
      keyboard={!saving}
      cancelButtonProps={{ disabled: saving }}
    >
      <Typography.Paragraph>
        Current cost: TZS {money(material?.costPerBaseUnit || 0)} per{" "}
        {material?.baseUom?.symbol}. Stock quantity and historical receipts will
        not change. Recipe estimates will use the corrected cost.
      </Typography.Paragraph>
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        disabled={saving}
        initialValues={{ costPerBaseUnit: Number(material.costPerBaseUnit) }}
      >
        <Form.Item
          name="costPerBaseUnit"
          label={`New cost per ${material?.baseUom?.name || "base unit"} (TZS)`}
          extra="Enter the price of ONE base unit, not the total purchase or bag price."
          rules={[
            { required: true },
            { type: "number", min: 0, max: 9999999999.9999 },
          ]}
        >
          <InputNumber
            min={0}
            max={9999999999.9999}
            precision={4}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Typography.Paragraph aria-live="polite">
          Stock: {money(material?.currentStockBaseQty || 0)}{" "}
          {material?.baseUom?.symbol}
          <br />
          Inventory value: TZS{" "}
          {money(
            Number(material?.currentStockBaseQty || 0) *
              Number(material?.costPerBaseUnit || 0),
          )}
          {" → "}{" "}
          {newCost == null
            ? "Enter a new cost"
            : `TZS ${money(Number(material?.currentStockBaseQty || 0) * newCost)}`}
        </Typography.Paragraph>
        <Form.Item
          name="reason"
          label="Reason for correction"
          rules={[{ required: true, whitespace: true }, { max: 500 }]}
        >
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
