import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const TABLE_PAGE_SIZE = 20;

type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const start = page * TABLE_PAGE_SIZE + 1;
  const end = Math.min((page + 1) * TABLE_PAGE_SIZE, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/80 px-4 py-3">
      <p className="text-xs text-neutral-500">
        {start}–{end} de {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <span className="min-w-[4rem] text-center text-xs font-medium text-neutral-600">
          {page + 1} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
