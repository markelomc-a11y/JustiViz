import React from 'react';
import { 
  X, 
  BookOpen, 
  ShieldCheck, 
  GitFork, 
  Sliders, 
  Scale, 
  Cpu, 
  CheckCircle2, 
  FileText,
  Sparkles
} from 'lucide-react';

interface MethodologyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyHelpModal: React.FC<MethodologyHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="methodology-modal"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <Scale className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                JustiViz: Metodologia & Arquitetura de XAI Narrativa
              </h2>
              <p className="text-xs text-slate-500">
                Enquadramento Científico para Agentes Autónomos Explicáveis na Análise Jurídica Contratual
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-600 text-xs sm:text-sm leading-relaxed bg-white">
          
          {/* Section 1: The Black-Box Challenge & European/PT Context */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> O Desafio da "Caixa-Negra" na IA Jurídica & Regulamento da IA da UE
            </h3>
            <p>
              À medida que os agentes autónomos assumem tarefas de auditoria contratual e <em>due diligence</em>, as suas Cadeias de Raciocínio (Chain-of-Thought) tornam-se opacas para advogados, juízes e juristas de empresa. No contexto da União Europeia e de Portugal, regulado pelo <strong className="text-slate-900">Regulamento da IA da UE (Regulamento 2024/1689)</strong>, a falta de explicabilidade e supervisão humana efetiva acarreta responsabilidade civil e sancionatória grave.
            </p>
          </div>

          {/* Section 2: Datasets & Taxonomia: Alternativas ao CUAD em Português Europeu */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-600" /> Enquadramento em Direito Português & Alternativas ao CUAD
            </h3>
            <p className="text-xs text-indigo-950 leading-relaxed">
              Enquanto o benchmark norte-americano <strong>CUAD</strong> reflete contratos submetidos à SEC sob a lei de Delaware/Nova Iorque, o <strong>JustiViz</strong> integra os referenciais fundamentais de Direito Português e Europeu:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-indigo-950 pt-1">
              <li className="p-2 rounded-lg bg-white/80 border border-indigo-100">
                <strong>• mlp_pt_eurlex-contracts (HuggingFace / LegalPT):</strong> +11.600 contratos e diretivas contratuais da UE em Português Europeu.
              </li>
              <li className="p-2 rounded-lg bg-white/80 border border-indigo-100">
                <strong>• Portal BASE & Registo DGSI/IGFEJ:</strong> Base de dados pública de cláusulas abusivas julgadas pelos tribunais portugueses.
              </li>
              <li className="p-2 rounded-lg bg-white/80 border border-indigo-100">
                <strong>• DL n.º 446/85 (LCCG):</strong> Regime das Cláusulas Contratuais Gerais (Cláusulas Absoluta e Relativamente Proibidas).
              </li>
              <li className="p-2 rounded-lg bg-white/80 border border-indigo-100">
                <strong>• Código Civil (Arts. 405.º e 809.º):</strong> Princípio da boa-fé e nulidade da renúncia antecipada a dolo ou culpa grave.
              </li>
            </ul>
          </div>

          {/* Section 3: Core Multimedia Pillars */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Os 4 Pilares de Explicabilidade Multimodal (XAI):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> 1. Scrollytelling Sequencial (0% a 100%)
                </strong>
                <p className="text-xs text-slate-600">
                  Transforma logs técnicos secos num storyboard estruturado em 5 fases (0% Ingestão, 25% Parâmetros, 50% Decisão Crítica, 75% Jurisprudência STJ, 100% Redlines), com narração áudio em Português Europeu (pt-PT).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" /> 2. Zoom Semântico Hierárquico (Macro/Micro)
                </strong>
                <p className="text-xs text-slate-600">
                  Interface Focus+Context que permite transitar instantaneamente entre resumos jurídicos em linguagem clara (Macro) e parâmetros técnicos/tokens brutos da API (Micro).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-indigo-600" /> 3. Hipóteses Alternativas Rejeitadas (Forked Paths)
                </strong>
                <p className="text-xs text-slate-600">
                  Expõe pelo menos 3 hipóteses descartadas pelo agente em cada nó crítico, com fundamentação jurídica detalhada do motivo de rejeição.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 4. Auditoria de Fidelidade (Anti-Alucinação)
                </strong>
                <p className="text-xs text-slate-600">
                  Um modelo auditor secundário valida se a explicação apresentada reflete com fidelidade os parâmetros de execução, alertando para potenciais alucinações.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Trust Calibration Matrix */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Calibração de Confiança Humano-IA (Appropriate Reliance Lab)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Baseado na matriz 2×2 de Guo et al. (2024) e Schemmer et al. (2023), o JustiViz mede empiricamente o tempo e precisão com que os juristas detetam falhas da IA através da visualização explicativa em comparação com logs tradicionais.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">Datasets CUAD / Eur-Lex PT • Orquestração LangGraph • React + D3.js 60 FPS</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            Explorar JustiViz
          </button>
        </div>
      </div>
    </div>
  );
};
