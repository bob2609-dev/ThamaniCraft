import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function Recipes() {
  return (
    <div>
      <Title level={2}>Recipes</Title>
      <Paragraph>Overview and management of Recipes.</Paragraph>
    </div>
  );
}
