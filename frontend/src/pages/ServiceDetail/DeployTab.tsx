import React from 'react';
import { Button, Card, Timeline, Tag, Space, message, Popconfirm } from 'antd';
import { RocketOutlined, HistoryOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deployService } from '../../api/services';
import { getDeployLogs, listVersions, createVersion, rollbackVersion } from '../../api/tools';
import type { McpService, DeployLog, ServiceVersion } from '../../types';

interface Props {
  serviceId: number;
  service: McpService;
}

const DeployTab: React.FC<Props> = ({ serviceId, service }) => {
  const queryClient = useQueryClient();

  const { data: deployLogs = [] } = useQuery({
    queryKey: ['deploy-logs', serviceId],
    queryFn: () => getDeployLogs(serviceId),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['versions', serviceId],
    queryFn: () => listVersions(serviceId),
  });

  const deployMut = useMutation({
    mutationFn: () => deployService(serviceId),
    onSuccess: (res) => {
      message.success(res.message || 'Deployed successfully');
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['deploy-logs', serviceId] });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || 'Deploy failed');
    },
  });

  const createVersionMut = useMutation({
    mutationFn: () => createVersion(serviceId, `Deploy v${service.current_version + 1}`),
    onSuccess: () => {
      message.success('Version snapshot created');
      queryClient.invalidateQueries({ queryKey: ['versions', serviceId] });
    },
  });

  const rollbackMut = useMutation({
    mutationFn: (versionId: number) => rollbackVersion(serviceId, versionId),
    onSuccess: (res) => {
      message.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
    },
  });

  const statusColor: Record<string, string> = {
    success: 'green', failed: 'red', running: 'blue', pending: 'default',
  };

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button type="primary" size="large" icon={<RocketOutlined />} onClick={() => deployMut.mutate()} loading={deployMut.isPending}>
          Deploy Now
        </Button>
        <Button icon={<HistoryOutlined />} onClick={() => createVersionMut.mutate()} loading={createVersionMut.isPending}>
          Create Version Snapshot
        </Button>
      </Space>

      <div style={{ display: 'flex', gap: 24 }}>
        <Card title="Deploy History" style={{ flex: 1 }}>
          {(deployLogs as DeployLog[]).length === 0 ? (
            <p>No deployments yet</p>
          ) : (
            <Timeline items={(deployLogs as DeployLog[]).map((log) => ({
              color: statusColor[log.status] || 'default',
              children: (
                <div>
                  <Tag color={statusColor[log.status]}>{log.status}</Tag>
                  <strong>{log.action}</strong> - {log.created_at}
                  {log.log_output && (
                    <pre style={{ fontSize: 12, maxHeight: 100, overflow: 'auto', background: '#f5f5f5', padding: 8, marginTop: 4 }}>
                      {log.log_output.slice(0, 500)}
                    </pre>
                  )}
                </div>
              ),
            }))} />
          )}
        </Card>

        <Card title="Versions" style={{ flex: 1 }}>
          {(versions as ServiceVersion[]).length === 0 ? (
            <p>No versions yet</p>
          ) : (
            <Timeline items={(versions as ServiceVersion[]).map((v) => ({
              children: (
                <div>
                  <strong>{v.version_tag}</strong> - {v.created_at}
                  <br />{v.changelog}
                  <br />
                  <Popconfirm title="Rollback to this version?" onConfirm={() => rollbackMut.mutate(v.id)}>
                    <Button size="small" type="link">Rollback</Button>
                  </Popconfirm>
                </div>
              ),
            }))} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default DeployTab;
