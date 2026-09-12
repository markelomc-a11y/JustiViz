# Relatório de Desenvolvimento do JustiViz

## 1. Identificação do projeto

**Projeto:** JustiViz
**Área:** Engenharia Multimédia, visualização de informação e inteligência artificial explicável
**Contexto:** Projeto final de licenciatura
**Objetivo:** Investigar como uma interface narrativa pode tornar auditável e compreensível uma análise contratual apoiada por um agente de inteligência artificial.

Este documento substitui o relatório anterior de melhorias e reúne informação utilizável no relatório académico sobre a evolução, arquitetura, decisões técnicas, validação e limitações do projeto.

## 2. Problema investigado

Os agentes de inteligência artificial podem executar várias operações para produzir uma recomendação contratual: extração de texto, identificação de entidades, recuperação de legislação, comparação de evidência, classificação de risco e síntese. Uma resposta final isolada não mostra como a decisão foi construída nem permite avaliar facilmente a sua fundamentação.

O JustiViz aborda este problema através de uma representação narrativa e interativa. A interface não apresenta apenas um resultado: mostra a cláusula analisada, os referenciais jurídicos usados, a relação entre a evidência contratual e legal, a incerteza, a auditoria de fidelidade e a síntese final.

## 3. Objetivos de desenvolvimento

### Objetivo geral

Criar um protótipo multimédia que permita explorar e auditar o percurso de análise de um contrato por um agente LangGraph.

### Objetivos específicos

- Representar a análise como uma narrativa em cinco etapas.
- Permitir a análise independente de cada cláusula.
- Recuperar legislação associada à categoria jurídica escolhida.
- Associar findings a artigos, excertos legais e excertos contratuais.
- Distinguir classificação de risco jurídico de fidelidade da explicação.
- Apresentar informação em níveis Macro e Micro.
- Mostrar alternativas de decisão de forma auditável, sem alegar acesso à cadeia privada de pensamento.
- Permitir comparar a interface narrativa com logs técnicos.
- Apoiar estudos exploratórios de confiança e dependência humana das recomendações.

## 4. Evolução funcional

### 4.1. Da conclusão isolada à narrativa

A primeira estrutura apresentava o percurso como uma sequência de nós. A evolução do projeto consolidou a narrativa em cinco etapas coerentes:

1. **Extração da cláusula**: preparação do texto e identificação do conteúdo contratual.
2. **Referencial jurídico**: recuperação da legislação e das disposições relevantes.
3. **Classificação de risco**: comparação entre a cláusula e a evidência legal.
4. **Auditoria de fidelidade**: verificação da correspondência entre texto, evidência, explicação e classificação.
5. **Síntese do veredito**: fundamentação e recomendação de revisão.

Foi removido o nó visual artificial de ingestão contratual. O primeiro passo real da análise passou a ser a origem do grafo, evitando a duplicação entre ingestão e extração.

### 4.2. Análise por cláusula

O carregamento de um documento desencadeia a extração do texto e a sua segmentação. Cada cláusula recebe o seu próprio `ContractTrace`, com cinco passos, findings jurídicos e veredito. A interface permite navegar entre cláusulas na vista narrativa, no explorador dirigido e no Laboratório de Confiança.

Esta decisão melhora a coerência da informação: o excerto, a classificação, as fontes e o veredito pertencem à mesma cláusula selecionada.

### 4.3. Classificação baseada em evidência

O serviço Python recupera uma fonte jurídica associada à categoria selecionada. Entre as categorias suportadas estão:

- RGPD;
- Regulamento da IA da União Europeia;
- Código Civil Português e Decreto-Lei n.º 446/85;
- Código do Trabalho Português;
- Constituição da República Portuguesa.

O texto legal é descarregado quando possível e guardado em cache. O serviço identifica secções de artigos e associa ao finding o excerto legal recuperado. A avaliação também guarda o excerto da cláusula que foi comparado.

A classificação segue estes princípios:

- **Risco elevado:** contradição forte identificada e evidência oficial do artigo disponível;
- **Risco moderado:** linguagem ambígua, contradição ligeira, fonte incompleta ou incerteza relevante;
- **Risco reduzido:** ausência de contradição material segundo os critérios disponíveis, sem afirmar conformidade jurídica definitiva.

A aplicação recomenda revisão profissional em resultados moderados, elevados, críticos ou incertos.

### 4.4. Dados estruturados de avaliação

A aplicação introduziu estruturas específicas para não depender apenas de texto narrativo:

```typescript
interface LegalFinding {
  article: string;
  legal_reference: string;
  source_url?: string;
  legal_excerpt: string;
  contract_excerpt: string;
  relationship: 'supports' | 'contradicts' | 'unclear';
  severity: 'none' | 'slight' | 'strong';
  explanation: string;
  confidence: number;
}

interface ClauseAssessment {
  classification: RiskLevel;
  risk_score: number;
  findings: LegalFinding[];
  uncertainty_notes: string[];
  requires_professional_review: boolean;
  legal_source_status?: string;
}
```

Esta estrutura permite que a mesma avaliação seja usada pela narrativa, pelo grafo, pelo detalhe técnico e pelo veredito agregado.

### 4.5. Separação de níveis apresentados

O frontend apresenta apenas dois tipos de informação de nível:

1. **Classificação da cláusula**: resultado da comparação com a legislação e os artigos recuperados.
2. **Fidelidade da análise**: medida da correspondência entre explicação, evidência e resultado.

Os nós de extração não apresentam risco jurídico. Os nós de classificação, referências e síntese apresentam a classificação da cláusula. O nó de auditoria apresenta fidelidade. Esta separação evita que o `LOW` técnico de uma etapa de extração seja interpretado como conclusão de segurança jurídica.

### 4.6. Macro e Micro

Em modo Macro, o utilizador vê a narrativa e a evidência principal. Em modo Micro, pode consultar:

- findings legais;
- artigos e fontes;
- excertos contratuais e legais;
- confiança;
- fidelidade;
- latência, quando registada;
- variáveis de estado;
- notas de auditoria.

Quando não há uma métrica real no rasto, a interface apresenta `N/D`.

## 5. Arquitetura técnica

### Frontend

- React 19;
- TypeScript;
- Vite;
- Tailwind CSS;
- D3.js para o grafo;
- Lucide React para ícones;
- PDF.js para leitura de PDF;
- Mammoth.js para leitura de DOCX;
- Web Speech API para narração pt-PT;
- Canvas Confetti para feedback do laboratório.

### Backend

- Express como servidor HTTP e proxy;
- middleware Vite em desenvolvimento;
- serviço Python independente iniciado pelo Express;
- LangGraph como orquestrador de estados.

### Serviço de análise

O serviço em `agent/langgraph_service.py` contém:

- carregamento do corpus CUAD;
- recuperação vetorial de contingência;
- carregamento e cache de fontes legais;
- extração de artigos;
- avaliação estruturada de cláusulas;
- construção dos cinco passos;
- auditoria de fidelidade;
- síntese do veredito;
- integração com Groq para anotações e auditoria secundária.

## 6. Fluxo de dados

```text
Documento ou texto introduzido
          |
          v
Extração de texto
          |
          v
Segmentação de cláusulas
          |
          v
Categoria Jurídica Alvo
          |
          v
Fonte legal oficial + cache
          |
          v
Disposições e artigos recuperados
          |
          v
Comparação cláusula / evidência legal
          |
          v
ClauseAssessment + LegalFindings
          |
          v
Cinco passos narrativos
          |
          v
Veredito por cláusula
          |
          v
Veredito agregado do contrato
```

Endpoints principais:

- `POST /api/segment-contract`: segmenta o texto;
- `POST /api/analyze-contract`: solicita a análise LangGraph;
- `POST /api/generate-explanation`: solicita uma explicação narrativa;
- `POST /api/audit-faithfulness`: executa a auditoria de fidelidade;
- `GET /api/health`: verifica o estado do serviço.

## 7. Agregação do contrato

Quando existem várias cláusulas, cada uma é analisada separadamente. O veredito global usa a média das pontuações e preserva o nível de risco mais grave observado.

A agregação evita que várias cláusulas de baixo risco escondam uma cláusula com contradição forte. O resumo global identifica que a avaliação é agregada e recomenda a revisão das cláusulas que apresentam risco ou incerteza.

## 8. Alternativas e explicabilidade

Os caminhos alternativos são armazenados em `TraceStep.alternatives`. Cada alternativa contém:

- hipótese;
- motivo de rejeição;
- confiança;
- categoria associada, quando disponível.

Estas alternativas são explicações estruturadas do processo de decisão observável. Não são uma transcrição da cadeia privada de pensamento de um modelo. Esta distinção é importante do ponto de vista técnico, metodológico e ético: a aplicação apresenta evidência auditável sem afirmar acesso a estados internos que o serviço não expõe.

## 9. Laboratório de Confiança

O Laboratório de Confiança foi desenvolvido para explorar a relação entre explicabilidade e decisão humana. Permite:

- selecionar um caso;
- selecionar uma cláusula;
- alternar entre narrativa e logs técnicos;
- visualizar o excerto e o percurso da cláusula;
- aceitar ou rejeitar a recomendação;
- registar o tempo de decisão;
- exportar resultados em JSON.

A matriz apresenta quatro resultados experimentais:

- confiança apropriada;
- hiper-confiança;
- sub-confiança;
- autonomia crítica apropriada perante uma falha.

Os registos são guardados no armazenamento local do navegador e destinam-se a exploração académica.

## 10. Proveniência e fontes

A aplicação distingue as seguintes proveniências:

- dados do corpus CUAD;
- documento fornecido pelo utilizador;
- análise em tempo real do serviço LangGraph;
- análise local de contingência;
- exemplos de demonstração.

As fontes jurídicas configuradas são oficiais, mas a disponibilidade e o formato da resposta podem variar. O estado da fonte é preservado como `cache`, `downloaded`, `stale-cache` ou `unavailable`. Uma fonte indisponível não é tratada como prova de conformidade.

## 11. Validação realizada

A validação do desenvolvimento inclui:

### Testes TypeScript

```bash
npm test
```

Testa o cálculo de performance existente e os formatadores de classificação em português europeu.

### Typecheck

```bash
npm run lint
```

Executa o TypeScript sem emitir ficheiros.

### Build

```bash
npm run build
```

Constrói o frontend com Vite e o servidor com esbuild.

### Testes Python

Os testes cobrem:

- análise completa de cinco passos;
- análise independente de cláusulas;
- seleção da fonte pelo referencial jurídico;
- integração da auditoria;
- extração de artigos;
- contradições fortes;
- cláusulas ambíguas;
- fontes indisponíveis;
- AI Act;
- agregação do veredito.

Quando `pytest` não está instalado no ambiente de desenvolvimento, os cenários principais podem ser executados diretamente com Python e `py_compile`.

### Validação do navegador

O projeto inclui uma configuração Playwright para validar a aplicação em navegador e recolher métricas de performance durante o scroll.

## 12. Limitações conhecidas

- A comparação legal combina recuperação de fonte, extração de disposições e regras determinísticas; não é uma decisão jurídica vinculativa.
- Algumas fontes oficiais podem não disponibilizar texto legível através de HTML.
- A fonte do Código do Trabalho e a fonte da Constituição podem exigir adaptações de extração quando o portal devolve conteúdo insuficiente.
- A auditoria de fidelidade compara a explicação com a evidência disponível; não mede acesso ao raciocínio privado de um modelo.
- As métricas de execução dos casos pré-carregados podem ser valores do próprio rasto e não medições recentes.
- Os casos de demonstração não devem ser confundidos com contratos carregados pelo utilizador ou com prova jurídica.
- O sistema não substitui revisão de profissionais do Direito.

## 13. Trabalho futuro

- Melhorar a extração de artigos em fontes legais com HTML dinâmico.
- Adicionar adaptadores específicos para Diário da República e Assembleia da República.
- Substituir regras de correspondência por comparação semântica verificável entre cláusula e disposição legal.
- Criar testes E2E de seleção de cláusula e modo Micro.
- Adicionar exportação de relatórios académicos com proveniência e evidência.
- Avaliar a interface com participantes e recolher medidas de compreensão, tempo e deteção de erros.
- Integrar modelos locais apenas quando existirem mecanismos de validação e proveniência equivalentes.

## 14. Reprodutibilidade

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm run dev
```

Para uma execução sem chamadas Groq, deixar `GROQ_API_KEY` vazio. O serviço mantém a avaliação determinística, o cache de fontes e a indicação de incerteza quando necessário.

## 15. Autoria

Projeto desenvolvido no âmbito da Licenciatura em Engenharia Multimédia, com foco na visualização narrativa, interação humano-máquina e explicabilidade de agentes de inteligência artificial aplicados à análise contratual.
