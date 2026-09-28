import React, { useState, useEffect } from 'react';
import { Typography, Card, Select, DatePicker, Table, Button, Space, Spin, message, Tabs, Modal, Form, Input, InputNumber, Row, Col } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { listOrders } from '../services/salesApi';
import { listWorkOrders } from '../services/productionApi';
import { fetchRawMaterials, fetchFinishedProducts } from '../services/inventoryApi';
import { getTrialBalance, getJournalEntries, postJournalEntry } from '../services/financeApi';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function Reports() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('SALES_MARGIN');
  const [isDoubleEntryView, setIsDoubleEntryView] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const openManualEntryModal = async () => {
    setIsModalVisible(true);
    try {
      const accs = await getTrialBalance();
      setAccounts(accs);
    } catch (e) {
      console.error(e);
      message.error("Failed to load accounts");
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, dateRange, isDoubleEntryView]);

  const generateReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'SALES_MARGIN') {
        const orders = await listOrders();
        // Filter by date
        const filtered = orders.filter(o => {
          const date = dayjs(o.createdAt);
          return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
        });
        
        // Setup columns
        setColumns([
          { title: 'Order ID', dataIndex: 'id', render: id => id.substring(0, 8) },
          { title: 'Date', dataIndex: 'createdAt', render: d => dayjs(d).format('YYYY-MM-DD') },
          { title: 'Customer', dataIndex: 'customerName' },
          { title: 'Status', dataIndex: 'status' },
          { title: 'Total (TZS)', dataIndex: 'totalAmount', render: val => val?.toLocaleString() },
          { title: 'Discount', dataIndex: 'discountAmount', render: val => val?.toLocaleString() },
          { title: 'Margin (%)', dataIndex: 'margin', render: (_, record) => {
            if (!record.costingSummary) return 'N/A';
            const revenue = record.totalAmount;
            const cost = record.costingSummary.actualCost || record.costingSummary.standardCost;
            if (!revenue) return '0%';
            const margin = ((revenue - cost) / revenue) * 100;
            return (
              <span style={{ color: margin > 30 ? '#3f8600' : margin > 0 ? '#faad14' : '#cf1322' }}>
                {margin.toFixed(2)}%
              </span>
            );
          }}
        ]);
        setData(filtered);
      } else if (reportType === 'PRODUCTION_YIELD') {
        const batches = await listWorkOrders();
        const filtered = batches.filter(b => {
          const date = dayjs(b.createdAt);
          return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
        });
        
        setColumns([
          { title: 'Batch ID', dataIndex: 'id', render: id => id.substring(0, 8) },
          { title: 'Date', dataIndex: 'createdAt', render: d => dayjs(d).format('YYYY-MM-DD') },
          { title: 'Recipe', dataIndex: 'recipeName' },
          { title: 'Status', dataIndex: 'status' },
          { title: 'Target Qty', dataIndex: 'targetQuantity' },
          { title: 'Actual Qty', dataIndex: 'actualYield' },
          { title: 'Scrap Qty', dataIndex: 'scrapQuantity' },
          { title: 'Yield (%)', dataIndex: 'yieldPercent', render: (_, record) => {
            if (!record.actualYield || !record.targetQuantity) return 'N/A';
            const yieldPct = (record.actualYield / record.targetQuantity) * 100;
            return `${yieldPct.toFixed(1)}%`;
          }}
        ]);
        setData(filtered);
      } else if (reportType === 'INVENTORY_VALUATION') {
        const [raw, finished] = await Promise.all([fetchRawMaterials(), fetchFinishedProducts()]);
        
        const inventoryData = [
          ...raw.map(r => ({ ...r, type: 'Raw Material' })),
          ...finished.map(f => ({ ...f, type: 'Finished Product' }))
        ];
        
        setColumns([
          { title: 'Item Name', dataIndex: 'name' },
          { title: 'Type', dataIndex: 'type' },
          { title: 'Stock Qty', dataIndex: 'stockQuantity' },
          { title: 'UOM', dataIndex: 'uom', render: u => u?.abbreviation || '' },
          { title: 'Unit Cost (TZS)', dataIndex: 'basePrice', render: val => val?.toLocaleString() },
          { title: 'Total Value (TZS)', dataIndex: 'totalValue', render: (_, record) => {
            const val = (record.stockQuantity || 0) * (record.basePrice || 0);
            return val.toLocaleString();
          }}
        ]);
        setData(inventoryData);
      } else if (reportType === 'TRIAL_BALANCE') {
        const accounts = await getTrialBalance();
        setColumns([
          { title: 'Account Code', dataIndex: 'code' },
          { title: 'Account Name', dataIndex: 'name' },
          { title: 'Type', dataIndex: 'type' },
          { title: 'Balance', dataIndex: 'balance', render: val => val?.toLocaleString() },
        ]);
        setData(accounts);
      } else if (reportType === 'JOURNAL_ENTRIES') {
        const journals = await getJournalEntries();
        if (isDoubleEntryView) {
          const flattened = [];
          journals.forEach(j => {
            j.lines.forEach((l, index) => {
              flattened.push({
                key: `${j.id}-${l.id}`,
                isFirstLine: index === 0,
                entryDate: j.entryDate,
                reference: j.reference,
                description: index === 0 ? j.description : '',
                accountName: `${l.account?.name} (${l.account?.code})`,
                debitAmount: l.debitAmount,
                creditAmount: l.creditAmount
              });
            });
          });
          setColumns([
            { title: 'Date', dataIndex: 'entryDate', render: (d, record) => record.isFirstLine ? dayjs(d).format('YYYY-MM-DD HH:mm') : '' },
            { title: 'Reference', dataIndex: 'reference', render: (ref, record) => record.isFirstLine ? ref : '' },
            { title: 'Description', dataIndex: 'description' },
            { title: 'Account', dataIndex: 'accountName', render: (name, record) => record.creditAmount ? <span style={{ marginLeft: 20 }}>{name}</span> : name },
            { title: 'Debit (TZS)', dataIndex: 'debitAmount', align: 'right', render: val => val ? val.toLocaleString() : '' },
            { title: 'Credit (TZS)', dataIndex: 'creditAmount', align: 'right', render: val => val ? val.toLocaleString() : '' },
          ]);
          setData(flattened);
        } else {
          setColumns([
            { title: 'Date', dataIndex: 'entryDate', render: d => dayjs(d).format('YYYY-MM-DD HH:mm') },
            { title: 'Reference', dataIndex: 'reference' },
            { title: 'Description', dataIndex: 'description' },
            { title: 'Details', dataIndex: 'lines', render: lines => (
               <ul style={{ paddingLeft: 16, margin: 0 }}>
                 {lines?.map(l => (
                   <li key={l.id}>
                     {l.account?.name} ({l.account?.code}): 
                     {l.debitAmount ? ` DR ${l.debitAmount.toLocaleString()}` : ` CR ${l.creditAmount.toLocaleString()}`}
                   </li>
                 ))}
               </ul>
            )},
          ]);
          setData(journals);
        }
      }
    } catch (e) {
      console.error(e);
      message.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handlePostEntry = async (values) => {
    try {
      const lines = [
        { account: { id: values.debitAccountId }, debitAmount: values.amount },
        { account: { id: values.creditAccountId }, creditAmount: values.amount }
      ];
      await postJournalEntry({
        reference: values.reference,
        description: values.description,
        entryDate: values.entryDate,
        lines
      });
      message.success('Journal entry posted successfully');
      setIsModalVisible(false);
      form.resetFields();
      generateReport();
    } catch (e) {
      console.error(e);
      message.error('Failed to post journal entry: ' + e.message);
    }
  };

  const exportToCSV = () => {
    if (!data.length) return;
    
    // Get headers
    const headers = columns.map(c => c.title).join(',');
    
    // Get rows
    const rows = data.map(record => {
      return columns.map(c => {
        let val = record[c.dataIndex];
        if (c.dataIndex === 'createdAt') val = dayjs(val).format('YYYY-MM-DD');
        if (c.dataIndex === 'uom') val = val?.abbreviation;
        if (c.dataIndex === 'margin' && record.costingSummary) {
           const rev = record.totalAmount || 0;
           const cost = record.costingSummary.actualCost || record.costingSummary.standardCost;
           val = rev ? (((rev - cost) / rev) * 100).toFixed(2) + '%' : '0%';
        }
        if (c.dataIndex === 'yieldPercent' && record.actualYield) {
           val = ((record.actualYield / record.targetQuantity) * 100).toFixed(1) + '%';
        }
        if (c.dataIndex === 'totalValue') {
           val = (record.stockQuantity || 0) * (record.basePrice || 0);
        }
        // Escape quotes and wrap in quotes to handle commas
        const strVal = String(val ?? '').replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',');
    });
    
    const csvContent = [headers, ...rows].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${reportType}_${dayjs().format('YYYYMMDD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Reports & Analytics</Title>
        <Space>
          {reportType === 'JOURNAL_ENTRIES' && (
            <Button type="primary" onClick={openManualEntryModal}>
              + Post Manual Entry
            </Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={exportToCSV} disabled={data.length === 0}>
            Export CSV
          </Button>
        </Space>
      </div>
      
      <Tabs
        activeKey={reportType}
        onChange={setReportType}
        style={{ marginBottom: 16 }}
        items={[
          { key: 'SALES_MARGIN', label: 'Sales & Gross Margin' },
          { key: 'PRODUCTION_YIELD', label: 'Production Yield & Scrap' },
          { key: 'INVENTORY_VALUATION', label: 'Inventory Valuation' },
          { key: 'TRIAL_BALANCE', label: 'Trial Balance' },
          { key: 'JOURNAL_ENTRIES', label: 'Journal Entries' },
        ]}
      />

      <Card 
        className="glass-panel" 
        style={{ marginBottom: 24, borderRadius: '12px', border: '1px solid var(--border-subtle)' }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }} size="large">
          <div style={{ display: 'flex', gap: 16 }}>
            {reportType !== 'INVENTORY_VALUATION' && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>DATE RANGE</div>
                <RangePicker 
                  value={dateRange} 
                  onChange={val => val && setDateRange(val)} 
                  allowClear={false}
                  size="large"
                />
              </div>
            )}
            {reportType === 'JOURNAL_ENTRIES' && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>VIEW TYPE</div>
                <Select
                  value={isDoubleEntryView ? 'double' : 'standard'}
                  onChange={v => setIsDoubleEntryView(v === 'double')}
                  style={{ width: 160 }}
                  size="large"
                >
                  <Option value="standard">Standard View</Option>
                  <Option value="double">Double-Entry</Option>
                </Select>
              </div>
            )}
          </div>
          
          <div style={{ alignSelf: 'flex-end' }}>
            <Button type="primary" size="large" onClick={generateReport} loading={loading}>
              Generate Report
            </Button>
          </div>
        </Space>
      </Card>
      
      <Card className="glass-panel" style={{ borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <Table 
          loading={loading}
          dataSource={data} 
          columns={columns} 
          rowKey={record => record.key || record.id}
          size="middle"
          pagination={{ pageSize: 15 }}
        />
      </Card>

      <Modal
        title="Post Manual Journal Entry"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handlePostEntry}>
          <Form.Item name="reference" label="Reference" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="entryDate" label="Entry Date" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="debitAccountId" label="Debit Account" rules={[{ required: true, message: 'Please select an account' }]}>
                <Select showSearch optionFilterProp="children" placeholder="Select Account">
                  {accounts.map(acc => (
                    <Option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="creditAccountId" label="Credit Account" rules={[{ required: true, message: 'Please select an account' }]}>
                <Select showSearch optionFilterProp="children" placeholder="Select Account">
                  {accounts.map(acc => (
                    <Option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
