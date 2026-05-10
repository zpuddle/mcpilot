import React from 'react';
import { Form, Input, Select, Button, Card, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateService } from '../../api/services';
import type { McpService } from '../../types';

interface Props {
  service: McpService;
}

const ConfigTab: React.FC<Props> = ({ service }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => updateService(service.id, values),
    onSuccess: () => {
      message.success('Configuration updated');
      queryClient.invalidateQueries({ queryKey: ['service', service.id] });
    },
    onError: () => message.error('Update failed'),
  });

  const handleSubmit = (values: Record<string, unknown>) => {
    // Parse env_vars from text to object
    const envText = values.env_vars_text as string || '';
    const envVars: Record<string, string> = {};
    envText.split('\n').forEach((line: string) => {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key) envVars[key] = val;
      }
    });

    mutation.mutate({
      name: values.name,
      description: values.description,
      transport_type: values.transport_type,
      env_vars: envVars,
      extra_dependencies: values.extra_dependencies,
    });
  };

  const envVarsText = Object.entries(service.env_vars || {})
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  return (
    <Card title="Service Configuration">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: service.name,
          description: service.description,
          transport_type: service.transport_type,
          env_vars_text: envVarsText,
          extra_dependencies: service.extra_dependencies,
        }}
        onFinish={handleSubmit}
      >
        <Form.Item name="name" label="Service Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="transport_type" label="Transport Type">
          <Select options={[
            { value: 'sse', label: 'SSE' },
            { value: 'streamable_http', label: 'Streamable HTTP' },
            { value: 'both', label: 'Both' },
          ]} />
        </Form.Item>
        <Form.Item name="env_vars_text" label="Environment Variables" help="One per line: KEY=VALUE">
          <Input.TextArea rows={6} placeholder="API_KEY=your-key-here&#10;DATABASE_URL=postgres://..." style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name="extra_dependencies" label="Extra Python Dependencies" help="One per line, pip format">
          <Input.TextArea rows={4} placeholder="httpx>=0.27.0&#10;beautifulsoup4&#10;pandas" style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Save Configuration
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ConfigTab;
