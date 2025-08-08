import React from 'react';

export interface NavigationProps {
  role: 'admin' | 'manager' | 'user';
  onNavigate: (path: string) => void;
  currentPath: string;
}

const menu = {
  user: [
    { label: 'Dashboard', path: '/' },
    { label: 'Customers', path: '/customers' },
    { label: 'Leads', path: '/leads' },
    { label: 'Tasks', path: '/tasks' },
  ],
  manager: [
    { label: 'Reports', path: '/reports' },
  ],
  admin: [
    { label: 'Admin Panel', path: '/admin' },
  ],
};

const Navigation: React.FC<NavigationProps> = ({ role, onNavigate, currentPath }) => {
  const items = [
    ...menu.user,
    ...(role === 'admin' ? menu.admin : []),
  ];
  return (
    <nav aria-label="Sidebar" className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 font-bold text-lg">CRM</div>
      <ul className="flex-1">
        {items.map((item) => (
          <li key={item.path}>
            <button
              className={`w-full text-left px-4 py-2 hover:bg-blue-700 focus:bg-blue-700 focus:outline-none ${currentPath === item.path ? 'bg-blue-800' : ''}`}
              aria-current={currentPath === item.path ? 'page' : undefined}
              onClick={() => onNavigate(item.path)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation; 