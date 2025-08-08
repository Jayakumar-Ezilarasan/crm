import React, { useMemo, useCallback, useState } from 'react';
import { DataTable } from '../ui/DataTable';

// Optimized table row component with React.memo
const OptimizedTableRow = React.memo<{
  row: any;
  columns: any[];
  onRowClick?: (row: any) => void;
  renderCell: (value: any, column: any) => React.ReactNode;
}>(({ row, columns, onRowClick, renderCell }) => {
  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  return (
    <tr
      onClick={handleClick}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {columns.map((column) => (
        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
          {renderCell(row[column.key], column)}
        </td>
      ))}
    </tr>
  );
});

OptimizedTableRow.displayName = 'OptimizedTableRow';

// Optimized table header component
const OptimizedTableHeader = React.memo<{
  columns: any[];
  sortKey: string;
  sortAsc: boolean;
  onSort: (key: string) => void;
}>(({ columns, sortKey, sortAsc, onSort }) => {
  const handleSort = useCallback((key: string) => {
    onSort(key);
  }, [onSort]);

  return (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            onClick={() => column.sortable && handleSort(column.key)}
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
            }`}
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {column.sortable && sortKey === column.key && (
                <span className="text-gray-400">
                  {sortAsc ? '↑' : '↓'}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
});

OptimizedTableHeader.displayName = 'OptimizedTableHeader';

// Virtualized table body for large datasets
const VirtualizedTableBody = React.memo<{
  data: any[];
  columns: any[];
  onRowClick?: (row: any) => void;
  renderCell: (value: any, column: any) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
}>(({ data, columns, onRowClick, renderCell, itemHeight, containerHeight }) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, data.length);
  
  const visibleData = data.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: data.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleData.map((row, index) => (
            <OptimizedTableRow
              key={row.id || startIndex + index}
              row={row}
              columns={columns}
              onRowClick={onRowClick}
              renderCell={renderCell}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedTableBody.displayName = 'VirtualizedTableBody';

// Main optimized DataTable component
interface OptimizedDataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    label: string;
    sortable?: boolean;
  }[];
  loading?: boolean;
  error?: string | null;
  onRowClick?: (row: T) => void;
  renderCell?: (value: any, column: any) => React.ReactNode;
  enableVirtualization?: boolean;
  itemHeight?: number;
  containerHeight?: number;
}

export function OptimizedDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  onRowClick,
  renderCell,
  enableVirtualization = false,
  itemHeight = 60,
  containerHeight = 400,
}: OptimizedDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | ''>('');
  const [sortAsc, setSortAsc] = useState(true);

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortAsc ? comparison : -comparison;
    });
  }, [data, sortKey, sortAsc]);

  // Memoized sort handler
  const handleSort = useCallback((key: keyof T) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }, [sortKey, sortAsc]);

  // Memoized cell renderer
  const defaultRenderCell = useCallback((value: any, column: any) => {
    if (React.isValidElement(value)) {
      return value;
    }
    return String(value || '');
  }, []);

  const cellRenderer = renderCell || defaultRenderCell;

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading data</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <OptimizedTableHeader
          columns={columns}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSort={handleSort}
        />
        <tbody className="bg-white divide-y divide-gray-200">
          {enableVirtualization ? (
            <VirtualizedTableBody
              data={sortedData}
              columns={columns}
              onRowClick={onRowClick}
              renderCell={cellRenderer}
              itemHeight={itemHeight}
              containerHeight={containerHeight}
            />
          ) : (
            sortedData.map((row, index) => (
              <OptimizedTableRow
                key={row.id || index}
                row={row}
                columns={columns}
                onRowClick={onRowClick}
                renderCell={cellRenderer}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Export with React.memo for additional optimization
export default React.memo(OptimizedDataTable);
