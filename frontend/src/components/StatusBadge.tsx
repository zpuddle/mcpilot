import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ServiceStatus } from '../types';

const statusConfig: Record<ServiceStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; label: string }> = {
  draft: { variant: 'secondary', label: 'Draft' },
  building: { variant: 'outline', label: 'Building' },
  running: { variant: 'success', label: 'Running' },
  stopped: { variant: 'warning', label: 'Stopped' },
  error: { variant: 'destructive', label: 'Error' },
};

interface Props {
  status: ServiceStatus;
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status] || { variant: 'secondary' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default StatusBadge;
