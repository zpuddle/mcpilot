import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, theme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);
  const { token } = theme.useToken();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const data = await login(values.username, values.password);
      await authLogin(data.access_token, data.refresh_token);
      message.success('Login successful');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--mcpilot-bg-gradient)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 科技感背景网格 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${token.colorPrimary}15 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* 登录卡片 */}
      <div
        style={{
          position: 'relative',
          width: 420,
          padding: '48px 40px',
          background: 'var(--mcpilot-glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: 'var(--mcpilot-glass-border)',
          borderRadius: 16,
          boxShadow: 'var(--mcpilot-shadow)',
          transition: 'background var(--mcpilot-transition), border-color var(--mcpilot-transition), box-shadow var(--mcpilot-transition)',
        }}
      >
        {/* Logo 区域 */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title
            level={2}
            style={{
              margin: 0,
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimary}cc)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            MCPilot
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            MCP Service Management Platform
          </Text>
        </div>

        {/* 表单 */}
        <Form name="login" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: 'Please enter username' }]}>
            <Input
              prefix={<UserOutlined style={{ color: token.colorTextPlaceholder }} />}
              placeholder="Username"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please enter password' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: token.colorTextPlaceholder }} />}
              placeholder="Password"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 44,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimary}dd)`,
                border: 'none',
                boxShadow: `0 4px 12px ${token.colorPrimary}33`,
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
