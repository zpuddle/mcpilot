import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { CloudServerOutlined, CheckCircleOutlined, PauseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { listServices } from '../api/services';

const Dashboard: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => listServices(1, 100),
  });

  const services = data?.data || [];
  const running = services.filter((s) => s.status === 'running').length;
  const stopped = services.filter((s) => s.status === 'stopped').length;
  const errors = services.filter((s) => s.status === 'error').length;

  return (
    <div>
      <h2>Dashboard</h2>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Services" value={services.length} prefix={<CloudServerOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Running" value={running} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Stopped" value={stopped} prefix={<PauseCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Errors" value={errors} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
