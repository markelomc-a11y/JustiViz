import type { RiskLevel } from '../types';

const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: 'Risco Reduzido',
  MEDIUM: 'Risco Moderado',
  HIGH: 'Risco Elevado',
  CRITICAL: 'Risco Crítico',
};

export const formatRiskClassification = (classification: string | undefined): string => {
  if (!classification) return 'N/D';

  return classification.replace(/\b(CRITICAL|HIGH|MEDIUM|LOW)\b/g, (risk) => RISK_LABELS[risk as RiskLevel]);
};

export const formatRiskLevel = (risk: string | undefined): string => {
  if (!risk || !(risk in RISK_LABELS)) return 'N/D';
  return RISK_LABELS[risk as RiskLevel];
};