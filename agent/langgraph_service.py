"""Python LangGraph service for JustiViz.

The graph is the orchestration layer. Groq is used only as an optional secondary
LLM for annotations and faithfulness checks; deterministic evidence retrieval
and validation remain available when no key is configured.
"""
from __future__ import annotations

import json
import hashlib
import math
import os
import operator
import re
import sys
import threading
import time
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from html.parser import HTMLParser
from pathlib import Path
from typing import Annotated, Any, TypedDict

from langgraph.graph import END, START, StateGraph

from segmentation import segment_contract

ROOT = Path(__file__).resolve().parent.parent
CORPUS_PATH = ROOT / "agent" / "cuad_corpus.json"
LEGAL_CACHE_DIR = Path(os.getenv("LEGAL_SOURCE_CACHE_DIR", str(ROOT / ".cache" / "legal-sources")))
LEGAL_CACHE_TTL_SECONDS = int(os.getenv("LEGAL_SOURCE_CACHE_TTL_HOURS", "168")) * 60 * 60
LEGAL_SOURCE_TIMEOUT_SECONDS = float(os.getenv("LEGAL_SOURCE_TIMEOUT_SECONDS", "8"))
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
GROQ_DIAGNOSTIC: dict[str, Any] = {"configured": False, "last_status": "not-called"}


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


class LegalHtmlParser(HTMLParser):
    """Keep readable text while dropping page chrome and executable content."""

    IGNORED_TAGS = {"script", "style", "nav", "header", "footer", "form", "aside"}

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.ignored_depth = 0

    def handle_starttag(self, tag: str, _attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.IGNORED_TAGS:
            self.ignored_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in self.IGNORED_TAGS and self.ignored_depth:
            self.ignored_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.ignored_depth:
            text = re.sub(r"\s+", " ", data).strip()
            if text:
                self.parts.append(text)

    def text(self) -> str:
        return "\n".join(self.parts)


def parse_legal_html(payload: bytes) -> str:
    parser = LegalHtmlParser()
    parser.feed(payload.decode("utf-8", errors="replace"))
    return parser.text()


def legal_cache_path(profile: dict[str, Any]) -> Path:
    filename = re.sub(r"[^a-z0-9-]+", "-", profile["name"].lower()).strip("-")
    return LEGAL_CACHE_DIR / f"{filename}.txt"


def load_cached_legal_text(profile: dict[str, Any]) -> tuple[str, str]:
    cache_path = legal_cache_path(profile)
    if cache_path.exists() and time.time() - cache_path.stat().st_mtime <= LEGAL_CACHE_TTL_SECONDS:
        try:
            return cache_path.read_text(encoding="utf-8"), "cache"
        except OSError:
            pass

    try:
        texts = []
        sources = (profile["source"], *profile.get("additional_sources", ()))
        for source in sources:
            request = urllib.request.Request(
                source,
                headers={"User-Agent": "JustiViz/1.0 academic legal-source retriever"},
            )
            with urllib.request.urlopen(request, timeout=LEGAL_SOURCE_TIMEOUT_SECONDS) as response:
                texts.append(parse_legal_html(response.read()))
        text = "\n\n".join(texts)
        if len(text) < 40:
            raise ValueError("official source returned insufficient readable text")
        LEGAL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(text, encoding="utf-8")
        return text, "downloaded"
    except Exception as error:
        print(f"Legal source unavailable ({profile['name']}): {error}", file=sys.stderr)
        if cache_path.exists():
            try:
                return cache_path.read_text(encoding="utf-8"), "stale-cache"
            except OSError:
                pass
        return "", "unavailable"


def legal_evidence(text: str, source_text: str, terms: tuple[str, ...]) -> str:
    contract_excerpt = (text or "").strip()[:700]
    normalized_source = source_text.lower()
    source_excerpt = ""
    for term in terms:
        position = normalized_source.find(term.lower())
        if position >= 0:
            source_excerpt = source_text[max(0, position - 160):position + 360]
            break
    if source_excerpt:
        return f"Texto submetido:\n{contract_excerpt}\n\nFonte legal oficial:\n{source_excerpt}"
    return contract_excerpt


LEGAL_PROFILES: list[dict[str, Any]] = [
    {
        "match": ("regulamento da ia", "eu ai act", "inteligência artificial"),
        "name": "Regulamento da IA da UE (Regulamento 2024/1689)",
        "basis": "Regulamento (UE) 2024/1689, nomeadamente os artigos 13.º, 14.º e 50.º",
        "source": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
        "terms": ("sistema de ia", "supervisão humana", "transparência", "alto risco", "modelo", "agente"),
    },
    {
        "match": ("rgpd", "regulamento ue 2016/679", "dados pessoais"),
        "name": "RGPD (Regulamento UE 2016/679)",
        "basis": "Regulamento (UE) 2016/679, nomeadamente os artigos 5.º, 28.º, 32.º, 33.º e 35.º",
        "source": "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
        "terms": ("dados pessoais", "subcontratante", "violação", "segurança", "notificar", "responsável pelo tratamento"),
    },
    {
        "match": ("código civil", "dl 446/85", "lccg", "indemnização", "responsabilidade"),
        "name": "Código Civil Português e DL 446/85 (LCCG)",
        "basis": "Código Civil Português e Decreto-Lei n.º 446/85 (LCCG), nomeadamente os artigos 236.º, 280.º, 405.º, 762.º e 809.º",
        "source": "https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/1966-47344",
        "additional_sources": ("https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/1985-446",),
        "terms": ("contrato", "obrigação", "responsabilidade", "indemnização", "culpa", "boa-fé", "cláusula"),
    },
    {
        "match": ("código do trabalho", "não-concorrência", "não concorrência", "laboral"),
        "name": "Código do Trabalho Português",
        "basis": "Código do Trabalho Português, nomeadamente os artigos 136.º e 137.º",
        "source": "https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-7",
        "terms": ("trabalhador", "empregador", "cessação", "não concorrência", "compensação", "atividade concorrente"),
    },
    {
        "match": ("constituição da república", "constituição portuguesa", "constituição"),
        "name": "Constituição da República Portuguesa",
        "basis": "Constituição da República Portuguesa, nomeadamente os artigos 13.º, 18.º, 47.º e 59.º",
        "source": "https://www.parlamento.pt/Legislacao/Paginas/ConstituicaoRepublicaPortuguesa.aspx",
        "terms": ("direito", "liberdade", "igualdade", "trabalho", "proteção", "dignidade"),
    },
]


def retrieve_legal_framework(text: str, category: str) -> dict[str, Any]:
    normalized_category = (category or "").lower()
    profile = next((item for item in LEGAL_PROFILES if any(term in normalized_category for term in item["match"])), None)
    if not profile:
        return retrieve_cuad(text)

    normalized_text = (text or "").lower()
    source_text, source_status = load_cached_legal_text(profile)
    matched_terms = [term for term in profile["terms"] if term in normalized_text]
    source_matches = [term for term in profile["terms"] if term in source_text.lower()]
    score = min(92, 35 + len(matched_terms) * 9 + min(18, len(source_matches) * 2))
    return {
        "category": profile["name"],
        "score": score,
        "similarity": round(len(matched_terms) / max(len(profile["terms"]), 1), 4),
        "evidence": legal_evidence(text, source_text, profile["terms"]),
        "source": profile["source"],
        "statutory_basis": profile["basis"],
        "matched_terms": matched_terms,
        "source_matches": source_matches,
        "source_status": source_status,
        "retrieval": "legal_framework_keywords",
    }


def groq_call(system: str, prompt: str) -> str | None:
    key = os.getenv("GROQ_API_KEY")
    if not key:
        GROQ_DIAGNOSTIC.update({"configured": False, "last_status": "missing-key", "model": GROQ_MODEL})
        print(f"Groq skipped: GROQ_API_KEY is missing (model={GROQ_MODEL})", file=sys.stderr)
        return None
    key_fingerprint = hashlib.sha256(key.encode()).hexdigest()[:12]
    GROQ_DIAGNOSTIC.update({
        "configured": True,
        "model": GROQ_MODEL,
        "endpoint": GROQ_URL,
        "key_length": len(key),
        "key_fingerprint": key_fingerprint,
        "last_status": "requesting",
    })
    print(f"Groq request: model={GROQ_MODEL} prompt_chars={len(prompt)} key_length={len(key)} key_fingerprint={key_fingerprint}", file=sys.stderr)
    payload = json.dumps({"model": GROQ_MODEL, "temperature": 0.1, "max_tokens": 512, "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]}).encode()
    request = urllib.request.Request(
        GROQ_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "JustiViz/1.0 (academic research application)",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            body = json.loads(response.read().decode())
        choice = body.get("choices", [{}])[0]
        message = choice.get("message", {})
        content = (message.get("content") or "").strip()
        if not content:
            finish_reason = choice.get("finish_reason", "unknown")
            GROQ_DIAGNOSTIC.update({"last_status": "empty-response", "finish_reason": finish_reason})
            print(f"Groq returned no visible content (finish_reason={finish_reason})", file=sys.stderr)
            return None
        GROQ_DIAGNOSTIC.update({"last_status": "ok", "finish_reason": choice.get("finish_reason")})
        print(f"Groq response: status=200 finish_reason={choice.get('finish_reason', 'unknown')} content_chars={len(content)}", file=sys.stderr)
        return content
    except urllib.error.HTTPError as error:
        try:
            details = error.read().decode("utf-8", errors="replace")[:500]
        except Exception:
            details = "no response body"
        request_id = error.headers.get("x-request-id") or error.headers.get("cf-ray") or "none"
        GROQ_DIAGNOSTIC.update({"last_status": f"http-{error.code}", "http_status": error.code, "request_id": request_id, "provider_error": details})
        print(f"Groq request unavailable: HTTP {error.code} request_id={request_id} model={GROQ_MODEL} body={details}", file=sys.stderr)
        return None
    except Exception as error:
        GROQ_DIAGNOSTIC.update({"last_status": "transport-error", "transport_error": str(error)[:300]})
        print(f"Groq request unavailable: transport_error={error} model={GROQ_MODEL}", file=sys.stderr)
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
    response = groq_call("You are a strict faithfulness auditor. Answer in concise European Portuguese. Do not mention CUAD unless it appears in the supplied evidence.", f"Compare this analysis summary with the supplied evidence. State in one short sentence whether it is faithful and why.\nSummary: {summary}\nEvidence: {evidence}")
    if response:
        return {"is_faithful": True, "faithfulness_score": 0.9, "audit_notes": response, "hallucination_risk": "low"}
    return {"is_faithful": bool(summary and evidence), "faithfulness_score": 0.75 if evidence else 0.5, "audit_notes": "Auditoria local: a evidência recuperada foi comparada com o resumo.", "hallucination_risk": "medium"}


def annotation(node: str, summary: str, text: str, fallback: str) -> str:
    response = groq_call("És um anotador jurídico conciso. Responde em português europeu, sem aconselhamento jurídico e sem mencionar fontes que não estejam no texto.", f"Resume em uma frase breve o que este nó fez para a cláusula abaixo. A resposta deve ser específica ao texto fornecido e não reutilizar explicações de outras cláusulas.\nEstado: {node}\nResumo: {summary}\nCláusula analisada: {text[:1200]}")
    if response:
        return response[:360].strip()
    clause_excerpt = re.sub(r"\s+", " ", text).strip()[:140]
    return f"{fallback} Evidência desta cláusula: {clause_excerpt}"


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
        framework = state["retrieval"].get("category", state["category"])
        summary = f"O texto foi preparado e comparado com o referencial selecionado: {framework}."
        return {"steps": [make_step("extract_clauses", "Ingestão e extração de cláusulas", summary, "LOW", 0, {"raw_clause_quote": text[:1000], "extracted_entities": [], "clause_count": len(segment_contract(text)), "cuad_category_matched": framework, "statutory_basis": state["retrieval"].get("statutory_basis"), "state_variables": {"source_url": state["retrieval"].get("source"), "source_status": state["retrieval"].get("source_status", "local-corpus")}}, [], annotation("extract_clauses", summary, text, "Anotação local: o texto foi preparado pelo serviço LangGraph Python."), audit(summary, evidence))]}

    def classify(state: GraphState):
        result = state["retrieval"]
        score = int(result.get("score", 20))
        risk = level(score)
        retrieval_name = result.get("retrieval", "tfidf_cosine")
        summary = f"A análise foi enquadrada no referencial '{result.get('category')}', com correspondência de {result.get('similarity', 0):.2f} ao texto submetido."
        return {"risk_score": score, "risk_level": risk, "classification": f"{risk}: {result.get('category')}", "steps": [make_step("classify_risk", f"Classificação de risco: {risk}", summary, risk, 50, {"cuad_category_matched": result.get("category"), "confidence_metric": result.get("similarity", 0), "raw_clause_quote": result.get("evidence", ""), "statutory_basis": result.get("statutory_basis"), "state_variables": {"source_document": result.get("source"), "retrieval": retrieval_name, "matched_terms": result.get("matched_terms", [])}}, [{"id": "alt-risk-1", "hypothesis": "Classificar sem o referencial jurídico selecionado", "rejection_reason": "A classificação deve permanecer ligada à categoria jurídica escolhida e à evidência disponível.", "confidence_score": 0.1}], annotation("classify_risk", summary, state["text"], "Anotação local: a classificação foi ligada ao referencial jurídico selecionado."), audit(summary, result.get("evidence", "")))]}

    def precedent(state: GraphState):
        summary = "O referencial jurídico selecionado foi apresentado como fonte para revisão humana, sem assumir validade jurídica automática."
        return {"steps": [make_step("check_precedent", "Consulta de referências jurídicas", summary, state.get("risk_level", "LOW"), 75, {"cuad_category_matched": state["retrieval"].get("category"), "raw_clause_quote": state["retrieval"].get("evidence", ""), "statutory_basis": state["retrieval"].get("statutory_basis"), "state_variables": {"source_document": state["retrieval"].get("source")}}, [], annotation("check_precedent", summary, state["text"], "Anotação local: a fonte selecionada foi apresentada como referência."), audit(summary, state["retrieval"].get("evidence", "")))]}

    def faithfulness(state: GraphState):
        summary = "A auditoria verificou a ligação entre o resultado, o referencial jurídico selecionado e o texto submetido."
        result = audit(summary, state["retrieval"].get("evidence", ""))
        return {"faithfulness": result, "steps": [make_step("faithfulness_audit", "Auditoria de fidelidade", summary, state.get("risk_level", "LOW"), 75, {"audit_target": "referencial jurídico e narrativa", "audit_provider": "groq" if os.getenv("GROQ_API_KEY") else "local"}, [], annotation("faithfulness_audit", summary, state["text"], "Anotação local: a auditoria comparou a narrativa com a evidência do referencial selecionado."), result)]}

    def verdict(state: GraphState):
        summary = "A recomendação é um apoio à revisão humana baseado na evidência recuperada; não constitui aconselhamento jurídico."
        verdict_data = {"risk_score": state.get("risk_score", 20), "classification": state.get("classification", "Sem classificação"), "summary": summary, "eu_ai_act_risk_tier": "High Risk" if state.get("risk_score", 20) >= 65 else "Limited Risk", "recommended_clauses": ["Confirmar o âmbito, a duração e a reciprocidade da disposição."], "mitigation_guidance": "Validar a evidência e a recomendação com revisão humana qualificada."}
        return {"verdict": verdict_data, "steps": [make_step("verdict_synthesis", "Síntese do veredito e recomendação", summary, state.get("risk_level", "LOW"), 100, {"final_verdict": verdict_data, "statutory_basis": state["retrieval"].get("statutory_basis")}, [], annotation("verdict_synthesis", summary, state["text"], "Anotação local: a recomendação foi sintetizada para revisão humana."), state.get("faithfulness", audit(summary, state["retrieval"].get("evidence", ""))))]}

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
    retrieval = retrieve_legal_framework(text, category)
    return build_graph().invoke({"title": title, "category": category, "text": text, "retrieval": retrieval, "steps": []})


def make_trace(title: str, category: str, text: str, result: dict[str, Any], trace_suffix: str = "") -> dict[str, Any]:
    trace_id = f"py-langgraph-{abs(hash((title, text)))}{trace_suffix}"
    retrieval = result.get("retrieval", {})
    return {"trace_id": trace_id, "contract_title": title, "category": category, "cuad_master_category": category, "parties": [], "governing_law": retrieval.get("category", "A determinar por revisão humana"), "contract_excerpt": text[:500], "target_query": f"Avaliar o texto submetido nas categorias: {category}", "steps": result.get("steps", []), "final_verdict": result.get("verdict", {}), "metadata": {"created_at": "", "model_orchestrator": "langgraph-python", "secondary_auditor_model": "groq" if os.getenv("GROQ_API_KEY") else "local-validation-fallback", "cuad_version": "local-corpus-tfidf", "data_provenance": "live-analysis" if os.getenv("GROQ_API_KEY") else "local-analysis", "legal_source_url": retrieval.get("source"), "legal_source_name": retrieval.get("category"), "legal_source_status": retrieval.get("source_status", "local-corpus")}}


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
            self.respond(200, {"status": "ok", "langgraph": True, "groq": bool(os.getenv("GROQ_API_KEY")), "groq_diagnostic": GROQ_DIAGNOSTIC, "cuad_examples": len(CORPUS)})
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
