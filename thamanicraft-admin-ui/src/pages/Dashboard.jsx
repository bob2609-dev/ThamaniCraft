import { Typography } from 'antd';
const { Title, Paragraph } = Typography;
export default function Dashboard() {
  return (
    <div>
      <Title level={2}>Platform Dashboard</Title>
      <Paragraph>Global overview of ThamaniCraft platform health and metrics.</Paragraph>
    </div>
  );
}
