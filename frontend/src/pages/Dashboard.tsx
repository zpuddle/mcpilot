import React from 'react';
import { Card, Col, Row, Statistic, Typography, theme } from 'antd';
import { CloudServerOutlined, CheckCircleOutlined, PauseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/services';

const { Title } = Typography;

const statCards = [
  {
    key: 'total',
    title: 'Total Services',
    icon: <CloudServerOutlined />,
    gradient: 'linear-gradient(135deg, #2563eb11, #2563eb05)',
    iconColor: '#2563eb',
  },
  {
    key: 'running',
    title: 'Running',
    icon: <CheckCircleOutlined />,
    gradient: 'linear-gradient(135deg, #10b98111, #10b98105)',
    iconColor: '#10b981',
  },
  {
    key: 'stopped',
    title: 'Stopped',
    icon: <PauseCircleOutlined />,
    gradient: 'linear-gradient(135deg, #f59e0b11, #f59e0b05)',
    iconColor: '#f59e0b',
  },
  {
    key: 'errors',
    title: 'Errors',
    icon: <WarningOutlined />,
    gradient: 'linear-gradient(135deg, #ef444411, #ef444405)',
    iconColor: '#ef4444',
  },
];

const Dashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
  });
  const { token } = theme.useToken();

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, fontWeight: 600 }}>Dashboard</Title>
      <Row gutter={[20, 20]}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.key}>
            <Card
              className="mcpilot-card-hover"
              style={{
                borderRadius: token.borderRadius,
                background: card.gradient,
                border: '1px solid transparent',
                boxShadow: 'var(--mcpilot-shadow)',
              }}
              styles={{ body: { padding: '24px' } }}
            >
              <Statistic
                title={<span style={{ color: 'var(--mcpilot-text-secondary)', fontSize: 13 }}>{card.title}</span>}
                value={(stats as Record<string, number>)?.[card.key] || 0}
                prefix={React.cloneElement(card.icon as React.ReactElement, {
                  style: { color: card.iconColor, fontSize: 20, marginRight: 4 },
                })}
                valueStyle={{ fontWeight: 700, fontSize: 28 }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;
