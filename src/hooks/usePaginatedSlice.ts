import { useEffect, useMemo, useState } from 'react';
import { TABLE_PAGE_SIZE } from '@/components/admin/TablePagination';

export function usePaginatedSlice<T>(items: T[], resetKey = '', pageSize = TABLE_PAGE_SIZE) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const visible = useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { visible, page, setPage, totalPages, total: items.length };
}
