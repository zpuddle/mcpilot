import React, { useState, useEffect } from 'react';
import { Button, Space, message, Alert } from 'antd';
import { SaveOutlined, CheckOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getServiceCode, saveServiceCode, validateCode } from '../../api/services';

interface Props {
  serviceId: number;
}

const EXAMPLE_CODE = `# Write your MCP tool handler functions here.
# Each function should be an async def that matches a tool's handler_name.
#
# Example:
# async def get_weather(city: str) -> str:
#     """Get weather for a city."""
#     import httpx
#     async with httpx.AsyncClient() as client:
#         resp = await client.get(f"https://api.example.com/weather/{city}")
#         return resp.text

`;

const CodeTab: React.FC<Props> = ({ serviceId }) => {
  const [code, setCode] = useState('');
  const [dirty, setDirty] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);

  const { data } = useQuery({
    queryKey: ['service-code', serviceId],
    queryFn: () => getServiceCode(serviceId),
  });

  useEffect(() => {
    if (data) {
      setCode(data.code || EXAMPLE_CODE);
      setDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => saveServiceCode(serviceId, code),
    onSuccess: () => { message.success('Code saved'); setDirty(false); },
    onError: () => message.error('Save failed'),
  });

  const validateMutation = useMutation({
    mutationFn: () => validateCode(serviceId, code),
    onSuccess: (result) => {
      setValidation(result);
      if (result.valid && result.warnings.length === 0) {
        message.success('Code is valid');
      }
    },
  });

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
    setDirty(true);
    setValidation(null);
  };

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<SaveOutlined />} onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!dirty}>
          Save
        </Button>
        <Button icon={<CheckOutlined />} onClick={() => validateMutation.mutate()} loading={validateMutation.isPending}>
          Validate
        </Button>
        {dirty && <span style={{ color: '#faad14' }}>Unsaved changes</span>}
      </Space>

      {validation && !validation.valid && (
        <Alert type="error" message="Validation Errors" description={validation.errors.join('\n')} style={{ marginBottom: 12 }} showIcon />
      )}
      {validation && validation.warnings.length > 0 && (
        <Alert type="warning" message="Warnings" description={validation.warnings.join('\n')} style={{ marginBottom: 12 }} showIcon />
      )}
      {validation && validation.valid && validation.warnings.length === 0 && (
        <Alert type="success" message="Code is valid" style={{ marginBottom: 12 }} showIcon />
      )}

      <div style={{ border: '1px solid #d9d9d9', borderRadius: 4 }}>
        <Editor
          height="600px"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>
    </div>
  );
};

export default CodeTab;
