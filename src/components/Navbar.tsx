import React from 'react';
import { 
  ActiveViewMode, 
  ContractTrace, 
  ZoomLevel 
} from '../types';
import { 
  Scale, 
  Compass, 
  Activity, 
  Zap, 
  Sparkles, 
  Sliders, 
  ShieldCheck,
  FileText,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { getTraceProvenanceLabel } from '../utils/dataProvenance';

interface NavbarProps {
  activeMode: ActiveViewMode;
  onSelectMode: (mode: ActiveViewMode) => void;
  caseStudies: ContractTrace[];
  selectedTraceId: string;
  onSelectTrace: (traceId: string) => void;
  zoomLevel: ZoomLevel;
  onToggleZoom: (zoom: ZoomLevel) => void;
  fps: number;
  onOpenHelp: () => void;
  onResetSession?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  onSelectMode,
  caseStudies,
  selectedTraceId,
  onSelectTrace,
  zoomLevel,
  onToggleZoom,
  fps,
  onOpenHelp,
  onResetSession,
}) => {
  const currentTrace = caseStudies.find(t => t.trace_id === selectedTraceId) || caseStudies[0];

  return (
    <header id="justiviz-header" className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      {/* Top Banner / Brand & Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  JustiViz
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  XAI Multimodal
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
                  CUAD & Regulamento IA UE
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Scrollytelling Narrativo para Cadeias de Raciocínio de Agentes Autónomos de IA
              </p>
            </div>
          </div>

          {/* Center: Case Study Dropdown */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Caso Contratual:
            </span>
            <select
              id="case-study-select"
              value={selectedTraceId}
              onChange={(e) => onSelectTrace(e.target.value)}
              aria-label="Selecionar Caso de Estudo Contratual"
              className="bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 max-w-xs truncate cursor-pointer hover:bg-white transition-colors"
            >
              {caseStudies.map((cs) => (
                <option key={cs.trace_id} value={cs.trace_id}>
                  {cs.reliance_profile?.injected_error_present ? '⚠️ ' : '📋 '}
                  {cs.contract_title.split(' - ')[0]} [{getTraceProvenanceLabel(cs)}]
                </option>
              ))}
            </select>
            {currentTrace?.reliance_profile?.injected_error_present && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Caso com Erro Injetado
              </span>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Global Semantic Zoom Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
              <button
                id="toggle-zoom-macro"
                onClick={() => onToggleZoom('macro')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
                  zoomLevel === 'macro'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Macro: Narrativa jurídica de alto nível em linguagem clara"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Macro</span>
              </button>
              <button
                id="toggle-zoom-micro"
                onClick={() => onToggleZoom('micro')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
                  zoomLevel === 'micro'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Micro: Payloads brutos da API, variáveis de estado e métricas de tokens"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Micro</span>
              </button>
            </div>

            {/* 60 FPS Fluidity Monitor */}
            <div 
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              title="Desempenho de renderização a 60 FPS via requestAnimationFrame"
            >
              <span className={`w-2 h-2 rounded-full ${fps >= 55 ? 'bg-emerald-500' : fps >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} />
              <span className="font-mono font-semibold text-slate-700">{Math.round(fps)} FPS</span>
            </div>

            {onResetSession && (
              <button
                id="reset-session-btn"
                onClick={onResetSession}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                title="Reiniciar sessão e voltar ao caso inicial"
                aria-label="Reiniciar sessão"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Help / Methodology Guide */}
            <button
              id="help-guide-btn"
              onClick={onOpenHelp}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="Guia Metodológico & Arquitetura XAI"
              aria-label="Ajuda e Metodologia"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex space-x-1.5 border-t border-slate-200 py-2 overflow-x-auto no-scrollbar">
          <button
            id="tab-scrollytelling"
            onClick={() => onSelectMode('scrollytelling')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeMode === 'scrollytelling'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>1. Scrollytelling Narrativo</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100/80 text-indigo-800 font-bold">
              0%-100%
            </span>
          </button>

          <button
            id="tab-reliance-lab"
            onClick={() => onSelectMode('reliance_lab')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeMode === 'reliance_lab'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2. Laboratório de Confiança (Reliance Lab)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
              Matriz 4Q
            </span>
          </button>

          <button
            id="tab-custom-analyzer"
            onClick={() => onSelectMode('custom_analyzer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeMode === 'custom_analyzer'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Agente IA para Contratos Personalizados</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800 font-bold">
              Modo Interativo
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
