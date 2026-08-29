# JustiViz

> **Explicabilidade de agentes de IA através de visualização narrativa e interação em contexto de análise contratual**

## Visão Geral

**JustiViz** é um projeto académico de final de curso da **Licenciatura em Engenharia Multimédia** que investiga como a visualização narrativa e a interação humano-máquina podem tornar compreensíveis os processos de decisão de agentes de inteligência artificial.

O protótipo aplica estes princípios ao contexto da análise contratual. Em vez de apresentar apenas uma conclusão ou registos técnicos difíceis de interpretar, transforma o percurso de análise num espaço visual explorável: o utilizador pode acompanhar as etapas do raciocínio, consultar alternativas rejeitadas, inspecionar dados técnicos e analisar diferentes cláusulas individualmente.

**Áreas de investigação:** inteligência artificial generativa, inteligência artificial explicável (XAI), aprendizagem automática, visualização de informação e scrollytelling.

## Problema e Motivação

Agentes autónomos executam cadeias de operações complexas, mas os seus resultados são frequentemente percebidos como uma "caixa negra". Os registos brutos da execução são úteis para desenvolvimento e depuração, mas inadequados para utilizadores que necessitam de avaliar recomendações antes de as usar em decisões críticas.

**O JustiViz propõe uma abordagem de visualização que:**
- Torna o percurso de análise mais legível e contextualizado
- Apresenta a relação entre dados, decisões e recomendações
- Mostra hipóteses consideradas e rejeitadas pelo agente
- Apoia a verificação humana sem substituir o juízo profissional
- Permite a inspeção de informação em diferentes níveis de detalhe

## Funcionalidades Principais

### 📖 Narrativa de Análise (Scrollytelling)
A vista principal organiza o percurso em etapas de extração, classificação de risco, consulta de precedentes, auditoria de fidelidade e síntese da recomendação. A navegação por hover permite avançar pela narrativa sem interferir com o scroll normal da página.

### 🔗 Explorador de Grafos Dirigidos
Apresentação interativa de nós de decisão, transições e alternativas rejeitadas. Alternância entre visualização em grafo interativo e matriz de comparação das alternativas.

### 📄 Segmentação e Análise de Cláusulas
- Suporta ficheiros `.txt`, `.docx` e `.pdf`
- Segmentação automática de cláusulas
- Análise individual de cada cláusula com atualização em tempo real do grafo, narrativa e veredito
- Entrada manual de texto para testes rápidos

### 🔍 Zoom Semântico
- **Nível Macro:** Resumo acessível do raciocínio e recomendação
- **Nível Micro:** Parâmetros técnicos, métricas, excertos, variáveis de estado e metadados de auditoria

### ⚗️ Laboratório de Confiança (Trust Lab)
Simula situações de erro e diferentes padrões de dependência das recomendações do agente. Explora a relação entre explicabilidade, confiança e decisão humana.

### 🤖 Análise Local com Contingência
A análise é executada pelo agente LangGraph local, com representação de contingência para permitir a utilização do protótipo mesmo quando serviços auxiliares não estão disponíveis.

## Tecnologias

### Frontend
- **React 19** com TypeScript para interface componente
- **Vite** como bundler e dev server
- **D3.js** para visualização de grafos dirigidos
- **Scrollama** para coordenação de narrativa e scroll
- **Tailwind CSS** para estilo responsivo
- **Lucide React** para ícones
- **Motion** para animações fluidas
- **Canvas Confetti** para feedback visual lúdico

### Backend
- **Express** como servidor HTTP e proxy
- **Vite Dev Middleware** para hot reload em desenvolvimento

### Python & IA
- **LangGraph** para cadeia de estados da análise de contratos
- **Python 3.10+** para processamento de linguagem natural
- **Groq API** (opcional) como LLM secundário para anotações e auditoria de fidelidade
- **Ollama** (futuro) para modelos LLM locais

### Ferramentas de Processamento
- **Mammoth.js** para parsing de documentos `.docx`
- **PDF.js** para extração de texto de PDFs
- **Python regex & NLTK** para segmentação de cláusulas

### Testes & Qualidade
- **Playwright** para testes de navegador (E2E)
- **TypeScript** para validação de tipos estática
- **tsx** para execução de testes Node.js com TypeScript

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                   │
│  React 19 + TypeScript + Vite                          │
├─────────────────────────────────────────────────────────┤
│  ScrollytellingView | GraphExplorer | ContractAnalyzer │
│  RelianceLab | DigraphExplorerView | HierarchicalZoom  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────────────────┐ │
│   Express Server + Vite      │ │
│   Hot Reload & API Routes    │ │
├──────────────────────────────┤ │
│ /api/segment-contract        │ │
│ /api/analyze-contract        │ │
│ /api/audit-faithfulness      │ │
└───────┬──────────────────────┘ │
        │                         │
   ┌────▼────────────────────────▼─┐
   │   Python LangGraph Service     │
   │   (agent/langgraph_service.py) │
   ├────────────────────────────────┤
   │ • Análise de contratos         │
   │ • Classificação de risco       │
   │ • Precedentes legais           │
   │ • Auditoria de fidelidade      │
   │ • Integração Groq (opcional)   │
   └────────────────────────────────┘
```

## Estrutura do Projeto

```
JustiViz/
├── agent/                      # Backend Python
│   ├── langgraph_service.py   # Serviço principal LangGraph
│   ├── segmentation.py        # Segmentação de cláusulas
│   ├── cuad_corpus.json       # Corpus de cláusulas (CUAD dataset)
│   └── __init__.py
├── src/                        # Frontend React + TypeScript
│   ├── components/             # Componentes da aplicação
│   │   ├── ScrollytellingView.tsx
│   │   ├── DigraphExplorerView.tsx
│   │   ├── GraphCanvas.tsx
│   │   ├── CustomContractAnalyzer.tsx
│   │   ├── RelianceLab.tsx
│   │   ├── HierarchicalZoomDrawer.tsx
│   │   ├── VirtualizedAlternatives.tsx
│   │   ├── MethodologyHelpModal.tsx
│   │   └── Navbar.tsx
│   ├── data/                   # Casos de estudo pré-carregados
│   │   ├── cuadTraces.ts       # Traços de análise CUAD
│   │   └── ptTraces.ts         # Traços de análise PT (precedentes)
│   ├── utils/                  # Utilitários e análise
│   │   ├── contractAnalysis.ts # Lógica de análise
│   │   ├── dataProvenance.ts   # Rastreamento de dados
│   │   ├── staticTraceGenerator.ts
│   │   ├── staticTraceGeneratorPt.ts
│   │   └── fps.ts              # Utilitários de performance
│   ├── types.ts                # Definições de tipos TypeScript
│   ├── App.tsx                 # Componente raiz e navegação
│   ├── main.tsx                # Entry point React
│   └── index.css               # Estilos globais
├── tests/                      # Testes automatizados
│   ├── browser-performance.spec.ts  # Testes Playwright
│   ├── performance.test.ts      # Testes performance Node.js
│   ├── test_clause_segmentation.py  # Testes Python
│   └── test_langgraph_service.py    # Testes serviço LangGraph
├── server.ts                   # Servidor Express + Vite proxy
├── vite.config.ts              # Configuração Vite
├── tsconfig.json               # Configuração TypeScript
├── package.json                # Dependências Node.js
├── requirements.txt            # Dependências Python
├── .env.example                # Exemplo de variáveis de ambiente
├── playwright.config.ts        # Configuração de testes E2E
└── README.md                   # Este ficheiro
```

## Instalação e Configuração

### Pré-requisitos

- **Node.js 18+** com npm ou yarn
- **Python 3.10+**
- **Git**

### 1. Clonar o Repositório

```bash
git clone https://github.com/markelomc-a11y/JustiViz.git
cd JustiViz
```

### 2. Instalar Dependências Node.js

```bash
npm install
# ou
yarn install
```

### 3. Instalar Dependências Python

```bash
python -m venv venv          # Criar ambiente virtual (opcional mas recomendado)
source venv/bin/activate    # No Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Editar o ficheiro `.env` com as suas configurações:

```env
# Chave Groq (opcional - para anotações gerativas e auditoria)
GROQ_API_KEY="sua_chave_groq_aqui"
GROQ_MODEL="openai/gpt-oss-20b"

# URL da aplicação (para links internos e OAuth)
APP_URL="http://localhost:3000"

# Portas de desenvolvimento
PORT=3000
VITE_HMR_PORT=3001
DISABLE_HMR="false"

# Cache de fontes legais
LEGAL_SOURCE_CACHE_DIR=".cache/legal-sources"
LEGAL_SOURCE_CACHE_TTL_HOURS="168"
LEGAL_SOURCE_TIMEOUT_SECONDS="8"
```

## Execução

### Desenvolvimento

Inicia o servidor Express com suporte a hot reload via Vite:

```bash
npm run dev
```

A aplicação estará acessível em `http://localhost:3000`

**No Windows PowerShell, com interpretador Python explícito:**

```powershell
$env:PYTHON_BIN = "py"
npm run dev
```

**Com portas personalizadas:**

```bash
export PORT=3002
export VITE_HMR_PORT=3003
npm run dev
```

**Desativar hot reload se a porta HMR estiver ocupada:**

```bash
export DISABLE_HMR="true"
npm run dev
```

### Construção para Produção

```bash
npm run build       # Constrói frontend (Vite) + backend (esbuild)
npm run start       # Executa a versão compilada
```

### Limpeza

```bash
npm run clean       # Remove pasta dist e ficheiros gerados
```

## Testes

### Testes de Performance (Node.js)

```bash
npm test
```

Executa testes com `tsx --test` nos ficheiros `tests/*.test.ts`. Testa o pipeline de análise, caminhos alternativos e monitor FPS.

### Testes do Navegador (E2E com Playwright)

```bash
npm run test:browser
```

Configuração em [playwright.config.ts](playwright.config.ts)

### Testes Python

```bash
# Teste de segmentação de cláusulas
PYTHONPATH=. pytest -q tests/test_clause_segmentation.py

# Testes completos (segmentação + LangGraph)
PYTHONPATH=. pytest -q tests/test_clause_segmentation.py tests/test_langgraph_service.py
```

## Validação de Tipos

```bash
npm run lint    # Executa TypeScript sem emitir ficheiros (--noEmit)
```

## Documentação Adicional

- [`.env.example`](.env.example) - Guia completo de configuração
- `agent/langgraph_service.py` - Detalhes da cadeia de análise
- `agent/segmentation.py` - Algoritmo de segmentação de cláusulas

## Funcionalidades Futuras

- ✅ Integração com modelos LLM locais via Ollama
- ✅ Suporte a múltiplas línguas
- ✅ Exportação de relatórios em PDF
- ✅ Integração com bases de dados legais em tempo real
- ✅ Modo colaborativo para análise em equipa

## Notas de Desenvolvimento

### Serviço LangGraph

O serviço Python inicia automaticamente quando `npm run dev` é executado. O servidor Express age como proxy para as endpoints da API.

O Express inicia o serviço em `127.0.0.1:8001`.

**Endpoints da API:**
- `POST /api/analyze-contract` - Analisar contrato
- `POST /api/segment-contract` - Segmentar cláusulas
- `POST /api/audit-faithfulness` - Auditoria de fidelidade

### Corpus CUAD Local

O serviço usa um corpus CUAD local em `agent/cuad_corpus.json` com recuperação vetorial baseada em TF-IDF e similaridade de cosseno. O corpus pode ser substituído ou ampliado com um subconjunto maior de `CUADv1.json`, preservando os campos:
- Categoria
- Resposta anotada
- Documento de origem
- Contexto (para auditoria da evidência)

### Tratamento de Erros

Se o serviço LangGraph falhar ao iniciar:
1. Verifique se Python 3.10+ está instalado: `python --version`
2. Verifique as dependências Python: `pip install -r requirements.txt`
3. Consulte os registos de erro no terminal do servidor

A aplicação continua a funcionar com um modo de demonstração fallback quando o serviço não está disponível.

### Performance

O projeto inclui utilitários de monitorização de performance:
- `src/utils/fps.ts` - Monitor de FPS
- `tests/performance.test.ts` - Benchmarks
- `tests/browser-performance.spec.ts` - Testes de performance do navegador

### Variáveis de Ambiente Opcionais

A chave Groq (`GROQ_API_KEY`) é opcional e não deve ser colocada no código ou frontend. Sem a chave, o LangGraph continua a executar, usando validação local para as tarefas secundárias (anotações e auditoria).

## Limitações e Enquadramento

**JustiViz é um protótipo académico e demonstrador de interação**, desenvolvido para estudar apresentação, exploração e validação de resultados de agentes de IA.

⚠️ **Não fornece aconselhamento jurídico, não substitui profissionais qualificados e não deve ser utilizado como único fundamento para decisões contratuais.**

As análises locais, os casos de estudo e as auditorias simuladas servem para demonstrar os conceitos da aplicação. A qualidade das respostas de um modelo externo depende da configuração do serviço, do texto fornecido e dos mecanismos de validação disponíveis.

## Trabalho Futuro: Modelos Locais via Ollama

Está prevista a integração de **modelos LLM locais através do Ollama** para realizar as tarefas que atualmente são simuladas:
- Classificação de risco
- Anotações gerativas
- Auditoria de fidelidade
- Apoio à síntese das recomendações

A arquitetura foi desenvolvida considerando esta evolução. O LangGraph funciona como camada de orquestração dos diferentes estados e nós do processo, permitindo substituir progressivamente a lógica determinística e os marcadores simulados por chamadas a modelos locais, mantendo a estrutura da narrativa, do grafo, dos dados técnicos e da validação humana.

## Autoria

Projeto desenvolvido no âmbito da Licenciatura em Engenharia Multimédia, com foco na aplicação de técnicas de visualização narrativa à explicabilidade de agentes de inteligência artificial.
