import React, { Suspense, lazy, useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getService } from '../../api/services';

const OverviewTab = lazy(() => import('./OverviewTab'));
const CodeTab = lazy(() => import('./CodeTab'));
const ToolsTab = lazy(() => import('./ToolsTab'));
const ConfigTab = lazy(() => import('./ConfigTab'));
const DeployTab = lazy(() => import('./DeployTab'));
const LogsTab = lazy(() => import('./LogsTab'));

const tabFallback = (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const serviceId = Number(id);

  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => getService(serviceId),
    enabled: !!serviceId,
    staleTime: 30_000,
  });

  const pathParts = location.pathname.split('/');
  const activeTab = pathParts[pathParts.length - 1] || 'overview';

  const handleTabChange = (key: string) => {
    setMountedTabs((prev) => {
      if (prev.has(key)) return prev;
      return new Set(prev).add(key);
    });
    navigate(`/services/${serviceId}/${key}`);
  };

  const tabConfig = useMemo(() => [
    { key: 'overview', label: 'Overview' },
    { key: 'code', label: 'Code' },
    { key: 'tools', label: 'Tools & Resources' },
    { key: 'config', label: 'Config' },
    { key: 'deploy', label: 'Deploy' },
    { key: 'logs', label: 'Logs' },
  ], []);

  const tabContent = useMemo(() => {
    const wrap = (key: string, el: React.ReactNode) => {
      if (!mountedTabs.has(key)) return null;
      return (
        <div style={{ display: activeTab === key ? 'block' : 'none' }}>
          <Suspense fallback={tabFallback}>{el}</Suspense>
        </div>
      );
    };

    return {
      overview: wrap('overview', <OverviewTab service={service!} />),
      code: wrap('code', <CodeTab serviceId={serviceId} />),
      tools: wrap('tools', <ToolsTab serviceId={serviceId} />),
      config: wrap('config', <ConfigTab service={service!} />),
      deploy: wrap('deploy', <DeployTab serviceId={serviceId} service={service!} />),
      logs: wrap('logs', <LogsTab serviceId={serviceId} service={service!} />),
    };
  }, [activeTab, mountedTabs, service, serviceId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!service) return <div className="text-muted-foreground p-8 text-center">Service not found</div>;

  return (
    <div>
      <h2 className="mcpilot-page-title mb-4">{service.name}</h2>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {tabConfig.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mt-4">
        {tabContent.overview}
        {tabContent.code}
        {tabContent.tools}
        {tabContent.config}
        {tabContent.deploy}
        {tabContent.logs}
      </div>
    </div>
  );
};

export default ServiceDetail;
