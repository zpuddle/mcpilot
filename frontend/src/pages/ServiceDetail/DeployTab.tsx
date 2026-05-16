import React, { useState } from 'react';
import { Button, Card, Timeline, Tag, Space, message, Popconfirm, InputNumber, Table, Badge } from 'antd';
import { RocketOutlined, HistoryOutlined, ClusterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deployService, scaleService, getServiceInstances } from '../../api/services';
import type { ServiceInstance } from '../../api/services';
import { getDeployLogs, listVersions, createVersion, rollbackVersion } from '../../api/tools';
import type { McpService, DeployLog, ServiceVersion } from '../../types';

interface Props {
  serviceId: number;
  service: McpService;
}

const DeployTab: React.FC<Props> = ({ serviceId, service }) => {
  const queryClient = useQueryClient();
  const [replicas, setReplicas] = useState<number>(service.replicas || 1);
  const [scaling, setScaling] = useState(false);

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

  // Multi-instance
  const { data: instances = [] } = useQuery<ServiceInstance[]>({
    queryKey: ['instances', serviceId],
    queryFn: () => getServiceInstances(serviceId),
    refetchInterval: 30000,
  });

  const handleScale = async () => {
    setScaling(true);
    try {
      const res = await scaleService(serviceId, replicas);
      message.success(res.message || 'Scaled successfully');
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['instances', serviceId] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || 'Scale failed');
    } finally {
      setScaling(false);
    }
  };

  const instanceColumns = [
    {
      title: '实例编号',
      dataIndex: 'instance_index',
      key: 'instance_index',
      render: (val: number) => `#${val}`,
    },
    {
      title: '容器ID',
      dataIndex: 'container_id',
      key: 'container_id',
      render: (val: string | null) => val ? val.slice(0, 12) : '-',
    },
    {
      title: '内部端口',
      dataIndex: 'internal_port',
      key: 'internal_port',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const statusMap: Record<string, 'success' | 'error' | 'processing' | 'default'> = {
          running: 'success',
          exited: 'error',
          stopped: 'default',
          created: 'processing',
        };
        return <Badge status={statusMap[val] || 'default'} text={val} />;
      },
    },
  ];

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

      <Card title="实例配置" style={{ marginTop: 16 }}>
        <Space>
          <ClusterOutlined />
          <span>副本数：</span>
          <InputNumber min={1} max={10} value={replicas} onChange={(val) => setReplicas(val || 1)} />
          <Button type="primary" onClick={handleScale} loading={scaling}>
            应用
          </Button>
        </Space>

        {instances && instances.length > 1 && (
          <Table
            dataSource={instances}
            columns={instanceColumns}
            rowKey="id"
            size="small"
            pagination={false}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </div>
  );
};

export default DeployTab;
