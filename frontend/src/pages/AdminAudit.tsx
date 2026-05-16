import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/audit';
import type { AuditLog } from '../api/audit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const actionVariantMap: Record<string, 'default' | 'destructive' | 'secondary' | 'warning' | 'success'> = {
  create: 'success',
  delete: 'destructive',
  deploy: 'default',
  update: 'warning',
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
  const [pageSize] = useState(20);
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

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="mcpilot-page-title text-lg font-semibold">审计日志</h4>
        <div className="flex gap-3">
          <Select value={action || '__all_action__'} onValueChange={(v) => { setAction(v === '__all_action__' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="操作类型" />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map(opt => (
                <SelectItem key={opt.value || '__all_action__'} value={opt.value || '__all_action__'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resourceType || '__all_resource__'} onValueChange={(v) => { setResourceType(v === '__all_resource__' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="资源类型" />
            </SelectTrigger>
            <SelectContent>
              {resourceTypeOptions.map(opt => (
                <SelectItem key={opt.value || '__all_resource__'} value={opt.value || '__all_resource__'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium w-[180px]">时间</th>
                  <th className="h-10 px-4 text-left font-medium w-[120px]">用户名</th>
                  <th className="h-10 px-4 text-left font-medium w-[100px]">操作</th>
                  <th className="h-10 px-4 text-left font-medium w-[120px]">资源类型</th>
                  <th className="h-10 px-4 text-left font-medium w-[160px]">资源名称</th>
                  <th className="h-10 px-4 text-left font-medium w-[140px]">IP地址</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data || []).map((log: AuditLog) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="h-10 px-4">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="h-10 px-4">{log.username}</td>
                    <td className="h-10 px-4">
                      <Badge variant={actionVariantMap[log.action] || 'secondary'}>{log.action}</Badge>
                    </td>
                    <td className="h-10 px-4">{log.resource_type}</td>
                    <td className="h-10 px-4">{log.resource_name || '-'}</td>
                    <td className="h-10 px-4">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">共 {data?.total || 0} 条</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAudit;
