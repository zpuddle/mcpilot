import React, { useState, memo } from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateService } from '../../api/services';
import type { McpService } from '../../types';

interface Props {
  service: McpService;
}

const ConfigTab: React.FC<Props> = memo(({ service }) => {
  const queryClient = useQueryClient();

  const envVarsText = Object.entries(service.env_vars || {})
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const [form, setForm] = useState({
    name: service.name,
    description: service.description || '',
    transport_type: service.transport_type,
    env_vars_text: envVarsText,
    extra_dependencies: service.extra_dependencies || '',
  });

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => updateService(service.id, values),
    onSuccess: () => {
      toast.success('Configuration updated');
      queryClient.invalidateQueries({ queryKey: ['service', service.id] });
    },
    onError: () => toast.error('Update failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const envText = form.env_vars_text || '';
    const envVars: Record<string, string> = {};
    envText.split('\n').forEach((line: string) => {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key) envVars[key] = val;
      }
    });

    mutation.mutate({
      name: form.name,
      description: form.description,
      transport_type: form.transport_type,
      env_vars: envVars,
      extra_dependencies: form.extra_dependencies,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transport_type">Transport Type</Label>
            <Select
              value={form.transport_type}
              onValueChange={(v) => setForm((f) => ({ ...f, transport_type: v as 'sse' | 'streamable_http' | 'both' }))}
            >
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
          <div className="grid gap-2">
            <Label htmlFor="env_vars_text">Environment Variables</Label>
            <p className="text-xs text-muted-foreground">One per line: KEY=VALUE</p>
            <Textarea
              id="env_vars_text"
              rows={6}
              className="font-mono"
              placeholder={"API_KEY=your-key-here\nDATABASE_URL=postgres://..."}
              value={form.env_vars_text}
              onChange={(e) => setForm((f) => ({ ...f, env_vars_text: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="extra_dependencies">Extra Python Dependencies</Label>
            <p className="text-xs text-muted-foreground">One per line, pip format</p>
            <Textarea
              id="extra_dependencies"
              rows={4}
              className="font-mono"
              placeholder={"httpx>=0.27.0\nbeautifulsoup4\npandas"}
              value={form.extra_dependencies}
              onChange={(e) => setForm((f) => ({ ...f, extra_dependencies: e.target.value }))}
            />
          </div>
          <div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
ConfigTab.displayName = 'ConfigTab';

export default ConfigTab;
