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
    extract_clauses: 'The mock LLM segmented the clause, isolated operative duties, and mapped terms to the legal taxonomy.',
    classify_risk: 'The mock LLM classified the clause by measuring asymmetry, scope, and commercial exposure across the risk matrix.',
    check_precedent: 'The mock LLM cross-checked the clause against benchmark precedents and commercial practice without overstating legal certainty.',
    faithfulness_audit: 'The mock faithfulness auditor checked that the narrative is supported by the extracted facts and not inflated by speculation.',
    verdict_synthesis: 'The mock orchestrator synthesized the final recommendation from the state-machine path while preserving explainability for legal review.',
  };

  const mover = roleMap[nodeName] || 'The mock LLM translated the legal signal into a plain-language explanation for human review.';
  const tier = riskLevel === 'CRITICAL' ? 'critical' : riskLevel === 'HIGH' ? 'high' : riskLevel === 'MEDIUM' ? 'medium' : 'low';

  return `${mover} For ${category}, the clause excerpt “${shortExcerpt}” was evaluated as ${tier}-risk. The narrative explanation stays grounded in extracted facts and flags where a human reviewer should verify assumptions. ${summary}`;
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
    audit_notes: `Mock LLM audit for ${nodeType}: the narrative is ${isFaithful ? 'consistent with the extracted payload' : 'partially detached from the extracted state variables'} and remains suitable for human review.`,
    hallucination_risk: risk,
  };
};
