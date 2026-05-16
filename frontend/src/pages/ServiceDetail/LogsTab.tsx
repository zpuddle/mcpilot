import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Card, Space, Tag } from 'antd';
import { ReloadOutlined, DisconnectOutlined, LinkOutlined } from '@ant-design/icons';
import type { McpService } from '../../types';

interface Props {
  serviceId: number;
  service: McpService;
}

const LogsTab: React.FC<Props> = ({ serviceId, service }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const logContainerRef = useRef<HTMLPreElement | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Build WebSocket URL from the API base
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8020/api/v1';
    const wsBase = apiBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/services/${serviceId}/logs/stream?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
      // Auto-scroll to bottom
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setConnected(false);
    };
  }, [serviceId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    if (service.container_id) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [service.container_id, connect, disconnect]);

  const handleReconnect = () => {
    disconnect();
    setLogs([]);
    connect();
  };

  if (!service.container_id) {
    return <Card><p>No container running. Deploy the service first to see logs.</p></Card>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={handleReconnect}>
          Reconnect
        </Button>
        {connected ? (
          <Tag icon={<LinkOutlined />} color="success">Connected</Tag>
        ) : (
          <Tag icon={<DisconnectOutlined />} color="default">Disconnected</Tag>
        )}
      </Space>
      <pre
        ref={logContainerRef}
        style={{
          fontFamily: 'monospace',
          fontSize: 12,
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: 12,
          borderRadius: 6,
          height: 500,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {logs.length > 0 ? logs.join('\n') : 'Waiting for logs...'}
      </pre>
    </div>
  );
};

export default LogsTab;
