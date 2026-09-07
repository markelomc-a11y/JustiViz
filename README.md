# JustiViz

> Visualização narrativa e interação em contexto para a análise explicável de contratos por agentes de inteligência artificial.

## Visão geral

O JustiViz é o projeto final da Licenciatura em Engenharia Multimédia. O protótipo investiga como uma cadeia de análise contratual pode ser apresentada de forma compreensível através de scrollytelling, grafos dirigidos, zoom semântico e auditoria de fidelidade.

A aplicação não substitui a análise de profissionais do Direito. O seu objetivo académico é tornar visíveis a evidência utilizada, a classificação de risco, as referências jurídicas, as incertezas e as alternativas consideradas pelo sistema.

## Funcionalidades atuais

### Análise narrativa

A vista principal apresenta cinco etapas por cláusula:

1. **Extração da cláusula**: identifica e apresenta o texto e os elementos contratuais relevantes.
2. **Referencial jurídico**: recupera a legislação associada à categoria selecionada e a evidência disponível.
3. **Classificação de risco**: compara a cláusula com as disposições recuperadas e identifica possíveis contradições.
4. **Auditoria de fidelidade**: compara a explicação, a evidência contratual, a evidência legal e a classificação.
5. **Síntese do veredito**: resume a fundamentação, as incertezas e a recomendação de revisão.

O bloco narrativo e o grafo permanecem visíveis durante o scroll em ecrãs largos. A roda do rato sobre o bloco narrativo permite percorrer as etapas.

### Classificação jurídica por cláusula

Cada cláusula recebe uma avaliação estruturada com:

- classificação `LOW`, `MEDIUM`, `HIGH` ou `CRITICAL`;
- pontuação de risco;
- artigos e legislação utilizados;
- excerto contratual comparado;
- excerto legal recuperado;
- relação entre a cláusula e a referência: compatível, contraditória ou inconclusiva;
- intensidade da relação: sem contradição, ligeira ou forte;
- confiança da avaliação;
- indicação de necessidade de revisão profissional.

Na interface, estes valores são apresentados em português europeu como **Risco Reduzido**, **Risco Moderado**, **Risco Elevado** e **Risco Crítico**.

Uma contradição forte só pode produzir risco elevado quando existe evidência legal oficial recuperada. Se a fonte não estiver disponível ou não for possível extrair uma disposição aplicável, o resultado é tratado como incerto e encaminhado para revisão profissional.

### Referenciais jurídicos

O serviço reconhece categorias associadas a:

- RGPD, incluindo os artigos 5.º, 28.º, 32.º, 33.º e 35.º;
- Regulamento da IA da União Europeia, incluindo os artigos 13.º, 14.º e 50.º;
- Código Civil Português e Decreto-Lei n.º 446/85, incluindo os artigos 236.º, 280.º, 405.º, 762.º e 809.º;
- Código do Trabalho Português, incluindo os artigos 136.º e 137.º;
- Constituição da República Portuguesa, incluindo os artigos 13.º, 18.º, 47.º e 59.º.

As fontes configuradas incluem EUR-Lex, Diário da República e Assembleia da República. O serviço descarrega e coloca em cache o texto disponível, identifica disposições por artigo e associa a evidência aos findings da cláusula.

### Documentos e cláusulas

O analisador personalizado suporta:

- ficheiros `.txt`;
- ficheiros `.docx`, através de Mammoth.js;
- ficheiros `.pdf`, através de PDF.js;
- texto introduzido manualmente;
- exemplos de demonstração pré-configurados.

Depois da segmentação, cada cláusula é analisada de forma independente. O Laboratório de Confiança inclui um seletor de cláusula com navegação anterior/seguinte.

### Grafo e alternativas

O grafo representa os cinco passos e as alternativas de decisão associadas. As alternativas são representações auditáveis geradas a partir dos findings e dos critérios da análise; não devem ser interpretadas como acesso à cadeia privada de pensamento de um modelo.

O explorador inclui:

- grafo dirigido interativo;
- matriz de alternativas rejeitadas;
- pesquisa e filtros;
- seleção de cláusulas;
- distinção entre classificação da cláusula e auditoria de fidelidade.

### Zoom semântico

- **Macro**: narrativa, evidência principal e explicação em linguagem acessível.
- **Micro**: payload, métricas disponíveis, variáveis de estado, findings legais, fontes e auditoria.

O detalhe técnico fica oculto em modo Macro e visível em modo Micro. Quando uma métrica não existe no rasto, é apresentado `N/D`.

### Laboratório de Confiança

O Laboratório de Confiança permite comparar a apresentação narrativa com logs técnicos e registar a decisão do participante. O utilizador pode selecionar o caso, navegar pelas cláusulas e decidir se aceita ou rejeita a recomendação apresentada.

Os resultados são guardados localmente no navegador e podem ser exportados em JSON.

## Arquitetura

```text
Navegador
  React 19 + TypeScript + Vite
  ScrollytellingView, GraphCanvas, DigraphExplorerView,
  CustomContractAnalyzer, RelianceLab
          |
          v
Express + Vite middleware
  /api/segment-contract
  /api/analyze-contract
  /api/generate-explanation
  /api/audit-faithfulness
          |
          v
Serviço Python LangGraph
  segmentação
  recuperação de fontes legais
  avaliação por cláusula
  auditoria de fidelidade
  síntese do veredito
  Groq opcional para anotações e auditoria
```

## Estrutura principal

```text
agent/
  langgraph_service.py       Serviço LangGraph e recuperação legal
  segmentation.py            Segmentação de contratos
  cuad_corpus.json            Subconjunto local do corpus CUAD

src/
  components/                Componentes React da interface
  data/                      Casos de estudo pré-carregados
  utils/                     Análise local, provenance e labels
  types.ts                   Contratos de dados TypeScript
  App.tsx                    Router principal da aplicação

server.ts                    Express, proxy e ciclo de vida do LangGraph
tests/                       Testes TypeScript, Python e Playwright
```

## Fluxo de análise

1. O Express inicia o serviço Python LangGraph na porta `8001`.
2. O frontend extrai o texto do documento carregado.
3. O endpoint de segmentação identifica cláusulas.
4. O endpoint de análise envia o contrato, a categoria e o texto ao LangGraph.
5. O serviço recupera a referência jurídica selecionada e tenta obter a fonte oficial.
6. Cada cláusula é analisada independentemente.
7. A avaliação compara indicadores da cláusula com disposições legais recuperadas.
8. O serviço produz os cinco passos narrativos, findings e auditoria.
9. O contrato recebe um veredito agregado a partir das classificações das cláusulas.
10. O frontend apresenta a narrativa, o grafo, o detalhe técnico e as recomendações.

## Instalação

### Pré-requisitos

- Node.js 18 ou superior;
- Python 3.10 ou superior;
- npm;
- dependências Python instaladas.

### Dependências

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Configuração opcional

Copiar `.env.example` para `.env`. A variável `GROQ_API_KEY` é opcional. Sem ela, o LangGraph mantém a recuperação e a validação determinísticas e usa respostas locais para anotações e auditoria secundária.

Variáveis relevantes:

```env
PORT=3000
LANGGRAPH_PORT=8001
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
LEGAL_SOURCE_CACHE_DIR=.cache/legal-sources
LEGAL_SOURCE_CACHE_TTL_HOURS=168
LEGAL_SOURCE_TIMEOUT_SECONDS=8
```

## Execução

```bash
npm run dev
```

Abrir `http://localhost:3000`.

Para produção:

```bash
npm run build
npm run start
```

## Testes e validação

```bash
npm run lint
npm test
npm run test:browser
```

Os testes Python podem ser executados com:

```bash
PYTHONPATH=. pytest -q tests/test_clause_segmentation.py tests/test_langgraph_service.py
```

A suite inclui testes de:

- segmentação de cláusulas;
- recuperação de artigos;
- contradições fortes;
- cláusulas ambíguas;
- fontes oficiais indisponíveis;
- avaliação por cláusula;
- agregação do veredito contratual;
- tradução de classificações;
- comportamento de performance no navegador.

## Dados e proveniência

A aplicação distingue entre:

- **Corpus**: evidência do subconjunto CUAD local;
- **Documento do utilizador**: texto carregado ou introduzido na aplicação;
- **Análise em tempo real**: resultado produzido pelo serviço LangGraph;
- **Análise local de contingência**: resultado determinístico quando o serviço ou uma fonte não estão disponíveis;
- **Exemplos de demonstração**: casos pré-carregados para explorar a interface.

Esta proveniência deve ser considerada na interpretação dos resultados.

## Limitações

O JustiViz é um protótipo académico e não fornece aconselhamento jurídico. A avaliação atual combina recuperação de fontes oficiais, extração de disposições, regras determinísticas e, quando configurado, um modelo externo para anotações e auditoria. Não constitui prova automática de validade ou nulidade de uma cláusula.

As fontes oficiais podem estar indisponíveis, devolver HTML insuficiente ou usar formatos diferentes. Nestes casos, a aplicação assinala incerteza e recomenda revisão profissional. A análise de uma cláusula isolada também pode não refletir definições, anexos, remissões ou contexto de todo o contrato.

As alternativas rejeitadas são explicações estruturadas para auditoria da decisão, não uma transcrição da cadeia privada de pensamento de um modelo.

## Autoria

Projeto desenvolvido no âmbito da Licenciatura em Engenharia Multimédia, com foco na visualização narrativa, interação humano-máquina e explicabilidade de agentes de inteligência artificial aplicados à análise contratual.
