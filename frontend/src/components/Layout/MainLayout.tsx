import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  LayoutGrid,
  Users,
  UserCircle,
  FileText,
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  key: string;
  icon: React.ElementType;
  label: string;
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { mode, setMode } = useThemeStore();

  const menuItems: NavItem[] = [
    { key: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: '/services', icon: Server, label: 'MCP Services' },
    { key: '/templates', icon: LayoutGrid, label: 'Templates' },
    ...(user?.role_name === 'admin'
      ? [
          { key: '/admin/users', icon: Users, label: 'Users' },
          { key: '/admin/roles', icon: UserCircle, label: 'Roles' },
          { key: '/admin/audit', icon: FileText, label: '审计日志' },
          { key: '/admin/alerts', icon: Bell, label: '告警管理' },
        ]
      : []),
  ];

  const activeLabel =
    menuItems.find((item) => location.pathname.startsWith(item.key))?.label ||
    'MCPilot';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground text-[15px] font-bold shadow-[0_4px_12px_rgba(14,165,233,0.25)]">
            M
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            MCPilot
          </span>
        </div>

        <Separator />

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.key);
              return (
                <li key={item.key}>
                  <button
                    onClick={() => navigate(item.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                    {isActive && (
                      <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <Separator />

        <div className="px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-sidebar-accent">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium leading-tight text-foreground">
                    {user?.username}
                  </div>
                  <div className="text-[11px] leading-tight text-muted-foreground">
                    {user?.role_name}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuLabel>
                {user?.username} ({user?.role_name})
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
          <h1 className="text-lg font-semibold text-foreground">
            {activeLabel}
          </h1>

          <div className="flex items-center gap-3">
            <TooltipProvider delayDuration={300}>
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={(value) => {
                  if (value) setMode(value as 'light' | 'dark' | 'system');
                }}
                className="rounded-lg border border-border bg-muted p-0.5"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value="light"
                      size="sm"
                      className="h-7 w-7 px-0 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                    >
                      <Sun className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Light</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value="dark"
                      size="sm"
                      className="h-7 w-7 px-0 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                    >
                      <Moon className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Dark</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value="system"
                      size="sm"
                      className="h-7 w-7 px-0 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                    >
                      <Monitor className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>System</TooltipContent>
                </Tooltip>
              </ToggleGroup>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  {user?.username} ({user?.role_name})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
