import { Typography } from 'antd';
const { Title, Paragraph } = Typography;
export default function Tenants() {
  return (
    <div>
      <Title level={2}>Manage Tenants</Title>
      <Paragraph>Provision, suspend, and configure client businesses.</Paragraph>
    </div>
  );
}
