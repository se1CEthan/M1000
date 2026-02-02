import { ReactNode, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

interface DataTableProps<T> {
  title: string;
  description?: string;
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  filters?: {
    key: keyof T;
    label: string;
    options: FilterOption[];
  }[];
  actions?: ReactNode;
  emptyMessage?: string;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  data,
  columns,
  loading = false,
  searchPlaceholder = "Search...",
  searchKey,
  filters = [],
  actions,
  emptyMessage = "No data found",
  pageSize = 10
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filter data
  const filteredData = data.filter(item => {
    // Search filter
    if (searchTerm && searchKey) {
      const searchValue = String(item[searchKey]).toLowerCase();
      if (!searchValue.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    // Additional filters
    for (const [key, value] of Object.entries(filterValues)) {
      if (value && value !== 'all' && String(item[key]) !== value) {
        return false;
      }
    }

    return true;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: keyof T | string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions}
        </div>

        {/* Filters */}
        {(searchKey || filters.length > 0) && (
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {searchKey && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            {filters.map((filter) => (
              <Select
                key={String(filter.key)}
                value={filterValues[String(filter.key)] || 'all'}
                onValueChange={(value) => handleFilterChange(String(filter.key), value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {paginatedData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={String(column.key)}
                        className={`px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                          column.sortable ? 'cursor-pointer hover:bg-muted' : ''
                        } ${column.className || ''}`}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {column.sortable && sortConfig?.key === column.key && (
                            <span className="text-primary">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                        >
                          {column.render ? column.render(item) : String(item[column.key] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {paginatedData.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-2">
                    {columns.map((column) => (
                      <div key={String(column.key)} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          {column.label}:
                        </span>
                        <div className="text-sm">
                          {column.render ? column.render(item) : String(item[column.key] || '')}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}