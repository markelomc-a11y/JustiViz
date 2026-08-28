import { CUAD_ANNOTATED_SUBSET, type CuadAnnotatedExample } from '../data/cuadTraces';
import type { RiskLevel } from '../types';

export interface CuadClassification {
  category: string;
  score: number;
  riskLevel: RiskLevel;
  similarity: number;
  matchedEvidence: string;
  sourceDocument: string;
  answerStart: number;
}

const tokenize = (value: string): Set<string> => new Set(
  value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]{3,}/g) ?? []
);

const similarity = (left: Set<string>, right: Set<string>): number => {
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  left.forEach((token) => { if (right.has(token)) overlap += 1; });
  return overlap / Math.max(left.size, right.size);
};

const levelForScore = (score: number): RiskLevel => {
  if (score >= 85) return 'CRITICAL';
  if (score >= 65) return 'HIGH';
  if (score >= 45) return 'MEDIUM';
  return 'LOW';
};

export function classifyAgainstCuad(
  contractText: string,
  examples: CuadAnnotatedExample[] = CUAD_ANNOTATED_SUBSET,
): CuadClassification {
  const inputTokens = tokenize(contractText);
  const ranked = examples.map((example) => {
    const answerSimilarity = similarity(inputTokens, tokenize(example.answer));
    const contextSimilarity = similarity(inputTokens, tokenize(example.context));
    return { example, similarity: answerSimilarity * 0.75 + contextSimilarity * 0.25 };
  }).sort((left, right) => right.similarity - left.similarity);

  const best = ranked[0];
  if (!best || best.similarity === 0) {
    return {
      category: 'No answered CUAD category match', score: 20, riskLevel: 'LOW', similarity: 0,
      matchedEvidence: '', sourceDocument: '', answerStart: -1,
    };
  }

  const score = Math.round(Math.min(100, 20 + best.similarity * 80));
  return {
    category: best.example.category,
    score,
    riskLevel: levelForScore(score),
    similarity: Number(best.similarity.toFixed(4)),
    matchedEvidence: best.example.answer,
    sourceDocument: best.example.documentTitle,
    answerStart: best.example.answerStart,
  };
}
