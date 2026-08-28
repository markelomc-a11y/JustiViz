import React, { useState } from 'react';
import { 
  TraceStep, 
  ZoomLevel, 
  RiskLevel 
} from '../types';
import { 
  X, 
  Sliders, 
  Zap, 
  GitFork, 
  ShieldCheck, 
  ShieldAlert, 
  BookOpen, 
  Cpu, 
  Code, 
  Clock, 
  Scale, 
  CheckCircle2, 
  AlertOctagon, 
  Copy, 
  ExternalLink,
  HelpCircle,
  FileText
} from 'lucide-react';
import { VirtualizedAlternatives } from './VirtualizedAlternatives';

interface HierarchicalZoomDrawerProps {
  step: TraceStep | null;
  onClose: () => void;
  zoomLevel: ZoomLevel;
  onToggleZoom: (zoom: ZoomLevel) => void;
  onOpenFaithfulnessModal?: () => void;
}

export const HierarchicalZoomDrawer: React.FC<HierarchicalZoomDrawerProps> = ({
  step,
  onClose,
  zoomLevel,
  onToggleZoom,
  onOpenFaithfulnessModal,
}) => {
  const [activeTab, setActiveTab] = useState<'narrative' | 'technical' | 'alternatives' | 'audit'>('narrative');
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!step) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(step.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Risco Crítico</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Risco Elevado</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">Risco Moderado</span>;
      case 'LOW':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Risco Reduzido</span>;
    }
  };

  return (
    <div 
      id="hierarchical-zoom-drawer" 
      className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl md:max-w-2xl bg-white border-l border-slate-200 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out"
    >
      {/* Drawer Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold">
              {step.node_name}
            </span>
            {getRiskBadge(step.risk_level)}
            {step.is_critical_node && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                ★ Decisão Crítica
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {step.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Macro / Micro Toggle inside drawer */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onToggleZoom('macro')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                zoomLevel === 'macro' ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Alternar para Resumo Macro"
            >
              Macro
            </button>
            <button
              onClick={() => onToggleZoom('micro')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                zoomLevel === 'micro' ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Alternar para JSON Técnico Micro"
            >
              Micro
            </button>
          </div>

          <button
            id="close-drawer-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Fechar Painel"
            aria-label="Fechar Inspetor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs inside Drawer */}
      <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white text-xs font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('narrative')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'narrative'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Narrativa Macro</span>
        </button>

        <button
          onClick={() => setActiveTab('technical')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'technical'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Payload Micro & Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('alternatives')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'alternatives'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Hipóteses Rejeitadas ({step.alternatives.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? step.faithfulness_metadata.is_faithful ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-rose-600 text-rose-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {step.faithfulness_metadata.is_faithful ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span>Auditoria de Fidelidade</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-800 bg-white">

        {/* TAB 1: MACRO NARRATIVE */}
        {activeTab === 'narrative' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Plain-Language Narrative Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Resumo Jurídico em Linguagem Clara
              </h3>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                {step.summary}
              </p>
            </div>

            {/* Secondary Generative Annotation Card */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Anotação Explicativa Gerativa
                </h3>
                <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-semibold">
                  XAI Jurídica em Linguagem Clara
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed font-normal">
                {step.generative_annotation}
              </p>
            </div>

            {/* Extracted Contract Clause Quote if available */}
            {step.payload.raw_clause_quote && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Excerto Textual Contratual Extraído
                </h3>
                <blockquote className="border-l-2 border-indigo-600 pl-3 py-1 font-mono text-xs text-slate-800 bg-white rounded-r border-slate-200 shadow-xs">
                  "{step.payload.raw_clause_quote}"
                </blockquote>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">Grau de Confiança</span>
                <p className="text-base font-bold text-emerald-700 font-mono">
                  {step.payload.confidence_metric !== undefined ? `${Math.round(step.payload.confidence_metric * 100)}%` : 'N/D'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">Referencial jurídico</span>
                <p className="text-xs font-bold text-indigo-700 truncate">
                  {step.payload.cuad_category_matched || 'Geral'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 font-medium">Latência de Execução</span>
                <p className="text-base font-bold text-slate-800 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {step.execution_time_ms !== undefined ? `${step.execution_time_ms} ms` : 'N/D'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TECHNICAL PAYLOAD (MICRO VIEW) */}
        {activeTab === 'technical' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                Payload JSON Bruto do Rastreio (Estado Micro da API)
              </span>
              <button
                onClick={handleCopyPayload}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 transition-colors font-medium cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedPayload ? 'Copiado!' : 'Copiar JSON'}</span>
              </button>
            </div>

            {/* Precedent Citations if available */}
            {step.payload.precedent_citations && step.payload.precedent_citations.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" /> Precedentes Jurisprudenciais Relevantes
                </h4>
                <div className="space-y-2">
                  {step.payload.precedent_citations.map((cite, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{cite.case_name}</span>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">
                          Relevância: {Math.round(cite.relevance_score * 100)}%
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-slate-600 mt-0.5">{cite.citation}</p>
                      <span className="inline-block mt-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                        Jurisdição: {cite.jurisdiction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Block */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-200 overflow-x-auto">
              <pre className="text-[11px] leading-relaxed">
                {JSON.stringify(
                  {
                    step_id: step.step_id,
                    node_name: step.node_name,
                    risk_level: step.risk_level,
                    is_faithful: step.faithfulness_metadata.is_faithful,
                    payload: step.payload,
                    state_variables: step.payload.state_variables,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: FORKED PATHS (REJECTED ALTERNATIVES) */}
        {activeTab === 'alternatives' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <p>
                <strong className="text-slate-800 font-semibold">Por que razão são apresentadas hipóteses rejeitadas?</strong> Seguindo os princípios de explicabilidade XAI, o JustiViz apresenta as hipóteses alternativas avaliadas e descartadas pelo agente, permitindo aos juristas auditar os limites e critérios da decisão.
              </p>
            </div>

            <VirtualizedAlternatives alternatives={step.alternatives} />
          </div>
        )}

        {/* TAB 4: FAITHFULNESS AUDIT */}
        {activeTab === 'audit' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Audit Status Card */}
            <div className={`p-4 rounded-xl border ${
              step.faithfulness_metadata.is_faithful
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            } space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step.faithfulness_metadata.is_faithful ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertOctagon className="w-5 h-5 text-rose-600" />
                  )}
                  <span className="font-bold text-sm">
                    {step.faithfulness_metadata.is_faithful
                      ? 'Fiel & Logicamente Verificado'
                      : '🚨 Inconsistência de Fidelidade Detetada!'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 shadow-xs">
                  Pontuação: {Math.round(step.faithfulness_metadata.faithfulness_score * 100)}%
                </span>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed font-medium">
                {step.faithfulness_metadata.audit_notes}
              </p>
            </div>

            {/* Discrepancies if unfaithful */}
            {step.faithfulness_metadata.discrepancies && step.faithfulness_metadata.discrepancies.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Discrepâncias Identificadas pelo Modelo Auditor
                </h4>
                <ul className="list-disc list-inside text-xs text-rose-900 space-y-1 font-medium">
                  {step.faithfulness_metadata.discrepancies.map((disc, idx) => (
                    <li key={idx}>{disc}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Academic Reference & Self-Auditing Methodology */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
              <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Mecanismo de Verificação de Fidelidade (Young 2026 / Yuan et al. 2026)
              </h4>
              <p>
                Para evitar explicações ilusórias (onde um modelo de IA gera justificações convincentes que não correspondem aos parâmetros reais de execução), o JustiViz submete tanto a narrativa gerada como o payload técnico a um Modelo Auditor Secundário independente.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
        <span>ID do Passo: <code className="text-indigo-700 font-mono font-bold">{step.step_id}</code></span>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer shadow-xs"
        >
          Concluir
        </button>
      </div>
    </div>
  );
};
