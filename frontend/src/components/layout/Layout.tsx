import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../ui/Navigation';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Debug: Log user data to see what's being loaded
  console.log('Current user data:', user);

  // Ensure role is one of the allowed values
  const getValidRole = (role?: string): 'admin' | 'manager' | 'user' => {
    if (role === 'admin' || role === 'manager' || role === 'user') {
      return role;
    }
    return 'user';
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Navigation 
        role={getValidRole(user?.role)}
        onNavigate={handleNavigate}
        currentPath={location.pathname}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">CRM System</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{user?.name || user?.email || 'User'}</div>
                  <div className="text-xs text-gray-400 capitalize">{getValidRole(user?.role)}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout; 