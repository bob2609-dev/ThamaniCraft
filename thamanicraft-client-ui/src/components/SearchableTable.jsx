import React, { useState, useMemo } from 'react';
import { Table, Input, Space, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { withSorters } from '../utils/tableUtils';

const SearchableTable = ({ dataSource, columns, searchPlaceholder = "Search...", searchable = true, ...props }) => {
  const [searchText, setSearchText] = useState('');

  const sortedColumns = useMemo(() => withSorters(columns), [columns]);

  const filteredData = useMemo(() => {
    if (!searchText || !dataSource) return dataSource;
    
    const lowerSearchText = searchText.toLowerCase();
    
    return dataSource.filter(item => {
      // Basic recursive search through object values
      const searchInObject = (obj) => {
        if (!obj) return false;
        
        return Object.values(obj).some(val => {
          if (val === null || val === undefined) return false;
          
          if (typeof val === 'object') {
            return searchInObject(val);
          }
          
          return String(val).toLowerCase().includes(lowerSearchText);
        });
      };
      
      return searchInObject(item);
    });
  }, [dataSource, searchText]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {searchable && (
        <Row justify="end">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder={searchPlaceholder}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      )}
      <Table 
        dataSource={filteredData} 
        columns={sortedColumns} 
        {...props} 
      />
    </Space>
  );
};

export default SearchableTable;
