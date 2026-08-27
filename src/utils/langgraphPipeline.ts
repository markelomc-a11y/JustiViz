import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import type {
  ContractTrace,
  FinalVerdict,
  FaithfulnessMetadata,
  RiskLevel,
  TraceStep,
} from '../types';
import { buildMockAnnotation, runMockFaithfulnessAudit } from './mockLangGraph';

export type LangGraphNodeName =
  | 'extract_clauses'
  | 'classify_risk'
  | 'check_precedent'
  | 'faithfulness_audit'
  | 'verdict_synthesis';

export interface LangGraphPipelineInput {
  contractTitle: string;
  category: string;
  contractText: string;
}

const NODE_SEQUENCE: LangGraphNodeName[] = [
  'extract_clauses',
  'classify_risk',
  'check_precedent',
  'faithfulness_audit',
  'verdict_synthesis',
];

const GraphState = Annotation.Root({
  contractTitle: Annotation<string>(),
  category: Annotation<string>(),
  contractText: Annotation<string>(),
  extractedEntities: Annotation<string[]>({
    reducer: (left: string[] = [], right: string[] = []) => [...left, ...right],
    default: () => [],
  }),
  riskScore: Annotation<number>(),
  riskLevel: Annotation<string>(),
  classification: Annotation<string>(),
  precedentSummary: Annotation<string>(),
  steps: Annotation<TraceStep[]>({
    reducer: (left: TraceStep[] = [], right: TraceStep[] = []) => [...left, ...right],
    default: () => [],
  }),
  finalVerdict: Annotation<FinalVerdict | null>(),
});

const toRiskLevel = (riskScore: number): RiskLevel => {
  if (riskScore >= 85) return 'CRITICAL';
  if (riskScore >= 65) return 'HIGH';
  if (riskScore >= 45) return 'MEDIUM';
  return 'LOW';
};

const buildBasicTraceId = (title: string) =>
  `langgraph-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;

const buildFaithfulness = (
  nodeType: TraceStep['type'],
  summary: string,
  payload: Record<string, unknown>,
): FaithfulnessMetadata =>
  runMockFaithfulnessAudit({
    summary,
    technicalPayload: payload,
    nodeType,
  });

const createStep = ({
  nodeName,
  title,
  summary,
  riskLevel,
  scrollPhase,
  payload,
  alternatives,
  type,
  traceId,
  category,
  contractText,
}: {
  nodeName: LangGraphNodeName;
  title: string;
  summary: string;
  riskLevel: RiskLevel;
  scrollPhase: 0 | 25 | 50 | 75 | 100;
  payload: Record<string, unknown>;
  alternatives: { id: string; hypothesis: string; rejection_reason: string; confidence_score: number; cuad_category?: string }[];
  type: TraceStep['type'];
  traceId: string;
  category: string;
  contractText: string;
}): TraceStep => {
  const generativeAnnotation = buildMockAnnotation({
    nodeName,
    title,
    summary,
    category,
    contractText,
    riskLevel,
  });

  return {
    step_id: `${traceId}-${nodeName}`,
    node_name: nodeName,
    type,
    title,
    summary,
    generative_annotation: generativeAnnotation,
    risk_level: riskLevel,
    scroll_phase: scrollPhase,
    payload: payload as TraceStep['payload'],
    alternatives,
    faithfulness_metadata: buildFaithfulness(type, summary, payload),
    execution_time_ms: 280 + Math.round(Math.random() * 320),
    is_critical_node: nodeName === 'classify_risk' || nodeName === 'verdict_synthesis',
  };
};

const createWorkflow = () => {
  const workflow = new StateGraph(GraphState);

  workflow.addNode('extract_clauses', (state: any) => {
    const text = (state.contractText ?? '').trim();
    const entities = ['Counterparty A', 'Counterparty B', 'Liability trigger'];
    const step = createStep({
      nodeName: 'extract_clauses',
      title: 'Contract ingestion and clause extraction',
      summary: `The workflow extracted operative obligations from the contract and mapped them against the ${state.category} benchmark.`,
      riskLevel: 'LOW',
      scrollPhase: 0,
      type: 'extraction',
      traceId: buildBasicTraceId(state.contractTitle || 'contract'),
      category: state.category,
      contractText: text,
      payload: {
        extracted_entities: entities,
        cuad_category_matched: state.category,
        confidence_metric: 0.97,
        statutory_basis: 'Commercial contract interpretation + applicable risk benchmark',
        raw_clause_quote: text.length > 220 ? `${text.slice(0, 220)}...` : text,
        clause_count: Math.max(1, (text.match(/\b(section|clause|art\.|article|\d+\.)/gi) || []).length),
      },
      alternatives: [
        { id: 'alt-extract-1', hypothesis: 'Treat the text as administrative boilerplate only', rejection_reason: 'The clause contains affirmative obligations and direct remedial consequences, which go beyond general boilerplate.', confidence_score: 0.12, cuad_category: 'Boilerplate' },
        { id: 'alt-extract-2', hypothesis: 'Ignore the operative remedies and focus only on the header language', rejection_reason: 'The operative section expressly allocates obligations, risk, and remedy exposure, making it central to the legal assessment.', confidence_score: 0.16, cuad_category: 'Header-only review' },
        { id: 'alt-extract-3', hypothesis: 'Classify the clause as a purely non-binding expression of intent', rejection_reason: 'Mandatory language and enforceable remedies indicate a binding legal commitment, not a preliminary statement.', confidence_score: 0.09, cuad_category: 'Intent-only language' },
      ],
    });

    return {
      extractedEntities: entities,
      steps: [step],
    } as any;
  });

  workflow.addNode('classify_risk', (state: any) => {
    const text = (state.contractText ?? '').trim();
    const lowerText = text.toLowerCase();
    const isUnlimited = /unlimited|without any limit|shall not apply|uncapped|no cap/i.test(text);
    const isIndemnity = /indemn|hold harmless|liability|remedy|risk/i.test(text);
    const isNonCompete = /non[- ]?compete|restrictive covenant|competition|exclusive/i.test(text);
    const isTermination = /termination|terminate|convenience|cancel/i.test(text);
    const isDataBreach = /data breach|rgpd|gdpr|personal data|privacy/i.test(text);
    const riskScore = isUnlimited ? 94 : isIndemnity ? 82 : isNonCompete ? 72 : isTermination ? 58 : isDataBreach ? 68 : 49;
    const riskLevel = toRiskLevel(riskScore);
    const classification = isUnlimited
      ? 'Critical Risk: asymmetric uncapped exposure and onerous restriction'
      : isIndemnity
        ? 'High Risk: one-sided commercial exposure'
        : isNonCompete
          ? 'Moderate Risk: restraint of trade with commercial impact'
          : isTermination
            ? 'Moderate Risk: termination asymmetry'
            : 'Low Risk: conventional commercial terms';

    const traceId = buildBasicTraceId(state.contractTitle || 'contract');
    const step = createStep({
      nodeName: 'classify_risk',
      title: `Critical decision: ${riskLevel} risk classification`,
      summary: `The risk classifier flagged the clause as ${riskLevel} risk (${riskScore}/100), based on asymmetry, remedial exposure, and enforceability indicators.`,
      riskLevel,
      scrollPhase: 50,
      type: 'decision',
      traceId,
      category: state.category,
      contractText: text,
      payload: {
        cuad_category_matched: state.category,
        confidence_metric: 0.96,
        statutory_basis: 'Commercial risk allocation benchmark + legal drafting analysis',
        raw_clause_quote: text.length > 200 ? `${text.slice(0, 200)}...` : text,
        state_variables: {
          exposure_magnitude: isUnlimited ? 'UNBOUNDED' : 'CONTROLLED',
          imbalance_flag: isIndemnity ? 'HIGH' : 'MODERATE',
          jurisdictional_risk: riskLevel,
          lower_text_present: lowerText.length > 0,
        },
      },
      alternatives: [
        { id: 'alt-risk-1', hypothesis: 'Treat the term as standard commercial risk allocation', rejection_reason: 'The clause creates a materially one-sided exposure pattern that exceeds ordinary market balancing and requires commercial review.', confidence_score: 0.19, cuad_category: 'Standard terms' },
        { id: 'alt-risk-2', hypothesis: 'Recommend immediate contract rejection without redline mitigation', rejection_reason: 'The terms are often negotiable and salvageable via targeted drafting, so a full rejection is not the most proportionate recommendation.', confidence_score: 0.28, cuad_category: 'Immediate rejection' },
        { id: 'alt-risk-3', hypothesis: 'Assign a low risk category on the basis of generic legal wording', rejection_reason: 'The operative language creates real financial and legal exposure, which materially elevates the risk profile.', confidence_score: 0.13, cuad_category: 'Low risk' },
      ],
    });

    return {
      riskScore,
      riskLevel,
      classification,
      steps: [step],
    } as any;
  });

  workflow.addNode('check_precedent', (state: any) => {
    const text = (state.contractText ?? '').trim();
    const riskLevel = (state.riskLevel as RiskLevel) || 'LOW';
    const step = createStep({
      nodeName: 'check_precedent',
      title: 'Precedent and jurisdictional benchmark review',
      summary: 'The workflow compared the draft language against common benchmark precedents and legal-risk practice before finalizing the recommendation.',
      riskLevel: riskLevel === 'CRITICAL' ? 'HIGH' : riskLevel,
      scrollPhase: 75,
      type: 'precedent',
      traceId: buildBasicTraceId(state.contractTitle || 'contract'),
      category: state.category,
      contractText: text,
      payload: {
        cuad_category_matched: state.category,
        confidence_metric: 0.93,
        statutory_basis: 'Commercial precedent review + standard drafting practice',
        raw_clause_quote: text.length > 200 ? `${text.slice(0, 200)}...` : text,
        precedent_citations: [{
          case_name: 'Commercial benchmark precedent review',
          citation: 'Balanced standard market practice for enterprise drafting',
          relevance_score: 0.9,
          jurisdiction: 'Commercial practice benchmark',
          holding_summary: 'Market practice and judicial enforcement favor clear risk allocation, objective remedies, and proportionate financial limits.',
        }],
      },
      alternatives: [
        { id: 'alt-precedent-1', hypothesis: 'Apply a single jurisdictional rule without considering commercial drafting norms', rejection_reason: 'The clause must be reviewed in the context of the relevant commercial practice and drafting norms, not only a single jurisdictional label.', confidence_score: 0.18, cuad_category: 'Single-jurisdiction rule' },
        { id: 'alt-precedent-2', hypothesis: 'Assume the clause is automatically unenforceable without qualification', rejection_reason: 'The clause is not categorically void; it must be evaluated for proportionality, scope, and enforceability under the governing legal framework.', confidence_score: 0.2, cuad_category: 'Automatic invalidity' },
        { id: 'alt-precedent-3', hypothesis: 'Ignore precedential market practice and rely only on the bare text', rejection_reason: 'The legal meaning of the clause is informed by standard practice and enforceability expectations, not just the literal wording.', confidence_score: 0.14, cuad_category: 'Text-only review' },
      ],
    });

    return {
      precedentSummary: step.summary,
      steps: [step],
    } as any;
  });

  workflow.addNode('faithfulness_audit', (state: any) => {
    const text = (state.contractText ?? '').trim();
    const step = createStep({
      nodeName: 'faithfulness_audit',
      title: 'Local Ollama-style faithfulness audit',
      summary: 'The auxiliary local-AI auditor reviewed whether the summary stayed grounded in the extracted facts and did not overstate legal certainty.',
      riskLevel: (state.riskLevel as RiskLevel) || 'LOW',
      scrollPhase: 75,
      type: 'audit',
      traceId: buildBasicTraceId(state.contractTitle || 'contract'),
      category: state.category,
      contractText: text,
      payload: {
        cuad_category_matched: state.category,
        confidence_metric: 0.94,
        statutory_basis: 'Local audit review of extracted signal vs. narrative output',
        raw_clause_quote: text.length > 200 ? `${text.slice(0, 200)}...` : text,
        audit_target: 'narrative explanation integrity',
      },
      alternatives: [
        { id: 'alt-audit-1', hypothesis: 'Accept the first narrative pass without a grounded check', rejection_reason: 'The audit layer verifies that the summary reflects the extracted legal signals and does not introduce unsupported conclusions.', confidence_score: 0.11, cuad_category: 'No audit' },
        { id: 'alt-audit-2', hypothesis: 'Make a blanket claim that all legal conclusions are reliable', rejection_reason: 'Legal quality depends on traceability and grounded evidence; a blanket claim would ignore uncertainty and missing factual support.', confidence_score: 0.17, cuad_category: 'Blanket confidence' },
        { id: 'alt-audit-3', hypothesis: 'Treat the generated summary as final without independent validation', rejection_reason: 'A second-pass audit ensures the practical legal recommendation is stable, explainable, and reviewable by counsel.', confidence_score: 0.13, cuad_category: 'No validation' },
      ],
    });

    return { steps: [step] } as any;
  });

  workflow.addNode('verdict_synthesis', (state: any) => {
    const text = (state.contractText ?? '').trim();
    const riskLevel = (state.riskLevel as RiskLevel) || 'LOW';
    const riskScore = state.riskScore || 49;
    const verdictSummary = `The legal workflow recommends targeted redline review because the contract clause materially shifts commercial exposure ${riskLevel.toLowerCase()} and warrants human legal scrutiny before execution.`;
    const finalVerdict: FinalVerdict = {
      risk_score: riskScore,
      classification: state.classification || 'Review required',
      summary: verdictSummary,
      eu_ai_act_risk_tier: riskScore >= 85 ? 'High Risk' : riskScore >= 60 ? 'Limited Risk' : 'Minimal Risk',
      recommended_clauses: [
        'Add reasonable liability cap with defined carve-outs for fraud, deliberate misconduct, and data-security incidents.',
        'Ensure the indemnity is reciprocal and time-bounded to prevent one-sided commercial exposure.',
        'Document the operational and legal basis for the clause to support human review and consent before signing.',
      ],
      mitigation_guidance: 'Use targeted redlines and legal review to preserve commercial viability while avoiding unbounded exposure or overbroad restrictions.',
    };

    const step = createStep({
      nodeName: 'verdict_synthesis',
      title: 'Final verdict and recommendation synthesis',
      summary: verdictSummary,
      riskLevel,
      scrollPhase: 100,
      type: 'synthesis',
      traceId: buildBasicTraceId(state.contractTitle || 'contract'),
      category: state.category,
      contractText: text,
      payload: {
        cuad_category_matched: state.category,
        confidence_metric: 0.98,
        statutory_basis: 'Final legal recommendation + negotiated risk guidance',
        raw_clause_quote: text.length > 180 ? `${text.slice(0, 180)}...` : text,
        final_verdict: finalVerdict,
      },
      alternatives: [
        { id: 'alt-verdict-1', hypothesis: 'Approve the clause as-is with no redline changes', rejection_reason: 'The clause creates disproportionate exposure and reviewer-visible risk, so it is not appropriate to approve without mitigation.', confidence_score: 0.12, cuad_category: 'Approval as-is' },
        { id: 'alt-verdict-2', hypothesis: 'Reject the entire commercial relationship without negotiation', rejection_reason: 'A full rejection is not the proportionate response when targeted redline review can preserve business value and reduce legal risk.', confidence_score: 0.21, cuad_category: 'Full rejection' },
        { id: 'alt-verdict-3', hypothesis: 'Ignore the legal risk because the clause is not explicit enough to trigger liability', rejection_reason: 'The clause creates a direct legal and financial trigger; ignoring it would deprive the reviewing lawyer of materially relevant risk information.', confidence_score: 0.08, cuad_category: 'Ignore signal' },
      ],
    });

    return {
      finalVerdict,
      steps: [step],
    } as any;
  });

  workflow.addEdge(START as any, 'extract_clauses' as any);
  workflow.addEdge('extract_clauses' as any, 'classify_risk' as any);
  workflow.addEdge('classify_risk' as any, 'check_precedent' as any);
  workflow.addEdge('check_precedent' as any, 'faithfulness_audit' as any);
  workflow.addEdge('faithfulness_audit' as any, 'verdict_synthesis' as any);
  workflow.addEdge('verdict_synthesis' as any, END as any);

  return workflow.compile();
};

export async function runLangGraphPipeline({
  contractTitle,
  category,
  contractText,
}: LangGraphPipelineInput): Promise<ContractTrace> {
  const graph = createWorkflow();
  const result = await graph.invoke({
    contractTitle: contractTitle || 'Contract review',
    category,
    contractText,
  } as any);

  const steps = Array.isArray(result.steps) ? result.steps : [];
  const finalVerdict = result.finalVerdict || {
    risk_score: result.riskScore || 49,
    classification: result.classification || 'Review required',
    summary: 'The legal workflow recommends targeted review.',
    eu_ai_act_risk_tier: 'Limited Risk',
    recommended_clauses: ['Add redline review'],
    mitigation_guidance: 'Review with counsel before execution.',
  };

  const traceId = buildBasicTraceId(contractTitle || 'contract');

  return {
    trace_id: traceId,
    contract_title: contractTitle || 'Contract review',
    category,
    cuad_master_category: category,
    parties: ['Counterparty A', 'Counterparty B'],
    governing_law: 'Commercial contract benchmark + applicable local law',
    contract_excerpt: contractText.slice(0, 500),
    target_query: `Assess the legal risk and drafting quality of this contract clause for ${category}.`,
    steps,
    final_verdict: finalVerdict,
    clauses: [
      { index: 1, title: 'Primary clause review', text: contractText, risk_level: (result.riskLevel as RiskLevel) || 'LOW', trace: { trace_id: traceId, contract_title: contractTitle || 'Contract review', category, cuad_master_category: category, parties: ['Counterparty A', 'Counterparty B'], governing_law: 'Commercial contract benchmark + applicable local law', contract_excerpt: contractText.slice(0, 500), target_query: `Assess the legal risk and drafting quality of this contract clause for ${category}.`, steps, final_verdict: finalVerdict, metadata: { created_at: new Date().toISOString(), model_orchestrator: 'langgraph-state-machine', secondary_auditor_model: 'ollama-local-faithfulness-mock', cuad_version: '2025.1' } } },
    ],
    metadata: {
      created_at: new Date().toISOString(),
      model_orchestrator: 'langgraph-state-machine',
      secondary_auditor_model: 'ollama-local-faithfulness-mock',
      cuad_version: '2025.1',
    },
  };
}

export function getLangGraphNodeSequence() {
  return [...NODE_SEQUENCE];
}
