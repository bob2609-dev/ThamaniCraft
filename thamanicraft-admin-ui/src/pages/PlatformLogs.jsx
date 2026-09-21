import { Typography } from 'antd';
const { Title, Paragraph } = Typography;
export default function PlatformLogs() {
  return (
    <div>
      <Title level={2}>System Logs</Title>
      <Paragraph>Global audit logs and system events.</Paragraph>
    </div>
  );
}
