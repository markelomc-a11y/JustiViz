import React, { useEffect, useState } from 'react';
import type { ForkedAlternative } from '../types';

interface VirtualizedAlternativesProps {
  alternatives: ForkedAlternative[];
}

const ROW_HEIGHT = 196;
const OVERSCAN = 2;

export const VirtualizedAlternatives: React.FC<VirtualizedAlternativesProps> = ({ alternatives }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const viewportHeight = ROW_HEIGHT * 3;
  const firstVisible = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const lastVisible = Math.min(alternatives.length, firstVisible + 3 + OVERSCAN * 2);
  const visibleAlternatives = alternatives.slice(firstVisible, lastVisible);

  useEffect(() => setScrollTop(0), [alternatives]);

  return (
    <div
      className="overflow-y-auto"
      style={{ height: viewportHeight }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      aria-label="Hipóteses rejeitadas"
    >
      <div style={{ height: alternatives.length * ROW_HEIGHT, position: 'relative' }}>
        {visibleAlternatives.map((alt, visibleIndex) => {
          const index = firstVisible + visibleIndex;
          return (
            <div key={alt.id || index} className="absolute left-0 right-0 p-1" style={{ height: ROW_HEIGHT, top: index * ROW_HEIGHT }}>
              <div className="h-full p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Alternativa #{index + 1}</span>
                    <span title="Esta é uma hipótese gerada pelo agente de IA durante seu processo de raciocínio. O agente considerou e depois rejeitou esta alternativa." className="text-[10px] font-semibold text-slate-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 cursor-help">
                      🤖 Raciocínio IA
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">Confiança: {Math.round(alt.confidence_score * 100)}%</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900">{alt.hypothesis}</h4>
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
                  <span className="text-amber-700 font-bold block mb-0.5">Por que foi rejeitada:</span>
                  <p className="text-slate-600 leading-relaxed font-normal">{alt.rejection_reason}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
