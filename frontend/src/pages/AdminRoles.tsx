import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRoles, createRole, updateRole } from '../api/users';
import type { Role } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';

const ALL_PERMISSIONS = [
  'services:read', 'services:write', 'services:deploy', 'services:logs', 'services:lifecycle', '*',
];

const AdminRoles: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: listRoles,
  });

  const createMut = useMutation({
    mutationFn: (v: { name: string; permissions: string[] }) => createRole(v.name, v.permissions),
    onSuccess: () => { toast.success('Role created'); closeModal(); queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); },
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: number; name: string; permissions: string[] }) => updateRole(v.id, v.name, v.permissions),
    onSuccess: () => { toast.success('Role updated'); closeModal(); queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingRole(null);
    setFormName('');
    setFormPermissions([]);
  };

  const openCreate = () => {
    setEditingRole(null);
    setFormName('');
    setFormPermissions([]);
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormPermissions([...role.permissions]);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) return;
    if (editingRole) {
      updateMut.mutate({ id: editingRole.id, name: formName.trim(), permissions: formPermissions });
    } else {
      createMut.mutate({ name: formName.trim(), permissions: formPermissions });
    }
  };

  const togglePermission = (perm: string) => {
    setFormPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="mcpilot-page-title text-lg font-semibold">Role Management</h4>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Role
        </Button>
      </div>

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
                <th className="h-10 px-4 text-left font-medium">Name</th>
                <th className="h-10 px-4 text-left font-medium">Permissions</th>
                <th className="h-10 px-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(roles as Role[]).map((role) => (
                <tr key={role.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="h-10 px-4">{role.id}</td>
                  <td className="h-10 px-4">{role.name}</td>
                  <td className="h-10 px-4">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map(p => (
                        <Badge key={p} variant="secondary">{p}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="h-10 px-4">
                    <Button variant="link" size="sm" onClick={() => openEdit(role)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {ALL_PERMISSIONS.map(perm => (
                  <div key={perm} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm">{perm}</span>
                    <Switch
                      checked={formPermissions.includes(perm)}
                      onCheckedChange={() => togglePermission(perm)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formName.trim() || createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingRole ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRoles;
