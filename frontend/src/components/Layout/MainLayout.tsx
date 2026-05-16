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
    { key: '/templates', icon: <AppstoreOutlined />, label: 'Templates' },
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
    <Layout style={{ minHeight: '100vh', background: 'var(--mcpilot-bg-gradient)' }}>
      {/* Decorative Background Orbs */}
      <div className="mcpilot-deco-orb mcpilot-deco-orb-1" style={{ top: -100, right: 300 }} />
      <div className="mcpilot-deco-orb mcpilot-deco-orb-2" style={{ bottom: 100, left: 200 }} />
      <div className="mcpilot-deco-orb mcpilot-deco-orb-3" style={{ top: 350, right: 100 }} />

      <Sider
        theme="light"
        breakpoint="lg"
        collapsedWidth={64}
        width={260}
        className="mcpilot-sidebar"
        style={{
          background: 'var(--mcpilot-sider-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--mcpilot-sider-border)',
          boxShadow: 'var(--mcpilot-sidebar-shadow)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 20px',
            borderBottom: '1px solid var(--mcpilot-sider-border)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--mcpilot-accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            M
          </div>
          <span
            style={{
              color: 'var(--mcpilot-text-primary)',
              fontSize: 18,
              fontWeight: 700,
              fontFamily: '"Inter", sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            MCPilot
          </span>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            borderInlineEnd: 'none',
            padding: '16px 12px',
          }}
        />
        {/* Sidebar Footer - User Info */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 12px',
            borderTop: '1px solid var(--mcpilot-sider-border)',
          }}
        >
          <Dropdown menu={userMenu} placement="topRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--mcpilot-accent-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                size={32}
                style={{
                  backgroundColor: 'var(--mcpilot-accent)',
                  flexShrink: 0,
                }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--mcpilot-text-primary)',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.username}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--mcpilot-text-secondary)',
                    lineHeight: 1.2,
                  }}
                >
                  {user?.role_name}
                </div>
              </div>
            </div>
          </Dropdown>
        </div>
      </Sider>
      <Layout style={{ background: 'transparent' }}>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'var(--mcpilot-glass-bg)',
            borderBottom: '1px solid var(--mcpilot-sider-border)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 64,
            lineHeight: '64px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--mcpilot-text-primary)',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {menuItems.find((item) => location.pathname.startsWith(item.key))?.label || 'MCPilot'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  style={{ backgroundColor: 'var(--mcpilot-accent)' }}
                />
                <span style={{ color: 'var(--mcpilot-text-primary)' }}>{user?.username}</span>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: 'var(--mcpilot-glass-bg-card)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 'var(--mcpilot-border-radius)',
            border: 'var(--mcpilot-card-border)',
            boxShadow: 'var(--mcpilot-shadow)',
            minHeight: 360,
            transition: 'background-color var(--mcpilot-transition), box-shadow var(--mcpilot-transition), border-color var(--mcpilot-transition)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
