import { STAGE_LABELS, type Lead } from '@/types/crm';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportLeadsCsv(leads: Lead[], filename = 'leads.csv'): void {
  const headers = [
    'nome',
    'email',
    'telefone',
    'whatsapp',
    'stage',
    'plan_slug',
    'source',
    'created_at',
  ];

  const rows = leads.map((lead) =>
    [
      lead.nome ?? '',
      lead.email ?? '',
      lead.telefone ?? '',
      lead.whatsapp ?? '',
      STAGE_LABELS[lead.stage],
      lead.plan_slug ?? '',
      lead.source ?? 'landing',
      lead.created_at,
    ]
      .map(escapeCsv)
      .join(',')
  );

  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
