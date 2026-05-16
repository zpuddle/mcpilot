import React, { useState } from 'react';
import { Table, Tag, Select, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/audit';
import type { AuditLog } from '../api/audit';

const actionColorMap: Record<string, string> = {
  create: 'green',
  delete: 'red',
  deploy: 'blue',
  update: 'orange',
};

const actionOptions = [
  { value: '', label: '全部操作' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'deploy', label: 'Deploy' },
  { value: 'start', label: 'Start' },
  { value: 'stop', label: 'Stop' },
];

const resourceTypeOptions = [
  { value: '', label: '全部资源' },
  { value: 'service', label: 'Service' },
  { value: 'user', label: 'User' },
  { value: 'role', label: 'Role' },
  { value: 'tool', label: 'Tool' },
];

const AdminAudit: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [action, setAction] = useState<string>('');
  const [resourceType, setResourceType] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, pageSize, action, resourceType],
    queryFn: () =>
      getAuditLogs({
        page,
        size: pageSize,
        ...(action ? { action } : {}),
        ...(resourceType ? { resource_type: resourceType } : {}),
      }),
  });

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (v: string) => (
        <Tag color={actionColorMap[v] || 'default'}>{v}</Tag>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 120,
    },
    {
      title: '资源名称',
      dataIndex: 'resource_name',
      key: 'resource_name',
      width: 160,
      render: (v: string | null) => v || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
      render: (v: string | null) => v || '-',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>审计日志</h2>
        <Space>
          <Select
            value={action}
            onChange={(v) => { setAction(v); setPage(1); }}
            options={actionOptions}
            style={{ width: 140 }}
            placeholder="操作类型"
          />
          <Select
            value={resourceType}
            onChange={(v) => { setResourceType(v); setPage(1); }}
            options={resourceTypeOptions}
            style={{ width: 140 }}
            placeholder="资源类型"
          />
        </Space>
      </div>

      <Table<AuditLog>
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </div>
  );
};

export default AdminAudit;
