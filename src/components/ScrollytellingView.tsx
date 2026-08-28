import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ContractTrace, 
  TraceStep, 
  ZoomLevel,
  RiskLevel,
  ForkedAlternative
} from '../types';
import { runMockFaithfulnessAudit } from '../utils/mockLangGraph';
import { GraphCanvas } from './GraphCanvas';
import { 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  GitFork, 
  Scale, 
  Sliders, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';

interface ScrollytellingViewProps {
  trace: ContractTrace;
  selectedStep: TraceStep | null;
  onSelectStep: (step: TraceStep) => void;
  zoomLevel: ZoomLevel;
  onToggleZoom: (zoom: ZoomLevel) => void;
  onOpenRelianceLab: () => void;
}

export const ScrollytellingView: React.FC<ScrollytellingViewProps> = ({
  trace,
  selectedStep,
  onSelectStep,
  zoomLevel,
  onToggleZoom,
  onOpenRelianceLab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [selectedAlternative, setSelectedAlternative] = useState<ForkedAlternative | null>(null);
  const [expandedExcerpt, setExpandedExcerpt] = useState<boolean>(false);
  const [currentClauseIndex, setCurrentClauseIndex] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const wheelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clauseItems = Array.isArray(trace.clauses) ? trace.clauses : [];
  const graphStatePath = useMemo(
    () => ['Extração de cláusulas', 'Classificação de risco', 'Consulta de precedentes', 'Auditoria de fidelidade', 'Síntese do veredito'],
    []
  );

  const visibleClauseItems = clauseItems;

  const currentClause = useMemo(() => {
    if (!visibleClauseItems.length) return null;
    return visibleClauseItems[currentClauseIndex] ?? visibleClauseItems[0] ?? null;
  }, [visibleClauseItems, currentClauseIndex]);

  const activeClauseTrace = currentClause?.trace ?? trace;
  const steps = activeClauseTrace.steps || trace.steps || [];
  const currentStep = steps[currentStepIndex] || steps[0];
  const activeStep = selectedStep ?? currentStep;

  const excerptText = currentClause?.text || trace.contract_excerpt || '';

  const mockAnnotation = 'Esta anotação seria gerada por um LLM local. Nesta demonstração, o conteúdo é simulado e funciona apenas como marcador.';

  const mockAudit = useMemo(() => {
    if (!activeStep) return null;

    return runMockFaithfulnessAudit({
      summary: activeStep.summary,
      technicalPayload: activeStep.payload,
      nodeType: activeStep.type,
    });
  }, [activeStep]);

  const isLongExcerpt = excerptText.length > 220;
  const currentClauseTitle = currentClause ? `${trace.contract_title} - Cláusula ${currentClause.index ?? currentClauseIndex + 1}` : trace.contract_title;

  const getNodeDisplayName = (nodeName: string) => {
    const localizedNames: Record<string, string> = {
      extract_clauses: 'Extração de Cláusulas',
      risk_assessment: 'Avaliação de Risco',
      legal_reasoning: 'Raciocínio Jurídico',
      final_verdict: 'Veredito Final',
      decision_tree: 'Árvore de Decisão',
      clause_analysis: 'Análise da Cláusula',
      contract_ingestion: 'Ingestão Contratual',
    };

    return localizedNames[nodeName] || nodeName.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    if (selectedStep) {
      const nextIndex = steps.findIndex(step => step.step_id === selectedStep.step_id);
      if (nextIndex >= 0) {
        setCurrentStepIndex(nextIndex);
      }
    }
  }, [selectedStep, steps]);

  useEffect(() => {
    if (!visibleClauseItems.length) {
      setCurrentClauseIndex(0);
      return;
    }

    if (selectedStep) {
      const nextClauseIndex = visibleClauseItems.findIndex((clause) =>
        clause.trace?.steps?.some((step) => step.step_id === selectedStep.step_id)
      );
      if (nextClauseIndex >= 0) {
        setCurrentClauseIndex(nextClauseIndex);
      } else if (currentClauseIndex >= visibleClauseItems.length) {
        setCurrentClauseIndex(0);
      }
    }
  }, [visibleClauseItems, selectedStep, currentClauseIndex]);

  useEffect(() => {
    if (visibleClauseItems.length > 0 && currentClauseIndex >= visibleClauseItems.length) {
      setCurrentClauseIndex(0);
    }
  }, [visibleClauseItems, currentClauseIndex]);

  useEffect(() => {
    setExpandedExcerpt(false);
  }, [selectedStep, selectedAlternative]);

  // Audio speech narration using Web Speech API (with pt-PT European Portuguese detection)
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      setSpeechNotice('A narração não é suportada neste navegador, mas o conteúdo permanece disponível no ecrã.');
      setIsSpeaking(false);
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeechNotice(null);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${currentStep.title}. ${currentStep.summary}. ${currentStep.generative_annotation}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
      
      // Detect if the content is in Portuguese
      const isPortuguese = 
        trace.governing_law.toLowerCase().includes('portug') ||
        trace.contract_title.toLowerCase().includes('contrato') ||
        trace.contract_title.toLowerCase().includes('acordo') ||
        currentStep.title.toLowerCase().includes('ingestão') ||
        currentStep.title.toLowerCase().includes('decisão') ||
        currentStep.title.toLowerCase().includes('síntese');

      if (isPortuguese) {
        utterance.lang = 'pt-PT';
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang === 'pt-PT' || v.lang.startsWith('pt'));
        if (ptVoice) utterance.voice = ptVoice;
      } else {
        utterance.lang = 'en-US';
      }

      utterance.rate = 1.0;
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeechNotice(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeechNotice('A narração está temporariamente indisponível para este passo.');
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setSpeechNotice(null);
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStepJump = useCallback((idx: number) => {
    const nextStep = steps[idx];
    if (!nextStep) return;

    setCurrentStepIndex(idx);
    onSelectStep(nextStep);
    setSelectedAlternative(null);
    setShowTechnicalDetails(true);

    if ('speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [steps, onSelectStep, isSpeaking]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleNarrativeHoverScroll = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const direction = event.deltaY > 0 ? 1 : -1;
      if (wheelDebounceRef.current) clearTimeout(wheelDebounceRef.current);
      wheelDebounceRef.current = setTimeout(() => {
        const nextIndex = Math.min(steps.length - 1, Math.max(0, currentStepIndex + direction));
        if (nextIndex !== currentStepIndex) handleStepJump(nextIndex);
        wheelDebounceRef.current = null;
      }, 180);
    };

    container.addEventListener('wheel', handleNarrativeHoverScroll, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNarrativeHoverScroll);
      if (wheelDebounceRef.current) clearTimeout(wheelDebounceRef.current);
    };
  }, [currentStepIndex, handleStepJump, steps.length]);

  const handleGraphNodeSelection = (step: TraceStep, alternative?: ForkedAlternative) => {
    const isSameStep = !!selectedStep && selectedStep.step_id === step.step_id;

    onSelectStep(step);

    if (alternative) {
      setSelectedAlternative(alternative);
      setShowTechnicalDetails(true);
      return;
    }

    setSelectedAlternative(null);
    setShowTechnicalDetails(true);
  };

  const handleClauseJump = (idx: number) => {
    if (!visibleClauseItems.length) return;
    const safeIndex = Math.min(visibleClauseItems.length - 1, Math.max(0, idx));
    const clause = visibleClauseItems[safeIndex];
    const nextStep = clause?.trace?.steps?.[0] || trace.steps?.[0];
    if (!nextStep) return;

    setCurrentClauseIndex(safeIndex);
    setCurrentStepIndex(0);
    setSelectedAlternative(null);
    setShowTechnicalDetails(true);
    onSelectStep(nextStep);
  };

  const getPhaseName = (phase: number) => {
    switch (phase) {
      case 0:
        return '0% • Ingestão Contratual & Pedido';
      case 25:
        return '25% • Extração de Parâmetros e Cláusulas';
      case 50:
        return '50% • Ponto Crítico de Decisão Jurídica';
      case 75:
        return '75% • Jurisprudência & Hipóteses Rejeitadas';
      case 100:
      default:
        return '100% • Veredito Final & Recomendações';
    }
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return 'text-rose-700 border-rose-200 bg-rose-50';
      case 'HIGH':
        return 'text-orange-700 border-orange-200 bg-orange-50';
      case 'MEDIUM':
        return 'text-amber-700 border-amber-200 bg-amber-50';
      case 'LOW':
      default:
        return 'text-emerald-700 border-emerald-200 bg-emerald-50';
    }
  };

  return (
    <div id="scrollytelling-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Contract Header & Milestone Scrub Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {trace.category}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Legislação Aplicável: <strong className="text-slate-800">{trace.governing_law}</strong>
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {trace.contract_title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              <strong className="text-indigo-600 font-semibold">Questão Jurídica:</strong> {trace.target_query}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
            <button
              id="btn-narrate-audio"
              onClick={handleToggleSpeech}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isSpeaking ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'text-slate-500 hover:text-slate-900 hover:bg-white'
              }`}
              title={isSpeaking ? 'Silenciar Narração Áudio' : 'Ouvir Narração Áudio (pt-PT)'}
            >
              {isSpeaking ? <Volume2 className="w-4 h-4 text-amber-600 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {speechNotice && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            {speechNotice}
          </div>
        )}

        <div className="rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Estado simulado do LangGraph</span>
            </div>
            <span className="text-[10px] text-indigo-700">
              ativo: <strong>{activeStep?.node_name || 'extract_clauses'}</strong>
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-indigo-700">
            Este bloco representa, de forma simplificada, o percurso de estados do agente LangGraph. As cores acompanham a posição atual na narrativa, incluindo etapas que podem ser agrupadas ou omitidas por um rasto específico.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {graphStatePath.map((stateName, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;

              return (
                <span
                  key={stateName}
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : isPast
                      ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {idx + 1}. {stateName}
                </span>
              );
            })}
          </div>
        </div>

        {/* 5-Stage Scrollytelling Storyboard Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Progresso: Nó {currentStepIndex + 1} de {steps.length} ({getPhaseName(currentStep.scroll_phase)})</span>
            <span className="font-semibold text-slate-700">{Math.round(((currentStepIndex + 1) / steps.length) * 100)}% concluído</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {steps.map((s, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <span
                  key={s.step_id}
                  className={`h-2 rounded-full transition-all duration-300 block ${
                    isCurrent
                      ? 'bg-amber-500 ring-2 ring-amber-400/40'
                      : isPast
                      ? 'bg-indigo-600'
                      : 'bg-slate-200'
                  }`}
                  title={`${idx + 1}. ${s.title}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium hidden sm:flex">
            <span>0% Ingestão</span>
            <span>25% Extração</span>
            <span>50% Ponto Crítico</span>
            <span>75% Jurisprudência</span>
            <span>100% Veredito</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Narrative Story Timeline vs. Right D3 Multimedia Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Scrollytelling Narrative Story Cards */}
        <div 
          ref={scrollContainerRef}
          className="lg:col-span-4 space-y-4"
          aria-label="Área de navegação por scrollytelling"
        >
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4 relative overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Navegação por hover</p>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{currentClauseTitle}</h3>
              </div>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-1">
                {currentStepIndex + 1}/{steps.length}
              </span>
            </div>

            {visibleClauseItems.length > 0 && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">
                  <span>Navegação por cláusulas</span>
                  <span>{currentClauseIndex + 1}/{visibleClauseItems.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleClauseJump(currentClauseIndex - 1)}
                      className="h-7 w-7 shrink-0 rounded-md border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                      disabled={currentClauseIndex === 0}
                      aria-label="Cláusula anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mx-auto" />
                    </button>
                    <select
                      value={currentClauseIndex}
                      onChange={(event) => handleClauseJump(Number(event.target.value))}
                      className="min-w-0 flex-1 rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {visibleClauseItems.map((clause, idx) => (
                        <option key={`${clause.index ?? idx}-${clause.title}`} value={idx}>{idx + 1}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleClauseJump(currentClauseIndex + 1)}
                      className="h-7 w-7 shrink-0 rounded-md border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                      disabled={currentClauseIndex >= visibleClauseItems.length - 1}
                      aria-label="Próxima cláusula"
                    >
                      <ChevronRight className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {steps.map((s, idx) => (
                <div
                  key={s.step_id}
                  data-step-index={idx}
                  className="story-step w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer"
                  onClick={() => handleStepJump(idx)}
                  style={{
                    backgroundColor: idx === currentStepIndex ? '#eef2ff' : '#f8fafc',
                    border: idx === currentStepIndex ? '1px solid #c7d2fe' : '1px solid transparent',
                    color: idx === currentStepIndex ? '#1e1b4b' : '#475569',
                    fontWeight: idx === currentStepIndex ? 700 : 500,
                    boxShadow: idx === currentStepIndex ? '0 0 0 1px rgba(99, 102, 241, 0.08)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      idx === currentStepIndex ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                    {s.scroll_phase}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Interactive D3 Directed Graph Canvas */}
        <div className={selectedStep ? 'lg:col-span-5 h-[620px] sticky top-24' : 'lg:col-span-7 h-[620px] sticky top-24'}>
          <GraphCanvas
            trace={activeClauseTrace}
            currentStepIndex={currentStepIndex}
            selectedStep={selectedStep}
            onSelectStep={handleGraphNodeSelection}
            zoomLevel={zoomLevel}
            onToggleZoom={onToggleZoom}
            showAlternatives={true}
          />
        </div>

        {/* Third Column: Narrative summary + optional technical details toggled by graph node clicks */}
        {selectedStep && (
          <aside className="lg:col-span-3 space-y-4 sticky top-24">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Nó em foco</p>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedAlternative ? 'Hipótese rejeitada' : getNodeDisplayName(selectedStep.node_name)}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getRiskColor(selectedStep.risk_level)}`}>
                  {selectedAlternative ? 'REJEITADA' : selectedStep.risk_level}
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-[10px] uppercase tracking-[0.18em] text-slate-600 mb-2">Resumo narrativo</h4>
                  <p className="text-sm text-slate-800 leading-relaxed">{selectedAlternative ? selectedAlternative.hypothesis : activeStep.summary}</p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <h4 className="text-[10px] uppercase tracking-[0.18em] text-indigo-700 mb-2">Explicação gerativa</h4>
                  <p className="text-[12px] leading-relaxed text-indigo-950">{mockAnnotation}</p>
                </div>
              </div>
            </div>

            {showTechnicalDetails && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Detalhe técnico</p>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedAlternative ? selectedAlternative.hypothesis : getNodeDisplayName(selectedStep.node_name)}</h3>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1">Fase do scroll</p>
                    <p className="font-semibold text-slate-800">{selectedStep.scroll_phase}%</p>
                  </div>

                  <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-700 mb-1">Método de decisão</p>
                    <p className="font-semibold text-indigo-950">{selectedAlternative ? selectedAlternative.cuad_category || 'Hipótese rejeitada' : selectedStep.payload?.cuad_category_matched || 'Classificação geral'}</p>
                  </div>

                  {selectedAlternative ? (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-amber-800">Motivo de rejeição</p>
                      <p className="text-[11px] leading-relaxed text-slate-700">{selectedAlternative.rejection_reason}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-700">
                        <span>Confiança</span>
                        <strong>{Math.round(selectedAlternative.confidence_score * 100)}%</strong>
                      </div>
                    </div>
                  ) : (
                    excerptText && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-800">EXCERTO DO CONTRATO</p>
                          {isLongExcerpt && (
                            <button
                              type="button"
                              onClick={() => setExpandedExcerpt((value) => !value)}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-300 bg-white text-base font-bold text-amber-800 hover:bg-amber-100"
                              aria-label={expandedExcerpt ? 'Colapsar excerto' : 'Expandir excerto'}
                            >
                              {expandedExcerpt ? '−' : '+'}
                            </button>
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed text-slate-700 italic transition-all duration-200 ${expandedExcerpt ? '' : 'max-h-28 overflow-hidden'}`}>
                          “{excerptText}”
                        </p>
                      </div>
                    )
                  )}
                  <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Métricas</p>
                    <div className="flex items-center justify-between">
                      <span>Confiança</span>
                      <strong>{Math.round(((selectedAlternative ? selectedAlternative.confidence_score : activeStep.payload?.confidence_metric) || 0.95) * 100)}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fidelidade</span>
                      <strong>{Math.round((mockAudit?.faithfulness_score ?? activeStep.faithfulness_metadata.faithfulness_score) * 100)}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Latência</span>
                      <strong>{activeStep.execution_time_ms || 340} ms</strong>
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-700">Auditoria de fidelidade simulada</p>
                    <p className="text-[11px] leading-relaxed text-slate-700">
                      {(mockAudit?.audit_notes ?? activeStep.faithfulness_metadata.audit_notes)}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-700">
                      <span>Risco de alucinação</span>
                      <strong className="uppercase">{(mockAudit?.hallucination_risk ?? activeStep.faithfulness_metadata.hallucination_risk)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}

      </div>

      {/* 100% Phase: Executive Final Verdict Summary Box */}
      {currentStepIndex === steps.length - 1 && (
        <div className="p-6 rounded-xl bg-white border border-indigo-100 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-700">
                100% Concluído • Apoio à Decisão Jurídica
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Síntese Final & Recomendações de Revisão Contratual (Redlines)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Regulamento IA UE: {activeClauseTrace.final_verdict.eu_ai_act_risk_tier}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Índice de Risco: {activeClauseTrace.final_verdict.risk_score}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Classificação Executiva
              </h3>
              <p className="text-sm font-semibold text-slate-900">
                {activeClauseTrace.final_verdict.classification}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeClauseTrace.final_verdict.summary}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Ações de Revisão Recomendadas
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {activeClauseTrace.final_verdict.recommended_clauses.map((clause, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{clause}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
