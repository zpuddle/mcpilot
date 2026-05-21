import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { ServiceList } from '@/pages/ServiceList'
import { ServiceDetail } from '@/pages/ServiceDetail'
import { ServiceCreate } from '@/pages/ServiceCreate'
import { ServiceEdit } from '@/pages/ServiceEdit'
import { ServiceTools } from '@/pages/ServiceTools'
import { ServiceResources } from '@/pages/ServiceResources'
import { ServiceVersions } from '@/pages/ServiceVersions'
import { Templates } from '@/pages/Templates'
import { AdminUsers } from '@/pages/AdminUsers'
import { AdminAlerts } from '@/pages/AdminAlerts'
import { AdminDocker } from '@/pages/AdminDocker'
import { AdminAudit } from '@/pages/AdminAudit'

// Simple auth check
const isAuthenticated = () => {
  return localStorage.getItem('access_token') !== null
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'services',
        element: <ServiceList />,
      },
      {
        path: 'services/new',
        element: <ServiceCreate />,
      },
      {
        path: 'services/:id',
        element: <ServiceDetail />,
      },
      {
        path: 'services/:id/edit',
        element: <ServiceEdit />,
      },
      {
        path: 'services/:id/tools',
        element: <ServiceTools />,
      },
      {
        path: 'services/:id/resources',
        element: <ServiceResources />,
      },
      {
        path: 'services/:id/versions',
        element: <ServiceVersions />,
      },
      {
        path: 'templates',
        element: <Templates />,
      },
      {
        path: 'admin/users',
        element: <AdminUsers />,
      },
      {
        path: 'admin/audit',
        element: <AdminAudit />,
      },
      {
        path: 'admin/alerts',
        element: <AdminAlerts />,
      },
      {
        path: 'admin/docker',
        element: <AdminDocker />,
      },
    ],
  },
])
