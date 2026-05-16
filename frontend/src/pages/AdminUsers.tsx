import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsers, updateUserRole, updateUserStatus, listRoles } from '../api/users';
import type { Role } from '../types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
    onSuccess: () => { toast.success('Role updated'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const statusMut = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => updateUserStatus(userId, isActive),
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  return (
    <div>
      <h4 className="mcpilot-page-title text-lg font-semibold mb-6">User Management</h4>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium w-[60px]">ID</th>
                <th className="h-10 px-4 text-left font-medium">Username</th>
                <th className="h-10 px-4 text-left font-medium">Email</th>
                <th className="h-10 px-4 text-left font-medium">Role</th>
                <th className="h-10 px-4 text-left font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="h-10 px-4">{user.id}</td>
                  <td className="h-10 px-4">{user.username}</td>
                  <td className="h-10 px-4">{user.email}</td>
                  <td className="h-10 px-4">
                    <Select
                      value={user.role_name}
                      onValueChange={(value) => {
                        const role = (roles as Role[]).find(r => r.name === value);
                        if (role) roleMut.mutate({ userId: user.id, roleId: role.id });
                      }}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(roles as Role[]).map(r => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="h-10 px-4">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(checked) => statusMut.mutate({ userId: user.id, isActive: checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
