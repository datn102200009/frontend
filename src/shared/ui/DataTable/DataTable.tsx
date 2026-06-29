import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Search, PackageOpen } from 'lucide-react';
import styles from './DataTable.module.css';

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchPlaceholder?: string;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onSearch?: (value: string) => void;
  initialSearch?: string;
  filterSlot?: React.ReactNode;
  showSearch?: boolean;
  pageCount?: number;        // Thêm cho server-side pagination
  pageIndex?: number;        // Thêm cho server-side pagination (0-based)
  onPageChange?: (pageIndex: number) => void; // Thêm cho server-side pagination
  totalCount?: number;       // Thêm cho server-side pagination
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = 'Tìm kiếm...',
  pageSize = 10,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  emptyDescription = 'Chưa có bản ghi nào được tạo.',
  onSearch,
  initialSearch = '',
  filterSlot,
  showSearch = true,
  pageCount: pageCountProp,
  pageIndex: pageIndexProp,
  onPageChange,
  totalCount,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setGlobalFilter(initialSearch);
    }
  }, [initialSearch]);

  const isServerSide = onPageChange !== undefined;

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    pageCount: isServerSide ? pageCountProp : undefined,
    manualPagination: isServerSide,
  });

  const pageIndex = isServerSide ? (pageIndexProp ?? 0) : table.getState().pagination.pageIndex;
  const pageCount = isServerSide ? (pageCountProp ?? 1) : table.getPageCount();

  return (
    <div className={styles.wrapper}>
      {/* Search Bar */}
      {showSearch && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                onSearch?.(e.target.value);
              }}
              aria-label={searchPlaceholder}
            />
          </div>
          {filterSlot && <div style={{ marginLeft: '12px', display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>{filterSlot}</div>}
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={styles.th}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : 'none'
                    }
                  >
                    <span className={styles.thContent}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className={styles.sortIcon}>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp size={14} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <td key={`sk-${i}-${j}`} className={styles.td}>
                      <div className={styles.skeleton} />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  <div className={styles.emptyState}>
                    <PackageOpen size={40} strokeWidth={1.2} />
                    <p className={styles.emptyTitle}>{emptyMessage}</p>
                    <p className={styles.emptyDesc}>{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={styles.tr}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={styles.td}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Trang {pageIndex + 1} / {pageCount} {totalCount !== undefined && `(Tổng: ${totalCount})`}
          </span>
          <div className={styles.pageButtons}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => isServerSide ? onPageChange!(0) : table.setPageIndex(0)}
              disabled={isServerSide ? pageIndex === 0 : !table.getCanPreviousPage()}
              aria-label="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => isServerSide ? onPageChange!(pageIndex - 1) : table.previousPage()}
              disabled={isServerSide ? pageIndex === 0 : !table.getCanPreviousPage()}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => isServerSide ? onPageChange!(pageIndex + 1) : table.nextPage()}
              disabled={isServerSide ? pageIndex >= pageCount - 1 : !table.getCanNextPage()}
              aria-label="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => isServerSide ? onPageChange!(pageCount - 1) : table.setPageIndex(pageCount - 1)}
              disabled={isServerSide ? pageIndex >= pageCount - 1 : !table.getCanNextPage()}
              aria-label="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
