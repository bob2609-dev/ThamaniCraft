import { Typography } from 'antd';
const { Title, Paragraph } = Typography;
export default function Settings() {
  return (
    <div>
      <Title level={2}>Platform Settings</Title>
      <Paragraph>Global application configurations and security policies.</Paragraph>
    </div>
  );
}
