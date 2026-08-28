# JustiViz

## Projeto académico

O **JustiViz** é um projeto académico de final de curso da **Licenciatura em Engenharia Multimédia**. A aplicação investiga de que forma a visualização narrativa e a interação humano-máquina podem tornar mais compreensíveis os processos de decisão de agentes de inteligência artificial.

O protótipo aplica estes princípios ao contexto da análise contratual. Em vez de apresentar apenas uma conclusão ou registos técnicos difíceis de interpretar, transforma o percurso de análise num espaço visual explorável: o utilizador pode acompanhar as etapas do raciocínio, consultar alternativas rejeitadas, inspecionar dados técnicos e analisar diferentes cláusulas individualmente.

Este trabalho aborda sobretudo **inteligência artificial generativa**, **inteligência artificial explicável (XAI)**, **aprendizagem automática**, **visualização de informação** e **scrollytelling**.

## Problema e motivação

Agentes autónomos podem executar cadeias de operações complexas, mas os seus resultados são frequentemente percebidos como uma “caixa negra”. Os registos brutos da execução são úteis para desenvolvimento e depuração, mas não são adequados para todos os utilizadores, nomeadamente profissionais que necessitam de avaliar uma recomendação antes de a utilizar numa decisão humana.

O JustiViz explora uma abordagem de visualização que procura:

- tornar o percurso de análise mais legível e contextualizado;
- apresentar a relação entre dados, decisões e recomendações;
- mostrar hipóteses consideradas e rejeitadas pelo agente;
- apoiar a verificação humana sem substituir o juízo profissional;
- permitir a inspeção de informação em diferentes níveis de detalhe.

## Objetivos do protótipo

1. Criar uma interface de **scrollytelling** em que a navegação acompanha as etapas de análise.
2. Representar o percurso de decisão através de um grafo dirigido.
3. Explorar alternativas rejeitadas e os respetivos motivos.
4. Disponibilizar zoom semântico entre uma leitura narrativa e dados técnicos.
5. Suportar a análise de contratos carregados pelo utilizador e a navegação individual pelas cláusulas detetadas.
6. Explorar anotações gerativas e auditorias de fidelidade como apoio à interpretação.

## Funcionalidades

### Narrativa de análise

A vista principal organiza o percurso em etapas de extração, classificação de risco, consulta de precedentes, auditoria de fidelidade e síntese da recomendação. A secção de navegação por hover permite avançar pela narrativa sem interferir com o scroll normal do resto da página.

### Grafo dirigido

O explorador de grafos apresenta nós de decisão, transições e alternativas rejeitadas. O utilizador pode alternar entre o grafo interativo e uma matriz de comparação das alternativas.

### Navegação por cláusula

Quando um contrato contém várias cláusulas, estas são segmentadas e podem ser selecionadas individualmente. A seleção atualiza o texto, os passos narrativos, o grafo, o veredito e os dados técnicos correspondentes à cláusula escolhida.

### Zoom semântico

- **Macro:** resumo acessível do raciocínio e da recomendação.
- **Micro:** parâmetros técnicos, métricas, excertos, variáveis de estado e metadados de auditoria.

### Analisador de contratos

O analisador aceita texto introduzido manualmente e ficheiros `.txt`, `.docx` ou `.pdf`. A análise é executada pelo agente LangGraph local, com uma representação de contingência para permitir a utilização do protótipo mesmo quando algum serviço auxiliar não está disponível.

### Laboratório de confiança

O laboratório de confiança simula situações de erro e diferentes padrões de dependência das recomendações do agente. Esta área serve para explorar a relação entre explicabilidade, confiança e decisão humana.

## Arquitetura e tecnologias

```text
React + TypeScript
        |
        +-- Interface de scrollytelling
        +-- Grafo D3.js
        +-- Analisador de contratos
        +-- Laboratório de confiança
        |
Express + Vite (server.ts)
        |
        +-- /api/segment-contract --> Python (agent/segmentation.py)
        +-- /api/analyze-contract  --> agente LangGraph local
        +-- /api/audit-faithfulness --> auditoria local simulada
        |
        +-- Integração futura      --> modelos LLM locais através do Ollama
```

Tecnologias principais:

- React 19 e TypeScript;
- Vite e Express;
- D3.js para o grafo dirigido;
- Scrollama para os eventos da narrativa;
- LangGraph para a cadeia de estados da análise;
- Ollama e modelos LLM locais como integração prevista;
- Python para a segmentação de cláusulas;
- Tailwind CSS para a interface;
- Lucide React para os ícones da aplicação.

## Estrutura do projeto

```text
agent/                  Segmentação de texto em Python
project_report/         Requisitos e documentação do projeto
src/
  components/           Vistas e componentes da aplicação
  data/                 Casos de estudo pré-carregados
        utils/                Análise, geração de rastos, classificador CUAD e pipeline LangGraph
  App.tsx               Composição principal e navegação entre vistas
  types.ts              Modelo de dados dos rastos e das cláusulas
server.ts               Servidor Express e endpoints da aplicação
tests/                  Testes da segmentação de cláusulas
```

## Requisitos

- Node.js 18 ou superior;
- npm;
- Python 3 para o endpoint de segmentação;
- dependências instaladas através do `package.json`.

## Instalação e execução

Na raiz do projeto:

```bash
npm install
npm run dev
```

O servidor é iniciado na porta `3000`. A aplicação fica normalmente disponível em `http://localhost:3000`.

O agente LangGraph é executado localmente. Se algum componente auxiliar não estiver disponível, o protótipo utiliza a lógica local de contingência. Esta alternativa destina-se a demonstração e experimentação académica, não a substituir um serviço de análise jurídica validado.

## Scripts disponíveis

```bash
npm run dev      # Executa o servidor em modo de desenvolvimento
npm run build    # Cria a compilação de produção
npm run start    # Executa a versão compilada
npm run lint     # Verifica os tipos TypeScript
```

Testes de segmentação:

```bash
PYTHONPATH=. pytest -q tests/test_clause_segmentation.py
```

Testes TypeScript do pipeline, caminhos alternativos e monitor FPS:

```bash
npm test
```

Os casos CUAD apresentados pela aplicação são um subconjunto anotado extraído do ficheiro `CUADv1.json` do repositório oficial [The-Atticus-Project/cuad](https://github.com/The-Atticus-Project/cuad). A classificação guarda a categoria, a resposta anotada, o documento de origem e o offset da resposta para permitir auditoria da evidência.

## Limitações e enquadramento

O JustiViz é um **protótipo académico e demonstrador de interação**, desenvolvido para estudar apresentação, exploração e validação de resultados de agentes de IA. Não fornece aconselhamento jurídico, não substitui profissionais qualificados e não deve ser utilizado como único fundamento para decisões contratuais.

As análises locais, os casos de estudo e as auditorias simuladas servem para demonstrar os conceitos da aplicação. A qualidade das respostas de um modelo externo depende da configuração do serviço, do texto fornecido e dos mecanismos de validação disponíveis.

## Trabalho futuro: modelos locais Ollama

Está prevista a integração de **modelos LLM locais através do Ollama** para realizar as tarefas que atualmente são simuladas, nomeadamente a classificação de risco, as anotações gerativas, a auditoria de fidelidade e o apoio à síntese das recomendações.

A arquitetura da aplicação foi desenvolvida considerando esta evolução. O LangGraph funciona como camada de orquestração dos diferentes estados e nós do processo, permitindo substituir progressivamente a lógica determinística e os marcadores simulados por chamadas a modelos locais, mantendo a estrutura da narrativa, do grafo, dos dados técnicos e da validação humana.

## Autoria

Projeto desenvolvido no âmbito da Licenciatura em Engenharia Multimédia, com foco na aplicação de técnicas de visualização narrativa à explicabilidade de agentes de inteligência artificial.


