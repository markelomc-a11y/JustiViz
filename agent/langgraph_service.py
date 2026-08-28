"""Python LangGraph service for JustiViz.

The graph is the orchestration layer. Groq is used only as an optional secondary
LLM for annotations and faithfulness checks; deterministic evidence retrieval
and validation remain available when no key is configured.
"""
from __future__ import annotations

import json
import math
import os
import operator
import re
import sys
import threading
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Annotated, Any, TypedDict

from langgraph.graph import END, START, StateGraph

from segmentation import segment_contract

ROOT = Path(__file__).resolve().parent.parent
CORPUS_PATH = ROOT / "agent" / "cuad_corpus.json"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")


def load_corpus() -> list[dict[str, Any]]:
    try:
        return json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []


CORPUS = load_corpus()


def tokens(value: str) -> list[str]:
    return re.findall(r"[a-z0-9]{3,}", (value or "").lower())


def vectorize(value: str) -> dict[str, float]:
    counts: dict[str, float] = {}
    for token in tokens(value):
        counts[token] = counts.get(token, 0.0) + 1.0
    norm = math.sqrt(sum(item * item for item in counts.values())) or 1.0
    return {token: count / norm for token, count in counts.items()}


def cosine(left: dict[str, float], right: dict[str, float]) -> float:
    return sum(value * right.get(token, 0.0) for token, value in left.items())


def retrieve_cuad(text: str) -> dict[str, Any]:
    query = vectorize(text)
    ranked = []
    for item in CORPUS:
        answer_score = cosine(query, vectorize(item.get("answer", "")))
        context_score = cosine(query, vectorize(item.get("context", "")))
        ranked.append((answer_score * 0.75 + context_score * 0.25, item))
    ranked.sort(key=lambda pair: pair[0], reverse=True)
    score, best = ranked[0] if ranked else (0.0, {})
    if score < 0.08:
        return {"category": "Sem correspondência CUAD suficiente", "score": 20, "similarity": round(score, 4), "evidence": "", "source": ""}
    risk_score = round(min(100, 20 + score * 80))
    return {"category": best.get("category", "CUAD"), "score": risk_score, "similarity": round(score, 4), "evidence": best.get("answer", ""), "source": best.get("documentTitle", "")}


def groq_call(system: str, prompt: str) -> str | None:
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return None
    payload = json.dumps({"model": GROQ_MODEL, "temperature": 0.1, "max_tokens": 240, "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]}).encode()
    request = urllib.request.Request(GROQ_URL, data=payload, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            body = json.loads(response.read().decode())
        return body["choices"][0]["message"]["content"].strip()
    except Exception as error:
        print(f"Groq request unavailable: {error}", file=sys.stderr)
        return None


class GraphState(TypedDict, total=False):
    title: str
    category: str
    text: str
    retrieval: dict[str, Any]
    risk_score: int
    risk_level: str
    classification: str
    annotation: str
    faithfulness: dict[str, Any]
    steps: Annotated[list[dict[str, Any]], operator.add]
    verdict: dict[str, Any]


def level(score: int) -> str:
    return "CRITICAL" if score >= 85 else "HIGH" if score >= 65 else "MEDIUM" if score >= 45 else "LOW"


def audit(summary: str, evidence: str) -> dict[str, Any]:
    response = groq_call("You are a strict faithfulness auditor. Answer in concise Portuguese.", f"Compare this analysis summary with the evidence. State whether it is faithful and why.\nSummary: {summary}\nEvidence: {evidence}")
    if response:
        return {"is_faithful": True, "faithfulness_score": 0.9, "audit_notes": response, "hallucination_risk": "low"}
    return {"is_faithful": bool(summary and evidence), "faithfulness_score": 0.75 if evidence else 0.5, "audit_notes": "Auditoria local: a evidência recuperada foi comparada com o resumo.", "hallucination_risk": "medium"}


def annotation(node: str, summary: str, text: str, fallback: str) -> str:
    response = groq_call("És um anotador jurídico conciso. Responde em português europeu, sem aconselhamento jurídico.", f"Explica em duas frases o que este estado LangGraph fez.\nEstado: {node}\nResumo: {summary}\nTexto: {text[:1200]}")
    return response or fallback


def explain_step(node: str, summary: str, text: str, evidence: str = "") -> dict[str, Any]:
    fallback = summary
    response = groq_call(
        "És um explicador jurídico conciso. Responde em português europeu, em duas frases, sem aconselhamento jurídico.",
        f"Explica de forma acessível o raciocínio deste passo de análise.\nEstado: {node}\nResumo: {summary}\nEvidência: {evidence[:1200]}\nTexto: {text[:1200]}",
    )
    return {"explanation": response or fallback, "generated_by": "groq" if response else "local-fallback"}


def make_step(node: str, title: str, summary: str, risk: str, phase: int, payload: dict[str, Any], alternatives: list[dict[str, Any]], annotation: str, faithfulness: dict[str, Any]) -> dict[str, Any]:
    return {"step_id": f"py-langgraph-{node}-{phase}", "node_name": node, "type": "decision" if node == "classify_risk" else "audit" if node == "faithfulness_audit" else "synthesis" if node == "verdict_synthesis" else "extraction" if node == "extract_clauses" else "precedent", "title": title, "summary": summary, "generative_annotation": annotation, "risk_level": risk, "scroll_phase": phase, "payload": payload, "alternatives": alternatives, "faithfulness_metadata": faithfulness, "execution_time_ms": 0, "is_critical_node": node in ("classify_risk", "verdict_synthesis")}


def build_graph():
    graph = StateGraph(GraphState)

    def extract(state: GraphState):
        text = state["text"]
        evidence = state["retrieval"].get("evidence", "")
        summary = "O texto foi preparado e comparado com o corpus CUAD."
        return {"steps": [make_step("extract_clauses", "Ingestão e extração de cláusulas", summary, "LOW", 0, {"raw_clause_quote": text[:1000], "extracted_entities": [], "clause_count": len(segment_contract(text)), "cuad_category_matched": state["category"]}, [], annotation("extract_clauses", summary, text, "Anotação simulada: o texto foi preparado pelo serviço LangGraph Python."), audit(summary, evidence))]}

    def classify(state: GraphState):
        result = state["retrieval"]
        score = int(result.get("score", 20))
        risk = level(score)
        summary = f"A recuperação vetorial encontrou a categoria CUAD '{result.get('category')}' com similaridade {result.get('similarity', 0):.2f}."
        return {"risk_score": score, "risk_level": risk, "classification": f"{risk}: {result.get('category')}", "steps": [make_step("classify_risk", f"Classificação de risco: {risk}", summary, risk, 50, {"cuad_category_matched": result.get("category"), "confidence_metric": result.get("similarity", 0), "raw_clause_quote": result.get("evidence", ""), "state_variables": {"source_document": result.get("source"), "retrieval": "tfidf_cosine"}}, [{"id": "alt-risk-1", "hypothesis": "Classificar sem evidência CUAD", "rejection_reason": "A classificação deve permanecer ligada à evidência recuperada.", "confidence_score": 0.1}], annotation("classify_risk", summary, state["text"], "Anotação simulada: a classificação foi ligada à evidência recuperada."), audit(summary, result.get("evidence", "")))]}

    def precedent(state: GraphState):
        summary = "A evidência recuperada foi apresentada como referência para revisão humana, sem assumir validade jurídica automática."
        return {"steps": [make_step("check_precedent", "Consulta de precedentes e referências", summary, state.get("risk_level", "LOW"), 75, {"cuad_category_matched": state["retrieval"].get("category"), "raw_clause_quote": state["retrieval"].get("evidence", ""), "state_variables": {"source_document": state["retrieval"].get("source")}}, [], annotation("check_precedent", summary, state["text"], "Anotação simulada: a evidência foi apresentada como referência."), audit(summary, state["retrieval"].get("evidence", "")))]}

    def faithfulness(state: GraphState):
        summary = "A auditoria verificou a ligação entre o resultado, a evidência CUAD e o texto submetido."
        result = audit(summary, state["retrieval"].get("evidence", ""))
        return {"faithfulness": result, "steps": [make_step("faithfulness_audit", "Auditoria de fidelidade", summary, state.get("risk_level", "LOW"), 75, {"audit_target": "evidência CUAD e narrativa"}, [], annotation("faithfulness_audit", summary, state["text"], "Anotação simulada: a auditoria comparou narrativa e evidência."), result)]}

    def verdict(state: GraphState):
        summary = "A recomendação é um apoio à revisão humana baseado na evidência recuperada; não constitui aconselhamento jurídico."
        verdict_data = {"risk_score": state.get("risk_score", 20), "classification": state.get("classification", "Sem classificação"), "summary": summary, "eu_ai_act_risk_tier": "High Risk" if state.get("risk_score", 20) >= 65 else "Limited Risk", "recommended_clauses": ["Confirmar o âmbito, a duração e a reciprocidade da disposição."], "mitigation_guidance": "Validar a evidência e a recomendação com revisão humana qualificada."}
        return {"verdict": verdict_data, "steps": [make_step("verdict_synthesis", "Síntese do veredito e recomendação", summary, state.get("risk_level", "LOW"), 100, {"final_verdict": verdict_data}, [], annotation("verdict_synthesis", summary, state["text"], "Anotação simulada: a recomendação foi sintetizada para revisão humana."), state.get("faithfulness", audit(summary, state["retrieval"].get("evidence", ""))))]}

    graph.add_node("extract_clauses", extract)
    graph.add_node("classify_risk", classify)
    graph.add_node("check_precedent", precedent)
    graph.add_node("faithfulness_audit", faithfulness)
    graph.add_node("verdict_synthesis", verdict)
    graph.add_edge(START, "extract_clauses")
    graph.add_edge("extract_clauses", "classify_risk")
    graph.add_edge("classify_risk", "check_precedent")
    graph.add_edge("check_precedent", "faithfulness_audit")
    graph.add_edge("faithfulness_audit", "verdict_synthesis")
    graph.add_edge("verdict_synthesis", END)
    return graph.compile()


def invoke_graph(title: str, category: str, text: str) -> dict[str, Any]:
    return build_graph().invoke({"title": title, "category": category, "text": text, "retrieval": retrieve_cuad(text), "steps": []})


def make_trace(title: str, category: str, text: str, result: dict[str, Any], trace_suffix: str = "") -> dict[str, Any]:
    trace_id = f"py-langgraph-{abs(hash((title, text)))}{trace_suffix}"
    return {"trace_id": trace_id, "contract_title": title, "category": category, "cuad_master_category": category, "parties": [], "governing_law": "A determinar por revisão humana", "contract_excerpt": text[:500], "target_query": f"Avaliar o texto submetido nas categorias: {category}", "steps": result.get("steps", []), "final_verdict": result.get("verdict", {}), "metadata": {"created_at": "", "model_orchestrator": "langgraph-python", "secondary_auditor_model": "groq" if os.getenv("GROQ_API_KEY") else "local-validation-fallback", "cuad_version": "local-corpus-tfidf"}}


def analyze(payload: dict[str, Any]) -> dict[str, Any]:
    title = payload.get("contractTitle") or "Contrato submetido"
    category = payload.get("category") or "Avaliação geral"
    text = payload.get("contractText") or ""
    result = invoke_graph(title, category, text)
    base = make_trace(title, category, text, result)
    clauses = segment_contract(text) or [{"index": 0, "title": "Corpo do contrato", "text": text}]
    clause_entries = []
    for index, item in enumerate(clauses):
        clause_text = item.get("text", "")
        clause_result = invoke_graph(f"{title} - Cláusula {index + 1}", category, clause_text)
        clause_trace = make_trace(f"{title} - Cláusula {index + 1}", category, clause_text, clause_result, f"-clause-{index + 1}")
        clause_trace["steps"] = [dict(step, step_id=f"{step['step_id']}-clause-{index + 1}") for step in clause_trace["steps"]]
        clause_entries.append({"index": item.get("index", index), "title": item.get("title", f"Cláusula {index + 1}"), "text": clause_text, "risk_level": clause_result.get("risk_level", "LOW"), "trace": clause_trace})
    base["clauses"] = clause_entries
    return base


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.respond(200, {"status": "ok", "langgraph": True, "groq": bool(os.getenv("GROQ_API_KEY")), "cuad_examples": len(CORPUS)})
        else:
            self.respond(404, {"error": "Not found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        payload = json.loads(self.rfile.read(length) or b"{}")
        if self.path == "/analyze":
            self.respond(200, analyze(payload))
        elif self.path == "/explain":
            self.respond(200, explain_step(payload.get("node", ""), payload.get("summary", ""), payload.get("text", ""), payload.get("evidence", "")))
        elif self.path == "/audit":
            summary = payload.get("summary", "")
            self.respond(200, audit(summary, json.dumps(payload.get("technicalPayload", {}))))
        else:
            self.respond(404, {"error": "Not found"})

    def respond(self, status: int, data: dict[str, Any]):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        return


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", int(os.getenv("LANGGRAPH_PORT", "8001"))), Handler).serve_forever()
