import React, { useState, useEffect, useCallback, memo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
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

const CodeTab: React.FC<Props> = memo(({ serviceId }) => {
  const [code, setCode] = useState('');
  const [dirty, setDirty] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);

  const { data } = useQuery({
    queryKey: ['service-code', serviceId],
    queryFn: () => getServiceCode(serviceId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data) {
      setCode(data.code || EXAMPLE_CODE);
      setDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => saveServiceCode(serviceId, code),
    onSuccess: () => { toast.success('Code saved'); setDirty(false); },
    onError: () => toast.error('Save failed'),
  });

  const validateMutation = useMutation({
    mutationFn: () => validateCode(serviceId, code),
    onSuccess: (result) => {
      setValidation(result);
      if (result.valid && result.warnings.length === 0) {
        toast.success('Code is valid');
      }
    },
  });

  const handleChange = useCallback((value: string) => {
    setCode(value);
    setDirty(true);
    setValidation(null);
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={!dirty}
        >
          <Save className="mr-1.5 h-4 w-4" />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => validateMutation.mutate()}
        >
          <CheckCircle className="mr-1.5 h-4 w-4" />
          Validate
        </Button>
        {dirty && <span className="text-sm text-warning">Unsaved changes</span>}
      </div>

      {validation && !validation.valid && (
        <Card className="mb-3 border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-2 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Validation Errors</p>
              <pre className="mt-1 text-sm text-destructive/80">{validation.errors.join('\n')}</pre>
            </div>
          </CardContent>
        </Card>
      )}
      {validation && validation.warnings.length > 0 && (
        <Card className="mb-3 border-warning/50 bg-warning/5">
          <CardContent className="flex items-start gap-2 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-warning">Warnings</p>
              <pre className="mt-1 text-sm text-warning/80">{validation.warnings.join('\n')}</pre>
            </div>
          </CardContent>
        </Card>
      )}
      {validation && validation.valid && validation.warnings.length === 0 && (
        <Card className="mb-3 border-success/50 bg-success/5">
          <CardContent className="flex items-center gap-2 p-3">
            <CheckCircle className="h-4 w-4 text-success" />
            <p className="font-medium text-success">Code is valid</p>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <CodeMirror
          value={code}
          height="600px"
          theme={vscodeDark}
          extensions={[python()]}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            bracketMatching: true,
            autocompletion: false,
            indentOnInput: true,
          }}
        />
      </div>
    </div>
  );
});
CodeTab.displayName = 'CodeTab';

export default CodeTab;
