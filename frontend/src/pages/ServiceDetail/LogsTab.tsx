import React from 'react';
import { Button, Card, Input, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getServiceLogs } from '../../api/services';
import type { McpService } from '../../types';

interface Props {
  serviceId: number;
  service: McpService;
}

const LogsTab: React.FC<Props> = ({ serviceId, service }) => {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ['service-logs', serviceId],
    queryFn: () => getServiceLogs(serviceId, 200),
    enabled: !!service.container_id,
    refetchInterval: 5000,
  });

  if (!service.container_id) {
    return <Card><p>No container running. Deploy the service first to see logs.</p></Card>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
          Refresh
        </Button>
      </Space>
      <Input.TextArea
        value={data?.logs || 'Loading...'}
        readOnly
        rows={25}
        style={{ fontFamily: 'monospace', fontSize: 12, background: '#1e1e1e', color: '#d4d4d4' }}
      />
    </div>
  );
};

export default LogsTab;
