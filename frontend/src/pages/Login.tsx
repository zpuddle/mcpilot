import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const data = await login(username, password);
      await authLogin(data.access_token, data.refresh_token);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center gap-8 p-16 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[200px] w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[50px] right-[400px] w-56 h-56 rounded-full bg-primary/5 blur-3xl" />

        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-[28px] font-bold shadow-lg shadow-primary/30">
          M
        </div>
        <h1 className="m-0 text-4xl font-extrabold tracking-tight text-foreground">
          MCPilot
        </h1>
        <p className="text-muted-foreground text-base text-center">
          MCP Service Management Platform
        </p>

        <Card className="w-[360px] mt-4 bg-background/40 backdrop-blur border-border/40">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <User className="w-12 h-12 text-primary/50" />
            <p className="text-muted-foreground text-sm text-center leading-relaxed">
              Manage, deploy and monitor<br />your MCP services with ease
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-20">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-[28px] font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 pl-10 rounded-[10px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 rounded-[10px]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-[10px] font-semibold text-[15px]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
