import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/services';
import { Server, CheckCircle, PauseCircle, AlertTriangle } from 'lucide-react';

const statCards = [
  {
    key: 'total',
    title: 'Total Services',
    icon: Server,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    key: 'running',
    title: 'Running',
    icon: CheckCircle,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
  {
    key: 'stopped',
    title: 'Stopped',
    icon: PauseCircle,
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-500',
  },
  {
    key: 'errors',
    title: 'Errors',
    icon: AlertTriangle,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
  },
];

const Dashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {(stats as Record<string, number>)?.[card.key] ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
