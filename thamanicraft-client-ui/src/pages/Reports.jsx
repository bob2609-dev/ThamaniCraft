import React, { useState, useEffect } from 'react';
import { Typography, Card, Select, DatePicker, Table, Button, Space, Spin, message, Tabs, Modal, Form, Input, InputNumber, Row, Col } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { listOrders } from '../services/salesApi';
import { getExpenses } from '../services/financeApi';
import { listWorkOrders } from '../services/productionApi';
import { fetchRawMaterials, fetchFinishedProducts } from '../services/inventoryApi';
import { getTrialBalance, getJournalEntries, postJournalEntry } from '../services/financeApi';
import { withSorters } from '../utils/tableUtils';
import SearchableTable from '../components/SearchableTable';

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
          { title: 'Date', dataIndex: 'createdAt', render: d => dayjs(d).format('YYYY-MM-DD'), sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
          { title: 'Customer', dataIndex: 'customerName', sorter: (a, b) => a.customerName?.localeCompare(b.customerName) },
          { title: 'Status', dataIndex: 'status', sorter: (a, b) => a.status.localeCompare(b.status) },
          { title: 'Total (TZS)', dataIndex: 'total', render: val => Number(val)?.toLocaleString(), sorter: (a, b) => Number(a.total) - Number(b.total) },
          { title: 'Discount', dataIndex: 'discountAmount', render: val => Number(val)?.toLocaleString(), sorter: (a, b) => Number(a.discountAmount) - Number(b.discountAmount) },
          { title: 'Margin (%)', dataIndex: 'margin', sorter: (a, b) => {
            const costA = a.actualCost || a.standardCost || 0;
            const marginA = revA ? ((revA - costA) / revA) : 0;
            const revB = Number(b.total) || 0;
            const costB = b.actualCost || b.standardCost || 0;
            const marginB = revB ? ((revB - costB) / revB) : 0;
            return marginA - marginB;
          }, render: (_, record) => {
            if (record.actualCost == null && record.standardCost == null) return 'N/A';
            const revenue = Number(record.total);
            const cost = record.actualCost || record.standardCost;
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
          { title: 'Date', dataIndex: 'createdAt', render: d => dayjs(d).format('YYYY-MM-DD'), sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
          { title: 'Recipe', dataIndex: 'recipeName', sorter: (a, b) => a.recipeName?.localeCompare(b.recipeName) },
          { title: 'Status', dataIndex: 'status', sorter: (a, b) => a.status?.localeCompare(b.status) },
          { title: 'Target Qty', dataIndex: 'targetQuantity', sorter: (a, b) => Number(a.targetQuantity) - Number(b.targetQuantity) },
          { title: 'Actual Qty', dataIndex: 'actualYield', sorter: (a, b) => Number(a.actualYield) - Number(b.actualYield) },
          { title: 'Scrap Qty', dataIndex: 'scrapQuantity', sorter: (a, b) => Number(a.scrapQuantity) - Number(b.scrapQuantity) },
          { title: 'Yield (%)', dataIndex: 'yieldPercent', sorter: (a, b) => {
            const yieldA = a.actualYield && a.targetQuantity ? a.actualYield / a.targetQuantity : 0;
            const yieldB = b.actualYield && b.targetQuantity ? b.actualYield / b.targetQuantity : 0;
            return yieldA - yieldB;
          }, render: (_, record) => {
            if (!record.actualYield || !record.targetQuantity) return 'N/A';
            const yieldPct = (record.actualYield / record.targetQuantity) * 100;
            return `${yieldPct.toFixed(2)}%`;
          }}
        ]);
        setData(filtered);
      } else if (reportType === 'PROFIT_LOSS') {
        // Build Money In / Money Out
        const [orders, expenses] = await Promise.all([listOrders(), getExpenses()]);
        const filteredOrders = orders.filter(o => {
          const date = dayjs(o.createdAt);
          return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
        });
        const filteredExpenses = expenses.filter(e => {
          const date = dayjs(e.expenseDate);
          return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
        });
        
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const cogs = filteredOrders.reduce((sum, o) => sum + (Number(o.actualCost || o.standardCost) || 0), 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const netProfit = totalRevenue - cogs - totalExpenses;

        setColumns([
          { title: 'Category', dataIndex: 'category' },
          { title: 'Amount (TZS)', dataIndex: 'amount', render: val => Number(val).toLocaleString(), align: 'right' }
        ]);
        
        setData([
          { key: 'rev', category: 'Sales Revenue (Money In)', amount: totalRevenue },
          { key: 'cogs', category: 'Ingredient Costs', amount: -cogs },
          { key: 'exp', category: 'Operational Expenses (Money Out)', amount: -totalExpenses },
          { key: 'net', category: 'Net Profit', amount: netProfit }
        ]);
      } else if (reportType === 'INVENTORY_VALUATION') {
        const [raw, finished] = await Promise.all([fetchRawMaterials(), fetchFinishedProducts()]);
        
        const inventoryData = [
          ...raw.map(r => ({ ...r, type: 'Raw Material' })),
          ...finished.map(f => ({ ...f, type: 'Finished Product' }))
        ];
        
        setColumns([
          { title: 'Item Name', dataIndex: 'name', sorter: (a, b) => a.name?.localeCompare(b.name) },
          { title: 'Type', dataIndex: 'type', sorter: (a, b) => a.type?.localeCompare(b.type) },
          { title: 'Stock Qty', dataIndex: 'currentStockBaseQty', sorter: (a, b) => Number(a.currentStockBaseQty) - Number(b.currentStockBaseQty) },
          { title: 'UOM', dataIndex: ['baseUom', 'symbol'] },
          { title: 'Unit Cost (TZS)', dataIndex: 'costPerBaseUnit', render: val => val?.toLocaleString(), sorter: (a, b) => Number(a.costPerBaseUnit) - Number(b.costPerBaseUnit) },
          { title: 'Total Value (TZS)', dataIndex: 'totalValue', sorter: (a, b) => {
            const valA = (a.currentStockBaseQty || 0) * (a.costPerBaseUnit || 0);
            const valB = (b.currentStockBaseQty || 0) * (b.costPerBaseUnit || 0);
            return valA - valB;
          }, render: (_, record) => {
            const val = (record.currentStockBaseQty || 0) * (record.costPerBaseUnit || 0);
            return val.toLocaleString();
          }}
        ]);
        setData(inventoryData);
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
        if (c.dataIndex === 'margin' && (record.actualCost != null || record.standardCost != null)) {
           const rev = Number(record.total) || 0;
           const cost = record.actualCost || record.standardCost;
           val = rev ? (((rev - cost) / rev) * 100).toFixed(2) + '%' : '0%';
        }
        if (c.dataIndex === 'yieldPercent' && record.actualYield) {
           val = ((record.actualYield / record.targetQuantity) * 100).toFixed(2) + '%';
        }
        if (c.dataIndex === 'totalValue') {
           val = (record.currentStockBaseQty || 0) * (record.costPerBaseUnit || 0);
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
          { key: 'PROFIT_LOSS', label: 'Money In / Money Out (P&L)' },
          { key: 'PRODUCTION_YIELD', label: 'Production Yield & Scrap' },
          { key: 'INVENTORY_VALUATION', label: 'Stock Valuation' },
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
        <SearchableTable 
          loading={loading}
          dataSource={data} 
          columns={withSorters(columns)} 
          rowKey={record => record.key || record.id}
          size="middle"
          pagination={{ pageSize: 15 }}
        />
      </Card>

    </div>
  );
}
