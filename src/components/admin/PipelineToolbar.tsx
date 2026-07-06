import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  type LeadFilters,
  type LeadSort,
} from '@/hooks/useLeadFilters';
import { PLAN_CONFIG } from '@/lib/plans';
import { PIPELINE_STAGES, PLAN_SLUGS, STAGE_LABELS, type Lead } from '@/types/crm';

type PipelineToolbarProps = {
  filters: LeadFilters;
  sort: LeadSort;
  totalCount: number;
  filteredCount: number;
  filteredLeads: Lead[];
  onFiltersChange: (filters: LeadFilters) => void;
  onSortChange: (sort: LeadSort) => void;
  onExport?: (leads: Lead[]) => void;
};

export default function PipelineToolbar({
  filters,
  sort,
  totalCount,
  filteredCount,
  filteredLeads,
  onFiltersChange,
  onSortChange,
  onExport,
}: PipelineToolbarProps) {
  const active = hasActiveFilters(filters);

  const update = (patch: Partial<LeadFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const clear = () => onFiltersChange(DEFAULT_FILTERS);

  return (
    <div className="mb-4 space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="search"
            placeholder="Buscar nome, e-mail, telefone…"
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filters.stage} onValueChange={(v) => update({ stage: v as LeadFilters['stage'] })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas etapas</SelectItem>
              {PIPELINE_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.plan} onValueChange={(v) => update({ plan: v as LeadFilters['plan'] })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos planos</SelectItem>
              {PLAN_SLUGS.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {PLAN_CONFIG[slug].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.period} onValueChange={(v) => update({ period: v as LeadFilters['period'] })}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => onSortChange(v as LeadSort)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recente</SelectItem>
              <SelectItem value="oldest">Mais antigo</SelectItem>
              <SelectItem value="name">Nome A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-500">
          <span className="font-medium text-neutral-900">{filteredCount}</span> de {totalCount}{' '}
          {totalCount === 1 ? 'lead' : 'leads'}
        </p>
        <div className="flex items-center gap-2">
          {onExport && filteredCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-neutral-300"
              onClick={() => onExport(filteredLeads)}
            >
              Exportar CSV
            </Button>
          )}
          {active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-neutral-600 hover:text-neutral-950"
              onClick={clear}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
