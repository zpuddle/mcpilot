import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  listAlerts,
  resolveAlert,
} from '../api/monitoring';
import type { AlertRule, AlertHistoryItem } from '../api/monitoring';
import { listServices } from '../api/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const conditionTypes = [
  { value: 'cpu_above', label: 'CPU 使用率超过' },
  { value: 'memory_above', label: '内存使用率超过' },
  { value: 'restart_count', label: '重启次数超过' },
  { value: 'container_down', label: '容器宕机' },
  { value: 'health_check_fail', label: '健康检查失败' },
];

const RulesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formName, setFormName] = useState('');
  const [formServiceId, setFormServiceId] = useState<string>('');
  const [formConditionType, setFormConditionType] = useState('');
  const [formThreshold, setFormThreshold] = useState('');
  const [formNotifyMethod, setFormNotifyMethod] = useState('log');
  const [formWebhookUrl, setFormWebhookUrl] = useState('');
  const [formIsEnabled, setFormIsEnabled] = useState(true);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: listAlertRules,
  });

  const { data: servicesResp } = useQuery({
    queryKey: ['services-list-all'],
    queryFn: () => listServices(1, 200),
  });
  const services = servicesResp?.data ?? [];

  const createMut = useMutation({
    mutationFn: createAlertRule,
    onSuccess: () => {
      toast.success('规则创建成功');
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      closeModal();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AlertRule> }) => updateAlertRule(id, data),
    onSuccess: () => {
      toast.success('规则更新成功');
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      closeModal();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteAlertRule,
    onSuccess: () => {
      toast.success('规则已删除');
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_enabled }: { id: number; is_enabled: boolean }) =>
      updateAlertRule(id, { is_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingRule(null);
    setFormName('');
    setFormServiceId('');
    setFormConditionType('');
    setFormThreshold('');
    setFormNotifyMethod('log');
    setFormWebhookUrl('');
    setFormIsEnabled(true);
  };

  const openCreate = () => {
    setEditingRule(null);
    setFormName('');
    setFormServiceId('');
    setFormConditionType('');
    setFormThreshold('');
    setFormNotifyMethod('log');
    setFormWebhookUrl('');
    setFormIsEnabled(true);
    setModalOpen(true);
  };

  const openEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormServiceId(rule.service_id != null ? String(rule.service_id) : '');
    setFormConditionType(rule.condition_type);
    setFormThreshold(rule.threshold ?? '');
    setFormNotifyMethod(rule.notify_method);
    setFormWebhookUrl(rule.webhook_url ?? '');
    setFormIsEnabled(rule.is_enabled);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formConditionType) return;
    const payload: Partial<AlertRule> = {
      name: formName.trim(),
      service_id: formServiceId ? Number(formServiceId) : null,
      condition_type: formConditionType,
      threshold: formThreshold || null,
      notify_method: formNotifyMethod,
      webhook_url: formNotifyMethod === 'webhook' ? formWebhookUrl : null,
      is_enabled: formIsEnabled,
    };
    if (editingRule) {
      updateMut.mutate({ id: editingRule.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const getConditionLabel = (v: string) => {
    const found = conditionTypes.find(c => c.value === v);
    return found ? found.label : v;
  };

  return (
    <>
      <div className="mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          新建规则
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
                <th className="h-10 px-4 text-left font-medium">名称</th>
                <th className="h-10 px-4 text-left font-medium">条件类型</th>
                <th className="h-10 px-4 text-left font-medium">阈值</th>
                <th className="h-10 px-4 text-left font-medium">通知方式</th>
                <th className="h-10 px-4 text-left font-medium">状态</th>
                <th className="h-10 px-4 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="h-10 px-4">{rule.name}</td>
                  <td className="h-10 px-4">{getConditionLabel(rule.condition_type)}</td>
                  <td className="h-10 px-4">{rule.threshold ?? '-'}</td>
                  <td className="h-10 px-4">
                    <Badge variant="secondary">{rule.notify_method}</Badge>
                  </td>
                  <td className="h-10 px-4">
                    <Switch
                      checked={rule.is_enabled}
                      onCheckedChange={(checked) => toggleMut.mutate({ id: rule.id, is_enabled: checked })}
                    />
                  </td>
                  <td className="h-10 px-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                        <Edit className="h-4 w-4" />
                        编辑
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>确认删除此规则？此操作无法撤销。</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMut.mutate(rule.id)}>删除</AlertDialogAction>
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

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? '编辑规则' : '新建规则'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">名称</Label>
              <Input
                id="rule-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="例：CPU 过高告警"
              />
            </div>
            <div className="space-y-2">
              <Label>服务（可选，不选则适用所有服务）</Label>
              <Select value={formServiceId || '__all_services__'} onValueChange={(v) => setFormServiceId(v === '__all_services__' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="全部服务" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all_services__">全部服务</SelectItem>
                  {services.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>条件类型</Label>
              <Select value={formConditionType || '__none__'} onValueChange={(v) => setFormConditionType(v === '__none__' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择条件" />
                </SelectTrigger>
                <SelectContent>
                  {conditionTypes.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-threshold">阈值</Label>
              <Input
                id="rule-threshold"
                value={formThreshold}
                onChange={(e) => setFormThreshold(e.target.value)}
                placeholder="例：80（百分比）或 5（次数）"
              />
            </div>
            <div className="space-y-2">
              <Label>通知方式</Label>
              <RadioGroup value={formNotifyMethod} onValueChange={setFormNotifyMethod} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="log" id="notify-log" />
                  <Label htmlFor="notify-log" className="font-normal">日志</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="webhook" id="notify-webhook" />
                  <Label htmlFor="notify-webhook" className="font-normal">Webhook</Label>
                </div>
              </RadioGroup>
            </div>
            {formNotifyMethod === 'webhook' && (
              <div className="space-y-2">
                <Label htmlFor="rule-webhook">Webhook URL</Label>
                <Input
                  id="rule-webhook"
                  value={formWebhookUrl}
                  onChange={(e) => setFormWebhookUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>取消</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formName.trim() || !formConditionType || createMut.isPending || updateMut.isPending}
            >
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingRule ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const HistoryTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', page],
    queryFn: () => listAlerts({ page, size: 20 }),
  });

  const resolveMut = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      toast.success('告警已标记为已解决');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <>
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
                  <th className="h-10 px-4 text-left font-medium">服务</th>
                  <th className="h-10 px-4 text-left font-medium">告警类型</th>
                  <th className="h-10 px-4 text-left font-medium">消息</th>
                  <th className="h-10 px-4 text-left font-medium">状态</th>
                  <th className="h-10 px-4 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((alert: AlertHistoryItem) => (
                  <tr key={alert.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="h-10 px-4">{alert.created_at}</td>
                    <td className="h-10 px-4">{alert.service_name ?? '-'}</td>
                    <td className="h-10 px-4">
                      <Badge variant="warning">{alert.alert_type}</Badge>
                    </td>
                    <td className="h-10 px-4 max-w-[300px] truncate">{alert.message}</td>
                    <td className="h-10 px-4">
                      {alert.resolved ? (
                        <Badge variant="success">已解决</Badge>
                      ) : (
                        <Badge variant="destructive">未解决</Badge>
                      )}
                    </td>
                    <td className="h-10 px-4">
                      {!alert.resolved ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveMut.mutate(alert.id)}
                          disabled={resolveMut.isPending}
                        >
                          {resolveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          标记已解决
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">共 {data?.total ?? 0} 条</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

const AdminAlerts: React.FC = () => {
  return (
    <div>
      <h4 className="mcpilot-page-title text-lg font-semibold mb-6">告警管理</h4>
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">告警规则</TabsTrigger>
          <TabsTrigger value="history">告警历史</TabsTrigger>
        </TabsList>
        <TabsContent value="rules">
          <RulesTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAlerts;
