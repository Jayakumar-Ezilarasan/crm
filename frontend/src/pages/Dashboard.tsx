import React, { useState, useEffect } from 'react';
import Dashboard from '../components/ui/Dashboard';
import { DashboardService, DashboardStats } from '../services/dashboardService';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await DashboardService.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <Dashboard 
        stats={stats}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default DashboardPage; 