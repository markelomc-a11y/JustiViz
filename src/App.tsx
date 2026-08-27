import React, { useState, useEffect, useRef } from 'react';
import { 
  ContractTrace, 
  TraceStep, 
  ActiveViewMode, 
  ZoomLevel 
} from './types';
import { CUAD_CASE_STUDIES } from './data/cuadTraces';
import { PT_CASE_STUDIES } from './data/ptTraces';
import { Navbar } from './components/Navbar';
import { ScrollytellingView } from './components/ScrollytellingView';
import { RelianceLab } from './components/RelianceLab';
import { CustomContractAnalyzer } from './components/CustomContractAnalyzer';
import { MethodologyHelpModal } from './components/MethodologyHelpModal';

const ALL_INITIAL_CASE_STUDIES: ContractTrace[] = [
  ...PT_CASE_STUDIES,
  ...CUAD_CASE_STUDIES
];

export default function App() {
  const [caseStudies, setCaseStudies] = useState<ContractTrace[]>(ALL_INITIAL_CASE_STUDIES);
  const [selectedTraceId, setSelectedTraceId] = useState<string>(ALL_INITIAL_CASE_STUDIES[0].trace_id);
  const [activeMode, setActiveMode] = useState<ActiveViewMode>('scrollytelling');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('macro');
  const [selectedStep, setSelectedStep] = useState<TraceStep | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);

  const resetSession = () => {
    setCaseStudies(ALL_INITIAL_CASE_STUDIES);
    setSelectedTraceId(ALL_INITIAL_CASE_STUDIES[0].trace_id);
    setActiveMode('scrollytelling');
    setSelectedStep(null);
    setZoomLevel('macro');
  };

  // Measure dynamic render frame rate (60 FPS test)
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const calculateFps = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(calculateFps);
    };

    animId = requestAnimationFrame(calculateFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  const currentTrace = caseStudies.find(t => t.trace_id === selectedTraceId) || caseStudies[0];

  useEffect(() => {
    setSelectedStep(null);
  }, [selectedTraceId]);

  const handleAddCustomTrace = (newTrace: ContractTrace) => {
    setCaseStudies(prev => [newTrace, ...prev.filter(trace => trace.trace_id !== newTrace.trace_id)]);
    setSelectedTraceId(newTrace.trace_id);
  };

  const handleInspectTraceInScrollytelling = (traceId: string) => {
    setSelectedTraceId(traceId);
    setActiveMode('scrollytelling');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Application Bar */}
      <Navbar
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        caseStudies={caseStudies}
        selectedTraceId={selectedTraceId}
        onSelectTrace={setSelectedTraceId}
        zoomLevel={zoomLevel}
        onToggleZoom={setZoomLevel}
        fps={fps}
        onOpenHelp={() => setIsHelpOpen(true)}
        onResetSession={resetSession}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full pb-12">
        {activeMode === 'scrollytelling' && (
          <ScrollytellingView
            trace={currentTrace}
            selectedStep={selectedStep}
            onSelectStep={setSelectedStep}
            zoomLevel={zoomLevel}
            onToggleZoom={setZoomLevel}
            onOpenRelianceLab={() => setActiveMode('reliance_lab')}
          />
        )}

        {activeMode === 'reliance_lab' && (
          <RelianceLab
            caseStudies={caseStudies}
            onInspectTraceInScrollytelling={handleInspectTraceInScrollytelling}
          />
        )}

        {activeMode === 'custom_analyzer' && (
          <CustomContractAnalyzer
            onAddCustomTrace={handleAddCustomTrace}
            onNavigateToScrollytelling={() => setActiveMode('scrollytelling')}
          />
        )}
      </main>

      {/* Scientific Methodology Modal */}
      <MethodologyHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">JustiViz</span>
            <span>• Inteligência Artificial Explicável (XAI) para Raciocínio de Agentes Autónomos</span>
          </div>
          <span>Datasets CUAD / Eur-Lex PT • Conformidade com o Regulamento da IA da UE • Arquitetura de Estados LangGraph</span>
        </div>
      </footer>
    </div>
  );
}
