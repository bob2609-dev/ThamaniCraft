import React, { useState } from 'react';
import { Tabs } from 'antd';
import { ShoppingCartOutlined, HistoryOutlined } from '@ant-design/icons';
import PointOfSale from './PointOfSale';
import OrderHistory from './OrderHistory';

export default function Sales() {
  const [activeTab, setActiveTab] = useState('pos');

  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pos',
            label: <span><ShoppingCartOutlined /> Point of Sale</span>,
            children: <PointOfSale />
          },
          {
            key: 'history',
            label: <span><HistoryOutlined /> Order History</span>,
            children: <OrderHistory />
          }
        ]}
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
