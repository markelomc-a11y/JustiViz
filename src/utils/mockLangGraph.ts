import type { FaithfulnessMetadata, NodeType, RiskLevel } from '../types';

export interface MockLangGraphContext {
  nodeName: string;
  title: string;
  summary: string;
  category: string;
  contractText: string;
  riskLevel: RiskLevel;
}

export interface MockFaithfulnessInput {
  summary: string;
  technicalPayload: Record<string, unknown> | object;
  nodeType: NodeType;
}

export const buildMockAnnotation = ({
  nodeName,
  title,
  summary,
  category,
  contractText,
  riskLevel,
}: MockLangGraphContext): string => {
  const excerpt = contractText.trim().replace(/\s+/g, ' ');
  const shortExcerpt = excerpt.length > 180 ? `${excerpt.slice(0, 180)}...` : excerpt;

  const roleMap: Record<string, string> = {
    extract_clauses: 'O LLM simulado segmentou a cláusula, isolou as obrigações aplicáveis e associou os termos à taxonomia jurídica.',
    classify_risk: 'O LLM simulado classificou a cláusula medindo a assimetria, o âmbito e a exposição comercial na matriz de risco.',
    check_precedent: 'O LLM simulado comparou a cláusula com precedentes de referência e práticas comerciais, sem exagerar a certeza jurídica.',
    faithfulness_audit: 'O auditor de fidelidade simulado verificou se a narrativa é sustentada pelos factos extraídos e não por especulação.',
    verdict_synthesis: 'O orquestrador simulado sintetizou a recomendação final a partir do percurso de estados, preservando a explicabilidade para revisão jurídica.',
  };

  const mover = roleMap[nodeName] || 'O LLM simulado traduziu o sinal jurídico numa explicação clara para revisão humana.';
  const tier = riskLevel === 'CRITICAL' ? 'crítico' : riskLevel === 'HIGH' ? 'elevado' : riskLevel === 'MEDIUM' ? 'moderado' : 'reduzido';

  return `${mover} Para ${category}, o excerto “${shortExcerpt}” foi avaliado como de risco ${tier}. A explicação mantém-se baseada nos factos extraídos e assinala os pressupostos que devem ser verificados por uma pessoa. ${summary}`;
};

export const runMockFaithfulnessAudit = ({
  summary,
  technicalPayload,
  nodeType,
}: MockFaithfulnessInput): FaithfulnessMetadata => {
  const payloadText = JSON.stringify(technicalPayload ?? {}).toLowerCase();
  const summaryText = summary.toLowerCase();
  const hasDirectSupport = payloadText.length > 0 && summaryText.length > 0;
  const isFaithful = hasDirectSupport && !summaryText.includes('hallucinated') && !summaryText.includes('guaranteed');
  const score = isFaithful ? 0.96 : 0.72;

  const risk = score >= 0.9 ? 'low' : score >= 0.75 ? 'medium' : 'high';

  return {
    is_faithful: isFaithful,
    faithfulness_score: score,
    audit_notes: `Auditoria LLM simulada para ${nodeType}: a narrativa ${isFaithful ? 'é consistente com os dados extraídos' : 'está parcialmente desligada das variáveis de estado extraídas'} e continua adequada para revisão humana.`,
    hallucination_risk: risk,
  };
};
