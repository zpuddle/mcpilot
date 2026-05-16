import React, { useState, memo } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { listTools, createTool, updateTool, deleteTool, listResources, createResource, deleteResource } from '../../api/tools';
import type { ServiceTool, ServiceResource } from '../../types';

interface Props {
  serviceId: number;
}

const defaultSchemaText = `{
  "type": "object",
  "properties": {
    "example_param": { "type": "string", "description": "示例参数" }
  },
  "required": ["example_param"]
}`;

const ToolsTab: React.FC<Props> = memo(({ serviceId }) => {
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ServiceTool | null>(null);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const [toolForm, setToolForm] = useState({
    name: '',
    handler_name: '',
    description: '',
    input_schema_text: defaultSchemaText,
    is_enabled: true,
  });

  const [resourceForm, setResourceForm] = useState({
    name: '',
    uri_template: '',
    handler_name: '',
    mime_type: 'text/plain',
  });

  const { data: tools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ['tools', serviceId],
    queryFn: () => listTools(serviceId),
    staleTime: 30_000,
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources', serviceId],
    queryFn: () => listResources(serviceId),
    staleTime: 30_000,
  });

  const createToolMut = useMutation({
    mutationFn: (data: Partial<ServiceTool>) => createTool(serviceId, data),
    onSuccess: () => { toast.success('Tool created'); setToolModalOpen(false); queryClient.invalidateQueries({ queryKey: ['tools', serviceId] }); },
  });

  const updateToolMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServiceTool> }) => updateTool(serviceId, id, data),
    onSuccess: () => { toast.success('Tool updated'); setToolModalOpen(false); setEditingTool(null); queryClient.invalidateQueries({ queryKey: ['tools', serviceId] }); },
  });

  const deleteToolMut = useMutation({
    mutationFn: (id: number) => deleteTool(serviceId, id),
    onSuccess: () => { toast.success('Tool deleted'); queryClient.invalidateQueries({ queryKey: ['tools', serviceId] }); },
  });

  const createResourceMut = useMutation({
    mutationFn: (data: Partial<ServiceResource>) => createResource(serviceId, data),
    onSuccess: () => { toast.success('Resource created'); setResourceModalOpen(false); queryClient.invalidateQueries({ queryKey: ['resources', serviceId] }); },
  });

  const deleteResourceMut = useMutation({
    mutationFn: (id: number) => deleteResource(serviceId, id),
    onSuccess: () => { toast.success('Resource deleted'); queryClient.invalidateQueries({ queryKey: ['resources', serviceId] }); },
  });

  const handleToolSubmit = () => {
    if (!toolForm.name || !toolForm.handler_name) {
      toast.error('Tool Name and Handler are required');
      return;
    }
    const rawSchema = toolForm.input_schema_text?.trim();
    let inputSchema: Record<string, unknown> = {};
    if (rawSchema) {
      try {
        inputSchema = JSON.parse(rawSchema);
      } catch (e) {
        toast.error('Input Schema 不是合法的 JSON: ' + (e as Error).message);
        return;
      }
    }
    const payload: Record<string, unknown> = {
      name: toolForm.name,
      handler_name: toolForm.handler_name,
      description: toolForm.description,
      input_schema: inputSchema,
      is_enabled: toolForm.is_enabled,
    };

    if (editingTool) {
      updateToolMut.mutate({ id: editingTool.id, data: payload });
    } else {
      createToolMut.mutate(payload);
    }
  };

  const openToolModal = (tool: ServiceTool | null) => {
    setEditingTool(tool);
    if (tool) {
      setToolForm({
        name: tool.name,
        handler_name: tool.handler_name,
        description: tool.description || '',
        input_schema_text: tool.input_schema && Object.keys(tool.input_schema).length > 0
          ? JSON.stringify(tool.input_schema, null, 2)
          : '',
        is_enabled: tool.is_enabled,
      });
    } else {
      setToolForm({
        name: '',
        handler_name: '',
        description: '',
        input_schema_text: defaultSchemaText,
        is_enabled: true,
      });
    }
    setToolModalOpen(true);
  };

  const handleResourceSubmit = () => {
    if (!resourceForm.name || !resourceForm.uri_template || !resourceForm.handler_name) {
      toast.error('All fields except MIME type are required');
      return;
    }
    createResourceMut.mutate(resourceForm);
  };

  const openResourceModal = () => {
    setResourceForm({ name: '', uri_template: '', handler_name: '', mime_type: 'text/plain' });
    setResourceModalOpen(true);
  };

  return (
    <>
      <Tabs defaultValue="tools">
        <TabsList>
          <TabsTrigger value="tools">Tools ({tools.length})</TabsTrigger>
          <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <div className="mt-4">
            <Button onClick={() => openToolModal(null)} className="mb-4">
              <Plus className="mr-1 h-4 w-4" />
              Add Tool
            </Button>
            {toolsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : tools.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tools yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">Handler</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                      <th className="px-3 py-2 text-left font-medium">Enabled</th>
                      <th className="px-3 py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tools.map((tool: ServiceTool) => (
                      <tr key={tool.id} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{tool.name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{tool.handler_name}</td>
                        <td className="max-w-[200px] truncate px-3 py-2">{tool.description}</td>
                        <td className="px-3 py-2">
                          <Switch checked={tool.is_enabled} disabled />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openToolModal(tool)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Tool</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure you want to delete this tool?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteToolMut.mutate(tool.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="mt-4">
            <Button onClick={openResourceModal} className="mb-4">
              <Plus className="mr-1 h-4 w-4" />
              Add Resource
            </Button>
            {resourcesLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : resources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resources yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">URI Template</th>
                      <th className="px-3 py-2 text-left font-medium">Handler</th>
                      <th className="px-3 py-2 text-left font-medium">MIME</th>
                      <th className="px-3 py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((res: ServiceResource) => (
                      <tr key={res.id} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{res.name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{res.uri_template}</td>
                        <td className="px-3 py-2 font-mono text-xs">{res.handler_name}</td>
                        <td className="px-3 py-2">{res.mime_type}</td>
                        <td className="px-3 py-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                                <AlertDialogDescription>Are you sure you want to delete this resource?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteResourceMut.mutate(res.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={toolModalOpen} onOpenChange={(open) => { if (!open) { setToolModalOpen(false); setEditingTool(null); } }}>
        <DialogContent forceMount className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTool ? 'Edit Tool' : 'Add Tool'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tool_name">Tool Name</Label>
              <Input
                id="tool_name"
                placeholder="e.g. get_weather"
                value={toolForm.name}
                onChange={(e) => setToolForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tool_handler">Handler Function Name</Label>
              <Input
                id="tool_handler"
                placeholder="e.g. get_weather (must match async def in code)"
                value={toolForm.handler_name}
                onChange={(e) => setToolForm((f) => ({ ...f, handler_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tool_description">Description</Label>
              <Textarea
                id="tool_description"
                rows={2}
                placeholder="What does this tool do?"
                value={toolForm.description}
                onChange={(e) => setToolForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tool_schema">Input Schema (JSON Schema)</Label>
              <p className="text-xs text-muted-foreground">
                定义工具的输入参数结构，用于 FastMCP 生成函数签名。留空则无参数。
              </p>
              <Textarea
                id="tool_schema"
                rows={10}
                className="font-mono"
                placeholder='{"type":"object","properties":{"city":{"type":"string"}},"required":["city"]}'
                value={toolForm.input_schema_text}
                onChange={(e) => setToolForm((f) => ({ ...f, input_schema_text: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="tool_enabled"
                checked={toolForm.is_enabled}
                onCheckedChange={(checked) => setToolForm((f) => ({ ...f, is_enabled: checked }))}
              />
              <Label htmlFor="tool_enabled">Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setToolModalOpen(false); setEditingTool(null); }}>Cancel</Button>
            <Button onClick={handleToolSubmit} disabled={createToolMut.isPending || updateToolMut.isPending}>
              {(createToolMut.isPending || updateToolMut.isPending) ? 'Saving...' : editingTool ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
        <DialogContent forceMount>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="res_name">Resource Name</Label>
              <Input
                id="res_name"
                placeholder="e.g. user_profile"
                value={resourceForm.name}
                onChange={(e) => setResourceForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res_uri">URI Template</Label>
              <Input
                id="res_uri"
                placeholder="e.g. users://{user_id}/profile"
                value={resourceForm.uri_template}
                onChange={(e) => setResourceForm((f) => ({ ...f, uri_template: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res_handler">Handler Function Name</Label>
              <Input
                id="res_handler"
                placeholder="e.g. get_user_profile"
                value={resourceForm.handler_name}
                onChange={(e) => setResourceForm((f) => ({ ...f, handler_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res_mime">MIME Type</Label>
              <Input
                id="res_mime"
                value={resourceForm.mime_type}
                onChange={(e) => setResourceForm((f) => ({ ...f, mime_type: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResourceModalOpen(false)}>Cancel</Button>
            <Button onClick={handleResourceSubmit} disabled={createResourceMut.isPending}>
              {createResourceMut.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
ToolsTab.displayName = 'ToolsTab';

export default ToolsTab;
