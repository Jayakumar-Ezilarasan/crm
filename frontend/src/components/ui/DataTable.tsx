import React, { useState } from 'react';
import Pagination from './Pagination';

export interface DataTableProps<T> {
  columns: { key: keyof T; label: string; sortable?: boolean }[];
  data: T[];
  loading?: boolean;
  error?: string;
  onRowClick?: (row: T) => void;
  itemsPerPage?: number;
}

export function DataTable<T extends Record<string, any>>({ 
  columns, 
  data, 
  loading, 
  error, 
  onRowClick,
  itemsPerPage = 8 
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = data.filter(row =>
    columns.some(col => {
      const value = row[col.key];
      return React.isValidElement(value) ? false : String(value).toLowerCase().includes(filter.toLowerCase());
    })
  );

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        
        // Skip sorting for React elements
        if (React.isValidElement(aVal) || React.isValidElement(bVal)) return 0;
        
        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        return sortAsc
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      })
    : filtered;

  // Pagination logic
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sorted.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) return <div role="status" aria-busy="true" className="p-4">Loading...</div>;
  if (error) return <div role="alert" className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Filter..."
        className="input input-bordered w-full max-w-md"
        value={filter}
        aria-label="Filter table"
        onChange={e => setFilter(e.target.value)}
      />
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow" aria-label="Data table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className="px-4 py-2 text-left cursor-pointer select-none bg-gray-50"
                  onClick={() => {
                    if (!col.sortable) return;
                    if (sortKey === col.key) setSortAsc(a => !a);
                    else {
                      setSortKey(col.key);
                      setSortAsc(true);
                    }
                  }}
                  aria-sort={sortKey === col.key ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  scope="col"
                >
                  {col.label}
                  {col.sortable && (
                    <span className="ml-1">{sortKey === col.key ? (sortAsc ? '▲' : '▼') : ''}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-blue-50 cursor-pointer border-b"
                tabIndex={0}
                aria-label={`Row ${idx + 1}`}
                onClick={() => onRowClick?.(row)}
                onKeyDown={e => e.key === 'Enter' && onRowClick?.(row)}
              >
                {columns.map(col => {
                  const value = row[col.key];
                  return (
                    <td key={String(col.key)} className="px-4 py-3">
                      {React.isValidElement(value) ? value : String(value || '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {sorted.length === 0 && (
          <div className="p-4 text-gray-500 text-center">No data found.</div>
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          className="mt-4"
        />
      )}
    </div>
  );
} 