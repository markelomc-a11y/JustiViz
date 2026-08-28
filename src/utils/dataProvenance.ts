import type { ContractTrace, TraceDataProvenance } from '../types';

const PROVENANCE_LABELS: Record<TraceDataProvenance, string> = {
  corpus: 'Dados reais do corpus CUAD',
  fixture: 'Caso demonstrativo simulado',
  'user-input': 'Documento fornecido pelo utilizador',
  'live-analysis': 'Análise gerada pelo serviço de IA',
  'local-analysis': 'Análise local simulada',
};

export const getTraceProvenance = (trace: ContractTrace): TraceDataProvenance =>
  trace.metadata?.data_provenance || 'fixture';

export const getTraceProvenanceLabel = (trace: ContractTrace): string =>
  PROVENANCE_LABELS[getTraceProvenance(trace)];