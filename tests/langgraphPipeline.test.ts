import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runLangGraphPipeline } from '../src/utils/langgraphPipeline';
import { classifyAgainstCuad } from '../src/utils/cuadClassifier';

test('LangGraph classifies a clause using CUAD evidence', async () => {
  const trace = await runLangGraphPipeline({
    contractTitle: 'CUAD termination test',
    category: 'General',
    contractText: "Either party may terminate this Agreement without cause at any time effective upon thirty (30) days' written notice.",
  });
  const decision = trace.steps.find((step) => step.node_name === 'classify_risk');
  assert.ok(decision);
  assert.equal(decision.payload.cuad_category_matched, 'Termination For Convenience');
  assert.equal(decision.payload.statutory_basis, 'CUADv1 annotated-answer retrieval');
  assert.match(String(decision.payload.state_variables?.source_document), /CENTRACK/);
});

test('classification exposes rejected fork paths in the decision trace', async () => {
  const trace = await runLangGraphPipeline({
    contractTitle: 'CUAD fork test', category: 'General',
    contractText: 'Neither party shall compete in the Territory during the term of this Agreement.',
  });
  const decision = trace.steps.find((step) => step.node_name === 'classify_risk');
  assert.ok(decision);
  assert.equal(decision.alternatives.length, 3);
  assert.ok(decision.alternatives.every((alternative) => alternative.rejection_reason.length > 0));
});

test('unmatched text does not receive a fabricated CUAD match', () => {
  const result = classifyAgainstCuad('A neutral sentence about office furniture and stationery.');
  assert.equal(result.category, 'No answered CUAD category match');
  assert.equal(result.similarity, 0);
});
