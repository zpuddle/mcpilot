import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Segmented, theme } from 'antd';
import {
  DashboardOutlined,
  CloudServerOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  AuditOutlined,
  AppstoreOutlined,
  AlertOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const { token } = theme.useToken();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/services', icon: <CloudServerOutlined />, label: 'MCP Services' },
    { key: '/templates', icon: <AppstoreOutlined />, label: '模板市场' },
    ...(user?.role_name === 'admin'
      ? [
          { key: '/admin/users', icon: <TeamOutlined />, label: 'Users' },
          { key: '/admin/roles', icon: <UserOutlined />, label: 'Roles' },
          { key: '/admin/audit', icon: <AuditOutlined />, label: '审计日志' },
          { key: '/admin/alerts', icon: <AlertOutlined />, label: '告警管理' },
        ]
      : []),
  ];

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'profile', label: `${user?.username} (${user?.role_name})`, disabled: true },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="dark"
        breakpoint="lg"
        collapsedWidth={64}
        style={{
          background: 'var(--mcpilot-sider-bg, #0f172a)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.15) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <h2 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
            MCPilot
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ background: 'transparent', borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 16,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'var(--mcpilot-glass-bg)',
            borderBottom: 'var(--mcpilot-glass-border)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Segmented
            size="small"
            value={mode}
            onChange={(v) => setMode(v as 'light' | 'dark' | 'system')}
            options={[
              { value: 'light', icon: <SunOutlined /> },
              { value: 'dark', icon: <MoonOutlined /> },
              { value: 'system', icon: <DesktopOutlined /> },
            ]}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button
              type="text"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Avatar
                icon={<UserOutlined />}
                size="small"
                style={{ backgroundColor: token.colorPrimary }}
              />
              <span>{user?.username}</span>
            </Button>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadius,
            boxShadow: 'var(--mcpilot-shadow)',
            minHeight: 360,
            transition: 'background-color var(--mcpilot-transition), box-shadow var(--mcpilot-transition)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
