const fs = require('fs');

const file = 'src/layouts/MainLayout.jsx';
let content = fs.readFileSync(file, 'utf8');

// Change Sider to use position: fixed
content = content.replace(
  "style={{ overflow: 'auto', height: '100vh', position: 'sticky', top: 0, left: 0, zIndex: 20 }}",
  "style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 20 }}"
);

// Add margin to inner Layout so it doesn't overlap with fixed Sider
// But Sider width varies (collapsed vs expanded). 
// Actually, Antd Layout hasSider automatically manages margin if Sider is NOT position: fixed.
// If Sider is sticky, it stays in normal flow and Layout manages margin automatically!
// Why wasn't sticky working for the user?
