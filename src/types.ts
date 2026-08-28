/**
 * JustiViz - Explainable AI (XAI) & Multimedia Narrative Visualization
 * Data Types & JSON Trace Schema Definition
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NodeName = 
  | 'extract_clauses' 
  | 'classify_risk' 
  | 'check_precedent' 
  | 'faithfulness_audit' 
  | 'verdict_synthesis';

export type NodeType = 'input' | 'extraction' | 'decision' | 'precedent' | 'audit' | 'synthesis';

export interface ForkedAlternative {
  id: string;
  hypothesis: string;
  rejection_reason: string;
  confidence_score: number;
  cuad_category?: string;
  impact_assessment?: string;
}

export interface FaithfulnessMetadata {
  is_faithful: boolean;
  faithfulness_score: number; // 0.0 to 1.0 (e.g. 0.96)
  audit_notes: string;
  hallucination_risk: 'low' | 'medium' | 'high';
  discrepancies?: string[];
  audited_by?: string;
  last_verified_timestamp?: string;
}

export interface TechnicalPayload {
  raw_clause_quote?: string;
  cuad_category_matched?: string;
  confidence_metric?: number;
  statutory_basis?: string;
  extracted_entities?: string[];
  embeddings_cosine_similarity?: number;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  state_variables?: Record<string, any>;
  precedent_citations?: {
    case_name: string;
    citation: string;
    relevance_score: number;
    jurisdiction: string;
    holding_summary?: string;
  }[];
  raw_api_response?: Record<string, any>;
}

export interface TraceStep {
  step_id: string;
  node_name: NodeName;
  type: NodeType;
  title: string;
  summary: string; // Macro level: Accessible plain-language narrative for legal professionals
  generative_annotation: string; // Secondary LLM annotation explaining legal jargon and reasoning
  risk_level: RiskLevel;
  scroll_phase: 0 | 25 | 50 | 75 | 100; // Trigger position along the scrollytelling path
  payload: TechnicalPayload; // Micro level: Technical API and parameter data
  alternatives: ForkedAlternative[]; // Rejected paths (at least 3 per critical decision)
  faithfulness_metadata: FaithfulnessMetadata;
  execution_time_ms?: number;
  is_critical_node?: boolean;
}

export interface FinalVerdict {
  risk_score: number; // 0 - 100
  classification: string;
  summary: string;
  eu_ai_act_risk_tier: 'Minimal Risk' | 'Limited Risk' | 'High Risk' | 'Unacceptable Risk';
  recommended_clauses: string[];
  mitigation_guidance: string;
}

export interface RelianceProfile {
  injected_error_present: boolean;
  error_description?: string;
  ground_truth_verdict?: string;
  error_step_id?: string;
}

export interface ContractClause {
  index: number;
  title: string;
  text: string;
  risk_level?: RiskLevel;
  trace?: ContractTrace;
}

export interface ContractTrace {
  trace_id: string;
  contract_title: string;
  category: string; // e.g. "CUAD: Indemnity & IP Infringement"
  cuad_master_category: string;
  parties: string[];
  governing_law: string;
  contract_excerpt: string;
  target_query: string;
  steps: TraceStep[];
  final_verdict: FinalVerdict;
  clauses?: ContractClause[];
  reliance_profile?: RelianceProfile;
  metadata?: {
    created_at: string;
    model_orchestrator: string;
    secondary_auditor_model: string;
    cuad_version: string;
    data_provenance?: TraceDataProvenance;
  };
}

export type TraceDataProvenance = 'corpus' | 'fixture' | 'user-input' | 'live-analysis' | 'local-analysis';

export type ActiveViewMode = 'scrollytelling' | 'reliance_lab' | 'custom_analyzer';

export type ZoomLevel = 'macro' | 'micro';

// D3 Node & Link Types for Graph Rendering
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  step_id?: string;
  title: string;
  node_name: NodeName | 'rejected_alternative' | 'root_contract';
  type: NodeType | 'alternative';
  risk_level?: RiskLevel;
  is_active: boolean;
  is_rejected?: boolean;
  is_critical?: boolean;
  is_faithful?: boolean;
  summary?: string;
  confidence?: number;
  rejection_reason?: string;
  step_data?: TraceStep;
  parent_id?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  depth: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  is_rejected?: boolean;
  label?: string;
}

export interface RelianceUserRecord {
  contract_id: string;
  user_action: 'ACCEPT' | 'REJECT_ERROR';
  agent_is_correct: boolean;
  time_to_decide_ms: number;
  mode_used: 'scrollytelling' | 'raw_logs';
  outcome: 'APPROPRIATE_RELIANCE' | 'OVERRELIANCE' | 'UNDERRELIANCE' | 'APPROPRIATE_SELF_RELIANCE';
}
