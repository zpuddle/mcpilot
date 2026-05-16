import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { RefreshCw, Link, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { McpService } from '../../types';

interface Props {
  serviceId: number;
  service: McpService;
}

const LogsTab: React.FC<Props> = memo(({ serviceId, service }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const logContainerRef = useRef<HTMLPreElement | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const apiBase = import.meta.env.VITE_API_BASE || '/api/v1';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}${apiBase}/services/${serviceId}/logs/stream?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
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
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground">No container running. Deploy the service first to see logs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Button variant="outline" onClick={handleReconnect}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Reconnect
        </Button>
        {connected ? (
          <Badge variant="success" className="gap-1">
            <Link className="h-3 w-3" />
            Connected
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Unlink className="h-3 w-3" />
            Disconnected
          </Badge>
        )}
      </div>
      <pre
        ref={logContainerRef}
        className="h-[500px] overflow-auto whitespace-pre-wrap break-all rounded-md bg-[#1e1e1e] p-3 font-mono text-xs text-[#d4d4d4]"
      >
        {logs.length > 0 ? logs.join('\n') : 'Waiting for logs...'}
      </pre>
    </div>
  );
});
LogsTab.displayName = 'LogsTab';

export default LogsTab;
