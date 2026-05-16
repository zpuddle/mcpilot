import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listServices, createService, deleteService } from '../api/services';
import StatusBadge from '../components/StatusBadge';
import type { McpService } from '../types';

const ServiceList: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices(1, 50),
  });

  const createMutation = useMutation({
    mutationFn: (values: { name: string; description: string; transport_type: string }) => createService(values),
    onSuccess: () => {
      message.success('Service created');
      setCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || 'Create failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: () => {
      message.success('Service deleted');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: McpService['status']) => <StatusBadge status={status} />,
    },
    { title: 'Transport', dataIndex: 'transport_type', key: 'transport_type' },
    { title: 'Port', dataIndex: 'port', key: 'port', render: (v: number | null) => v || '-' },
    { title: 'Version', dataIndex: 'current_version', key: 'version', render: (v: number) => `v${v}` },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: McpService) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/services/${record.id}/overview`)}>
            Detail
          </Button>
          <Popconfirm title="Delete this service?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>MCP Services</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          New Service
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ total: data?.total, pageSize: 50 }}
      />

      <Modal
        title="Create MCP Service"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="name" label="Service Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. weather-tool" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of this MCP service" />
          </Form.Item>
          <Form.Item name="transport_type" label="Transport" initialValue="sse">
            <Select options={[
              { value: 'sse', label: 'SSE' },
              { value: 'streamable_http', label: 'Streamable HTTP' },
              { value: 'both', label: 'Both' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceList;
