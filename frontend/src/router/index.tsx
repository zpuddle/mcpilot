import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ServiceList from '../pages/ServiceList';
import ServiceDetail from '../pages/ServiceDetail';
import AdminUsers from '../pages/AdminUsers';
import AdminRoles from '../pages/AdminRoles';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
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
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'services', element: <ServiceList /> },
      { path: 'services/:id/:tab?', element: <ServiceDetail /> },
      { path: 'admin/users', element: <AdminUsers /> },
      { path: 'admin/roles', element: <AdminRoles /> },
    ],
  },
]);

export default router;
