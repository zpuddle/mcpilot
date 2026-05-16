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
        minHeight: '100vh',
        background: '#F0F9FF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Orbs */}
      <div className="mcpilot-deco-orb mcpilot-deco-orb-1" style={{ top: -80, right: 200 }} />
      <div className="mcpilot-deco-orb mcpilot-deco-orb-2" style={{ bottom: 50, right: 400 }} />
      <div className="mcpilot-deco-orb mcpilot-deco-orb-3" style={{ top: 350, left: 500 }} />

      {/* Left Panel - Brand */}
      <div
        style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          padding: 60,
          background: 'linear-gradient(180deg, #0EA5E9, #06B6D4, #0284C7)',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          M
        </div>
        <Title
          level={1}
          style={{
            margin: 0,
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: '-0.03em',
            textAlign: 'center',
          }}
        >
          MCPilot
        </Title>
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.80)',
            fontSize: 16,
            textAlign: 'center',
          }}
        >
          MCP Service Management Platform
        </Text>
        <div
          style={{
            width: 360,
            height: 200,
            borderRadius: 24,
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
          }}
        >
          <UserOutlined style={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.50)' }} />
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.67)',
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Manage, deploy and monitor<br />your MCP services with ease
          </Text>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div
        style={{
          width: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: 80,
          boxShadow: '-4px 0 24px rgba(14, 165, 233, 0.06)',
          position: 'relative',
        }}
      >
        <div style={{ width: 400 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <Title
              level={2}
              style={{
                margin: 0,
                color: '#0F172A',
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: '-0.02em',
              }}
            >
              Welcome back
            </Title>
            <Text style={{ color: '#64748B', fontSize: 14, marginTop: 8, display: 'block' }}>
              Sign in to your account
            </Text>
          </div>

          {/* Form */}
          <Form name="login" onFinish={onFinish} size="large" autoComplete="off" layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please enter username' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Username"
                style={{
                  borderRadius: 10,
                  height: 48,
                  borderColor: '#E2E8F0',
                }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Password"
                style={{
                  borderRadius: 10,
                  height: 48,
                  borderColor: '#E2E8F0',
                }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 48,
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 15,
                  background: 'linear-gradient(180deg, #0EA5E9, #0284C7)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.20)',
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
