import React from 'react';
import { Table, Switch, Select, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsers, updateUserRole, updateUserStatus } from '../api/users';
import { listRoles } from '../api/users';
import type { Role } from '../types';

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: listUsers,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: listRoles,
  });

  const roleMut = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) => updateUserRole(userId, roleId),
    onSuccess: () => { message.success('Role updated'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const statusMut = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => updateUserStatus(userId, isActive),
    onSuccess: () => { message.success('Status updated'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role', dataIndex: 'role_name', key: 'role',
      render: (_: string, record: { id: number; role_name: string }) => (
        <Select
          value={record.role_name}
          style={{ width: 120 }}
          onChange={(value) => {
            const role = (roles as Role[]).find(r => r.name === value);
            if (role) roleMut.mutate({ userId: record.id, roleId: role.id });
          }}
          options={(roles as Role[]).map(r => ({ value: r.name, label: r.name }))}
        />
      ),
    },
    {
      title: 'Active', dataIndex: 'is_active', key: 'is_active',
      render: (v: boolean, record: { id: number }) => (
        <Switch checked={v} onChange={(checked) => statusMut.mutate({ userId: record.id, isActive: checked })} />
      ),
    },
  ];

  return (
    <div>
      <h2>User Management</h2>
      <Table columns={columns} dataSource={users} rowKey="id" loading={isLoading} />
    </div>
  );
};

export default AdminUsers;
