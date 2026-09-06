import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'agent'))

import langgraph_service
from langgraph_service import analyze, assess_clause, extract_article_provisions


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


def test_legal_assessment_uses_article_excerpt_and_strong_contradiction():
    profile = {'article_numbers': ('33',)}
    source = 'Article 33\nThe controller shall notify the personal data breach to the supervisory authority without undue delay and, where feasible, not later than 72 hours.'
    provisions = extract_article_provisions(source, profile)
    assessment = assess_clause(
        'O subcontratante notificará a violação no prazo de 45 dias.',
        {
            'category': 'RGPD (Regulamento UE 2016/679)',
            'source': 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
            'source_status': 'downloaded',
            'provisions': provisions,
            'retrieval': 'legal_framework_keywords',
            'articles': ('Artigo 33.º do RGPD',),
        },
    )

    assert provisions[0]['article'] == 'Article 33'
    assert '72 hours' in assessment['findings'][0]['legal_excerpt']
    assert assessment['classification'] == 'HIGH'


def test_missing_official_provision_cannot_produce_high_risk():
    assessment = assess_clause(
        'O subcontratante notificará a violação no prazo de 45 dias.',
        {
            'category': 'RGPD (Regulamento UE 2016/679)',
            'source': 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
            'source_status': 'unavailable',
            'provisions': [],
            'retrieval': 'legal_framework_keywords',
            'articles': ('Artigo 33.º do RGPD',),
        },
    )

    assert assessment['classification'] == 'MEDIUM'
    assert assessment['requires_professional_review'] is True
    assert assessment['findings'][0]['legal_excerpt'] == ''


def test_ambiguous_legal_clause_requires_professional_review():
    profile = {'article_numbers': ('33',)}
    provisions = extract_article_provisions(
        'Article 33\nThe controller shall notify the supervisory authority without undue delay.',
        profile,
    )
    assessment = assess_clause(
        'O incidente será comunicado em prazo adequado, conforme as circunstâncias.',
        {
            'category': 'RGPD (Regulamento UE 2016/679)',
            'source': 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
            'source_status': 'downloaded',
            'provisions': provisions,
            'retrieval': 'legal_framework_keywords',
            'articles': ('Artigo 33.º do RGPD',),
        },
    )

    assert assessment['classification'] == 'MEDIUM'
    assert assessment['requires_professional_review'] is True
    assert assessment['findings'][0]['severity'] == 'none'


def test_ai_act_human_oversight_contradiction_is_high_with_article_evidence():
    provisions = extract_article_provisions(
        'Article 14\nHigh-risk AI systems shall be designed and developed in such a way that they can be effectively overseen by natural persons.',
        {'article_numbers': ('14',)},
    )
    assessment = assess_clause(
        'O sistema de IA funciona sem supervisão humana.',
        {
            'category': 'Regulamento da IA da UE (Regulamento 2024/1689)',
            'source': 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
            'source_status': 'downloaded',
            'provisions': provisions,
            'retrieval': 'legal_framework_keywords',
            'articles': ('Artigo 14.º do Regulamento da IA da UE',),
        },
    )

    assert assessment['classification'] == 'HIGH'
    assert assessment['findings'][0]['article'] == 'Artigo 14.º do Regulamento da IA da UE'


def test_contract_verdict_aggregates_clause_classifications():
    trace = analyze({
        'contractTitle': 'Contrato DPA',
        'category': 'RGPD (Regulamento UE 2016/679)',
        'contractText': 'CLÁUSULA 1. A violação será notificada em 45 dias úteis.\n\nCLÁUSULA 2. O subcontratante notificará sem demora.',
    })

    clause_levels = [clause['risk_level'] for clause in trace['clauses']]
    assert len(clause_levels) == 2
    assert clause_levels[0] == 'HIGH'
    assert clause_levels[1] in {'LOW', 'MEDIUM'}
    assert trace['final_verdict']['classification'].startswith('HIGH:')
    assert trace['final_verdict']['risk_score'] >= 55
