import React, { useState, useEffect } from 'react';
import { 
  ContractTrace, 
  RelianceUserRecord 
} from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  BarChart3, 
  Award, 
  HelpCircle, 
  FileText, 
  Eye, 
  GitFork, 
  Zap,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RelianceLabProps {
  caseStudies: ContractTrace[];
  onInspectTraceInScrollytelling: (traceId: string) => void;
}

export const RelianceLab: React.FC<RelianceLabProps> = ({
  caseStudies,
  onInspectTraceInScrollytelling,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseStudies[3]?.trace_id || caseStudies[0].trace_id);
  const [inspectionMode, setInspectionMode] = useState<'scrollytelling_preview' | 'raw_logs'>('scrollytelling_preview');
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [userDecision, setUserDecision] = useState<'ACCEPT' | 'REJECT_ERROR' | null>(null);
  const [records, setRecords] = useState<RelianceUserRecord[]>([
    {
      contract_id: 'cuad-trace-001',
      user_action: 'ACCEPT',
      agent_is_correct: true,
      time_to_decide_ms: 12400,
      mode_used: 'scrollytelling',
      outcome: 'APPROPRIATE_RELIANCE',
    },
    {
      contract_id: 'cuad-trace-002',
      user_action: 'ACCEPT',
      agent_is_correct: true,
      time_to_decide_ms: 15200,
      mode_used: 'scrollytelling',
      outcome: 'APPROPRIATE_RELIANCE',
    },
  ]);

  const activeCase = caseStudies.find(c => c.trace_id === selectedCaseId) || caseStudies[0];
  const agentIsCorrect = !activeCase.reliance_profile?.injected_error_present;

  // Timer counter
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && !userDecision) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [timerRunning, userDecision]);

  const handleMakeDecision = (action: 'ACCEPT' | 'REJECT_ERROR') => {
    setUserDecision(action);
    setTimerRunning(false);

    let outcome: RelianceUserRecord['outcome'];
    if (agentIsCorrect && action === 'ACCEPT') {
      outcome = 'APPROPRIATE_RELIANCE';
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } else if (!agentIsCorrect && action === 'REJECT_ERROR') {
      outcome = 'APPROPRIATE_SELF_RELIANCE'; // Successfully detected error!
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } else if (!agentIsCorrect && action === 'ACCEPT') {
      outcome = 'OVERRELIANCE'; // Blindly accepted error
    } else {
      outcome = 'UNDERRELIANCE'; // Rejected a valid recommendation
    }

    const newRecord: RelianceUserRecord = {
      contract_id: activeCase.trace_id,
      user_action: action,
      agent_is_correct: agentIsCorrect,
      time_to_decide_ms: Math.round(elapsedSeconds * 1000),
      mode_used: inspectionMode === 'scrollytelling_preview' ? 'scrollytelling' : 'raw_logs',
      outcome,
    };

    setRecords(prev => [newRecord, ...prev]);
  };

  const handleResetExperiment = (caseId?: string) => {
    if (caseId) setSelectedCaseId(caseId);
    setUserDecision(null);
    setElapsedSeconds(0);
    setTimerRunning(true);
  };

  // Compute 4-Quadrant Reliance Matrix Counts
  const matrixCounts = {
    appropriate_reliance: records.filter(r => r.outcome === 'APPROPRIATE_RELIANCE').length,
    overreliance: records.filter(r => r.outcome === 'OVERRELIANCE').length,
    underreliance: records.filter(r => r.outcome === 'UNDERRELIANCE').length,
    appropriate_self_reliance: records.filter(r => r.outcome === 'APPROPRIATE_SELF_RELIANCE').length,
  };

  const totalEvaluations = records.length || 1;
  const overallAppropriateScore = Math.round(
    ((matrixCounts.appropriate_reliance + matrixCounts.appropriate_self_reliance) / totalEvaluations) * 100
  );

  return (
    <div id="reliance-lab-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Quadro Teórico de Decisão Humano-IA (Guo et al. 2024 / Schemmer et al. 2023)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laboratório de Calibração de Confiança (Appropriate Reliance Lab)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl mt-1">
              O objetivo da XAI não é a confiança cega, mas sim a <strong>Confiança Calibrada (Appropriate Reliance)</strong>: confiar no agente quando este está correto, e detetar e anular rapidamente erros quando a IA alucina ou comete uma falha lógica.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center shrink-0 min-w-[140px]">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Confiança Apropriada</span>
            <span className="text-2xl font-bold text-emerald-700 font-mono">{overallAppropriateScore}%</span>
            <span className="text-[10px] text-slate-500 block">({records.length} avaliações registadas)</span>
          </div>
        </div>
      </div>

      {/* 4-Quadrant Theoretical Reliance Matrix Visualizer */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Matriz Empírica de Calibração de Confiança em 4 Quadrantes
          </h2>
          <span className="text-xs text-slate-500 font-medium">Meta: Maximizar Quadrantes Verdes, Eliminar Hiper-confiança</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Quadrant 1: Top-Left (Appropriate Reliance) */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confiança Apropriada (IA Correta + Jurista Aceita)
              </span>
              <span className="text-lg font-bold text-emerald-700 font-mono">{matrixCounts.appropriate_reliance}</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              O sistema está correto e o jurista utiliza de forma produtiva a inteligência artificial.
            </p>
          </div>

          {/* Quadrant 2: Top-Right (Overreliance - The Danger Zone) */}
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Hiper-confiança / Overreliance (IA Falha + Jurista Aceita Cegamente)
              </span>
              <span className="text-lg font-bold text-rose-700 font-mono">{matrixCounts.overreliance}</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              <strong>Falha Crítica:</strong> O agente cometeu um erro ou alucinação jurídica, mas o jurista não o detetou.
            </p>
          </div>

          {/* Quadrant 3: Bottom-Left (Underreliance / Subreliance) */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Sub-confiança / Underreliance (IA Correta + Jurista Rejeita)
              </span>
              <span className="text-lg font-bold text-amber-700 font-mono">{matrixCounts.underreliance}</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              O sistema apresentou um parecer correto, mas o jurista desconfiou indevidamente, desperdiçando tempo.
            </p>
          </div>

          {/* Quadrant 4: Bottom-Right (Appropriate Self-Reliance - Error Catching) */}
          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Auto-confiança Apropriada (IA Falha + Jurista Deteta e Corrige!)
              </span>
              <span className="text-lg font-bold text-indigo-700 font-mono">{matrixCounts.appropriate_self_reliance}</span>
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed font-medium">
              <strong>Sucesso da XAI:</strong> O jurista utilizou as hipóteses rejeitadas e o teste de fidelidade para identificar a falha da máquina e corrigir a decisão!
            </p>
          </div>

        </div>
      </div>

      {/* Interactive Evaluation Sandbox */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        
        {/* Test Case & Mode Selectors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold">Selecionar Caso para Auditoria:</span>
            <div className="flex flex-wrap gap-2">
              {caseStudies.map((cs) => (
                <button
                  key={cs.trace_id}
                  onClick={() => handleResetExperiment(cs.trace_id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    cs.trace_id === selectedCaseId
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {cs.reliance_profile?.injected_error_present ? '⚠️ ' : '📋 '}
                  <span>{cs.contract_title.split(' - ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interface Comparison Toggle: Scrollytelling vs Raw Logs */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold">Paradigma de Interface em Teste:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setInspectionMode('scrollytelling_preview')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  inspectionMode === 'scrollytelling_preview'
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>JustiViz Scrollytelling + Hipóteses</span>
              </button>
              <button
                onClick={() => setInspectionMode('raw_logs')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  inspectionMode === 'raw_logs'
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Logs Técnicos Brutos Tradicionais</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contract Text & Decision Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Inspection Panel (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Raw Contract Excerpt */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cláusula Contratual em Auditoria
                </span>
                <span className="text-xs text-slate-500 font-mono font-medium">
                  {activeCase.governing_law}
                </span>
              </div>
              <blockquote className="font-mono text-xs text-slate-800 bg-white p-3.5 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto shadow-xs">
                {activeCase.contract_excerpt}
              </blockquote>
            </div>

            {/* Inspection Content based on Mode */}
            {inspectionMode === 'scrollytelling_preview' ? (
              /* JustiViz Narrative & Forked Alternative Inspection */
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <GitFork className="w-4 h-4 text-indigo-600" /> Auditoria Narrativa XAI & Hipóteses Alternativas
                  </span>
                  <button
                    onClick={() => onInspectTraceInScrollytelling(activeCase.trace_id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Abrir Vista Scrollytelling 60 FPS</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Step Cards with Forked Alternatives */}
                <div className="space-y-3">
                  {activeCase.steps.map((step, idx) => (
                    <div key={step.step_id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Passo {idx + 1}: {step.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            step.faithfulness_metadata.is_faithful
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {step.faithfulness_metadata.is_faithful ? 'Fiel (98%)' : '🚨 AVISO DE FIDELIDADE (25%)'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{step.summary}</p>

                      {/* Rejected Alternative Teaser */}
                      {step.alternatives && step.alternatives.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                          <span className="text-rose-700 font-bold shrink-0">Hipótese Rejeitada:</span>
                          <span className="text-slate-800">{step.alternatives[0]?.hypothesis}</span>
                          <span className="text-slate-500 italic shrink-0">({step.alternatives[0]?.rejection_reason.slice(0, 45)}...)</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Raw Log Dump (Hard to parse) */
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs text-slate-400 max-h-96 overflow-y-auto">
                <div className="text-slate-500">=== LOGS TÉCNICOS BRUTOS DE EXECUÇÃO DO AGENTE ===</div>
                <div className="text-emerald-400">[INFO] A inicializar grafo de estados LangGraph. Session ID: {activeCase.trace_id}</div>
                {activeCase.steps.map((s, idx) => (
                  <div key={s.step_id} className="space-y-0.5 border-b border-slate-800 pb-2">
                    <div className="text-indigo-400">[NODE_{idx+1}] {s.node_name} | status=OK | time={s.execution_time_ms}ms</div>
                    <div className="text-slate-300 text-[10px] truncate">RAW_PAYLOAD: {JSON.stringify(s.payload)}</div>
                    <div className="text-slate-400 text-[10px]">OUTPUT_SUMMARY: {s.summary}</div>
                  </div>
                ))}
                <div className="text-amber-400">[AGENT_VERDICT] Resultado gerado: {activeCase.final_verdict.classification}</div>
              </div>
            )}

          </div>

          {/* Right Decision Action Box (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Active Stopwatch Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Tempo até Decisão de Auditoria:
              </span>
              <span className="text-3xl font-mono font-bold text-slate-900">
                {elapsedSeconds.toFixed(1)}s
              </span>
            </div>

            {/* Agent Proposed Recommendation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Recomendação Proposta pelo Agente IA:
              </span>
              <p className="text-xs font-bold text-slate-900">
                {activeCase.final_verdict.classification}
              </p>
              <p className="text-xs text-slate-600">
                {activeCase.final_verdict.summary}
              </p>
            </div>

            {/* Decision Buttons */}
            {!userDecision ? (
              <div className="space-y-3">
                <button
                  id="btn-accept-advice"
                  onClick={() => handleMakeDecision('ACCEPT')}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aceitar Parecer do Agente IA</span>
                </button>

                <button
                  id="btn-reject-advice"
                  onClick={() => handleMakeDecision('REJECT_ERROR')}
                  className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Rejeitar & Sinalizar Falha / Erro da IA</span>
                </button>
              </div>
            ) : (
              /* Post-Decision Result Evaluation */
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Resultado da Auditoria</span>
                  <button
                    onClick={() => handleResetExperiment()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Repetir Teste
                  </button>
                </div>

                {/* Outcome Banner */}
                {userDecision === 'ACCEPT' && agentIsCorrect && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                    <strong className="block font-bold">✓ CONFIANÇA APROPRIADA (APPROPRIATE RELIANCE)</strong>
                    <p>O agente estava correto e validou a recomendação em {elapsedSeconds.toFixed(1)}s.</p>
                  </div>
                )}

                {userDecision === 'REJECT_ERROR' && !agentIsCorrect && (
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs space-y-1">
                    <strong className="block font-bold">🎯 AUTO-CONFIANÇA APROPRIADA (FALHA DA IA IDENTIFICADA!)</strong>
                    <p>Excelente! Identificou a falha de raciocínio da IA e sobrepôs-se com sucesso ao agente em {elapsedSeconds.toFixed(1)}s!</p>
                  </div>
                )}

                {userDecision === 'ACCEPT' && !agentIsCorrect && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                    <strong className="block font-bold">⚠️ FALHA DE HIPER-CONFIANÇA (OVERRELIANCE)</strong>
                    <p>Aceitou a recomendação do agente, mas a IA alucinou uma penalidade de 5M€ inexistente na Cláusula 9.2!</p>
                  </div>
                )}

                {userDecision === 'REJECT_ERROR' && agentIsCorrect && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <strong className="block font-bold">⚠️ SUB-CONFIANÇA (UNDERRELIANCE)</strong>
                    <p>O parecer da IA era juridicamente válido com base na legislação e precedentes, mas foi rejeitado sem fundamento.</p>
                  </div>
                )}

                <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <strong className="text-slate-800 block mb-0.5 font-bold">Realidade Efetiva (Ground Truth):</strong>
                  {activeCase.reliance_profile?.injected_error_present
                    ? activeCase.reliance_profile.error_description
                    : 'O contrato foi analisado com rigor e 98% de fidelidade aos termos do documento.'}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
