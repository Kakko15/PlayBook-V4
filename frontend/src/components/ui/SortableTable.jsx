import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * SortableTable Component
 *
 * @param {Object} props
 * @param {Array} props.data - Array of data objects to display
 * @param {Array} props.columns - Column configuration array
 *   - key: string - Property key in data object
 *   - header: string - Display header text
 *   - sortable: boolean - Enable sorting for this column
 *   - filterable: boolean - Enable filtering for this column
 *   - filterType: 'text' | 'select' - Type of filter
 *   - filterOptions: Array - Options for select filter
 *   - renderCell: function - Custom cell renderer (row, value) => ReactNode
 *   - className: string - Additional classes for the column
 * @param {string} props.defaultSortKey - Default column to sort by
 * @param {'asc' | 'desc'} props.defaultSortOrder - Default sort direction
 * @param {string} props.emptyMessage - Message to show when no data
 * @param {string} props.className - Additional table classes
 */
const SortableTable = ({
  data = [],
  columns = [],
  defaultSortKey = null,
  defaultSortOrder = 'asc',
  emptyMessage = 'No data available',
  className = '',
}) => {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [filters, setFilters] = useState({});

  // Handle column sort
  const handleSort = (columnKey) => {
    if (sortKey === columnKey) {
      // Toggle sort order or clear sort
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(columnKey);
      setSortOrder('asc');
    }
  };

  // Handle filter change
  const handleFilterChange = (columnKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };

  // Apply filters and sorting
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.keys(filters).forEach((key) => {
      const filterValue = filters[key];
      if (filterValue) {
        result = result.filter((row) => {
          const cellValue = row[key];
          if (cellValue == null) return false;

          // Handle nested objects (e.g., row.team.name)
          const column = columns.find((col) => col.key === key);
          let actualValue = cellValue;

          if (column?.filterKey) {
            const keys = column.filterKey.split('.');
            actualValue = keys.reduce((obj, k) => obj?.[k], row);
          }

          return String(actualValue)
            .toLowerCase()
            .includes(String(filterValue).toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortKey) {
      result.sort((a, b) => {
        const column = columns.find((col) => col.key === sortKey);
        let aValue = a[sortKey];
        let bValue = b[sortKey];

        // Handle nested objects for sorting
        if (column?.sortKey) {
          const keys = column.sortKey.split('.');
          aValue = keys.reduce((obj, k) => obj?.[k], a);
          bValue = keys.reduce((obj, k) => obj?.[k], b);
        }

        // Handle null/undefined values
        if (aValue == null) return sortOrder === 'asc' ? 1 : -1;
        if (bValue == null) return sortOrder === 'asc' ? -1 : 1;

        // Number comparison
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // String comparison
        const comparison = String(aValue).localeCompare(String(bValue));
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, sortKey, sortOrder, columns]);

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      {columns.some((col) => col.filterable) && (
        <div className='flex flex-wrap items-center gap-4'>
          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={col.key} className='min-w-[200px] flex-1'>
                <Input
                  placeholder={`Filter by ${col.header}...`}
                  value={filters[col.key] || ''}
                  onChange={(e) => handleFilterChange(col.key, e.target.value)}
                  className='h-9'
                />
              </div>
            ))}
          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={clearFilters}
              className='h-9'
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className='overflow-x-auto rounded-lg border border-border'>
        <table className='w-full'>
          <thead className='bg-surface-variant'>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-on-surface-variant',
                    col.sortable &&
                      'cursor-pointer select-none hover:bg-muted/50',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className='flex items-center gap-2'>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className='text-muted-foreground'>
                        {sortKey === col.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className='h-4 w-4' />
                          ) : (
                            <ChevronDown className='h-4 w-4' />
                          )
                        ) : (
                          <ChevronsUpDown className='h-4 w-4 opacity-30' />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className='px-4 py-8 text-center text-muted-foreground'
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className='border-b border-border last:border-b-0 hover:bg-muted/50'
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3', col.cellClassName)}
                    >
                      {col.renderCell
                        ? col.renderCell(row, row[col.key], rowIndex)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      {processedData.length > 0 && (
        <div className='text-sm text-muted-foreground'>
          Showing {processedData.length} of {data.length} results
        </div>
      )}
    </div>
  );
};

export default SortableTable;
