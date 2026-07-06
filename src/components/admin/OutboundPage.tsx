import { useState } from 'react';
import { Send, Target, RefreshCw, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function OutboundPage() {
  const [stats] = useState({
    leadsNovo: 85,
    leadsContatoIniciado: 12,
    leadsRespondeu: 3,
    enviosHoje: 0,
    taxaResposta: 0.08,
  });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Outbound</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Prospecção ativa via WhatsApp — Apify + wacli
        </p>
      </header>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Leads novo</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{stats.leadsNovo}</p>
            </div>
            <Users className="h-8 w-8 text-neutral-300" />
          </div>
        </Card>
        <Card className="border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Contato iniciado</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{stats.leadsContatoIniciado}</p>
            </div>
            <Send className="h-8 w-8 text-neutral-300" />
          </div>
        </Card>
        <Card className="border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Responderam</p>
              <p className="mt-1 text-2xl font-bold text-[#5a8f1f]">{stats.leadsRespondeu}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-[#5a8f1f]/30" />
          </div>
        </Card>
        <Card className="border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Taxa de resposta</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{(stats.taxaResposta * 100).toFixed(0)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-neutral-300" />
          </div>
        </Card>
      </div>

      {/* Ações */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-neutral-200 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-neutral-100 p-2">
              <Target className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Importar leads</h2>
              <p className="text-xs text-neutral-500">Buscar novos leads no Google Maps via Apify</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">Execute pelo terminal:</p>
            <code className="block rounded bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
              cd ~/siterapido_repo/scripts/outbound<br />
              python3 source_apify.py --search "seu nicho Natal"
            </code>
          </div>
        </Card>

        <Card className="border border-neutral-200 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-neutral-100 p-2">
              <Send className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Enviar lote</h2>
              <p className="text-xs text-neutral-500">Disparar mensagens de primeiro contato</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">Dry-run (preview):</p>
            <code className="block rounded bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
              python3 send_batch.py
            </code>
            <p className="mt-2 text-xs text-neutral-500">Real (envia de verdade):</p>
            <code className="block rounded bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
              OUTBOUND_ENABLED=1 OUTBOUND_BATCH_SIZE=10 python3 send_batch.py
            </code>
          </div>
        </Card>
      </div>

      {/* Últimos envios */}
      <Card className="mt-6 border border-neutral-200 p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Últimos envios</h2>
        <p className="text-sm text-neutral-400">Nenhum envio hoje. Execute um dry-run ou lote para ver resultados aqui.</p>
      </Card>
    </div>
  );
}
