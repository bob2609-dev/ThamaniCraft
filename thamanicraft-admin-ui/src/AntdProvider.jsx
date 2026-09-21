import React from 'react';
import { ConfigProvider, theme as antdTheme, App } from 'antd';
import { useTheme } from './ThemeContext';

export default function AntdProvider({ children }) {
  const { theme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#D97706',
          borderRadius: 8,
          colorBgBase: theme === 'dark' ? '#0B1120' : '#F8FAFC',
          colorBgContainer: theme === 'dark' ? '#1E293B' : '#FFFFFF',
          colorTextBase: theme === 'dark' ? '#F8FAFC' : '#0F172A',
          colorBorder: theme === 'dark' ? '#334155' : '#E2E8F0',
        }
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
