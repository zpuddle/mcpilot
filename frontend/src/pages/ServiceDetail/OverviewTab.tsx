import React from 'react';
import { Descriptions, Button, Space, Tag } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startService, stopService, restartService } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import type { McpService } from '../../types';
import { message } from 'antd';

interface Props {
  service: McpService;
}

const OverviewTab: React.FC<Props> = ({ service }) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['service', service.id] });

  const startMut = useMutation({ mutationFn: () => startService(service.id), onSuccess: () => { message.success('Started'); invalidate(); } });
  const stopMut = useMutation({ mutationFn: () => stopService(service.id), onSuccess: () => { message.success('Stopped'); invalidate(); } });
  const restartMut = useMutation({ mutationFn: () => restartService(service.id), onSuccess: () => { message.success('Restarted'); invalidate(); } });

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<PlayCircleOutlined />} type="primary" onClick={() => startMut.mutate()} loading={startMut.isPending} disabled={service.status === 'running'}>
          Start
        </Button>
        <Button icon={<PauseCircleOutlined />} onClick={() => stopMut.mutate()} loading={stopMut.isPending} disabled={service.status === 'stopped' || service.status === 'draft'}>
          Stop
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => restartMut.mutate()} loading={restartMut.isPending} disabled={service.status !== 'running'}>
          Restart
        </Button>
      </Space>

      <Descriptions bordered column={2}>
        <Descriptions.Item label="Name">{service.name}</Descriptions.Item>
        <Descriptions.Item label="Slug">{service.slug}</Descriptions.Item>
        <Descriptions.Item label="Status"><StatusBadge status={service.status} /></Descriptions.Item>
        <Descriptions.Item label="Transport"><Tag>{service.transport_type}</Tag></Descriptions.Item>
        <Descriptions.Item label="Port">{service.port || 'Not assigned'}</Descriptions.Item>
        <Descriptions.Item label="Version">v{service.current_version}</Descriptions.Item>
        <Descriptions.Item label="Image">{service.image_tag || '-'}</Descriptions.Item>
        <Descriptions.Item label="Container">{service.container_id?.slice(0, 12) || '-'}</Descriptions.Item>
        <Descriptions.Item label="Description" span={2}>{service.description || '-'}</Descriptions.Item>
        <Descriptions.Item label="Created">{service.created_at}</Descriptions.Item>
        <Descriptions.Item label="Updated">{service.updated_at}</Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default OverviewTab;
