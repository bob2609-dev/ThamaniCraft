import React, { useState } from 'react';
import { Upload, message, Button } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export default function ImageUpload({ value, onChange }) {
  const [loading, setLoading] = useState(false);

  const beforeUpload = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return Upload.LIST_IGNORE;
    }
    
    try {
      setLoading(true);
      const base64 = await getBase64(file);
      onChange(base64);
    } catch (e) {
      message.error("Failed to read image");
    } finally {
      setLoading(false);
    }
    return false; // Prevent automatic HTTP upload
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {value ? (
        <div style={{ position: 'relative', width: 200, height: 200, border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
          <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f0f0f0' }} />
          <Button 
            danger 
            type="primary" 
            icon={<DeleteOutlined />} 
            onClick={handleRemove}
            style={{ position: 'absolute', top: 8, right: 8 }}
          />
        </div>
      ) : (
        <Upload
          name="image"
          listType="picture-card"
          showUploadList={false}
          beforeUpload={beforeUpload}
          accept="image/*"
        >
          <div>
            <UploadOutlined />
            <div style={{ marginTop: 8 }}>{loading ? 'Uploading...' : 'Upload'}</div>
          </div>
        </Upload>
      )}
    </div>
  );
}
