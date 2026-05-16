import React, { useState, memo } from 'react';
import { Rocket, History, Network } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deployService, scaleService, getServiceInstances } from '../../api/services';
import type { ServiceInstance } from '../../api/services';
import { getDeployLogs, listVersions, createVersion, rollbackVersion } from '../../api/tools';
import type { McpService, DeployLog, ServiceVersion } from '../../types';

interface Props {
  serviceId: number;
  service: McpService;
}

const statusColorMap: Record<string, string> = {
  success: 'bg-green-500',
  failed: 'bg-red-500',
  running: 'bg-blue-500',
  pending: 'bg-yellow-500',
};

const statusBadgeVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline' | 'success' | 'warning'> = {
  success: 'success',
  failed: 'destructive',
  running: 'default',
  pending: 'warning',
};

const DeployTab: React.FC<Props> = memo(({ serviceId, service }) => {
  const queryClient = useQueryClient();
  const [replicas, setReplicas] = useState<number>(service.replicas || 1);
  const [scaling, setScaling] = useState(false);

  const { data: deployLogs = [] } = useQuery({
    queryKey: ['deploy-logs', serviceId],
    queryFn: () => getDeployLogs(serviceId),
    staleTime: 30_000,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['versions', serviceId],
    queryFn: () => listVersions(serviceId),
    staleTime: 30_000,
  });

  const deployMut = useMutation({
    mutationFn: () => deployService(serviceId),
    onSuccess: (res) => {
      toast.success(res.message || 'Deployed successfully');
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['deploy-logs', serviceId] });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Deploy failed');
    },
  });

  const createVersionMut = useMutation({
    mutationFn: () => createVersion(serviceId, `Deploy v${service.current_version + 1}`),
    onSuccess: () => {
      toast.success('Version snapshot created');
      queryClient.invalidateQueries({ queryKey: ['versions', serviceId] });
    },
  });

  const rollbackMut = useMutation({
    mutationFn: (versionId: number) => rollbackVersion(serviceId, versionId),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
    },
  });

  const { data: instances = [] } = useQuery<ServiceInstance[]>({
    queryKey: ['instances', serviceId],
    queryFn: () => getServiceInstances(serviceId),
    refetchInterval: 30000,
    staleTime: 15_000,
  });

  const handleScale = async () => {
    setScaling(true);
    try {
      const res = await scaleService(serviceId, replicas);
      toast.success(res.message || 'Scaled successfully');
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['instances', serviceId] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Scale failed');
    } finally {
      setScaling(false);
    }
  };

  const instanceStatusColor: Record<string, string> = {
    running: 'bg-green-500',
    exited: 'bg-red-500',
    stopped: 'bg-gray-400',
    created: 'bg-yellow-500',
  };

  return (
    <div>
      <div className="mb-6 flex gap-3">
        <Button size="lg" onClick={() => deployMut.mutate()} disabled={deployMut.isPending}>
          <Rocket className="mr-2 h-4 w-4" />
          Deploy Now
        </Button>
        <Button variant="outline" onClick={() => createVersionMut.mutate()} disabled={createVersionMut.isPending}>
          <History className="mr-2 h-4 w-4" />
          Create Version Snapshot
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deploy History</CardTitle>
          </CardHeader>
          <CardContent>
            {(deployLogs as DeployLog[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No deployments yet</p>
            ) : (
              <div className="relative border-l-2 border-muted pl-4">
                {(deployLogs as DeployLog[]).map((log) => (
                  <div key={log.id} className="relative mb-4 last:mb-0">
                    <div
                      className={`absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full ${statusColorMap[log.status] || 'bg-gray-400'}`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusBadgeVariant[log.status] || 'secondary'}>{log.status}</Badge>
                        <span className="font-medium">{log.action}</span>
                        <span className="text-xs text-muted-foreground">{log.created_at}</span>
                      </div>
                      {log.log_output && (
                        <pre className="mt-1 max-h-24 overflow-auto rounded bg-muted p-2 text-xs">
                          {log.log_output.slice(0, 500)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Versions</CardTitle>
          </CardHeader>
          <CardContent>
            {(versions as ServiceVersion[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No versions yet</p>
            ) : (
              <div className="relative border-l-2 border-muted pl-4">
                {(versions as ServiceVersion[]).map((v) => (
                  <div key={v.id} className="relative mb-4 last:mb-0">
                    <div className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <div>
                      <span className="font-medium">{v.version_tag}</span>
                      <span className="text-xs text-muted-foreground"> - {v.created_at}</span>
                      <br />
                      <span className="text-sm">{v.changelog}</span>
                      <br />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            Rollback
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Rollback</AlertDialogTitle>
                            <AlertDialogDescription>Rollback to this version?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => rollbackMut.mutate(v.id)}>Confirm</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">实例配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Network className="h-4 w-4 text-muted-foreground" />
            <span>副本数：</span>
            <Input
              type="number"
              min={1}
              max={10}
              value={replicas}
              onChange={(e) => setReplicas(Number(e.target.value) || 1)}
              className="w-20"
            />
            <Button onClick={handleScale} disabled={scaling}>
              {scaling ? '应用中...' : '应用'}
            </Button>
          </div>

          {instances && instances.length > 1 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">实例编号</th>
                    <th className="px-3 py-2 text-left font-medium">容器ID</th>
                    <th className="px-3 py-2 text-left font-medium">内部端口</th>
                    <th className="px-3 py-2 text-left font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map((inst) => (
                    <tr key={inst.id} className="border-b last:border-0">
                      <td className="px-3 py-2">#{inst.instance_index}</td>
                      <td className="px-3 py-2 font-mono text-xs">{inst.container_id ? inst.container_id.slice(0, 12) : '-'}</td>
                      <td className="px-3 py-2">{inst.internal_port}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block h-2 w-2 rounded-full ${instanceStatusColor[inst.status] || 'bg-gray-400'}`} />
                          {inst.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
DeployTab.displayName = 'DeployTab';

export default DeployTab;
