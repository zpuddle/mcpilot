import React, { useState } from 'react';
import {
  Descriptions,
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Progress,
  Statistic,
  Badge,
  Typography,
  List,
  Modal,
  Form,
  Select,
  Radio,
  Input,
  Empty,
  Popconfirm,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  startService,
  stopService,
  restartService,
  listServices,
  getServiceDependencies,
  addServiceDependency,
  removeServiceDependency,
} from '../../api/services';
import type { ServiceDependency } from '../../api/services';
import { getServiceMetrics } from '../../api/monitoring';
import StatusBadge from '../../components/StatusBadge';
import type { McpService } from '../../types';

const { Text } = Typography;

interface Props {
  service: McpService;
}

const OverviewTab: React.FC<Props> = ({ service }) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['service', service.id] });

  const startMut = useMutation({ mutationFn: () => startService(service.id), onSuccess: () => { message.success('Started'); invalidate(); } });
  const stopMut = useMutation({ mutationFn: () => stopService(service.id), onSuccess: () => { message.success('Stopped'); invalidate(); } });
  const restartMut = useMutation({ mutationFn: () => restartService(service.id), onSuccess: () => { message.success('Restarted'); invalidate(); } });

  /* ========== Metrics ========== */
  const isRunning = service.status === 'running';
  const { data: metrics } = useQuery({
    queryKey: ['service-metrics', service.id],
    queryFn: () => getServiceMetrics(service.id),
    enabled: isRunning,
    refetchInterval: 15000,
  });

  /* ========== Dependencies ========== */
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [depForm] = Form.useForm();

  const { data: dependencies = [], refetch: refetchDeps } = useQuery({
    queryKey: ['service-dependencies', service.id],
    queryFn: () => getServiceDependencies(service.id),
  });

  const { data: servicesResp } = useQuery({
    queryKey: ['services-list-all'],
    queryFn: () => listServices(1, 200),
  });
  const allServices = servicesResp?.data ?? [];

  const existingDepIds = dependencies.map((d: ServiceDependency) => d.depends_on_id);
  const availableServices = allServices.filter(
    (s) => s.id !== service.id && !existingDepIds.includes(s.id),
  );

  const addDepMutation = useMutation({
    mutationFn: (data: { depends_on_id: number; dependency_type?: string; description?: string }) =>
      addServiceDependency(service.id, data),
    onSuccess: () => {
      refetchDeps();
      message.success('依赖添加成功');
      setDepModalOpen(false);
      depForm.resetFields();
    },
  });

  const removeDepMutation = useMutation({
    mutationFn: (depId: number) => removeServiceDependency(service.id, depId),
    onSuccess: () => {
      refetchDeps();
      message.success('依赖已移除');
    },
  });

  const handleAddDep = async () => {
    const values = await depForm.validateFields();
    addDepMutation.mutate(values);
  };

  return (
    <div>
      {/* Actions */}
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<PlayCircleOutlined />} type="primary" onClick={() => startMut.mutate()} loading={startMut.isPending} disabled={service.status === 'running'}>
          Start
        </Button>
        <Button icon={<PauseCircleOutlined />} onClick={() => stopMut.mutate()} loading={stopMut.isPending} disabled={service.status === 'stopped' || service.status === 'draft'}>
          Stop
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => restartMut.mutate()} loading={restartMut.isPending} disabled={service.status !== 'running'}>
          Restart
        </Button>
      </Space>

      {/* Basic Info */}
      <Descriptions
        bordered
        column={2}
        style={{ marginBottom: 24 }}
        labelStyle={{ color: 'var(--mcpilot-text-secondary)', fontWeight: 500 }}
        contentStyle={{ color: 'var(--mcpilot-text-primary)' }}
      >
        <Descriptions.Item label="Name">{service.name}</Descriptions.Item>
        <Descriptions.Item label="Slug">{service.slug}</Descriptions.Item>
        <Descriptions.Item label="Status"><StatusBadge status={service.status} /></Descriptions.Item>
        <Descriptions.Item label="Transport"><Tag>{service.transport_type}</Tag></Descriptions.Item>
        <Descriptions.Item label="Port">{service.port || 'Not assigned'}</Descriptions.Item>
        <Descriptions.Item label="Version">v{service.current_version}</Descriptions.Item>
        <Descriptions.Item label="Image">{service.image_tag || '-'}</Descriptions.Item>
        <Descriptions.Item label="Container">{service.container_id?.slice(0, 12) || '-'}</Descriptions.Item>
        <Descriptions.Item label="Description" span={2}>{service.description || '-'}</Descriptions.Item>
        <Descriptions.Item label="Created">{service.created_at}</Descriptions.Item>
        <Descriptions.Item label="Updated">{service.updated_at}</Descriptions.Item>
      </Descriptions>

      {/* ========== Metrics Section ========== */}
      <Card
        title="运行指标"
        className="mcpilot-glass-card"
        style={{ marginTop: 24, border: '1px solid var(--mcpilot-card-border)' }}
        extra={isRunning ? <Text type="secondary">每 15 秒自动刷新</Text> : null}
      >
        {isRunning && metrics ? (
          <Row gutter={24}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={Math.round(metrics.cpu_percent * 100) / 100}
                  format={(p) => `${p}%`}
                  strokeColor={metrics.cpu_percent > 80 ? '#ff4d4f' : '#1890ff'}
                  size={100}
                />
                <div style={{ marginTop: 8 }}>
                  <Text strong>CPU 使用率</Text>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={Math.round(metrics.memory_percent * 100) / 100}
                  format={(p) => `${p}%`}
                  strokeColor={metrics.memory_percent > 80 ? '#ff4d4f' : '#52c41a'}
                  size={100}
                />
                <div style={{ marginTop: 8 }}>
                  <Text strong>内存使用率</Text>
                  <br />
                  <Text type="secondary">
                    {metrics.memory_usage_mb.toFixed(1)} / {metrics.memory_limit_mb.toFixed(1)} MB
                  </Text>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', paddingTop: 16 }}>
                <Statistic title="重启次数" value={metrics.restart_count} />
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', paddingTop: 16 }}>
                <Statistic
                  title="容器状态"
                  value={metrics.status}
                  prefix={
                    <Badge
                      status={metrics.status === 'running' ? 'success' : 'error'}
                      style={{ marginRight: 4 }}
                    />
                  }
                />
              </div>
            </Col>
          </Row>
        ) : (
          <Text type="secondary">服务未运行，无法获取指标</Text>
        )}
      </Card>

      {/* ========== Dependencies Section ========== */}
      <Card
        title="服务依赖"
        className="mcpilot-glass-card"
        style={{ marginTop: 24, border: '1px solid var(--mcpilot-card-border)' }}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              depForm.resetFields();
              depForm.setFieldsValue({ dependency_type: 'runtime' });
              setDepModalOpen(true);
            }}
          >
            添加依赖
          </Button>
        }
      >
        {dependencies.length > 0 ? (
          <List
            dataSource={dependencies}
            renderItem={(dep: ServiceDependency) => {
              const depService = allServices.find((s) => s.id === dep.depends_on_id);
              return (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="del"
                      title="确认移除此依赖？"
                      onConfirm={() => removeDepMutation.mutate(dep.id)}
                    >
                      <Button type="link" danger icon={<DeleteOutlined />} size="small">
                        移除
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{dep.depends_on_name || depService?.name || `Service #${dep.depends_on_id}`}</span>
                        <Tag color={dep.dependency_type === 'runtime' ? 'blue' : 'default'}>
                          {dep.dependency_type}
                        </Tag>
                        {depService && (
                          <Badge
                            status={depService.status === 'running' ? 'success' : 'default'}
                            text={depService.status}
                          />
                        )}
                      </Space>
                    }
                    description={dep.description || '无描述'}
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="暂无服务依赖" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Add Dependency Modal */}
      <Modal
        title="添加服务依赖"
        open={depModalOpen}
        onCancel={() => setDepModalOpen(false)}
        onOk={handleAddDep}
        confirmLoading={addDepMutation.isPending}
        destroyOnClose
      >
        <Form form={depForm} layout="vertical">
          <Form.Item
            name="depends_on_id"
            label="依赖服务"
            rules={[{ required: true, message: '请选择依赖的服务' }]}
          >
            <Select
              placeholder="选择服务"
              showSearch
              optionFilterProp="label"
              options={availableServices.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
          <Form.Item name="dependency_type" label="依赖类型" initialValue="runtime">
            <Radio.Group>
              <Radio value="runtime">运行时（runtime）</Radio>
              <Radio value="optional">可选（optional）</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="描述此依赖关系（可选）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OverviewTab;
