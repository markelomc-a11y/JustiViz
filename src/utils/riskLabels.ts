import type { RiskLevel } from '../types';

const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: 'Risco Reduzido',
  MEDIUM: 'Risco Moderado',
  HIGH: 'Risco Elevado',
  CRITICAL: 'Risco Crítico',
};

export const formatRiskClassification = (classification: string | undefined): string => {
  if (!classification) return 'N/D';

  const translatedClassifications: Record<string, string> = {
    'Critical Risk: Asymmetric Unbounded Liability / Overbroad Restriction': 'Risco Crítico: Responsabilidade ilimitada assimétrica / Restrição excessiva',
    'High Risk: One-Sided Commercial Exposure': 'Risco Elevado: Exposição comercial unilateral',
    'Moderate Risk: Asymmetric Operational Termination Rights': 'Risco Moderado: Direitos operacionais de cessação assimétricos',
    'Low Risk: Standard Bilateral Commercial Covenants': 'Risco Reduzido: Obrigações comerciais bilaterais padrão',
    'Standard Commercial Risk Allocation': 'Distribuição comercial de risco padrão',
  };
  if (translatedClassifications[classification]) return translatedClassifications[classification];

  return classification.replace(/\b(CRITICAL|HIGH|MEDIUM|LOW)\b/g, (risk) => RISK_LABELS[risk as RiskLevel]);
};

export const formatRiskLevel = (risk: string | undefined): string => {
  if (!risk || !(risk in RISK_LABELS)) return 'N/D';
  return RISK_LABELS[risk as RiskLevel];
};

export const formatAiActRiskTier = (tier: string | undefined): string => ({
  'Minimal Risk': 'Risco Mínimo',
  'Limited Risk': 'Risco Limitado',
  'High Risk': 'Risco Elevado',
  'Unacceptable Risk': 'Risco Inaceitável',
}[tier || ''] || 'N/D');