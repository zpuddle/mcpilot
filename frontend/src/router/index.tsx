import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Skeleton } from 'antd';
import MainLayout from '../components/Layout/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// 懒加载页面
const Login = React.lazy(() => import('../pages/Login'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const ServiceList = React.lazy(() => import('../pages/ServiceList'));
const ServiceDetail = React.lazy(() => import('../pages/ServiceDetail'));
const AdminUsers = React.lazy(() => import('../pages/AdminUsers'));
const AdminRoles = React.lazy(() => import('../pages/AdminRoles'));
const AdminAudit = React.lazy(() => import('../pages/AdminAudit'));
const AdminAlerts = React.lazy(() => import('../pages/AdminAlerts'));
const Templates = React.lazy(() => import('../pages/Templates'));

// 统一骨架屏包裹
const LazyPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} style={{ padding: 24 }} />}>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Suspense fallback={null}><Login /></Suspense>,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <LazyPage><Dashboard /></LazyPage> },
      { path: 'services', element: <LazyPage><ServiceList /></LazyPage> },
      { path: 'services/:id/:tab?', element: <LazyPage><ServiceDetail /></LazyPage> },
      { path: 'admin/users', element: <LazyPage><AdminUsers /></LazyPage> },
      { path: 'admin/roles', element: <LazyPage><AdminRoles /></LazyPage> },
      { path: 'admin/audit', element: <LazyPage><AdminAudit /></LazyPage> },
      { path: 'admin/alerts', element: <LazyPage><AdminAlerts /></LazyPage> },
      { path: 'templates', element: <LazyPage><Templates /></LazyPage> },
    ],
  },
]);

export default router;
