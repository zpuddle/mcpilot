import client from './client';
import type { TokenResponse, User } from '../types';

export async function login(username: string, password: string): Promise<TokenResponse> {
  const res = await client.post('/auth/login', { username, password });
  return res.data;
}

export async function register(username: string, email: string, password: string) {
  const res = await client.post('/auth/register', { username, email, password });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await client.get('/auth/me');
  return res.data;
}

export async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const res = await client.post('/auth/refresh', { refresh_token });
  return res.data;
}
