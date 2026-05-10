import client from './client';
import type { User, Role, ApiResponse } from '../types';

export async function listUsers(): Promise<User[]> {
  const res = await client.get('/users');
  return res.data;
}

export async function updateUserRole(userId: number, roleId: number) {
  const res = await client.put<ApiResponse>(`/users/${userId}/role`, { role_id: roleId });
  return res.data;
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  const res = await client.put<ApiResponse>(`/users/${userId}/status`, { is_active: isActive });
  return res.data;
}

export async function listRoles(): Promise<Role[]> {
  const res = await client.get('/roles');
  return res.data;
}

export async function createRole(name: string, permissions: string[]) {
  const res = await client.post<Role>('/roles', { name, permissions });
  return res.data;
}

export async function updateRole(roleId: number, name: string, permissions: string[]) {
  const res = await client.put<Role>(`/roles/${roleId}`, { name, permissions });
  return res.data;
}
