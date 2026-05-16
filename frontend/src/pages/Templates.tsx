import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listTemplates, createFromTemplate, type ServiceTemplate } from '../api/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from 'sonner';
import { Globe, Database, Bot, Wrench, Zap, Loader2 } from 'lucide-react';

const categoryIcons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  api: { icon: <Globe className="h-7 w-7" />, color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.06)' },
  database: { icon: <Database className="h-7 w-7" />, color: '#10B981', bg: 'rgba(16, 185, 129, 0.06)' },
  ai: { icon: <Bot className="h-7 w-7" />, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
  tool: { icon: <Wrench className="h-7 w-7" />, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
};

const categoryOptions = [
  { value: '', label: '全部' },
  { value: 'api', label: 'API' },
  { value: 'database', label: '数据库' },
  { value: 'ai', label: 'AI' },
  { value: 'tool', label: '工具' },
];

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);
  const [serviceName, setServiceName] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', category],
    queryFn: () => listTemplates(category || undefined),
  });

  const createMutation = useMutation({
    mutationFn: ({ templateId, name }: { templateId: number; name: string }) =>
      createFromTemplate(templateId, name),
    onSuccess: (data) => {
      toast.success('服务创建成功');
      setModalOpen(false);
      setServiceName('');
      setSelectedTemplate(null);
      navigate(`/services/${data.id}/overview`);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || '创建失败');
    },
  });

  const handleUseTemplate = (template: ServiceTemplate) => {
    setSelectedTemplate(template);
    setServiceName('');
    setModalOpen(true);
  };

  const handleConfirmCreate = () => {
    if (!serviceName.trim()) {
      toast.warning('请输入服务名称');
      return;
    }
    if (selectedTemplate) {
      createMutation.mutate({ templateId: selectedTemplate.id, name: serviceName.trim() });
    }
  };

  const getIconConfig = (template: ServiceTemplate) => {
    return categoryIcons[template.category] || { icon: <Globe className="h-7 w-7" />, color: '#64748B', bg: 'rgba(100, 116, 139, 0.06)' };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="mcpilot-page-title text-lg font-semibold">服务模板</h4>
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(v) => { if (v !== undefined) setCategory(v); }}
          variant="outline"
        >
          {categoryOptions.map(opt => (
            <ToggleGroupItem key={opt.value} value={opt.value} aria-label={opt.label}>
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className={`grid grid-cols-3 gap-4 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
        {templates.map((template) => {
          const iconConfig = getIconConfig(template);
          return (
            <Card key={template.id} className="mcpilot-glass-card mcpilot-card-hover flex flex-col h-full">
              <CardHeader className="flex-1 flex flex-col items-center text-center pb-2">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: iconConfig.bg, color: iconConfig.color }}
                >
                  {iconConfig.icon}
                </div>
                <CardTitle className="text-base font-semibold">{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground line-clamp-2 pb-2">
                {template.description}
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-4 border-t">
                <span className="text-xs text-muted-foreground">已使用 {template.usage_count} 次</span>
                <Button size="sm" onClick={() => handleUseTemplate(template)}>
                  <Zap className="h-3 w-3" />
                  使用此模板
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {!isLoading && templates.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          暂无模板
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); setSelectedTemplate(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>使用模板: {selectedTemplate?.name || ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{selectedTemplate?.description}</p>
            <Input
              placeholder="请输入服务名称（如 my-weather-api）"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmCreate(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); setSelectedTemplate(null); }}>取消</Button>
            <Button onClick={handleConfirmCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
