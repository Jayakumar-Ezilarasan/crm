import React from 'react';
import { Customer } from '../../types/models';
import { DataTable } from './DataTable';

export interface CustomerListProps {
  customers?: Customer[];
  loading?: boolean;
  error?: string;
  onSelect?: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, loading, error, onSelect }) => {
  const columns = [
    { key: 'name' as keyof Customer, label: 'Name', sortable: true },
    { key: 'email' as keyof Customer, label: 'Email', sortable: true },
    { key: 'phone' as keyof Customer, label: 'Phone', sortable: true },
    { key: 'company' as keyof Customer, label: 'Company', sortable: true },
  ];

  const handleRowClick = (customer: Customer) => {
    onSelect?.(customer);
  };

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={customers || []}
        loading={loading}
        error={error}
        onRowClick={handleRowClick}
        itemsPerPage={8}
      />
    </div>
  );
}; 