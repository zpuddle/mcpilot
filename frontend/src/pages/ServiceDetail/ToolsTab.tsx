import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, Popconfirm, Tabs, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTools, createTool, updateTool, deleteTool, listResources, createResource, deleteResource } from '../../api/tools';
import type { ServiceTool, ServiceResource } from '../../types';

interface Props {
  serviceId: number;
}

const ToolsTab: React.FC<Props> = ({ serviceId }) => {
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ServiceTool | null>(null);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [toolForm] = Form.useForm();
  const [resourceForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: tools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ['tools', serviceId],
    queryFn: () => listTools(serviceId),
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources', serviceId],
    queryFn: () => listResources(serviceId),
  });

  const createToolMut = useMutation({
    mutationFn: (data: Partial<ServiceTool>) => createTool(serviceId, data),
    onSuccess: () => { message.success('Tool created'); setToolModalOpen(false); toolForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['tools', serviceId] }); },
  });

  const updateToolMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServiceTool> }) => updateTool(serviceId, id, data),
    onSuccess: () => { message.success('Tool updated'); setToolModalOpen(false); setEditingTool(null); toolForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['tools', serviceId] }); },
  });

  const deleteToolMut = useMutation({
    mutationFn: (id: number) => deleteTool(serviceId, id),
    onSuccess: () => { message.success('Tool deleted'); queryClient.invalidateQueries({ queryKey: ['tools', serviceId] }); },
  });

  const createResourceMut = useMutation({
    mutationFn: (data: Partial<ServiceResource>) => createResource(serviceId, data),
    onSuccess: () => { message.success('Resource created'); setResourceModalOpen(false); resourceForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['resources', serviceId] }); },
  });

  const deleteResourceMut = useMutation({
    mutationFn: (id: number) => deleteResource(serviceId, id),
    onSuccess: () => { message.success('Resource deleted'); queryClient.invalidateQueries({ queryKey: ['resources', serviceId] }); },
  });

  const toolColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Handler', dataIndex: 'handler_name', key: 'handler_name' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Enabled', dataIndex: 'is_enabled', key: 'is_enabled', render: (v: boolean) => v ? 'Yes' : 'No' },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: ServiceTool) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingTool(record); toolForm.setFieldsValue(record); setToolModalOpen(true); }} />
          <Popconfirm title="Delete?" onConfirm={() => deleteToolMut.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const resourceColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'URI Template', dataIndex: 'uri_template', key: 'uri_template' },
    { title: 'Handler', dataIndex: 'handler_name', key: 'handler_name' },
    { title: 'MIME', dataIndex: 'mime_type', key: 'mime_type' },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: ServiceResource) => (
        <Popconfirm title="Delete?" onConfirm={() => deleteResourceMut.mutate(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const handleToolSubmit = (values: Record<string, unknown>) => {
    if (editingTool) {
      updateToolMut.mutate({ id: editingTool.id, data: values });
    } else {
      createToolMut.mutate(values);
    }
  };

  return (
    <>
      <Tabs items={[
        {
          key: 'tools',
          label: `Tools (${tools.length})`,
          children: (
            <div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTool(null); toolForm.resetFields(); setToolModalOpen(true); }} style={{ marginBottom: 16 }}>
                Add Tool
              </Button>
              <Table columns={toolColumns} dataSource={tools} rowKey="id" loading={toolsLoading} size="small" />
            </div>
          ),
        },
        {
          key: 'resources',
          label: `Resources (${resources.length})`,
          children: (
            <div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { resourceForm.resetFields(); setResourceModalOpen(true); }} style={{ marginBottom: 16 }}>
                Add Resource
              </Button>
              <Table columns={resourceColumns} dataSource={resources} rowKey="id" loading={resourcesLoading} size="small" />
            </div>
          ),
        },
      ]} />

      {/* Tool Modal */}
      <Modal title={editingTool ? 'Edit Tool' : 'Add Tool'} open={toolModalOpen} onCancel={() => { setToolModalOpen(false); setEditingTool(null); }} onOk={() => toolForm.submit()}>
        <Form form={toolForm} layout="vertical" onFinish={handleToolSubmit}>
          <Form.Item name="name" label="Tool Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. get_weather" />
          </Form.Item>
          <Form.Item name="handler_name" label="Handler Function Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. get_weather (must match async def in code)" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="What does this tool do?" />
          </Form.Item>
          <Form.Item name="is_enabled" label="Enabled" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Resource Modal */}
      <Modal title="Add Resource" open={resourceModalOpen} onCancel={() => setResourceModalOpen(false)} onOk={() => resourceForm.submit()}>
        <Form form={resourceForm} layout="vertical" onFinish={(v) => createResourceMut.mutate(v)}>
          <Form.Item name="name" label="Resource Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. user_profile" />
          </Form.Item>
          <Form.Item name="uri_template" label="URI Template" rules={[{ required: true }]}>
            <Input placeholder="e.g. users://{user_id}/profile" />
          </Form.Item>
          <Form.Item name="handler_name" label="Handler Function Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. get_user_profile" />
          </Form.Item>
          <Form.Item name="mime_type" label="MIME Type" initialValue="text/plain">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ToolsTab;
