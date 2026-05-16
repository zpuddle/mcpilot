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
    iconBg: 'rgba(14, 165, 233, 0.06)',
    iconColor: '#0EA5E9',
  },
  {
    key: 'running',
    title: 'Running',
    icon: <CheckCircleOutlined />,
    iconBg: 'rgba(16, 185, 129, 0.06)',
    iconColor: '#10B981',
  },
  {
    key: 'stopped',
    title: 'Stopped',
    icon: <PauseCircleOutlined />,
    iconBg: 'rgba(245, 158, 11, 0.06)',
    iconColor: '#F59E0B',
  },
  {
    key: 'errors',
    title: 'Errors',
    icon: <WarningOutlined />,
    iconBg: 'rgba(239, 68, 68, 0.06)',
    iconColor: '#EF4444',
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
      <Title
        level={4}
        style={{
          marginBottom: 24,
          fontWeight: 600,
          color: 'var(--mcpilot-text-primary)',
          fontFamily: '"Inter", sans-serif',
        }}
      >
        Dashboard
      </Title>
      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.key}>
            <Card
              className="mcpilot-glass-card mcpilot-card-hover"
              style={{
                borderRadius: 12,
                border: '1px solid var(--mcpilot-card-border)',
              }}
              styles={{ body: { padding: '20px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: card.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: card.iconColor, fontSize: 20, display: 'inline-flex' }}>
                    {card.icon}
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      color: 'var(--mcpilot-text-secondary)',
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    {card.title}
                  </div>
                  <Statistic
                    value={(stats as Record<string, number>)?.[card.key] || 0}
                    valueStyle={{
                      fontWeight: 700,
                      fontSize: 24,
                      color: 'var(--mcpilot-text-primary)',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;
