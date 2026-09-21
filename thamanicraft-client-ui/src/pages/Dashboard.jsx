import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function Dashboard() {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Paragraph>Overview and management of Dashboard.</Paragraph>
    </div>
  );
}
