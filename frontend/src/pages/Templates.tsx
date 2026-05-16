import React, { useState } from 'react';
import { Card, Row, Col, Button, Modal, Input, message, Segmented, Typography, Space } from 'antd';
import { ApiOutlined, DatabaseOutlined, RobotOutlined, ToolOutlined, GlobalOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listTemplates, createFromTemplate } from '../api/templates';
import type { ServiceTemplate } from '../api/templates';

const { Paragraph } = Typography;

const categoryIcons: Record<string, React.ReactNode> = {
  api: <ApiOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
  database: <DatabaseOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
  ai: <RobotOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
  tool: <ToolOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
};

const categoryOptions = [
  { value: '', label: '全部' },
  { value: 'api', label: 'API' },
  { value: 'database', label: '数据库' },
  { value: 'ai', label: 'AI' },
  { value: 'tool', label: '工具' },
];

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);
  const [serviceName, setServiceName] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', category],
    queryFn: () => listTemplates(category || undefined),
  });

  const createMutation = useMutation({
    mutationFn: ({ templateId, name }: { templateId: number; name: string }) =>
      createFromTemplate(templateId, name),
    onSuccess: (data) => {
      message.success('服务创建成功');
      setModalOpen(false);
      setServiceName('');
      setSelectedTemplate(null);
      navigate(`/services/${data.id}/overview`);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || '创建失败');
    },
  });

  const handleUseTemplate = (template: ServiceTemplate) => {
    setSelectedTemplate(template);
    setServiceName('');
    setModalOpen(true);
  };

  const handleConfirmCreate = () => {
    if (!serviceName.trim()) {
      message.warning('请输入服务名称');
      return;
    }
    if (selectedTemplate) {
      createMutation.mutate({ templateId: selectedTemplate.id, name: serviceName.trim() });
    }
  };

  const getIcon = (template: ServiceTemplate) => {
    return categoryIcons[template.category] || <GlobalOutlined style={{ fontSize: 32, color: '#666' }} />;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>服务模板</Typography.Title>
        <Segmented
          options={categoryOptions}
          value={category}
          onChange={(v) => setCategory(v as string)}
        />
      </div>

      <Row gutter={[16, 16]} style={{ opacity: isLoading ? 0.6 : 1 }}>
        {templates.map((template) => (
          <Col span={8} key={template.id}>
            <Card
              hoverable
              className="mcpilot-card-hover"
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Space direction="vertical" style={{ width: '100%', flex: 1 }}>
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  {getIcon(template)}
                </div>
                <Typography.Title level={5} style={{ textAlign: 'center', margin: 0 }}>
                  {template.name}
                </Typography.Title>
                <Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ textAlign: 'center', marginBottom: 0 }}
                >
                  {template.description}
                </Paragraph>
              </Space>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  已使用 {template.usage_count} 次
                </Typography.Text>
                <Button type="primary" size="small" onClick={() => handleUseTemplate(template)}>
                  使用此模板
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {!isLoading && templates.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--mcpilot-text-secondary)' }}>
          暂无模板
        </div>
      )}

      <Modal
        title={`使用模板: ${selectedTemplate?.name || ''}`}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setSelectedTemplate(null); }}
        onOk={handleConfirmCreate}
        confirmLoading={createMutation.isPending}
        okText="创建"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">
            {selectedTemplate?.description}
          </Typography.Text>
        </div>
        <Input
          placeholder="请输入服务名称（如 my-weather-api）"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          onPressEnter={handleConfirmCreate}
        />
      </Modal>
    </div>
  );
};

export default Templates;
