import { useEffect, useState, useCallback } from 'react';
import { Customer } from '../types/models';
import { CustomerService } from '../services/customerService';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await CustomerService.list(force);
      setCustomers(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Optimistic update example
  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    const optimistic = [...customers, { ...customer, id: Date.now() } as Customer];
    setCustomers(optimistic);
    try {
      const created = await CustomerService.create(customer);
      setCustomers([...customers, created]);
    } catch (e: any) {
      setError(e.message || 'Failed to add customer');
      fetchCustomers(true);
    }
  };

  return { customers, loading, error, refetch: fetchCustomers, addCustomer };
} 