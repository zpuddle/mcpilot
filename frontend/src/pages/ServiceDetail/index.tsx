import React from 'react';
import { Tabs, Spin } from 'antd';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getService } from '../../api/services';
import OverviewTab from './OverviewTab';
import CodeTab from './CodeTab';
import ToolsTab from './ToolsTab';
import ConfigTab from './ConfigTab';
import DeployTab from './DeployTab';
import LogsTab from './LogsTab';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const serviceId = Number(id);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => getService(serviceId),
    enabled: !!serviceId,
  });

  if (isLoading) return <Spin size="large" />;
  if (!service) return <div>Service not found</div>;

  // Determine active tab from URL
  const pathParts = location.pathname.split('/');
  const activeTab = pathParts[pathParts.length - 1] || 'overview';

  const tabItems = [
    { key: 'overview', label: 'Overview', children: <OverviewTab service={service} /> },
    { key: 'code', label: 'Code', children: <CodeTab serviceId={serviceId} /> },
    { key: 'tools', label: 'Tools & Resources', children: <ToolsTab serviceId={serviceId} /> },
    { key: 'config', label: 'Config', children: <ConfigTab service={service} /> },
    { key: 'deploy', label: 'Deploy', children: <DeployTab serviceId={serviceId} service={service} /> },
    { key: 'logs', label: 'Logs', children: <LogsTab serviceId={serviceId} service={service} /> },
  ];

  return (
    <div>
      <h2>{service.name}</h2>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => navigate(`/services/${serviceId}/${key}`)}
        items={tabItems}
      />
    </div>
  );
};

export default ServiceDetail;
