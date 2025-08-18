import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { useIsMobile, useIsTablet } from '../hooks/useMedia';

interface Column {
  key: string;
  header: string;
  accessor: (item: any) => React.ReactNode;
  sortable?: boolean;
  hidden?: boolean;
  priority?: 'high' | 'medium' | 'low'; // For mobile column hiding
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (item: any) => void;
  emptyState?: React.ReactNode;
  className?: string;
  persistKey?: string; // For localStorage column preferences
}

export function ResponsiveTable({
  data,
  columns,
  onRowClick,
  emptyState,
  className = '',
  persistKey = 'table-columns'
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const tableRef = useRef<HTMLDivElement>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Load column visibility from localStorage
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    
    try {
      const stored = localStorage.getItem(`${persistKey}-hidden`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save column visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `${persistKey}-hidden`,
        JSON.stringify(Array.from(hiddenColumns))
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [hiddenColumns, persistKey]);

  // Auto-hide low priority columns on mobile
  const getVisibleColumns = () => {
    let visibleColumns = columns.filter(col => !hiddenColumns.has(col.key));
    
    if (isMobile) {
      // On mobile, auto-hide low priority columns unless explicitly shown
      visibleColumns = visibleColumns.filter(col => 
        col.priority === 'high' || 
        col.priority === 'medium' ||
        !col.priority // Default to showing if no priority set
      );
      
      // Ensure we always show at least 2 columns on mobile
      if (visibleColumns.length < 2) {
        visibleColumns = columns.slice(0, 2);
      }
    }
    
    return visibleColumns;
  };

  const visibleColumns = getVisibleColumns();

  // Sort data
  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const column = columns.find(col => col.key === sortConfig.key);
        if (!column) return 0;
        
        const aValue = column.accessor(a);
        const bValue = column.accessor(b);
        
        if (aValue == null || bValue == null) return 0;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (current?.key === columnKey) {
        return current.direction === 'asc'
          ? { key: columnKey, direction: 'desc' }
          : null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  // Scroll shadow detection
  const [showStartShadow, setShowStartShadow] = useState(false);
  const [showEndShadow, setShowEndShadow] = useState(false);

  useEffect(() => {
    const container = tableRef.current;
    if (!container) return;

    const updateShadows = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowStartShadow(scrollLeft > 0);
      setShowEndShadow(scrollLeft < scrollWidth - clientWidth - 1);
    };

    updateShadows();
    container.addEventListener('scroll', updateShadows);
    
    const resizeObserver = new ResizeObserver(updateShadows);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateShadows);
      resizeObserver.disconnect();
    };
  }, []);

  if (data.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Mobile column selector */}
      {(isMobile || isTablet) && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            Showing {visibleColumns.length} of {columns.length} columns
          </div>
          <Select 
            value={showColumnSelector ? 'open' : 'closed'} 
            onValueChange={(value) => setShowColumnSelector(value === 'open')}
          >
            <SelectTrigger className="w-auto">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Columns
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {columns.map(column => (
                <div key={column.key} className="flex items-center space-x-2 px-2 py-1">
                  <Checkbox
                    checked={!hiddenColumns.has(column.key)}
                    onCheckedChange={() => toggleColumnVisibility(column.key)}
                  />
                  <span className="text-sm">{column.header}</span>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table container with scroll shadows */}
      <div
        ref={tableRef}
        className={`
          relative overflow-x-auto
          ${showStartShadow ? 'shadow-scroll-start' : ''}
          ${showEndShadow ? 'shadow-scroll-end' : ''}
        `}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-200">
              {visibleColumns.map(column => (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer hover:bg-neutral-50' : ''}
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                    ${isMobile ? 'px-2 py-2' : 'px-4 py-3'}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="text-neutral-400">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(isMobile || isTablet) && (
                <th className="w-12 px-2 py-2">
                  <MoreHorizontal className="h-4 w-4 text-neutral-400" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr
                key={index}
                className={`
                  border-b border-neutral-100 hover:bg-neutral-50
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(item)}
              >
                {visibleColumns.map(column => (
                  <td
                    key={column.key}
                    className={`
                      px-4 py-3 text-sm text-neutral-900
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                      ${isMobile ? 'px-2 py-2' : 'px-4 py-3'}
                    `}
                  >
                    {column.accessor(item)}
                  </td>
                ))}
                {(isMobile || isTablet) && (
                  <td className="w-12 px-2 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="touch-target"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle row actions
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom styles for scroll shadows */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .shadow-scroll-start::before {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            width: 20px;
            background: linear-gradient(90deg, rgba(0,0,0,0.1) 0%, transparent 100%);
            pointer-events: none;
            z-index: 1;
          }
          
          .shadow-scroll-end::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            width: 20px;
            background: linear-gradient(270deg, rgba(0,0,0,0.1) 0%, transparent 100%);
            pointer-events: none;
            z-index: 1;
          }
        `
      }} />
    </div>
  );
}