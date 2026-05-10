import React from 'react';
import { Tag } from 'antd';
import type { ServiceStatus } from '../types';

const statusConfig: Record<ServiceStatus, { color: string; label: string }> = {
  draft: { color: 'default', label: 'Draft' },
  building: { color: 'processing', label: 'Building' },
  running: { color: 'success', label: 'Running' },
  stopped: { color: 'warning', label: 'Stopped' },
  error: { color: 'error', label: 'Error' },
};

interface Props {
  status: ServiceStatus;
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status] || { color: 'default', label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
};

export default StatusBadge;
