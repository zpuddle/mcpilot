import client from './client';

export interface ServiceTemplate {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  code_template: string;
  tools_template: any[];
  resources_template: any[];
  env_vars_template: Record<string, string>;
  dependencies: string;
  is_builtin: boolean;
  usage_count: number;
  created_at: string;
}

export async function listTemplates(category?: string): Promise<ServiceTemplate[]> {
  const params = category ? { category } : {};
  const response = await client.get('/templates', { params });
  return response.data;
}

export async function getTemplate(id: number): Promise<ServiceTemplate> {
  const response = await client.get(`/templates/${id}`);
  return response.data;
}

export async function createFromTemplate(templateId: number, name: string): Promise<any> {
  const response = await client.post(`/templates/${templateId}/create-service`, { name });
  return response.data;
}
