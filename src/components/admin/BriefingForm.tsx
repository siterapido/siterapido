import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  SECOES_DISPONIVEIS,
  FUNCIONALIDADES_DISPONIVEIS,
  INTEGRACOES_DISPONIVEIS,
  ESTILOS,
  type BriefingData,
} from '@/types/crm';
import { cn } from '@/lib/utils';

interface Props {
  initial?: Partial<BriefingData>;
  onSave: (data: BriefingData) => void;
  saving?: boolean;
  readOnly?: boolean;
}

const STEPS = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'design', label: 'Design' },
  { id: 'conteudo', label: 'Conteúdo' },
  { id: 'funcionalidades', label: 'Funcionalidades' },
  { id: 'final', label: 'Final' },
];

export default function BriefingForm({ initial, onSave, saving, readOnly }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BriefingData>({
    empresa_nome: initial?.empresa_nome ?? '',
    empresa_ramo: initial?.empresa_ramo ?? '',
    empresa_descricao: initial?.empresa_descricao ?? '',
    empresa_diferencial: initial?.empresa_diferencial ?? '',
    publico_alvo: initial?.publico_alvo ?? '',
    publico_dor: initial?.publico_dor ?? '',
    cores_primaria: initial?.cores_primaria ?? '#5a8f1f',
    cores_secundaria: initial?.cores_secundaria ?? '#9CD653',
    estilo: initial?.estilo ?? 'moderno',
    inspiracao_url: initial?.inspiracao_url ?? '',
    tom_voz: initial?.tom_voz ?? '',
    secoes: initial?.secoes ?? ['hero', 'contato'],
    tem_logo: initial?.tem_logo ?? false,
    tem_fotos_proprias: initial?.tem_fotos_proprias ?? false,
    funcionalidades: initial?.funcionalidades ?? [],
    integracoes: initial?.integracoes ?? [],
    cta_principal: initial?.cta_principal ?? '',
    cta_secundario: initial?.cta_secundario ?? '',
    palavras_chave: initial?.palavras_chave ?? '',
    google_analytics: initial?.google_analytics ?? false,
    dominio_pronto: initial?.dominio_pronto ?? false,
    dominio_url: initial?.dominio_url ?? '',
    prazo_dias: initial?.prazo_dias ?? 7,
    observacoes: initial?.observacoes ?? '',
  });

  const update = (field: keyof BriefingData, value: unknown) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const toggleArray = (field: 'secoes' | 'funcionalidades' | 'integracoes', value: string) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const canProceed = () => {
    if (step === 0) return data.empresa_nome && data.empresa_ramo;
    if (step === 1) return data.cores_primaria && data.estilo;
    if (step === 2) return data.secoes.length > 0;
    if (step === 3) return true;
    if (step === 4) return data.cta_principal;
    return true;
  };

  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'empresa':
        return (
          <div className="space-y-5">
            <div>
              <Label>Nome da empresa / profissional</Label>
              <Input value={data.empresa_nome} onChange={(e) => update('empresa_nome', e.target.value)} className="mt-1.5" readOnly={readOnly} />
            </div>
            <div>
              <Label>Ramo / segmento</Label>
              <Input value={data.empresa_ramo} onChange={(e) => update('empresa_ramo', e.target.value)} placeholder="Ex: advocacia, estética, construção civil" className="mt-1.5" readOnly={readOnly} />
            </div>
            <div>
              <Label>Descrição da empresa</Label>
              <Textarea value={data.empresa_descricao} onChange={(e) => update('empresa_descricao', e.target.value)} rows={3} className="mt-1.5" readOnly={readOnly} />
            </div>
            <div>
              <Label>Diferencial competitivo</Label>
              <Textarea value={data.empresa_diferencial} onChange={(e) => update('empresa_diferencial', e.target.value)} rows={2} className="mt-1.5" placeholder="O que te destaca dos concorrentes?" readOnly={readOnly} />
            </div>
            <div>
              <Label>Público-alvo</Label>
              <Textarea value={data.publico_alvo} onChange={(e) => update('publico_alvo', e.target.value)} rows={2} className="mt-1.5" placeholder="Quem é seu cliente ideal?" readOnly={readOnly} />
            </div>
            <div>
              <Label>Principal dor / problema do cliente</Label>
              <Textarea value={data.publico_dor} onChange={(e) => update('publico_dor', e.target.value)} rows={2} className="mt-1.5" placeholder="O que seu público precisa resolver?" readOnly={readOnly} />
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor primária</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="color"
                    value={data.cores_primaria}
                    onChange={(e) => update('cores_primaria', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-neutral-200"
                    disabled={readOnly}
                  />
                  <Input value={data.cores_primaria} onChange={(e) => update('cores_primaria', e.target.value)} className="flex-1" readOnly={readOnly} />
                </div>
              </div>
              <div>
                <Label>Cor secundária</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="color"
                    value={data.cores_secundaria}
                    onChange={(e) => update('cores_secundaria', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-neutral-200"
                    disabled={readOnly}
                  />
                  <Input value={data.cores_secundaria} onChange={(e) => update('cores_secundaria', e.target.value)} className="flex-1" readOnly={readOnly} />
                </div>
              </div>
            </div>

            <div>
              <Label>Estilo visual</Label>
              <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ESTILOS.map((estilo) => (
                  <button
                    key={estilo.value}
                    type="button"
                    onClick={() => !readOnly && update('estilo', estilo.value)}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-colors',
                      data.estilo === estilo.value
                        ? 'border-[#9CD653] bg-[#9CD653]/10'
                        : 'border-neutral-200 hover:border-neutral-300',
                      readOnly && 'cursor-default'
                    )}
                    disabled={readOnly}
                  >
                    <p className="text-sm font-medium text-neutral-900">{estilo.label}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{estilo.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>URL de inspiração (opcional)</Label>
              <Input value={data.inspiracao_url} onChange={(e) => update('inspiracao_url', e.target.value)} placeholder="https://..." className="mt-1.5" readOnly={readOnly} />
            </div>
            <div>
              <Label>Tom de voz</Label>
              <Textarea value={data.tom_voz} onChange={(e) => update('tom_voz', e.target.value)} rows={2} className="mt-1.5" placeholder="Ex: formal, descontraído, técnico, acolhedor..." readOnly={readOnly} />
            </div>
          </div>
        );

      case 'conteudo':
        return (
          <div className="space-y-5">
            <div>
              <Label>Seções do site</Label>
              <p className="mb-2 text-xs text-neutral-500">Escolha quais seções o site vai ter</p>
              <div className="flex flex-wrap gap-2">
                {SECOES_DISPONIVEIS.map((sec) => (
                  <Badge
                    key={sec.value}
                    variant="outline"
                    onClick={() => !readOnly && toggleArray('secoes', sec.value)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      data.secoes.includes(sec.value)
                        ? 'border-[#9CD653] bg-[#9CD653]/15 text-neutral-900'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300',
                      readOnly && 'cursor-default'
                    )}
                  >
                    {data.secoes.includes(sec.value) ? '✓ ' : ''}{sec.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={data.tem_logo}
                  onCheckedChange={(v) => update('tem_logo', v)}
                  disabled={readOnly}
                />
                <Label className="mb-0">Tenho logo</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={data.tem_fotos_proprias}
                  onCheckedChange={(v) => update('tem_fotos_proprias', v)}
                  disabled={readOnly}
                />
                <Label className="mb-0">Tenho fotos próprias</Label>
              </div>
            </div>
          </div>
        );

      case 'funcionalidades':
        return (
          <div className="space-y-5">
            <div>
              <Label>Funcionalidades desejadas</Label>
              <p className="mb-2 text-xs text-neutral-500">O que o site precisa ter?</p>
              <div className="flex flex-wrap gap-2">
                {FUNCIONALIDADES_DISPONIVEIS.map((f) => (
                  <Badge
                    key={f.value}
                    variant="outline"
                    onClick={() => !readOnly && toggleArray('funcionalidades', f.value)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      data.funcionalidades.includes(f.value)
                        ? 'border-[#9CD653] bg-[#9CD653]/15 text-neutral-900'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300',
                      readOnly && 'cursor-default'
                    )}
                  >
                    {data.funcionalidades.includes(f.value) ? '✓ ' : ''}{f.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Integrações</Label>
              <p className="mb-2 text-xs text-neutral-500">Redes sociais e serviços para conectar</p>
              <div className="flex flex-wrap gap-2">
                {INTEGRACOES_DISPONIVEIS.map((i) => (
                  <Badge
                    key={i.value}
                    variant="outline"
                    onClick={() => !readOnly && toggleArray('integracoes', i.value)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      data.integracoes.includes(i.value)
                        ? 'border-[#9CD653] bg-[#9CD653]/15 text-neutral-900'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300',
                      readOnly && 'cursor-default'
                    )}
                  >
                    {data.integracoes.includes(i.value) ? '✓ ' : ''}{i.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'final':
        return (
          <div className="space-y-5">
            <div>
              <Label>CTA principal (chamada principal do site)</Label>
              <Input value={data.cta_principal} onChange={(e) => update('cta_principal', e.target.value)} placeholder="Ex: Solicite seu orçamento" className="mt-1.5" readOnly={readOnly} />
            </div>
            <div>
              <Label>CTA secundário</Label>
              <Input value={data.cta_secundario} onChange={(e) => update('cta_secundario', e.target.value)} placeholder="Ex: Fale conosco" className="mt-1.5" readOnly={readOnly} />
            </div>
            <div>
              <Label>Palavras-chave (SEO)</Label>
              <Textarea value={data.palavras_chave} onChange={(e) => update('palavras_chave', e.target.value)} rows={2} className="mt-1.5" placeholder="Ex: advogado Natal, direito trabalhista RN" readOnly={readOnly} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={data.google_analytics}
                  onCheckedChange={(v) => update('google_analytics', v)}
                  disabled={readOnly}
                />
                <Label className="mb-0">Google Analytics</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={data.dominio_pronto}
                  onCheckedChange={(v) => update('dominio_pronto', v)}
                  disabled={readOnly}
                />
                <Label className="mb-0">Já tenho domínio</Label>
              </div>
            </div>
            {data.dominio_pronto && (
              <div>
                <Label>URL do domínio</Label>
                <Input value={data.dominio_url} onChange={(e) => update('dominio_url', e.target.value)} placeholder="meusite.com.br" className="mt-1.5" readOnly={readOnly} />
              </div>
            )}
            <div>
              <Label>Prazo desejado (dias)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={data.prazo_dias}
                onChange={(e) => update('prazo_dias', parseInt(e.target.value) || 7)}
                className="mt-1.5"
                readOnly={readOnly}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={data.observacoes} onChange={(e) => update('observacoes', e.target.value)} rows={3} className="mt-1.5" readOnly={readOnly} />
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Steps indicator */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              type="button"
              onClick={() => i <= step && setStep(i)}
              disabled={readOnly}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                i < step ? 'bg-[#9CD653] text-neutral-900' : i === step ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400',
                readOnly && 'cursor-default'
              )}
            >
              {i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-2 h-0.5 w-8', i < step ? 'bg-[#9CD653]' : 'bg-neutral-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {renderStep()}

      {/* Navigation */}
      {!readOnly && (
        <div className="mt-8 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Anterior
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
              disabled={!canProceed()}
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => onSave(data)}
              disabled={!canProceed() || saving}
            >
              {saving ? 'Salvando...' : 'Salvar briefing'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
