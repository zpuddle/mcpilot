import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listServices, createService, deleteService } from '../api/services';
import StatusBadge from '../components/StatusBadge';
import type { McpService } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Eye, Trash2 } from 'lucide-react';

const ServiceList: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTransport, setFormTransport] = useState('sse');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices(1, 50),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (values: { name: string; description: string; transport_type: string }) =>
      createService(values),
    onSuccess: () => {
      toast.success('Service created');
      setCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Create failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: () => {
      toast.success('Service deleted');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const resetForm = useCallback(() => {
    setFormName('');
    setFormDescription('');
    setFormTransport('sse');
  }, []);

  const handleOpenCreate = useCallback(() => {
    resetForm();
    setCreateOpen(true);
  }, [resetForm]);

  const handleCreateSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formName.trim()) return;
      createMutation.mutate({
        name: formName,
        description: formDescription,
        transport_type: formTransport,
      });
    },
    [createMutation, formName, formDescription, formTransport],
  );

  const services = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold mcpilot-page-title">MCP Services</h4>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Service
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium">Name</th>
              <th className="h-10 px-4 text-left font-medium">Slug</th>
              <th className="h-10 px-4 text-left font-medium">Status</th>
              <th className="h-10 px-4 text-left font-medium">Transport</th>
              <th className="h-10 px-4 text-left font-medium">Port</th>
              <th className="h-10 px-4 text-left font-medium">Version</th>
              <th className="h-10 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  No services found.
                </td>
              </tr>
            ) : (
              services.map((record: McpService) => (
                <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="h-10 px-4 font-medium">{record.name}</td>
                  <td className="h-10 px-4 text-muted-foreground">{record.slug}</td>
                  <td className="h-10 px-4">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="h-10 px-4">{record.transport_type}</td>
                  <td className="h-10 px-4">{record.port || '-'}</td>
                  <td className="h-10 px-4">v{record.current_version}</td>
                  <td className="h-10 px-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/services/${record.id}/overview`)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Detail
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the service
                              &quot;{record.name}&quot;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteMutation.mutate(record.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create MCP Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. weather-tool"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Brief description of this MCP service"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transport_type">Transport</Label>
                <Select value={formTransport} onValueChange={setFormTransport}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sse">SSE</SelectItem>
                    <SelectItem value="streamable_http">Streamable HTTP</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceList;
