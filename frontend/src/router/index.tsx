import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const ServiceList = lazy(() => import('../pages/ServiceList'));
const ServiceDetail = lazy(() => import('../pages/ServiceDetail'));
const AdminUsers = lazy(() => import('../pages/AdminUsers'));
const AdminRoles = lazy(() => import('../pages/AdminRoles'));
const AdminAudit = lazy(() => import('../pages/AdminAudit'));
const AdminAlerts = lazy(() => import('../pages/AdminAlerts'));
const Templates = lazy(() => import('../pages/Templates'));

const LazyPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  }>
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
