import type { ContractTrace, RiskLevel, TraceStep } from '../types';

export interface CuadAnnotatedExample {
  documentTitle: string;
  category: string;
  question: string;
  answer: string;
  context: string;
  answerStart: number;
}

export const CUAD_ANNOTATED_SUBSET: CuadAnnotatedExample[] = [
  {
    documentTitle: 'CENTRACKINTERNATIONALINC_10_29_1999-EX-10.3-WEB SITE HOSTING AGREEMENT',
    category: 'Termination For Convenience',
    question: 'Highlight the parts (if any) of this contract related to "Termination For Convenience".',
    answer: "Either party may terminate this Agreement without cause at any time effective upon thirty (30) days' written notice.",
    context: ", which notice must be given not less than fifteen (15) days before the end of the respective initial or renewal term.\n\nEither party may terminate this Agreement without cause at any time effective upon thirty (30) days' written notice. Notwithstanding anything to the contrary contained in this Agreement, no termination of this Agreement for any reason whatsoever shall relieve the Customer of the obligation to pa",
    answerStart: 10880,
  },
  {
    documentTitle: 'ADAMSGOLFINC_03_21_2005-EX-10.17-ENDORSEMENT AGREEMENT',
    category: 'Non-Compete',
    question: 'Highlight the parts (if any) of this contract related to "Non-Compete".',
    answer: "When endorsing a non-competitive product, under no circumstances shall CONSULTANT wear, play, use, hold or in any way be associated with an ADAMS GOLF competitor's Product.",
    context: "or changed in appearance in the endorsement in any manner whatsoever without the express written consent of ADAMS GOLF. When endorsing a non-competitive product, under no circumstances shall CONSULTANT wear, play, use, hold or in any way be associated with an ADAMS GOLF competitor's Product.\n\n7. CONSULTANT'S SATISFACTION OF MANDATORY PRODUCT",
    answerStart: 5347,
  },
  {
    documentTitle: 'KIROMICBIOPHARMA,INC_05_11_2020-EX-10.23-CONSULTING AGREEMENT',
    category: 'Non-Compete',
    question: 'Highlight the parts (if any) of this contract related to "Non-Compete".',
    answer: "Without limiting the foregoing, Consultant agrees to use his or her best efforts (A) to segregate Consultant's",
    context: 'the formation of any business or commercial entity in the Field of Interest or otherwise competitive with the Company. Without limiting the foregoing, Consultant agrees to use his or her best efforts (A) to segregate Consultant\'s 844.KEY.CURE | www.kiromic.com PAGE 3',
    answerStart: 10361,
  },
  {
    documentTitle: 'DovaPharmaceuticalsInc_20181108_10-Q_EX-10.2_11414857_EX-10.2_Promotion Agreement',
    category: 'Non-Compete',
    question: 'Highlight the parts (if any) of this contract related to "Non-Compete".',
    answer: '[***], neither Valeant nor its Affiliates shall, directly or indirectly, [***] in the Territory other than the Product; provided that if the Agreement is terminated by Dova pursuant to [***], then any Tail Period shall be immediately terminated if either Valeant or any of its Affiliates, directly or indirectly, [***] in the Territory other than the Product during such Tail Period.',
    context: 'it of the Parties as expressly contemplated hereby.\n\n2.3 Non-Competition; Non-Solicitation.\n\n2.3.1 Non-Competition. (a) [***], neither Valeant nor its Affiliates shall, directly or indirectly, [***] in the Territory other than the Product; provided that if the Agreement is terminated by Dova pursuant to [***], then any Tail Period shall be immediately terminated if either Valeant or any of its Affiliates, directly or indirectly, [***] in the Territory other than the Product during such Tail Period.',
    answerStart: 32047,
  },
];

const makeStep = (example: CuadAnnotatedExample, index: number): TraceStep => {
  const risk: RiskLevel = example.category === 'Non-Compete' ? 'HIGH' : 'MEDIUM';
  const id = `cuad-${index + 1}`;
  return {
    step_id: `${id}-evidence`, node_name: 'extract_clauses', type: 'extraction',
    title: `CUAD evidence: ${example.category}`,
    summary: `The clause is an answered CUAD annotation for ${example.category}.`,
    generative_annotation: 'The displayed quote is copied from the corpus annotation and retains its source offset.',
    risk_level: risk, scroll_phase: 25, is_critical_node: false,
    payload: {
      cuad_category_matched: example.category,
      confidence_metric: 1,
      raw_clause_quote: example.answer,
      state_variables: { source: 'CUADv1.json', answer_start: example.answerStart, question: example.question },
    },
    alternatives: [],
    faithfulness_metadata: { is_faithful: true, faithfulness_score: 1, audit_notes: 'Verbatim CUAD answer span.', hallucination_risk: 'low' },
    execution_time_ms: 0,
  };
};

export function extractCuadSubset(examples: CuadAnnotatedExample[] = CUAD_ANNOTATED_SUBSET): ContractTrace[] {
  return examples.map((example, index) => {
    const step = makeStep(example, index);
    const traceId = `cuad-corpus-${index + 1}`;
    const verdict = {
      risk_score: example.category === 'Non-Compete' ? 72 : 58,
      classification: `CUAD ${example.category}`,
      summary: 'Corpus-backed clause evidence for human legal review.',
      eu_ai_act_risk_tier: 'Limited Risk' as const,
      recommended_clauses: ['Review scope, duration, and symmetry with counsel.'],
      mitigation_guidance: 'Use the quoted CUAD evidence as a retrieval benchmark, not legal advice.',
    };
    return {
      trace_id: traceId,
      contract_title: example.documentTitle,
      category: `CUAD: ${example.category}`,
      cuad_master_category: example.category,
      parties: [],
      governing_law: 'Not supplied by the CUAD annotation',
      contract_excerpt: example.context,
      target_query: example.question,
      steps: [step],
      final_verdict: verdict,
      clauses: [{ index: 1, title: example.category, text: example.answer, risk_level: step.risk_level, trace: undefined }],
      metadata: { created_at: '2021-03-11', model_orchestrator: 'CUADv1 extraction', secondary_auditor_model: 'none', cuad_version: 'CUADv1' },
    };
  });
}

export const CUAD_CASE_STUDIES = extractCuadSubset();
