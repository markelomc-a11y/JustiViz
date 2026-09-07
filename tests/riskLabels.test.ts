import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatRiskClassification, formatRiskLevel } from '../src/utils/riskLabels';

test('risk labels are translated to European Portuguese', () => {
  assert.equal(formatRiskLevel('LOW'), 'Risco Reduzido');
  assert.equal(formatRiskLevel('MEDIUM'), 'Risco Moderado');
  assert.equal(formatRiskLevel('HIGH'), 'Risco Elevado');
  assert.equal(formatRiskLevel('CRITICAL'), 'Risco Crítico');
});

test('composed classifications preserve reasoning and translate the level', () => {
  assert.equal(
    formatRiskClassification('HIGH: avaliação agregada de 2 cláusulas'),
    'Risco Elevado: avaliação agregada de 2 cláusulas',
  );
  assert.equal(formatRiskClassification(undefined), 'N/D');
  assert.equal(
    formatRiskClassification('Critical Risk: Asymmetric Unbounded Liability / Overbroad Restriction'),
    'Risco Crítico: Responsabilidade ilimitada assimétrica / Restrição excessiva',
  );
});