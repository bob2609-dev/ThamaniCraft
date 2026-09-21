import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function Settings() {
  return (
    <div>
      <Title level={2}>Settings</Title>
      <Paragraph>Overview and management of Settings.</Paragraph>
    </div>
  );
}
