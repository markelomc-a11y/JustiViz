import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'agent'))

import langgraph_service
from langgraph_service import analyze


def test_python_langgraph_returns_complete_trace():
    trace = analyze({
        'contractTitle': 'Teste de pagamento',
        'category': 'Avaliação geral',
        'contractText': 'SECTION 1. PAYMENT. Payment is due within thirty days.',
    })

    assert trace['metadata']['model_orchestrator'] == 'langgraph-python'
    assert len(trace['steps']) == 5
    assert trace['steps'][1]['payload']['state_variables']['retrieval'] == 'tfidf_cosine'


def test_python_langgraph_analyses_each_clause_independently():
    trace = analyze({
        'contractTitle': 'Contrato com cláusulas',
        'category': 'Avaliação geral',
        'contractText': 'SECTION 1. PAYMENT. Payment is due in thirty days.\n\nSECTION 2. CONFIDENTIALITY. Each party shall keep information confidential.',
    })

    assert len(trace['clauses']) == 2
    assert trace['clauses'][0]['trace']['contract_title'].endswith('Cláusula 1')
    assert trace['clauses'][1]['trace']['contract_title'].endswith('Cláusula 2')
    assert trace['clauses'][0]['trace']['steps'][0]['step_id'] != trace['clauses'][1]['trace']['steps'][0]['step_id']


def test_selected_legal_category_controls_retrieval_source():
    trace = analyze({
        'contractTitle': 'DPA de teste',
        'category': 'RGPD (Regulamento UE 2016/679)',
        'contractText': 'O subcontratante deve notificar uma violação de dados pessoais sem demora.',
    })

    retrieval_state = trace['steps'][1]['payload']['state_variables']
    assert retrieval_state['retrieval'] == 'legal_framework_keywords'
    assert '2016/679' in trace['metadata']['legal_source_name']
    assert 'eur-lex.europa.eu' in trace['metadata']['legal_source_url']
    assert all('corpus CUAD' not in step['summary'] for step in trace['steps'])
    assert all('corpus CUAD' not in step['summary'] for clause in trace['clauses'] for step in clause['trace']['steps'])


def test_groq_is_used_for_clause_annotations_and_faithfulness(monkeypatch):
    calls = []

    def fake_groq(system, prompt):
        calls.append((system, prompt))
        if 'faithfulness auditor' in system:
            return 'Auditoria Groq: a explicação corresponde à evidência.'
        return f'Anotação Groq específica: {prompt.split("Cláusula analisada: ", 1)[-1][:40]}'

    monkeypatch.setenv('GROQ_API_KEY', 'test-key')
    monkeypatch.setattr(langgraph_service, 'groq_call', fake_groq)
    trace = analyze({
        'contractTitle': 'Contrato com cláusulas',
        'category': 'RGPD (Regulamento UE 2016/679)',
        'contractText': 'CLÁUSULA 1. Dados pessoais devem ser protegidos.\n\nCLÁUSULA 2. O incidente deve ser notificado.',
    })

    annotation_prompts = [prompt for system, prompt in calls if 'anotador jurídico' in system]
    audit_calls = [system for system, _prompt in calls if 'faithfulness auditor' in system]
    assert len(annotation_prompts) >= 10
    assert len(audit_calls) >= 8
    assert any('CLÁUSULA 1' in prompt for prompt in annotation_prompts)
    assert any('CLÁUSULA 2' in prompt for prompt in annotation_prompts)
    assert trace['steps'][0]['faithfulness_metadata']['audit_notes'].startswith('Auditoria Groq')
