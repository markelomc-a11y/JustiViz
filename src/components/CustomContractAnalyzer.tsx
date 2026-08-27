import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { ContractTrace } from '../types';
import {
  buildFallbackTrace,
  buildTraceFromContractText,
  parseUploadedFile,
} from '../utils/contractAnalysis';
import { 
  Sparkles, 
  FileText, 
  Play, 
  RotateCcw, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Cpu,
  ArrowRight,
  HelpCircle,
  Zap,
  Sliders,
  ShieldCheck
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'DL 446/85 (LCCG) • Indemnização e Responsabilidade',
  'Código do Trabalho (Art. 136.º) • Não-Concorrência',
  'RGPD (Regulamento UE 2016/679) • Notificação de Incidentes',
  'CUAD: Indemnification & IP Infringement',
  'CUAD: Limitation of Liability',
  'CUAD: Non-Compete & Exclusivity',
];

interface CustomContractAnalyzerProps {
  onAddCustomTrace: (trace: ContractTrace) => void;
  onNavigateToScrollytelling: () => void;
}

export const CustomContractAnalyzer: React.FC<CustomContractAnalyzerProps> = ({
  onAddCustomTrace,
  onNavigateToScrollytelling,
}) => {
  const [contractTitle, setContractTitle] = useState<string>('Acordo de Prestação de Serviços Empresariais');
  const [category, setCategory] = useState<string>('DL 446/85 (LCCG) • Indemnização e Responsabilidade');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([CATEGORY_OPTIONS[0]]);
  const [contractText, setContractText] = useState<string>(
    `CLÁUSULA 12.ª — INDEMNIZAÇÃO E LIMITAÇÃO DE REMÉDIOS.
  12.1 O Prestador defenderá e indemnizará o Cliente contra qualquer reclamação de terceiros que alegue que os Serviços Cloud violam uma patente, direito de autor ou marca.
  12.2 Exceção. As limitações de responsabilidade da Cláusula 13.ª NÃO se aplicam às obrigações de indemnização do Prestador, e a sua exposição financeira ao abrigo da Cláusula 12.1 é estritamente ILIMITADA em valor e duração.`
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastGeneratedTrace, setLastGeneratedTrace] = useState<ContractTrace | null>(null);
  const [clauses, setClauses] = useState<Array<{ index: number; title: string; text: string }>>([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const segmentContractText = async (text: string) => {
    try {
      const response = await fetch('/api/segment-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText: text }),
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const nextClauses = Array.isArray(payload?.data) ? payload.data : [];
      setClauses(nextClauses);
      return nextClauses;
    } catch (error) {
      console.warn('Segmentação de cláusulas indisponível:', error);
      return [];
    }
  };

  const applyClauseTracePipeline = (
    trace: ContractTrace,
    segmentList: Array<{ index?: number; title?: string; text?: string }> = clauses,
  ) => {
    const clauseTrace = buildTraceFromContractText({
      contractTitle,
      category: selectedCategories.join(' • '),
      contractText,
      segmentList,
    });

    return {
      ...trace,
      ...clauseTrace,
      clauses: clauseTrace.clauses,
      contract_excerpt: clauseTrace.contract_excerpt,
      steps: clauseTrace.steps,
      final_verdict: clauseTrace.final_verdict,
      trace_id: clauseTrace.trace_id,
    };
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('');

    try {
      const extractedText = await parseUploadedFile(selectedFile);

      if (!extractedText.trim()) {
        throw new Error('O ficheiro carregado não contém texto legível.');
      }

      const fileStem = selectedFile.name.replace(/\.[^.]+$/, '');
      setContractTitle(fileStem || 'Contrato Carregado');
      setContractText(extractedText.trim());
      const nextClauses = await segmentContractText(extractedText.trim());
      setStatusMessage(`Ficheiro ${selectedFile.name} carregado com sucesso. Foram detetados ${nextClauses?.length ?? 0} segmentos de cláusula para análise.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Não foi possível ler o documento carregado.');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetch('/api/health')
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) {
          setAiStatus(payload?.status === 'ok' && Boolean(payload?.hasLangGraph) ? 'online' : 'offline');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAiStatus('offline');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const samplePresets = [
    {
      label: '🇵🇹 Cloud B2B: Teto Ilimitado (LCCG)',
      title: 'Contrato de Serviços Cloud (Risco Ilimitado - DL 446/85)',
      category: 'DL 446/85 (LCCG) • Indemnização e Responsabilidade',
      text: `CLÁUSULA 14.ª — (INDEMNIZAÇÃO E SALVAGUARDA DE DIREITOS)
1. O Prestador de Serviços obriga-se a defender e indemnizar integralmente o Cliente por quaisquer litígios de violação de propriedade intelectual e violação do RGPD.
2. Derrogação de Teto: Não obstante o limite geral fixado na Cláusula 15.ª (valor anual faturado), a responsabilidade indemnizatória do Prestador NÃO ESTÁ SUJEITA A QUALQUER LIMITE monetário ou temporal, assumindo o Prestador risco ilimitado.`,
    },
    {
      label: '🇵🇹 Não-Concorrência 60 Meses (CT Art. 136.º)',
      title: 'Acordo de Cessação e Não-Concorrência Pós-Contratual',
      category: 'Código do Trabalho (Art. 136.º) • Não-Concorrência',
      text: `CLÁUSULA 8.ª — (NÃO CONCORRÊNCIA E EXCLUSIVIDADE)
1. Pelo período de 60 (sessenta) meses após a cessação, o Trabalhador/Cedente obriga-se a não exercer atividade concorrente na UE e CPLP.
2. Gratuitidade: A presente restrição é gratuita e não confere direito a qualquer compensação pecuniária autónoma adicional.
3. Cláusula Penal: A infração sujeita o infrator a cláusula penal compulsória de 500.000,00 €.`,
    },
    {
      label: '🇵🇹 DPA / RGPD: Notificação 45 Dias (CNPD)',
      title: 'Acordo de Subcontratação de Dados Pessoais (DPA)',
      category: 'RGPD (Regulamento UE 2016/679) • Notificação de Incidentes',
      text: `CLÁUSULA 6.ª — (NOTIFICAÇÃO DE VIOLAÇÕES DE DADOS)
O Subcontratante notificará o Responsável pelo Tratamento de qualquer violação de segurança de dados pessoais no prazo máximo de 45 (quarenta e cinco) dias úteis a contar do conhecimento efetivo da ocorrência.`,
    },
    {
      label: '�🇹 Indemnização Ilimitada SaaS (CUAD)',
      title: 'Acordo de Serviços Cloud Empresariais (Indemnização Ilimitada)',
      category: 'CUAD: Indemnização & Violação de Propriedade Intelectual',
      text: `SECTION 12. INDEMNITY AND LIMITATION OF REMEDIES.
12.1 Provider shall defend, indemnify, and hold harmless Customer against any third-party claim alleging that the Cloud Services infringe any patent, copyright, or trademark.
12.2 Carve-out. The liability limitations in Section 13 shall NOT apply to Provider's indemnification obligations, and Provider's financial exposure under Section 12.1 shall be strictly UNLIMITED in amount and duration.`,
    },
  ];

  const handleApplyPreset = async (preset: typeof samplePresets[0]) => {
    setContractTitle(preset.title);
    setCategory(preset.category);
    setSelectedCategories([preset.category]);
    setContractText(preset.text);
    await segmentContractText(preset.text);
  };

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      setErrorMessage('Introduza ou cole o texto da cláusula contratual.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('');

    try {
      const response = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractText,
          contractTitle,
          category: selectedCategories.join(' • '),
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const trace = payload?.data ?? payload;
        if (!trace || !trace.steps || !trace.final_verdict) {
          throw new Error('A resposta da IA é inválida ou está incompleta.');
        }

        const nextClauses = await segmentContractText(contractText);
        const enrichedTrace = applyClauseTracePipeline(trace, nextClauses && nextClauses.length > 0 ? nextClauses : [{ index: 0, title: 'Cláusula principal', text: contractText }]);

        setLastGeneratedTrace(enrichedTrace);
        onAddCustomTrace(enrichedTrace);
        setStatusMessage('A análise em tempo real está ativa e o rasto personalizado foi adicionado.');
        return;
      }

      const errorPayload = await response.json().catch(() => ({}));
      const offlineMessage = errorPayload?.error || 'A análise em tempo real não está disponível neste momento.';
      console.warn('AI analysis unavailable, using offline fallback:', offlineMessage);
      setStatusMessage('Serviço de IA indisponível; a utilizar a lógica jurídica local de contingência.');

      const fullTrace = buildFallbackTrace({
        contractTitle,
        category: selectedCategories.join(' • '),
        contractText,
      });

      setLastGeneratedTrace(fullTrace);
      onAddCustomTrace(fullTrace);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao compilar a representação estática do rasto.');

      const fullTrace = buildFallbackTrace({
        contractTitle,
        category: selectedCategories.join(' • '),
        contractText,
      });

      setLastGeneratedTrace(fullTrace);
      onAddCustomTrace(fullTrace);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="custom-contract-analyzer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Máquina de Estados LangGraph / Agente Autónomo
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Analisador de Cláusulas Contratuais Personalizadas
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl mt-1">
              Submeta qualquer cláusula contratual em Português ou Inglês. O sistema orquestra uma cadeia de raciocínio de múltiplos nós em LangGraph, gera hipóteses alternativas rejeitadas, executa uma auditoria de fidelidade e compila um rasto interativo em scrollytelling!
            </p>
          </div>
        </div>
      </div>

      {/* Main Analysis Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Input Form (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500">Carregar Exemplo Pré-definido:</span>
            <div className="flex flex-wrap gap-2">
              {samplePresets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium border border-slate-200 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Category Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Título / Identificador do Contrato</label>
              <input
                type="text"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                className="w-full bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
                placeholder="Ex: Contrato de Prestação de Serviços Cloud"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Categoria Jurídica Alvo</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryMenuOpen((isOpen) => !isOpen)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left text-xs text-slate-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  aria-expanded={isCategoryMenuOpen}
                  aria-haspopup="true"
                >
                  {selectedCategories.length === 0
                    ? 'Selecione uma ou mais categorias'
                    : `${selectedCategories.length} categoria${selectedCategories.length === 1 ? '' : 's'} selecionada${selectedCategories.length === 1 ? '' : 's'}`}
                </button>
                {isCategoryMenuOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                    {CATEGORY_OPTIONS.map((option) => (
                      <label key={option} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-[11px] text-slate-700 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(option)}
                          onChange={(event) => {
                            const nextCategories = event.target.checked
                              ? [...selectedCategories, option]
                              : selectedCategories.filter((selectedCategory) => selectedCategory !== option);
                            setSelectedCategories(nextCategories);
                            setCategory(nextCategories.join(' • '));
                          }}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                {selectedCategories.length > 0 ? selectedCategories.join(' • ') : 'Nenhuma categoria selecionada'}
              </p>
            </div>
          </div>

          {/* Contract Excerpt Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-slate-700 flex-1">
                Texto da Cláusula Contratual (Cole, Edite ou Carregue)
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Carregar .txt / .docx / .pdf
                </button>
              </div>
            </div>

            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="sr-only">Texto da cláusula</span>
              <span className="text-[11px] text-slate-500 font-normal">{contractText.length} caracteres</span>
            </label>
            <textarea
              rows={8}
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="w-full bg-slate-50 font-mono text-xs text-slate-800 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white leading-relaxed"
              placeholder="Cole aqui o texto da cláusula contratual ou carregue um ficheiro..."
            />
          </div>

          {clauses.length > 0 && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">Segmentação de cláusulas</span>
                <span className="text-[10px] font-medium text-indigo-700">{clauses.length} cláusulas detetadas</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
                {clauses.map((clause) => (
                  <div key={`${clause.index}-${clause.title}`} className="rounded-lg bg-white border border-indigo-100 px-2 py-1.5 text-[11px] text-slate-700">
                    <span className="font-bold text-slate-800">{clause.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            <span className="font-medium">Estado da IA:</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold ${
              aiStatus === 'online'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : aiStatus === 'offline'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                aiStatus === 'online' ? 'bg-emerald-500' : aiStatus === 'offline' ? 'bg-amber-500' : 'bg-slate-400'
              }`} />
              {aiStatus === 'online' ? 'LangGraph ativo' : aiStatus === 'offline' ? 'Modo contingência' : 'A verificar...'}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium">
              {statusMessage}
            </div>
          )}

          {/* Submit Action */}
          <button
            id="btn-run-agent-analysis"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-indigo-200" />
                <span>A orquestrar cadeia de raciocínio do agente autónomo...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Executar Rasto de Agente & Auditoria de Fidelidade</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Preview & Instructions (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          
          {lastGeneratedTrace ? (
            /* Analysis Result Card */
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Análise Concluída com Sucesso!
                </span>
                <span className="text-xs font-mono text-slate-500 font-medium">
                  {lastGeneratedTrace.steps.length} Passos Gerados
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lastGeneratedTrace.final_verdict.classification}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {lastGeneratedTrace.final_verdict.summary}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium">Pontuação de Risco:</span>
                  <strong className="text-amber-700 font-mono font-bold">{lastGeneratedTrace.final_verdict.risk_score}/100</strong>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium">Regulamento da IA (UE):</span>
                  <strong className="text-indigo-700 font-bold">{lastGeneratedTrace.final_verdict.eu_ai_act_risk_tier}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium">Hipóteses Rejeitadas Geradas:</span>
                  <strong className="text-slate-900 font-mono font-bold">
                    {lastGeneratedTrace.steps.reduce((acc, s) => acc + (s.alternatives?.length || 0), 0)} Alternativas
                  </strong>
                </div>
              </div>

              <button
                id="btn-view-generated-story"
                onClick={onNavigateToScrollytelling}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Abrir na Vista de Scrollytelling Narrativo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Explanatory Box */
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" /> Como Funciona o Pipeline do JustiViz
              </h3>
              
              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong className="text-slate-800">Nó de Extração:</strong> Segmenta obrigações, entidades contratuais e mapeia os termos para as taxonomias de referência (DL 446/85 / CUAD).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong className="text-slate-800">Classificação de Risco:</strong> Determina a exposição indemnizatória e gera pelo menos 3 hipóteses alternativas rejeitadas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong className="text-slate-800">Auditoria de Fidelidade:</strong> Executa um nó auditor secundário para calcular o grau de fidelidade e detetar alucinações.</span>
                </li>
              </ul>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
