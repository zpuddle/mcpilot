import React, { useState } from 'react';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Switch,
  Tag,
  Space,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  listAlerts,
  resolveAlert,
} from '../api/monitoring';
import type { AlertRule, AlertHistoryItem } from '../api/monitoring';
import { listServices } from '../api/services';

const conditionTypes = [
  { value: 'cpu_above', label: 'CPU 使用率超过' },
  { value: 'memory_above', label: '内存使用率超过' },
  { value: 'restart_count', label: '重启次数超过' },
  { value: 'container_down', label: '容器宕机' },
  { value: 'health_check_fail', label: '健康检查失败' },
];

/* ========== Alert Rules Tab ========== */

const RulesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [form] = Form.useForm();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: listAlertRules,
  });

  const { data: servicesResp } = useQuery({
    queryKey: ['services-list-all'],
    queryFn: () => listServices(1, 200),
  });
  const services = servicesResp?.data ?? [];

  const createMut = useMutation({
    mutationFn: createAlertRule,
    onSuccess: () => {
      message.success('规则创建成功');
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      closeModal();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AlertRule> }) => updateAlertRule(id, data),
    onSuccess: () => {
      message.success('规则更新成功');
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      closeModal();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteAlertRule,
    onSuccess: () => {
      message.success('规则已删除');
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_enabled }: { id: number; is_enabled: boolean }) =>
      updateAlertRule(id, { is_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingRule(null);
    form.resetFields();
  };

  const openCreate = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({ notify_method: 'log', is_enabled: true });
    setModalOpen(true);
  };

  const openEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      service_id: rule.service_id,
      condition_type: rule.condition_type,
      threshold: rule.threshold,
      notify_method: rule.notify_method,
      webhook_url: rule.webhook_url,
      is_enabled: rule.is_enabled,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingRule) {
      updateMut.mutate({ id: editingRule.id, data: values });
    } else {
      createMut.mutate(values);
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '条件类型',
      dataIndex: 'condition_type',
      key: 'condition_type',
      render: (v: string) => {
        const found = conditionTypes.find((c) => c.value === v);
        return found ? found.label : v;
      },
    },
    { title: '阈值', dataIndex: 'threshold', key: 'threshold', render: (v: string | null) => v ?? '-' },
    {
      title: '通知方式',
      dataIndex: 'notify_method',
      key: 'notify_method',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (v: boolean, record: AlertRule) => (
        <Switch
          checked={v}
          size="small"
          onChange={(checked) => toggleMut.mutate({ id: record.id, is_enabled: checked })}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: AlertRule) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除此规则？" onConfirm={() => deleteMut.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const notifyMethod = Form.useWatch('notify_method', form);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建规则
        </Button>
      </div>
      <Table columns={columns} dataSource={rules} rowKey="id" loading={isLoading} />

      <Modal
        title={editingRule ? '编辑规则' : '新建规则'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={createMut.isPending || updateMut.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="例：CPU 过高告警" />
          </Form.Item>
          <Form.Item name="service_id" label="服务（可选，不选则适用所有服务）">
            <Select
              allowClear
              placeholder="全部服务"
              options={services.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
          <Form.Item
            name="condition_type"
            label="条件类型"
            rules={[{ required: true, message: '请选择条件类型' }]}
          >
            <Select options={conditionTypes} placeholder="选择条件" />
          </Form.Item>
          <Form.Item name="threshold" label="阈值">
            <Input placeholder="例：80（百分比）或 5（次数）" />
          </Form.Item>
          <Form.Item name="notify_method" label="通知方式" initialValue="log">
            <Radio.Group>
              <Radio value="log">日志</Radio>
              <Radio value="webhook">Webhook</Radio>
            </Radio.Group>
          </Form.Item>
          {notifyMethod === 'webhook' && (
            <Form.Item
              name="webhook_url"
              label="Webhook URL"
              rules={[{ required: true, message: '请输入 Webhook URL' }]}
            >
              <Input placeholder="https://..." />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
};

/* ========== Alert History Tab ========== */

const HistoryTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', page],
    queryFn: () => listAlerts({ page, size: 20 }),
  });

  const resolveMut = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      message.success('告警已标记为已解决');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    { title: '服务', dataIndex: 'service_name', key: 'service_name', render: (v: string | null) => v ?? '-' },
    {
      title: '告警类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      render: (v: string) => <Tag color="orange">{v}</Tag>,
    },
    { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (v: boolean) =>
        v ? <Tag color="green">已解决</Tag> : <Tag color="red">未解决</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: AlertHistoryItem) =>
        !record.resolved ? (
          <Button
            type="link"
            icon={<CheckOutlined />}
            onClick={() => resolveMut.mutate(record.id)}
            loading={resolveMut.isPending}
          >
            标记已解决
          </Button>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data?.data ?? []}
      rowKey="id"
      loading={isLoading}
      pagination={{
        current: page,
        total: data?.total ?? 0,
        pageSize: 20,
        onChange: setPage,
      }}
    />
  );
};

/* ========== Main Page ========== */

const AdminAlerts: React.FC = () => {
  return (
    <div>
      <h2>告警管理</h2>
      <Tabs
        defaultActiveKey="rules"
        items={[
          { key: 'rules', label: '告警规则', children: <RulesTab /> },
          { key: 'history', label: '告警历史', children: <HistoryTab /> },
        ]}
      />
    </div>
  );
};

export default AdminAlerts;
