import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRoles, createRole, updateRole } from '../api/users';
import type { Role } from '../types';

const ALL_PERMISSIONS = [
  'services:read', 'services:write', 'services:deploy', 'services:logs', 'services:lifecycle', '*',
];

const AdminRoles: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: listRoles,
  });

  const createMut = useMutation({
    mutationFn: (v: { name: string; permissions: string[] }) => createRole(v.name, v.permissions),
    onSuccess: () => { message.success('Role created'); setModalOpen(false); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); },
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: number; name: string; permissions: string[] }) => updateRole(v.id, v.name, v.permissions),
    onSuccess: () => { message.success('Role updated'); setModalOpen(false); setEditingRole(null); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); },
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Permissions', dataIndex: 'permissions', key: 'permissions',
      render: (perms: string[]) => perms.map(p => <Tag key={p}>{p}</Tag>),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Role) => (
        <Button type="link" onClick={() => { setEditingRole(record); form.setFieldsValue(record); setModalOpen(true); }}>
          Edit
        </Button>
      ),
    },
  ];

  const handleSubmit = (values: { name: string; permissions: string[] }) => {
    if (editingRole) {
      updateMut.mutate({ id: editingRole.id, ...values });
    } else {
      createMut.mutate(values);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Role Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRole(null); form.resetFields(); setModalOpen(true); }}>
          New Role
        </Button>
      </div>
      <Table columns={columns} dataSource={roles as Role[]} rowKey="id" loading={isLoading} />

      <Modal title={editingRole ? 'Edit Role' : 'Create Role'} open={modalOpen} onCancel={() => { setModalOpen(false); setEditingRole(null); }} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Role Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="permissions" label="Permissions" rules={[{ required: true }]}>
            <Select mode="multiple" options={ALL_PERMISSIONS.map(p => ({ value: p, label: p }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminRoles;
