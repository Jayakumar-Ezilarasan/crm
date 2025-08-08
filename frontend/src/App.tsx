import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Leads from './pages/Leads';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Layout from './components/layout/Layout';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="leads" element={<Leads />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="reports" element={
            <RoleBasedRoute allowedRoles={['manager']}>
              <Reports />
            </RoleBasedRoute>
          } />
          <Route path="admin" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <Admin />
            </RoleBasedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App; 