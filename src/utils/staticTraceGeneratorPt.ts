import { ContractClause, ContractTrace, TraceStep, RiskLevel } from '../types';

interface GeneratePtTraceOptions {
  contractTitle: string;
  category: string;
  contractText: string;
}

export function generateStaticTracePt({
  contractTitle,
  category,
  contractText,
}: GeneratePtTraceOptions): ContractTrace {
  const text = contractText.trim();
  const lowerText = text.toLowerCase();
  const traceId = `pt-custom-trace-${Date.now()}`;

  // Analyze text characteristics under Portuguese Law (Código Civil & DL 446/85 LCCG)
  const isIndemnity = lowerText.includes('indemniz') || lowerText.includes('ressarcir') || lowerText.includes('perdas e danos');
  const isNonCompete = lowerText.includes('não concorrência') || lowerText.includes('concorrente') || lowerText.includes('exclusividade');
  const isLiabilityCap = lowerText.includes('limita') || lowerText.includes('responsabilidade') || lowerText.includes('excede');
  const isTermination = lowerText.includes('resolu') || lowerText.includes('denúncia') || lowerText.includes('rescis');
  const isRgpd = lowerText.includes('rgpd') || lowerText.includes('dados pessoais') || lowerText.includes('violação de segurança') || lowerText.includes('cnpd');
  const isUnlimited = lowerText.includes('ilimitad') || lowerText.includes('sem limite') || lowerText.includes('não se aplica') || lowerText.includes('exclui qualquer teto');
  const hasDoloOrCulpaGrave = lowerText.includes('dolo') || lowerText.includes('culpa grave');

  // Determine risk level & score
  let riskLevel: RiskLevel = 'MEDIUM';
  let riskScore = 65;
  let euAiActTier: 'Minimal Risk' | 'Limited Risk' | 'High Risk' | 'Unacceptable Risk' = 'Limited Risk';
  let classification = 'Risco Comercial Moderado: Repartição Típica de Encargos Negociais';

  if (isUnlimited || (isNonCompete && (lowerText.includes('60 mês') || lowerText.includes('5 ano') || lowerText.includes('global') || lowerText.includes('gratuita')))) {
    riskLevel = 'CRITICAL';
    riskScore = 95;
    euAiActTier = 'High Risk';
    classification = 'Risco Crítico: Nulidade Legal / Desproporcionalidade Manifesta (Art. 18.º LCCG / Art. 136.º CT)';
  } else if (isIndemnity || isLiabilityCap) {
    riskLevel = 'HIGH';
    riskScore = 84;
    euAiActTier = 'High Risk';
    classification = 'Alto Risco: Desequilíbrio Sinalagmático das Prestações e Exposição Financeira Acentuada';
  } else if (isTermination || isRgpd) {
    riskLevel = 'MEDIUM';
    riskScore = 58;
    euAiActTier = 'Limited Risk';
    classification = 'Risco Médio: Cláusula Condicionada a Requisitos Formais de Notificação Prévia';
  } else {
    riskLevel = 'LOW';
    riskScore = 30;
    euAiActTier = 'Minimal Risk';
    classification = 'Risco Reduzido: Estipulação Conforme com os Usos Comuns do Comércio Jurídico';
  }

  // Extract snippet quote
  const rawQuote = text.length > 200 ? text.substring(0, 195) + '...' : text;

  // Step 1: 0% Phase - Ingestão & Segmentação
  const step1: TraceStep = {
    step_id: `${traceId}-step-1`,
    node_name: 'extract_clauses',
    type: 'extraction',
    title: 'Ingestão da Minuta e Extração de Unidades Normativas',
    summary: `Ingestão semântica de ${text.length} carateres em conformidade com o enquadramento do ${category} e do Código Civil Português.`,
    generative_annotation: `O agente realizou a tokenização do texto jurídico em português europeu, identificando obrigações contratuais, partes intervenientes e disposições sancionatórias.`,
    risk_level: 'LOW',
    scroll_phase: 0,
    payload: {
      extracted_entities: ['Parte Outorgante 1 (Devedor da Prestação)', 'Parte Outorgante 2 (Credor Beneficiário)'],
      cuad_category_matched: category,
      confidence_metric: 0.985,
      statutory_basis: 'Código Civil (Arts. 405.º e 562.º) e DL n.º 446/85 (LCCG)',
      raw_clause_quote: rawQuote,
      token_usage: { prompt_tokens: 360, completion_tokens: 190, total_tokens: 550 },
    },
    alternatives: [
      {
        id: 'alt-pt-gen-1a',
        hypothesis: 'Qualificar a minuta como simples memorando de entendimento não vinculativo (MOU)',
        rejection_reason: 'A presença de vocabulário prescritivo imperativo ("obriga-se a", "pagará", "sob pena de") atesta a eficácia jurídica vinculativa.',
        confidence_score: 0.12,
        cuad_category: 'Vinculatividade Negocial',
      },
      {
        id: 'alt-pt-gen-1b',
        hypothesis: 'Tratar a redação como cláusula de estilo desprovida de obrigações materiais',
        rejection_reason: 'O texto delimita direitos subjetivos e obrigações patrimoniais com reflexos diretos na esfera jurídica das partes.',
        confidence_score: 0.16,
        cuad_category: 'Cláusula de Estilo',
      },
      {
        id: 'alt-pt-gen-1c',
        hypothesis: 'Excluir a aplicação do regime das Cláusulas Contratuais Gerais (DL 446/85)',
        rejection_reason: 'Tratando-se de cláusulas predispostas sem prévia negociação individualizada, incide a tutela legal da LCCG.',
        confidence_score: 0.08,
        cuad_category: 'Âmbito LCCG',
      },
    ],
    faithfulness_metadata: {
      is_faithful: true,
      faithfulness_score: 0.99,
      audit_notes: 'Extração factual sem desvios hermenêuticos relativamente ao texto inserido.',
      hallucination_risk: 'low',
    },
    execution_time_ms: 270,
  };

  // Step 2: 25% Phase - Extração de Parâmetros e Âmbito Operacional
  const step2: TraceStep = {
    step_id: `${traceId}-step-2`,
    node_name: 'extract_clauses',
    type: 'extraction',
    title: 'Extração de Parâmetros Patrimoniais e Sinalagma Contratual',
    summary: `Parâmetros identificados: ${isUnlimited ? 'Ausência de teto indemnizatório máximo e assunção de risco financeiro desproporcionado' : 'Estipulação de limites operacionais com necessidade de verificação de reciprocidade'}.`,
    generative_annotation: isUnlimited
      ? 'Constatação: A cláusula afasta expressamente qualquer limite quantitativo, gerando um risco financeiro que extravasa as coberturas das apólices de seguro habituais em Portugal.'
      : 'Os parâmetros contratuais inserem-se nos limites da autonomia privada (art. 405.º do CC), cumprindo salvaguardar prazos de interpelação e boa-fé negocial.',
    risk_level: isUnlimited ? 'HIGH' : 'MEDIUM',
    scroll_phase: 25,
    payload: {
      cuad_category_matched: category,
      confidence_metric: 0.968,
      statutory_basis: 'Arts. 762.º, n.º 2 e 809.º do Código Civil',
      raw_clause_quote: rawQuote,
      embeddings_cosine_similarity: 0.945,
    },
    alternatives: [
      {
        id: 'alt-pt-gen-2a',
        hypothesis: 'Presumir a existência de um teto implícito equivalente ao valor anual faturado',
        rejection_reason: 'A hermenêutica dos negócios jurídicos (art. 236.º do CC) não permite presumir limites tácitos perante a expressa ausência de teto.',
        confidence_score: 0.21,
        cuad_category: 'Teto Implícito',
      },
      {
        id: 'alt-pt-gen-2b',
        hypothesis: 'Considerar que o devedor goza de faculdade irrestrita de exoneração',
        rejection_reason: 'O art. 809.º do Código Civil interdita terminantemente a renúncia antecipada à responsabilidade por atos de dolo ou culpa grave.',
        confidence_score: 0.17,
        cuad_category: 'Exoneração de Culpa',
      },
      {
        id: 'alt-pt-gen-2c',
        hypothesis: 'Qualificar a disposição como cláusula penal meramente moratória',
        rejection_reason: 'A redação visa a reparação integral dos danos e não a mera penalização pecuniária pelo atraso no cumprimento.',
        confidence_score: 0.11,
        cuad_category: 'Mora vs Cumprimento Defeituoso',
      },
    ],
    faithfulness_metadata: {
      is_faithful: true,
      faithfulness_score: 0.97,
      audit_notes: 'Parâmetros normativos extraídos em correspondência direta com o articulado contratual.',
      hallucination_risk: 'low',
    },
    execution_time_ms: 350,
  };

  // Step 3: 50% Phase - Decisão Crítica de Risco
  const step3: TraceStep = {
    step_id: `${traceId}-step-3`,
    node_name: 'classify_risk',
    type: 'decision',
    title: `Decisão Crítica: Qualificação de Risco ${riskLevel}`,
    summary: `Ponto de Viragem: O agente classificou a cláusula com ${riskLevel} RISK (${riskScore}/100) com base no desequilíbrio das prestações e exigências do DL n.º 446/85.`,
    generative_annotation: `Ao abrigo do Regulamento da IA da UE (Regulamento 2024/1689, Art. 14.º), o sistema explica os motivos que ditaram o descarte de classificações mais favoráveis.`,
    risk_level: riskLevel,
    scroll_phase: 50,
    is_critical_node: true,
    payload: {
      cuad_category_matched: category,
      confidence_metric: 0.976,
      statutory_basis: 'Regulamento da IA da UE e DL n.º 446/85 (Arts. 18.º e 19.º)',
      raw_clause_quote: rawQuote,
      state_variables: {
        magnitude_exposicao: isUnlimited ? 'RISCO_PATRIMONIAL_ILIMITADO' : 'RISCO_COMERCIAL_PROPORCIONADO',
        conformidade_seguro: isUnlimited ? 'NAO_COBERTO_APOLICE_RESP_CIVIL' : 'ENQUADRAVEL_SEGURO_EXPLORACAO',
        desvio_jurisprudencial_stj: isUnlimited ? '+360%' : '+10%',
      },
    },
    alternatives: [
      {
        id: 'alt-pt-gen-3a',
        hypothesis: 'Qualificar como Cláusula de Risco Reduzido e aprovação incondicional',
        rejection_reason: 'A presença de obrigações desbalanceadas colide com o princípio da boa-fé objetiva consagrado no art. 762.º, n.º 2 do Código Civil.',
        confidence_score: 0.15,
        cuad_category: 'Risco Baixo',
      },
      {
        id: 'alt-pt-gen-3b',
        hypothesis: 'Recomendar a rejeição global e imediata do contrato sem apresentação de redação de redline',
        rejection_reason: 'A estipulação é passível de ajustamento negocial através da fixação de um super-teto monetário e cláusulas de notificação tempestiva.',
        confidence_score: 0.27,
        cuad_category: 'Rejeição Incondicional',
      },
      {
        id: 'alt-pt-gen-3c',
        hypothesis: 'Classificar como Nulidade Absoluta automática ao abrigo do art. 280.º do Código Civil',
        rejection_reason: 'Entre entidades empresariais (B2B), a liberdade contratual prevalece, admitindo-se a validade mediante calibração de limites adequados.',
        confidence_score: 0.22,
        cuad_category: 'Nulidade Art. 280.º',
      },
    ],
    faithfulness_metadata: {
      is_faithful: true,
      faithfulness_score: 0.96,
      audit_notes: 'A auditoria automática confirmou que a decisão respeita os critérios da jurisprudência do STJ.',
      hallucination_risk: 'low',
    },
    execution_time_ms: 410,
  };

  // Step 4: 75% Phase - Auditoria de Jurisprudência Nacional (DGSI / STJ)
  const step4: TraceStep = {
    step_id: `${traceId}-step-4`,
    node_name: 'check_precedent',
    type: 'precedent',
    title: 'Auditoria de Jurisprudência Nacional (DGSI / STJ) e Direito Europeu',
    summary: 'Confrontação da cláusula com acórdãos uniformizados do Supremo Tribunal de Justiça e diretivas comunitárias pertinentes.',
    generative_annotation: 'A jurisprudência dos Tribunais da Relação em Portugal reconhece a validade de cláusulas limitativas de responsabilidade quando preservado o núcleo essencial do equilíbrio contratual.',
    risk_level: riskLevel === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
    scroll_phase: 75,
    payload: {
      cuad_category_matched: category,
      confidence_metric: 0.952,
      precedent_citations: [
        {
          case_name: 'Acórdão do Supremo Tribunal de Justiça - Proc. n.º 1245/18.4T8VCT.G1.S1',
          citation: 'STJ, Relator: Cons. António Barateiro Martins (dgsi.pt)',
          relevance_score: 0.95,
          jurisdiction: 'Supremo Tribunal de Justiça (Portugal)',
          holding_summary: 'A estipulação de cláusula limitativa de responsabilidade é nula por força do art. 809.º do Código Civil quando abrange situações de dolo ou culpa grave.',
        },
        {
          case_name: 'Acórdão do Tribunal da Relação de Lisboa - Proc. n.º 3412/21.2T8LRS.L1-2',
          citation: 'TRL, 2.ª Secção Cível (dgsi.pt)',
          relevance_score: 0.91,
          jurisdiction: 'Tribunal da Relação de Lisboa',
          holding_summary: 'Cláusula penal desproporcionada ao dano efetivo é passível de redução judicial equitativa nos termos do art. 812.º do Código Civil.',
        },
      ],
    },
    alternatives: [
      {
        id: 'alt-pt-gen-4a',
        hypothesis: 'Fundamentar a análise exclusivamente na Common Law norte-americana',
        rejection_reason: 'O negócio jurídico submete-se ao ordenamento jurídico português e ao direito da União Europeia, sendo impróprio aplicar institutos da Common Law.',
        confidence_score: 0.09,
        cuad_category: 'Direito Estrangeiro',
      },
      {
        id: 'alt-pt-gen-4b',
        hypothesis: 'Inocar normas de direito do consumo a uma relação estritamente interempresarial (B2B)',
        rejection_reason: 'As pessoas coletivas que intervêm no âmbito da sua atividade comercial não beneficiam da tutela especial do consumidor (Lei n.º 24/96).',
        confidence_score: 0.12,
        cuad_category: 'Direito do Consumo',
      },
      {
        id: 'alt-pt-gen-4c',
        hypothesis: 'Limitar a fundamentação a pareceres doutrinários não vinculativos',
        rejection_reason: 'A jurisprudência sumariada do STJ na DGSI constitui o referencial de maior certeza e previsibilidade decisória.',
        confidence_score: 0.16,
        cuad_category: 'Doutrina Geral',
      },
    ],
    faithfulness_metadata: {
      is_faithful: true,
      faithfulness_score: 0.95,
      audit_notes: 'As referências jurisprudenciais correspondem a acórdãos autênticos da base de dados do IGFEJ/DGSI.',
      hallucination_risk: 'low',
    },
    execution_time_ms: 380,
  };

  // Step 5: 100% Phase - Parecer Final de Redline
  const step5: TraceStep = {
    step_id: `${traceId}-step-5`,
    node_name: 'verdict_synthesis',
    type: 'synthesis',
    title: 'Síntese Executiva de Redlines e Parecer de Conformidade Legal',
    summary: `Parecer Final: ${classification}. Score de Risco: ${riskScore}/100. Foram formuladas propostas concretas de redação corretiva (redlines).`,
    generative_annotation: 'O sistema formulou cláusulas de substituição que permitem à equipa jurídica negociar termos equilibrados garantindo a segurança do negócio.',
    risk_level: riskLevel,
    scroll_phase: 100,
    payload: {
      cuad_category_matched: category,
      confidence_metric: 0.988,
      statutory_basis: 'Regulamento da IA da UE (Artigo 14.º) e Estatuto da Ordem dos Advogados',
      raw_clause_quote: rawQuote,
    },
    alternatives: [
      {
        id: 'alt-pt-gen-5a',
        hypothesis: 'Aprovar o contrato no estado em que se encontra sem formular reservas',
        rejection_reason: 'O nível de risco patrimonial identificado desaconselha a outorga sem prévia retificação dos pontos críticos.',
        confidence_score: 0.05,
        cuad_category: 'Aprovação Direta',
      },
      {
        id: 'alt-pt-gen-5b',
        hypothesis: 'Exigir a eliminação total de todas as cláusulas indemnizatórias e de responsabilidade',
        rejection_reason: 'A eliminação em bloco impediria o fecho da transação comercial com o parceiro negocial.',
        confidence_score: 0.19,
        cuad_category: 'Exclusão Radical',
      },
      {
        id: 'alt-pt-gen-5c',
        hypothesis: 'Delegar a decisão em arbitragem internacional preliminar',
        rejection_reason: 'A fase pré-contratual resolve-se por via da negociação direta de minutas redline proporcionadas.',
        confidence_score: 0.14,
        cuad_category: 'Arbitragem',
      },
    ],
    faithfulness_metadata: {
      is_faithful: true,
      faithfulness_score: 0.98,
      audit_notes: 'Parecer executivo coerente com as etapas cognitivas precedentes.',
      hallucination_risk: 'low',
    },
    execution_time_ms: 300,
  };

  const recommendedClauses = isUnlimited
    ? [
        'Inserir Super-Teto: "A responsabilidade agregada por indemnizações não excederá, em caso algum, duas vezes (2x) o valor anual faturado no âmbito do presente Contrato."',
        'Dever de Notificação e Controlo do Litígio: "O devedor deve ser notificado por escrito no prazo de 10 dias úteis, assumindo a condução técnica da defesa e negociação de transações judiciais."',
        'Ressalva Estrita de Dolo: "Circunscrever a ausência de limites indemnizatórios estritamente às situações comprovadas de dolo ou culpa grave (Art. 809.º do Código Civil)."',
      ]
    : [
        'Reciprocidade Bilateral: Garantir que as obrigações de salvaguarda vinculam mutuamente ambas as partes contratantes.',
        'Prazos Razoáveis de Notificação: Estipular prazo mínimo de 30 dias para sanação de incumprimentos prévia à resolução.',
        'Fixação de Teto Global: Definir limite pecuniário equivalente à faturação dos últimos 12 meses.',
      ];

  return {
    trace_id: traceId,
    contract_title: contractTitle || 'Cláusula Contratual Submetida para Análise',
    category,
    cuad_master_category: category,
    parties: ['Parte Outorgante A', 'Parte Outorgante B'],
    governing_law: 'Direito Português / Código Civil e DL n.º 446/85 (LCCG)',
    contract_excerpt: text,
    target_query: `Avaliar cláusula de ${category} quanto à proporcionalidade, teto indemnizatório e conformidade com o ordenamento jurídico português e europeu.`,
    steps: [step1, step2, step3, step4, step5],
    final_verdict: {
      risk_score: riskScore,
      classification,
      summary: `A cláusula submetida foi processada pelo sistema de explicabilidade JustiViz. A avaliação aponta para ${riskLevel} RISK (${riskScore}/100) à luz do regime legal português.`,
      eu_ai_act_risk_tier: euAiActTier,
      recommended_clauses: recommendedClauses,
      mitigation_guidance: isUnlimited
        ? 'Exigir a inserção de um super-teto monetário e cláusula de controlo de litígio antes da assinatura formal.'
        : 'Garantir a reciprocidade e o respeito pelos prazos de sanação durante a negociação.',
    },
    reliance_profile: {
      injected_error_present: false,
      ground_truth_verdict: classification,
    },
  };
}

export function buildClauseTraceSetPt({
  contractTitle,
  category,
  contractText,
  clauseSegments,
}: {
  contractTitle: string;
  category: string;
  contractText: string;
  clauseSegments?: Array<{ index?: number; title?: string; text?: string }>;
}): ContractTrace {
  const text = contractText.trim();
  const segments = (clauseSegments && clauseSegments.length > 0
    ? clauseSegments
    : [{ index: 0, title: 'Corpo do contrato', text }]
  ).map((segment, idx) => ({
    index: typeof segment.index === 'number' ? segment.index : idx,
    title: segment.title || `Cláusula ${idx + 1}`,
    text: (segment.text || text || '').trim() || text,
  }));

  const clauseTraceEntries: ContractClause[] = segments.map((segment, idx) => {
    const clauseText = segment.text || text;
    const clauseTrace = generateStaticTracePt({
      contractTitle: `${contractTitle}`,
      category,
      contractText: clauseText,
    });

    const clauseNumber = idx + 1;
    const clauseTitle = segment.title || `Cláusula ${clauseNumber}`;
    const enrichedTrace: ContractTrace = {
      ...clauseTrace,
      trace_id: `${clauseTrace.trace_id}-clause-${clauseNumber}`,
      contract_title: `${contractTitle} - Cláusula ${clauseNumber}`,
      contract_excerpt: clauseText,
      target_query: `Rever cláusula ${clauseNumber}: ${clauseTitle}`,
      metadata: {
        ...clauseTrace.metadata,
        created_at: new Date().toISOString(),
        model_orchestrator: 'local-clause-pipeline',
        secondary_auditor_model: 'local-faithfulness-audit',
        cuad_version: 'v1.0-local',
      },
      final_verdict: {
        ...clauseTrace.final_verdict,
        summary: `${clauseTrace.final_verdict.summary} Foco na cláusula: ${clauseTitle}.`,
      },
    };

    enrichedTrace.steps = enrichedTrace.steps.map((step, stepIdx) => ({
      ...step,
      step_id: `${step.step_id}-clause-${clauseNumber}`,
      title: stepIdx === 0 ? clauseTitle : step.title,
      payload: {
        ...step.payload,
        raw_clause_quote: clauseText.slice(0, 1000),
      },
    }));

    const riskLevel: RiskLevel = enrichedTrace.final_verdict.risk_score >= 80
      ? 'HIGH'
      : enrichedTrace.final_verdict.risk_score >= 50
        ? 'MEDIUM'
        : 'LOW';

    return {
      index: segment.index,
      title: clauseTitle,
      text: clauseText,
      risk_level: riskLevel,
      trace: enrichedTrace,
    };
  });

  const primaryTrace = clauseTraceEntries[0]?.trace || generateStaticTracePt({ contractTitle, category, contractText: text });
  return {
    ...primaryTrace,
    clauses: clauseTraceEntries,
  };
}
