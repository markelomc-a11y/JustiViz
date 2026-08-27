import React, { useMemo, useState } from 'react';
import { 
  ContractTrace, 
  TraceStep, 
  ZoomLevel, 
  RiskLevel 
} from '../types';
import { GraphCanvas } from './GraphCanvas';
import { 
  GitFork, 
  Filter, 
  Search, 
  Sliders, 
  Zap, 
  ShieldCheck, 
  Scale, 
  Info, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

interface DigraphExplorerViewProps {
  trace: ContractTrace;
  selectedStep: TraceStep | null;
  onSelectStep: (step: TraceStep) => void;
  zoomLevel: ZoomLevel;
  onToggleZoom: (zoom: ZoomLevel) => void;
}

export const DigraphExplorerView: React.FC<DigraphExplorerViewProps> = ({
  trace,
  selectedStep,
  onSelectStep,
  zoomLevel,
  onToggleZoom,
}) => {
  const [showAlternatives, setShowAlternatives] = useState<boolean>(true);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'canvas' | 'comparison_matrix'>('canvas');
  const [clauseIndex, setClauseIndex] = useState<number>(0);
  const [clauseRiskFilter, setClauseRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [clauseSortMode, setClauseSortMode] = useState<'index' | 'risk'>('index');

  const clauseItems = Array.isArray(trace.clauses) ? trace.clauses : [];

  const visibleClauses = useMemo(() => {
    const filtered = clauseItems.filter((clause) => {
      if (clauseRiskFilter === 'ALL') return true;
      return clause.risk_level === clauseRiskFilter;
    });

    return [...filtered].sort((a, b) => {
      if (clauseSortMode === 'risk') {
        const riskWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const riskDiff = (riskWeight[b.risk_level || 'LOW'] || 0) - (riskWeight[a.risk_level || 'LOW'] || 0);
        if (riskDiff !== 0) return riskDiff;
      }
      return (a.index ?? 0) - (b.index ?? 0);
    });
  }, [clauseItems, clauseRiskFilter, clauseSortMode]);

  const handleClauseJump = (nextIndex: number) => {
    if (!visibleClauses.length) return;
    const safeIndex = Math.min(visibleClauses.length - 1, Math.max(0, nextIndex));
    setClauseIndex(safeIndex);
    const targetClause = visibleClauses[safeIndex];
    const nextStep = targetClause?.trace?.steps?.[0];
    if (nextStep) {
      onSelectStep(nextStep);
    }
  };

  const filteredSteps = trace.steps.filter((s) => {
    const matchesRisk = filterRisk === 'ALL' || s.risk_level === filterRisk;
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.node_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div id="digraph-explorer-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Grafo de Raciocínio & Exploração de Estados
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {trace.contract_title.split(' - ')[0]}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Grafo Dirigido da Máquina de Estados & Hipóteses Alternativas
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl mt-1">
              Inspecione o grafo acíclico dirigido (DAG) que representa o raciocínio encadeado (Chain-of-Thought) do agente autónomo. Explore tanto as decisões selecionadas como todas as hipóteses alternativas rejeitadas.
            </p>
          </div>

          {/* View Mode Sub-tabs (Canvas vs Matrix) */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'canvas' ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Canvas Interativo
            </button>
            <button
              onClick={() => setActiveTab('comparison_matrix')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'comparison_matrix' ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriz de Alternativas ({trace.steps.reduce((acc, s) => acc + (s.alternatives?.length || 0), 0)})
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5">
              <button
                type="button"
                onClick={() => handleClauseJump(clauseIndex - 1)}
                disabled={!visibleClauses.length || clauseIndex === 0}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-indigo-200 bg-white text-indigo-700 disabled:opacity-40"
                aria-label="Cláusula anterior"
              >
                ←
              </button>
              <select
                value={clauseIndex}
                onChange={(event) => handleClauseJump(Number(event.target.value))}
                className="min-w-[180px] rounded-md border border-indigo-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                aria-label="Selecionar cláusula"
              >
                {visibleClauses.map((clause, idx) => (
                  <option key={`${clause.index ?? idx}-${clause.title}`} value={idx}>{`${clause.index ?? idx + 1}. ${clause.title}`}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleClauseJump(clauseIndex + 1)}
                disabled={!visibleClauses.length || clauseIndex >= visibleClauses.length - 1}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-indigo-200 bg-white text-indigo-700 disabled:opacity-40"
                aria-label="Próxima cláusula"
              >
                →
              </button>
            </div>
            <select
              value={clauseRiskFilter}
              onChange={(event) => {
                setClauseRiskFilter(event.target.value as 'ALL' | RiskLevel);
                setClauseIndex(0);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Filtrar cláusulas por risco"
            >
              <option value="ALL">Todos os riscos</option>
              <option value="CRITICAL">Crítico</option>
              <option value="HIGH">Alto</option>
              <option value="MEDIUM">Médio</option>
              <option value="LOW">Baixo</option>
            </select>
            <select
              value={clauseSortMode}
              onChange={(event) => setClauseSortMode(event.target.value as 'index' | 'risk')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Ordenar cláusulas"
            >
              <option value="index">Ordenar por número</option>
              <option value="risk">Ordenar por risco</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar nós, entidades, texto..."
              className="w-full bg-slate-50 text-slate-800 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Risk Filter */}
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Risco:</span>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                aria-label="Filtrar Nível de Risco"
                className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Todos os Níveis</option>
                <option value="CRITICAL">Risco Crítico</option>
                <option value="HIGH">Risco Elevado</option>
                <option value="MEDIUM">Risco Moderado</option>
                <option value="LOW">Risco Reduzido</option>
              </select>
            </div>

            {/* Toggle Alternatives Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showAlternatives}
                onChange={(e) => setShowAlternatives(e.target.checked)}
                className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mostrar Hipóteses Rejeitadas</span>
              </span>
            </label>

            {/* Global Semantic Zoom Toggle */}
            <button
              onClick={() => onToggleZoom(zoomLevel === 'macro' ? 'micro' : 'macro')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-indigo-600" />
              <span>{zoomLevel === 'macro' ? 'Mudar para Micro' : 'Mudar para Macro'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'canvas' ? (
        <div className="h-[680px] w-full rounded-xl overflow-hidden shadow-sm">
          <GraphCanvas
            trace={trace}
            currentStepIndex={trace.steps.length - 1}
            selectedStep={selectedStep}
            onSelectStep={onSelectStep}
            zoomLevel={zoomLevel}
            onToggleZoom={onToggleZoom}
            showAlternatives={showAlternatives}
          />
        </div>
      ) : (
        /* Forked Alternatives Comparison Matrix */
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-indigo-600" />
              Matriz de Auditoria e Comparação de Hipóteses Rejeitadas
            </h2>
            <p className="text-xs text-slate-500">
              Cada nó de decisão regista o caminho adotado e as contra-hipóteses descartadas com os respetivos fundamentos jurídicos de exclusão.
            </p>
          </div>

          <div className="space-y-6">
            {filteredSteps.map((step, idx) => (
              <div key={step.step_id} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                
                {/* Decision Node Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {step.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 font-medium">
                      CUAD: {step.payload.cuad_category_matched || 'Geral'}
                    </span>
                    <button
                      onClick={() => onSelectStep(step)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer"
                    >
                      Inspecionar Nó
                    </button>
                  </div>
                </div>

                {/* Selected Chosen Hypothesis Card */}
                <div className="p-4 rounded-lg bg-indigo-50/70 border border-indigo-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      Caminho Decisório Adotado (Ramo Ativo de Execução)
                    </span>
                    <span className="text-xs font-mono text-emerald-700 font-bold">
                      Grau de Confiança: {Math.round((step.payload.confidence_metric || 0.95) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed font-normal">
                    {step.summary}
                  </p>
                </div>

                {/* Rejected Alternatives List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Contra-Hipóteses Excluídas (Ramos Rejeitados):
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {step.alternatives.map((alt, altIdx) => (
                      <div key={alt.id || altIdx} className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2 flex flex-col justify-between shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              REJEITADO #{altIdx + 1}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 font-semibold">
                              {Math.round(alt.confidence_score * 100)}%
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-800">
                            {alt.hypothesis}
                          </h4>
                        </div>

                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                          <strong className="text-amber-700 block text-[10px] uppercase font-bold">Fundamento da Rejeição:</strong>
                          {alt.rejection_reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
