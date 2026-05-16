import React, { useState, memo } from 'react';
import { Play, Pause, RotateCw, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  startService,
  stopService,
  restartService,
  listServices,
  getServiceDependencies,
  addServiceDependency,
  removeServiceDependency,
} from '../../api/services';
import type { ServiceDependency } from '../../api/services';
import { getServiceMetrics } from '../../api/monitoring';
import StatusBadge from '../../components/StatusBadge';
import type { McpService } from '../../types';

interface Props {
  service: McpService;
}

const ServiceActions: React.FC<{ service: McpService }> = memo(({ service }) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['service', service.id] });

  const startMut = useMutation({ mutationFn: () => startService(service.id), onSuccess: () => { toast.success('Started'); invalidate(); } });
  const stopMut = useMutation({ mutationFn: () => stopService(service.id), onSuccess: () => { toast.success('Stopped'); invalidate(); } });
  const restartMut = useMutation({ mutationFn: () => restartService(service.id), onSuccess: () => { toast.success('Restarted'); invalidate(); } });

  return (
    <div className="mb-4 flex gap-2">
      <Button onClick={() => startMut.mutate()} disabled={startMut.isPending || service.status === 'running'}>
        <Play className="mr-1 h-4 w-4" />
        Start
      </Button>
      <Button variant="secondary" onClick={() => stopMut.mutate()} disabled={stopMut.isPending || service.status === 'stopped' || service.status === 'draft'}>
        <Pause className="mr-1 h-4 w-4" />
        Stop
      </Button>
      <Button variant="outline" onClick={() => restartMut.mutate()} disabled={restartMut.isPending || service.status !== 'running'}>
        <RotateCw className="mr-1 h-4 w-4" />
        Restart
      </Button>
    </div>
  );
});
ServiceActions.displayName = 'ServiceActions';

const ServiceInfo: React.FC<{ service: McpService }> = memo(({ service }) => {
  const items: { label: string; value: React.ReactNode; span2?: boolean }[] = [
    { label: 'Name', value: service.name },
    { label: 'Slug', value: service.slug },
    { label: 'Status', value: <StatusBadge status={service.status} /> },
    { label: 'Transport', value: <Badge variant="outline">{service.transport_type}</Badge> },
    { label: 'Port', value: service.port || 'Not assigned' },
    { label: 'Version', value: `v${service.current_version}` },
    { label: 'Image', value: service.image_tag || '-' },
    { label: 'Container', value: service.container_id?.slice(0, 12) || '-' },
    { label: 'Description', value: service.description || '-', span2: true },
    { label: 'Created', value: service.created_at },
    { label: 'Updated', value: service.updated_at },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3">
      {items.map((item) => (
        <div key={item.label} className={item.span2 ? 'col-span-2' : ''}>
          <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
          <div className="mt-0.5 text-sm">{item.value}</div>
        </div>
      ))}
    </div>
  );
});
ServiceInfo.displayName = 'ServiceInfo';

const CircleProgress: React.FC<{ percent: number; color: string; size?: number; strokeWidth?: number }> = ({
  percent,
  color,
  size = 100,
  strokeWidth = 8,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-semibold">{percent.toFixed(1)}%</span>
    </div>
  );
};

const MetricsSection: React.FC<{ service: McpService }> = memo(({ service }) => {
  const isRunning = service.status === 'running';
  const { data: metrics } = useQuery({
    queryKey: ['service-metrics', service.id],
    queryFn: () => getServiceMetrics(service.id),
    enabled: isRunning,
    refetchInterval: 15000,
    staleTime: 10_000,
  });

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">运行指标</CardTitle>
        {isRunning && <span className="text-xs text-muted-foreground">每 15 秒自动刷新</span>}
      </CardHeader>
      <CardContent>
        {isRunning && metrics ? (
          <div className="grid grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <CircleProgress
                percent={Math.round(metrics.cpu_percent * 100) / 100}
                color={metrics.cpu_percent > 80 ? '#ef4444' : '#3b82f6'}
              />
              <span className="mt-2 text-sm font-semibold">CPU 使用率</span>
            </div>
            <div className="flex flex-col items-center">
              <CircleProgress
                percent={Math.round(metrics.memory_percent * 100) / 100}
                color={metrics.memory_percent > 80 ? '#ef4444' : '#22c55e'}
              />
              <span className="mt-2 text-sm font-semibold">内存使用率</span>
              <span className="text-xs text-muted-foreground">
                {metrics.memory_usage_mb.toFixed(1)} / {metrics.memory_limit_mb.toFixed(1)} MB
              </span>
            </div>
            <div className="flex flex-col items-center justify-center pt-4">
              <span className="text-3xl font-bold">{metrics.restart_count}</span>
              <span className="mt-1 text-sm text-muted-foreground">重启次数</span>
            </div>
            <div className="flex flex-col items-center justify-center pt-4">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${metrics.status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="text-3xl font-bold">{metrics.status}</span>
              </div>
              <span className="mt-1 text-sm text-muted-foreground">容器状态</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">服务未运行，无法获取指标</p>
        )}
      </CardContent>
    </Card>
  );
});
MetricsSection.displayName = 'MetricsSection';

const DependenciesSection: React.FC<{ service: McpService }> = memo(({ service }) => {
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [depForm, setDepForm] = useState<{ depends_on_id: string; dependency_type: string; description: string }>({
    depends_on_id: '',
    dependency_type: 'runtime',
    description: '',
  });

  const { data: dependencies = [], refetch: refetchDeps } = useQuery({
    queryKey: ['service-dependencies', service.id],
    queryFn: () => getServiceDependencies(service.id),
    staleTime: 30_000,
  });

  const { data: servicesResp } = useQuery({
    queryKey: ['services-list-all'],
    queryFn: () => listServices(1, 200),
    enabled: depModalOpen,
    staleTime: 60_000,
  });
  const allServices = servicesResp?.data ?? [];

  const existingDepIds = dependencies.map((d: ServiceDependency) => d.depends_on_id);
  const availableServices = allServices.filter(
    (s) => s.id !== service.id && !existingDepIds.includes(s.id),
  );

  const addDepMutation = useMutation({
    mutationFn: (data: { depends_on_id: number; dependency_type?: string; description?: string }) =>
      addServiceDependency(service.id, data),
    onSuccess: () => {
      refetchDeps();
      toast.success('依赖添加成功');
      setDepModalOpen(false);
      setDepForm({ depends_on_id: '', dependency_type: 'runtime', description: '' });
    },
  });

  const removeDepMutation = useMutation({
    mutationFn: (depId: number) => removeServiceDependency(service.id, depId),
    onSuccess: () => {
      refetchDeps();
      toast.success('依赖已移除');
    },
  });

  const handleAddDep = () => {
    if (!depForm.depends_on_id) {
      toast.error('请选择依赖的服务');
      return;
    }
    addDepMutation.mutate({
      depends_on_id: Number(depForm.depends_on_id),
      dependency_type: depForm.dependency_type,
      description: depForm.description || undefined,
    });
  };

  const openDepModal = () => {
    setDepForm({ depends_on_id: '', dependency_type: 'runtime', description: '' });
    setDepModalOpen(true);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">服务依赖</CardTitle>
        <Button size="sm" onClick={openDepModal}>
          <Plus className="mr-1 h-4 w-4" />
          添加依赖
        </Button>
      </CardHeader>
      <CardContent>
        {dependencies.length > 0 ? (
          <div className="divide-y">
            {dependencies.map((dep: ServiceDependency) => {
              const depService = allServices.find((s) => s.id === dep.depends_on_id);
              return (
                <div key={dep.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dep.depends_on_name || depService?.name || `Service #${dep.depends_on_id}`}</span>
                      <Badge variant={dep.dependency_type === 'runtime' ? 'default' : 'secondary'}>
                        {dep.dependency_type}
                      </Badge>
                      {depService && (
                        <Badge variant={depService.status === 'running' ? 'success' : 'secondary'}>
                          {depService.status}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{dep.description || '无描述'}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="mr-1 h-4 w-4" />
                        移除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认移除</AlertDialogTitle>
                        <AlertDialogDescription>确认移除此依赖？</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeDepMutation.mutate(dep.id)}>确认</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无服务依赖</p>
        )}
      </CardContent>

      <Dialog open={depModalOpen} onOpenChange={setDepModalOpen}>
        <DialogContent forceMount>
          <DialogHeader>
            <DialogTitle>添加服务依赖</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="depends_on_id">依赖服务</Label>
              <Select
                value={depForm.depends_on_id}
                onValueChange={(v) => setDepForm((f) => ({ ...f, depends_on_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择服务" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>依赖类型</Label>
              <RadioGroup
                value={depForm.dependency_type}
                onValueChange={(v) => setDepForm((f) => ({ ...f, dependency_type: v }))}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="runtime" id="runtime" />
                  <Label htmlFor="runtime" className="font-normal">运行时（runtime）</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="optional" id="optional" />
                  <Label htmlFor="optional" className="font-normal">可选（optional）</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dep_description">描述</Label>
              <Textarea
                id="dep_description"
                placeholder="描述此依赖关系（可选）"
                rows={3}
                value={depForm.description}
                onChange={(e) => setDepForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepModalOpen(false)}>取消</Button>
            <Button onClick={handleAddDep} disabled={addDepMutation.isPending}>
              {addDepMutation.isPending ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});
DependenciesSection.displayName = 'DependenciesSection';

const OverviewTab: React.FC<Props> = memo(({ service }) => (
  <div>
    <ServiceActions service={service} />
    <ServiceInfo service={service} />
    <MetricsSection service={service} />
    <DependenciesSection service={service} />
  </div>
));
OverviewTab.displayName = 'OverviewTab';

export default OverviewTab;
