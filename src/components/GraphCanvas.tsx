import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  ContractTrace, 
  TraceStep, 
  ZoomLevel, 
  RiskLevel,
  ForkedAlternative 
} from '../types';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  GitFork, 
  ShieldAlert,
  Sparkles,
  Info,
  Zap
} from 'lucide-react';

interface GraphCanvasProps {
  trace: ContractTrace;
  currentStepIndex: number;
  selectedStep: TraceStep | null;
  onSelectStep: (step: TraceStep, alternative?: ForkedAlternative) => void;
  zoomLevel: ZoomLevel;
  onToggleZoom: (level: ZoomLevel) => void;
  showAlternatives?: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  trace,
  currentStepIndex,
  selectedStep,
  onSelectStep,
  zoomLevel,
  onToggleZoom,
  showAlternatives = true,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [transformState, setTransformState] = useState<string>('scale(1) translate(0,0)');
  const [activeTab, setActiveTab] = useState<'graph' | 'legend'>('graph');

  // Colors and styling constants
  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return { border: '#f43f5e', bg: '#881337', text: '#fecdd3', glow: 'rgba(244, 63, 94, 0.4)' };
      case 'HIGH':
        return { border: '#f97316', bg: '#7c2d12', text: '#fed7aa', glow: 'rgba(249, 115, 22, 0.4)' };
      case 'MEDIUM':
        return { border: '#eab308', bg: '#713f12', text: '#fef08a', glow: 'rgba(234, 179, 8, 0.3)' };
      case 'LOW':
      default:
        return { border: '#10b981', bg: '#064e3b', text: '#a7f3d0', glow: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !trace) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width || 800;
    const height = containerRect.height || 600;

    // Define gradients and filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow marker for active flow
    defs.append('marker')
      .attr('id', 'arrow-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#6366f1');

    // Arrow marker for rejected alternative
    defs.append('marker')
      .attr('id', 'arrow-rejected')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#64748b');

    const g = svg.append('g').attr('class', 'graph-root-group');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTransformState(`scale(${event.transform.k.toFixed(2)}) translate(${Math.round(event.transform.x)}, ${Math.round(event.transform.y)})`);
      });

    svg.call(zoom);

    // Node positioning computation
    // Primary vertical spine centered at x = width * 0.35
    const spineX = Math.max(260, width * 0.36);
    const startY = 80;
    const stepSpacingY = 135;

    // Build node hierarchy data
    interface LayoutNode {
      id: string;
      title: string;
      subtitle: string;
      x: number;
      y: number;
      isSpine: boolean;
      isAlternative: boolean;
      isActive: boolean;
      isPast: boolean;
      stepData?: TraceStep;
      riskLevel: RiskLevel;
      isCritical: boolean;
      isFaithful: boolean;
      confidence?: number;
      rejectionReason?: string;
      altId?: string;
      parentId?: string;
    }

    interface LayoutLink {
      sourceX: number;
      sourceY: number;
      targetX: number;
      targetY: number;
      isAlternative: boolean;
      isActive: boolean;
    }

    const nodes: LayoutNode[] = [];
    const links: LayoutLink[] = [];

    // Root Contract Ingestion Node
    nodes.push({
      id: 'root-contract',
      title: 'Ingestão Contratual',
      subtitle: trace.contract_title.slice(0, 32) + '...',
      x: spineX,
      y: startY,
      isSpine: true,
      isAlternative: false,
      isActive: true,
      isPast: true,
      riskLevel: 'LOW',
      isCritical: false,
      isFaithful: true,
    });

    // Primary steps & branches
    trace.steps.forEach((step, idx) => {
      const stepY = startY + (idx + 1) * stepSpacingY;
      const isPast = idx <= currentStepIndex;
      const isActive = idx === currentStepIndex;

      // Spine primary node
      nodes.push({
        id: step.step_id,
        title: `${idx + 1}. ${step.title}`,
        subtitle: step.node_name,
        x: spineX,
        y: stepY,
        isSpine: true,
        isAlternative: false,
        isActive,
        isPast,
        stepData: step,
        riskLevel: step.risk_level,
        isCritical: !!step.is_critical_node,
        isFaithful: step.faithfulness_metadata.is_faithful,
      });

      // Link from previous spine node
      const prevY = idx === 0 ? startY : startY + idx * stepSpacingY;
      links.push({
        sourceX: spineX,
        sourceY: prevY,
        targetX: spineX,
        targetY: stepY,
        isAlternative: false,
        isActive: isPast,
      });

      // Rejected Alternative Branches (Forked Paths)
      if (showAlternatives && step.alternatives && step.alternatives.length > 0) {
        step.alternatives.forEach((alt, altIdx) => {
          const offsetX = 280 + (altIdx % 2) * 50;
          const altY = stepY - 35 + altIdx * 45;

          const altNodeId = `alt-${step.step_id}-${alt.id}`;
          nodes.push({
            id: altNodeId,
            title: `Rejected: ${alt.hypothesis.slice(0, 28)}...`,
            subtitle: `Conf: ${Math.round(alt.confidence_score * 100)}% | ${alt.cuad_category || 'Alternative'}`,
            x: spineX + offsetX,
            y: altY,
            isSpine: false,
            isAlternative: true,
            isActive: false,
            isPast: isPast,
            stepData: step,
            riskLevel: 'LOW',
            isCritical: false,
            isFaithful: true,
            confidence: alt.confidence_score,
            rejectionReason: alt.rejection_reason,
            altId: alt.id,
            parentId: step.step_id,
          });

          // Link from spine node to alternative
          links.push({
            sourceX: spineX,
            sourceY: stepY,
            targetX: spineX + offsetX,
            targetY: altY,
            isAlternative: true,
            isActive: isPast,
          });
        });
      }
    });

    // Render Links (Edges)
    const linkGroup = g.append('g').attr('class', 'links');
    
    links.forEach((link) => {
      // Calculate Bézier curve
      const pathData = link.isAlternative
        ? `M ${link.sourceX} ${link.sourceY} C ${link.sourceX + 100} ${link.sourceY}, ${link.targetX - 80} ${link.targetY}, ${link.targetX} ${link.targetY}`
        : `M ${link.sourceX} ${link.sourceY} L ${link.targetX} ${link.targetY}`;

      linkGroup.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', link.isAlternative ? '#475569' : link.isActive ? '#6366f1' : '#334155')
        .attr('stroke-width', link.isAlternative ? 1.5 : link.isActive ? 3 : 2)
        .attr('stroke-dasharray', link.isAlternative ? '4,4' : 'none')
        .attr('opacity', link.isAlternative ? (link.isActive ? 0.6 : 0.3) : 0.9)
        .attr('marker-end', link.isAlternative ? 'url(#arrow-rejected)' : 'url(#arrow-active)');
    });

    // Render Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    nodes.forEach((node) => {
      const isSelected = selectedStep && (
        (node.stepData && selectedStep.step_id === node.stepData.step_id && node.isSpine) ||
        (node.parentId && selectedStep.step_id === node.parentId)
      );
      const nodeG = nodeGroup.append('g')
        .attr('class', `node ${node.id}`)
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .on('click', (event) => {
          event.stopPropagation();

          if (node.stepData) {
            if (node.isAlternative && node.altId && node.stepData.alternatives?.length) {
              const selectedAlternative = node.stepData.alternatives.find((alt) => alt.id === node.altId);
              if (selectedAlternative) {
                onSelectStep(node.stepData, selectedAlternative);
              } else {
                onSelectStep(node.stepData);
              }
            } else {
              onSelectStep(node.stepData);
            }
          }

          const targetTransform = d3.zoomIdentity
            .translate(width / 2 - node.x, height / 2 - node.y)
            .scale(1.0);
          svg.transition().duration(500).call(zoom.transform, targetTransform);
        });

      if (node.isSpine) {
        // Spine Node: Card Rectangle
        const colors = getRiskColor(node.riskLevel);
        const cardWidth = zoomLevel === 'micro' ? 240 : 220;
        const cardHeight = zoomLevel === 'micro' ? 82 : 72;

        // Active pulsing ring
        if (node.isActive) {
          nodeG.append('rect')
            .attr('x', -cardWidth / 2 - 4)
            .attr('y', -cardHeight / 2 - 4)
            .attr('width', cardWidth + 8)
            .attr('height', cardHeight + 8)
            .attr('rx', 14)
            .attr('fill', 'none')
            .attr('stroke', colors.border)
            .attr('stroke-width', 2.5)
            .attr('opacity', 0.8)
            .attr('filter', 'url(#glow)');
        }

        // Selection highlight
        if (isSelected) {
          nodeG.append('rect')
            .attr('x', -cardWidth / 2 - 6)
            .attr('y', -cardHeight / 2 - 6)
            .attr('width', cardWidth + 12)
            .attr('height', cardHeight + 12)
            .attr('rx', 16)
            .attr('fill', 'none')
            .attr('stroke', '#38bdf8')
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', '5,3');
        }

        // Main Node Card
        nodeG.append('rect')
          .attr('x', -cardWidth / 2)
          .attr('y', -cardHeight / 2)
          .attr('width', cardWidth)
          .attr('height', cardHeight)
          .attr('rx', 12)
          .attr('fill', node.isActive ? '#1e1b4b' : node.isPast ? '#0f172a' : '#090d16')
          .attr('stroke', node.isActive ? '#818cf8' : node.isPast ? colors.border : '#334155')
          .attr('stroke-width', node.isActive ? 2 : 1.5)
          .attr('opacity', node.isPast ? 1.0 : 0.45);

        // Status Badge / Icon Circle on left edge
        nodeG.append('circle')
          .attr('cx', -cardWidth / 2 + 18)
          .attr('cy', 0)
          .attr('r', 12)
          .attr('fill', colors.bg)
          .attr('stroke', colors.border)
          .attr('stroke-width', 1.5);

        // Step number inside circle
        nodeG.append('text')
          .attr('x', -cardWidth / 2 + 18)
          .attr('y', 4)
          .attr('text-anchor', 'middle')
          .attr('fill', colors.text)
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .text(node.id === 'root-contract' ? '0' : node.title.split('.')[0] || '1');

        // Node Title Text
        nodeG.append('text')
          .attr('x', -cardWidth / 2 + 38)
          .attr('y', -cardHeight / 2 + 24)
          .attr('fill', node.isPast ? '#f8fafc' : '#94a3b8')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .text(() => {
            const cleanTitle = node.title.replace(/^\d+\.\s*/, '');
            return cleanTitle.length > 22 ? cleanTitle.slice(0, 20) + '...' : cleanTitle;
          });

        // Node Subtitle / Type Tag
        nodeG.append('text')
          .attr('x', -cardWidth / 2 + 38)
          .attr('y', -cardHeight / 2 + 40)
          .attr('fill', '#94a3b8')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .text(node.subtitle);

        // Micro mode details badge
        if (zoomLevel === 'micro' && node.stepData) {
          nodeG.append('rect')
            .attr('x', -cardWidth / 2 + 38)
            .attr('y', -cardHeight / 2 + 48)
            .attr('width', cardWidth - 48)
            .attr('height', 18)
            .attr('rx', 4)
            .attr('fill', '#020617')
            .attr('stroke', '#1e293b');

          nodeG.append('text')
            .attr('x', -cardWidth / 2 + 44)
            .attr('y', -cardHeight / 2 + 61)
            .attr('fill', '#38bdf8')
            .attr('font-size', '8.5px')
            .attr('font-family', 'monospace')
            .text(`Ref: ${node.stepData.payload.cuad_category_matched?.slice(0, 16) || 'N/D'} | Conf: ${node.stepData.payload.confidence_metric !== undefined ? `${Math.round(node.stepData.payload.confidence_metric * 100)}%` : 'N/D'}`);
        }

        // Critical Node Marker
        if (node.isCritical) {
          const starG = nodeG.append('g').attr('transform', `translate(${cardWidth / 2 - 16}, ${-cardHeight / 2 + 14})`);
          starG.append('circle')
            .attr('r', 8)
            .attr('fill', '#f59e0b')
            .attr('stroke', '#78350f');
          starG.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 3)
            .attr('fill', '#000')
            .attr('font-size', '9px')
            .attr('font-weight', 'bold')
            .text('★');
        }

        // Faithfulness Status Indicator
        if (node.stepData) {
          const isFaithful = node.isFaithful;
          const faithG = nodeG.append('g').attr('transform', `translate(${cardWidth / 2 - 16}, ${cardHeight / 2 - 14})`);
          faithG.append('circle')
            .attr('r', 7)
            .attr('fill', isFaithful ? '#065f46' : '#991b1b')
            .attr('stroke', isFaithful ? '#10b981' : '#ef4444');
          faithG.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 3)
            .attr('fill', '#ffffff')
            .attr('font-size', '8px')
            .attr('font-weight', 'bold')
            .text(isFaithful ? '✓' : '!');
        }

      } else {
        // Alternative Rejected Node: Dashed pill box
        const altWidth = 210;
        const altHeight = 44;

        nodeG.append('rect')
          .attr('x', 0)
          .attr('y', -altHeight / 2)
          .attr('width', altWidth)
          .attr('height', altHeight)
          .attr('rx', 8)
          .attr('fill', '#090d16')
          .attr('stroke', '#475569')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', node.isPast ? 0.75 : 0.35);

        // Warning Rejection Badge
        nodeG.append('rect')
          .attr('x', 6)
          .attr('y', -altHeight / 2 + 6)
          .attr('width', 64)
          .attr('height', 14)
          .attr('rx', 3)
          .attr('fill', '#450a0a')
          .attr('stroke', '#991b1b');

        nodeG.append('text')
          .attr('x', 38)
          .attr('y', -altHeight / 2 + 16)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fca5a5')
          .attr('font-size', '8px')
          .attr('font-weight', 'bold')
          .text('REJEITADO');

        // Alternative text
        nodeG.append('text')
          .attr('x', 76)
          .attr('y', -altHeight / 2 + 17)
          .attr('fill', '#cbd5e1')
          .attr('font-size', '9.5px')
          .attr('font-weight', '500')
          .text(node.title.replace('Rejected: ', '').replace('Rejeitado: ', '').slice(0, 18) + '...');

        // Reason note
        nodeG.append('text')
          .attr('x', 8)
          .attr('y', -altHeight / 2 + 33)
          .attr('fill', '#64748b')
          .attr('font-size', '8px')
          .text(node.rejectionReason ? node.rejectionReason.slice(0, 36) + '...' : node.subtitle);
      }
    });

    // Auto-center to selected node (or active spine node)
    let targetNode = null;
    if (selectedStep) {
      targetNode = nodes.find(n => n.stepData?.step_id === selectedStep.step_id && n.isSpine) ||
                   nodes.find(n => n.stepData?.step_id === selectedStep.step_id);
    }
    if (!targetNode) {
      targetNode = nodes.find(n => n.isActive && n.isSpine) || nodes[0];
    }

    if (targetNode) {
      const targetTransform = d3.zoomIdentity
        .translate(width / 2 - targetNode.x, height / 2 - targetNode.y)
        .scale(1.0);
      svg.transition().duration(500).call(zoom.transform, targetTransform);
    }

  }, [trace, currentStepIndex, selectedStep, zoomLevel, showAlternatives]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().on('zoom', () => {});
    svg.transition().duration(500).call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity.translate(0, 0).scale(1));
  };

  return (
    <div 
      ref={containerRef}
      id="graph-canvas-container" 
      className="relative w-full h-full min-h-[520px] bg-slate-900 rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm"
    >
      {/* Canvas Top Bar Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
           {/* Graph Info Chip */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm text-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
            <GitFork className="w-3.5 h-3.5 text-indigo-600" />
            <span>Grafo de Estados & Decisões</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] text-slate-500 font-medium">
            Nó {currentStepIndex + 1} de {trace.steps.length}
          </span>
          {trace.steps[currentStepIndex]?.is_critical_node && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
              Ponto Crítico
            </span>
          )}
        </div>

        {/* Canvas Tools & Zoom Preset */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-1 shadow-sm">
          <button
            id="reset-canvas-zoom"
            onClick={handleResetZoom}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors text-xs flex items-center gap-1 font-medium cursor-pointer"
            title="Repor Vista & Centrar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Centrar</span>
          </button>
          
          <button
            id="toggle-semantic-zoom"
            onClick={() => onToggleZoom(zoomLevel === 'macro' ? 'micro' : 'macro')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              zoomLevel === 'micro' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Alternar Nível de Detalhe Micro/Macro"
          >
            <Zap className="w-3 h-3 text-indigo-600" />
            <span className="text-[11px]">{zoomLevel === 'macro' ? 'Ver Micro' : 'Ver Macro'}</span>
          </button>
        </div>
      </div>

      {/* Primary SVG Canvas */}
      <svg 
        ref={svgRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        aria-label="Grafo Interativo da Máquina de Estados"
      />

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex items-center justify-between">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] text-slate-600 flex flex-wrap items-center gap-3 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-slate-800 font-semibold">Caminho Selecionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 border-t border-dashed border-slate-400" />
            <span className="text-slate-600 font-medium">Hipóteses Rejeitadas (Forked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 font-bold">★</span>
            <span className="text-slate-800 font-semibold">Decisão Crítica</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 font-medium">Fiel</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 ml-1" />
            <span className="text-rose-700 font-medium">Infiel</span>
          </div>
        </div>

        <div className="pointer-events-auto hidden sm:block text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
          Deslocar ou arrastar para navegar • Clique em qualquer nó para inspecionar
        </div>
      </div>
    </div>
  );
};
