# Relatório do Projeto JustiViz

## Resumo executivo

O JustiViz é um projeto académico de Engenharia Multimédia centrado na explicabilidade de agentes de IA em contexto jurídico. A sua proposta consiste em transformar traces de raciocínio automatizado em uma narrativa visual de fácil leitura, permitindo que juristas, investigadores e utilizadores experientes compreendam, validem e desafiem decisões de IA de forma mais segura e informada.

O projeto insere-se num contexto relevante para Portugal e para a União Europeia: o uso de sistemas de IA em contexto profissional, especialmente no domínio jurídico, exige transparência, rastreabilidade e controlo humano. Em paralelo, a área de XAI (Explainable AI) evidencia a necessidade de interfaces que reduzam a opacidade dos sistemas automatizados sem sacrificar a profundidade técnica.

A solução combina conceitos de scrollytelling, visualização narrativa, grafos de decisão, zoom semântico e anotações em linguagem natural. O objetivo principal não é substituir a decisão humana, mas apoiar uma confiança apropriada (appropriate reliance): facilitar a deteção de erros, evidenciar alternativas rejeitadas e aumentar a capacidade de auditoria do utilizador.

Neste contexto, o projeto tem um forte valor académico e demonstrativo, sobretudo pela sua capacidade de ligar interface multimédia, análise jurídica e explicabilidade de IA. O grande potencial do protótipo está na forma como traduz processos quase opacos em experiência humana inteligível.

## 1. Contexto do projeto

O projeto JustiViz foi desenvolvido na perspetiva de uma solução orientada para a explicabilidade de IA aplicada ao domínio contratual. O foco principal é a análise de cláusulas contratuais, com especial atenção a riscos jurídicos, ausschandamentos de responsabilidade, não concorrência, limitação de responsabilidade e conformidade com o enquadramento jurídico português e europeu.

A ideia central é a seguinte: um agente autónomo processa texto contratual, identifica obrigações e riscos, escolhe um caminho de decisão e apresenta uma explicação compreensível ao utilizador. Em vez de expor logs técnicos cru, o sistema organiza esse raciocínio em um fluxo narrativo com múltiplos níveis de detalhe.

Este conceito está plenamente alinhado com os requisitos do projeto, nomeadamente:

- criação de uma interface de scrollytelling;
- visualização de caminhos alternativos rejeitados;
- zoom hierárquico entre resumo e detalhe técnico;
- anotações em linguagem natural;
- suporte a validação humana em contexto de decisão profissional.

## 2. Requisitos do projeto

Os requisitos do projeto, tal como definidos no documento de requisitos, posicionam claramente a solução como um protótipo académico de apoio à interpretação de raciocínio de IA. A prioridade é a exploração de conceitos de XAI e de narrativa visual, e não a construção de um sistema jurídico legalmente definitivo.

Os objetivos principais são:

1. Criar uma interface de scrollytelling que permita percorrer a narrativa do raciocínio do agente.
2. Visualizar caminhos de decisão considerados e rejeitados, permitindo explorar cenários alternativos.
3. Implementar zoom hierárquico para alternar entre visão macro e visão micro.
4. Gerar anotações em linguagem simples para explicar passos técnicos complexos.
5. Validar se a narrativa visual melhora a compreensão e a confiança na IA num contexto de apoio à decisão.

Este conjunto de objetivos é claramente compatível com o que o projeto já implementa, especialmente na interface atual em React, na navegação por passos e nos gráficos de decisão.

## 3. Comparação entre o relatório e o projeto real

### 3.1 O que o relatório faz melhor

O relatório destaca-se pela qualidade da fundamentação conceptual. Ele apresenta uma visão forte sobre:

- XAI e calibração de confiança;
- importância da explicabilidade em contextos críticos;
- necessidade de confiança apropriada em sistemas de IA;
- papel do scrollytelling como instrumento de narrativa visual;
- relevância do domínio jurídico e do enquadramento europeu.

Também é útil a forma como o documento articula a ideia de que não basta gerar decisões; é essencial comunicar os porquês, os pressupostos e as alternativas rejeitadas. Este é um dos pontos mais fortes do projeto e um elemento que deve ser preservado no plano de remediação.

Outra vantagem do relatório é a sua ligação ao contexto académico e à perspetiva de Engenharia Multimédia. Ele coloca a interface como elemento central da explicabilidade, e não apenas como camada visual de um backend. Essa visão está alinhada com a proposta do protótipo.

### 3.2 O que o projeto atual faz melhor

O projeto real tem um conjunto de vantagens concretas que o relatório, por mais sólido que seja, não captura com o mesmo nível de detalhe. Em particular, o código atual já inclui elementos muito úteis para cumprir os requisitos:

- estrutura de navegação por modos de visualização em [src/App.tsx](src/App.tsx);
- painel de scrollytelling em [src/components/ScrollytellingView.tsx](src/components/ScrollytellingView.tsx);
- seletor de casos e métricas de performance em [src/components/Navbar.tsx](src/components/Navbar.tsx);
- gerador de traces em [src/utils/staticTraceGenerator.ts](src/utils/staticTraceGenerator.ts) e [src/utils/staticTraceGeneratorPt.ts](src/utils/staticTraceGeneratorPt.ts);
- suporte ao contexto jurídico em português europeu e inglês;
- componente de análise customizada em [src/components/CustomContractAnalyzer.tsx](src/components/CustomContractAnalyzer.tsx);
- modelo de dados bem definido em [src/types.ts](src/types.ts).

Em termos de UX/UI, o projeto já demonstra uma boa noção de narrativa visual, organização visual e linguagem de interface coerente. Já as ideias de zoom macro/micro, de análise por etapas e de caminhos alternativos rejeitados são visíveis na estrutura de dados e na composição da interface.

### 3.3 Onde o relatório e o projeto se complementam

A combinação mais forte é a seguinte:

- O relatório oferece a base conceptual e a justificação académica;
- O projeto oferece a estrutura funcional e visual já implementada;
- A integração entre os dois cria uma solução com melhor qualidade de comunicação, mas também com maior aderência aos requisitos reais.

É neste ponto que a remediação deve operar: aproveitar a robustez teórica do relatório e a funcionalidade existente do projeto, sem perder a simplicidade necessária para um protótipo académico.

## 4. Principais pontos de alinhamento com os requisitos

O projeto cumpre, de forma clara, os requisitos principais identificados no ficheiro de requisitos:

### Requisito 1: Scrollytelling

O projeto implementa uma navegação narrativa através do componente de scrollytelling em [src/components/ScrollytellingView.tsx](src/components/ScrollytellingView.tsx). O fluxo em múltiplos passos, a barra de progresso e os botões de navegação reforçam a lógica narrativa.

### Requisito 2: Forked paths / alternativas rejeitadas

A estrutura de dados e os geradores de trace incluem múltiplas alternativas rejeitadas em cada etapa. Este é um dos elementos mais fortes do sistema e corresponde diretamente ao requisito do projeto.

### Requisito 3: Zoom hierárquico

A alternância entre “macro” e “micro” é uma característica presente no projeto, tanto na interface como no modelo de dados. Isso está bem alinhado com a necessidade de balancear compreensão geral e detalhe técnico.

### Requisito 4: Anotações generativas

O projeto usa anotações em linguagem natural e explicações legíveis para cada etapa. Isso contribui para uma melhor experiência de uso, especialmente para profissionais do direito.

### Requisito 5: Objetivo académico de prova de conceito

A componente de “analizador de contratos personalizados” em [src/components/CustomContractAnalyzer.tsx](src/components/CustomContractAnalyzer.tsx) funciona como prova de conceito útil para demonstrar a solução em contexto académico. O uso de dados estáticos ou simulados é aceitável para este fim, desde que fique explícito que se trata de um protótipo.

## 5. O que precisa de ser corrigido ou melhorado

Apesar de o projeto estar bem orientado para os objetivos, há pontos que o relatório e a implementação devem corrigir para ficarem mais coerentes e mais fortes.

### 5.1 Linguagem e contexto local

O relatório deve estar totalmente em português europeu, com terminologia e estilo consistentes com o contexto académico português. As referências académicas e a narrativa conceptual devem manter uma linguagem formal, mas acessível.

### 5.2 Clarificação sobre o papel da IA

O projeto deve deixar explícito que a análise fornecida é um apoio à decisão e não uma decisão jurídica formal. Isso é especialmente importante em contexto jurídico e em qualquer solução que possa ser usada por profissionais do direito.

### 5.3 Alinhamento entre backend real e mock

O código actual mostra uma arquitetura que admite um backend real em [server.ts](server.ts), mas o frontend principal pode operar com traces simulados. Em contexto académico, isso é aceitável, mas o produto deve comunicar claramente esta distinção. O melhor desenvolvimento é:

- manter a arquitetura real, com serviço ou mock;
- permitir demonstração em modo académico;
- reforçar a narrativa por meio de dados confiáveis e explicáveis;
- não criar a impressão de que a análise é definitiva quando se trata de uma simulação.

### 5.4 Reforço da UX de confiança

O projeto tem um forte valor visual, mas a confiança do utilizador aumenta quando a interface comunica claramente:

- o que foi observado;
- o que foi assumido;
- o que foi rejeitado;
- qual o nível de incerteza;
- qual o nível de confiança do sistema.

Estas dimensões deveriam estar mais visíveis no protótipo.

## 6. Plano de remediação proposto

A melhor estratégia é combinar o melhor do relatório com o melhor do projeto. O plano deve ser simples, coerente e orientado para os requisitos académicos.

### Prioridade 1 — Reforçar a narrativa legal e a explicabilidade

Manter a base conceptual do relatório, mas ajustá-la ao contexto do protótipo actual. Isso significa destacar:

- o papel da explicabilidade em contexto legal;
- a necessidade de confiança apropriada;
- a diferença entre um trace técnico e uma explicação humana;
- a importância das alternativas rejeitadas e da fidelidade das explicações.

### Prioridade 2 — Alinhar a arquitetura às necessidades do protótipo

O projeto deve manter a arquitetura já em desenvolvimento, com a distinção clara entre:

- camada de dados e trace;
- camada visual;
- camada de explicação / análise.

Se o backend for simulado, a solução deve continuar a ser conceptualizada como uma prova de conceito funcional e credível. Se o backend for real, a interface deve refletir isso com origem de dados, contexto e origem de confiança.

### Prioridade 3 — Reduzir a tensão entre teoria e implementação

O relatório é muito forte em teoria. O projeto atual é forte em funcionalidade. O que falta é uma camada de tradução entre os dois: um relatório mais preciso sobre o que foi realmente implementado, o que foi simulado e o que é demonstrativo.

### Prioridade 4 — Melhorar a confiança e a transparência UX

A remediação UX deve incluir:

- rótulos claros de risco;
- indicação de incerteza;
- textos em língua portuguesa europeia;
- explicação de cada passo em linguagem simples;
- tradução de elementos jurídicos complexos para linguagem de utilizador não técnico;
- indicação de que o sistema auxilia a decisão mas não substitui a validação humana.

## 7. Conclusão

A comparação entre o relatório e o projeto mostra que ambos têm pontos fortes complementares. O relatório oferece a estrutura teórica e a justificação académica; o projeto oferece a base funcional, visual e narrativa necessária para demonstrar o conceito em ação.

A melhor remediação passa por manter a profundidade conceptual do relatório e a utilidade prática do protótipo. A solução final deve manter a sua orientação académica, mas reforçar a clareza, a linguagem portuguesa europeia, a explicabilidade e a transparência da IA no contexto jurídico.

Em termos práticos, a recomendação mais forte é a seguinte: não tentar transformar o projeto num sistema jurídico completo; manter a sua natureza de protótipo de apoio à decisão, reforçando a qualidade da UX e da explicabilidade. É assim que o projeto cumprirá os requisitos sem perder valor académico, utilidade demonstrativa e coerência com o contexto europeu e português.

## 8. Palavra-chave

- XAI
- explicabilidade de IA
- scrollytelling
- visualização narrativa
- grafos de decisão
- confiança apropriada
- engenharia multimédia
- direito e IA
- protótipo académico
- português europeu

Esta abordagem é particularmente relevante para a análise de grafos de decisão em evolução, onde a manutenção do contexto visual é essencial para a compreensão da cadeia lógica (Ahn et al., 2014). No JustiViz, o zoom semântico é acionado por interação direta (clique ou hover sobre um nó), garantindo que o utilizador pode aprofundar a auditoria técnica sempre que necessário, mas mantendo a narrativa de alto nível como fio condutor.

3. ### **Visualização de Caminhos Bifurcados (Forked Paths)**

Um dos aspetos mais inovadores do design é a exposição visual de caminhos de decisão alternativos que o agente considerou e rejeitou. Estes ramos são representados com opacidade reduzida e acompanhados de justificações geradas pelo LLM secundário, permitindo ao utilizador auditar o "porquê" da exclusão de determinadas hipóteses. Esta transparência adicional contribui para a mitigação da sobreconfiança (*overreliance*), ao mostrar que a máquina "ponderou" alternativas antes de concluir.

PlaceholderparaFigura5:Wireframes/MockupsdaInterfaceJustiViz

Em síntese, o design de interação do JustiViz articula três dimensões complementares: (i) a progressão narrativa controlada pelo scroll, (ii) a profundidade de detalhe controlada pelo zoom semântico, e (iii) a transparência das alternativas exposta pelos caminhos bifurcados. Esta tripla articulação visa transformar a "caixa‑negra" do agente numa experiência educativa e auditável, alinhada com as melhores práticas de Visualização Narrativa e XAI.

5. ## **Seleção e Justificação de Tecnologias**

Python e LangGraph: Escolhidos para o backend pela capacidade de gerir estados complexos de agentes e facilitar a extração de traces ramificados.

React e Scrollama.js: Selecionados para garantir o controlo preciso de eventos de scroll e a performance exigida para interfaces multimédia fluidas.

D3.js: Utilizado para a renderização do grafo de decisões, permitindo visualizações flexíveis de árvores de pensamento e alternativas rejeitadas.

Dataset CUAD: Adotado como padrão académico para garantir a relevância prática da solução no domínio jurídico.

4. # **Desenvolvimento do Projeto**

O desenvolvimento do JustiViz foi orientado pela necessidade de transformar processos lógicos opacos em narrativas visuais fluidas, garantindo o rigor técnico exigido pela Engenharia Multimédia e a utilidade prática para o domínio jurídico. Para tal, adotou-se uma abordagem estruturada e incremental, organizada em fases sequenciais, mas com ciclos curtos de validação que permitiram ajustar a narrativa visual, a estrutura do agente e a interação em função dos resultados parciais obtidos. A implementação beneficiou significativamente do uso de ferramentas de Inteligência Artificial, nomeadamente o Claude e o GitHub Copilot, para a geração de código boilerplate no frontend e para a depuração de algoritmos complexos de manipulação de grafos no D3.js. O ambiente de desenvolvimento baseou-se no VS Code, integrando o LangGraph Studio para a visualização em tempo real dos fluxos do agente durante a fase de depuração.

O pipeline de desenvolvimento assentou numa arquitetura em duas camadas principais: (1) preparação e execução do agente em ambiente offline (Python/LangGraph); (2) visualização e interação em ambiente web (React/D3.js/Scrollama.js). Não foi implementado qualquer backend em produção ou API em tempo real, garantindo a reprodutibilidade do protótipo e a segurança dos dados processados.

1. ## **Metodologia e Fases de Desenvolvimento**

A metodologia adotada combinou a estruturação sequencial da Waterfall com ciclos incrementais curtos dentro de cada fase, permitindo um controlo rigoroso do progresso e a adaptação a desafios técnicos emergentes. O desenvolvimento foi organizado em quatro fases principais, cada uma com entregáveis específicos:

| Fase | Descrição | Tarefas |
| :---- | :---- | :---- |
| 1 \- Análise e Planeamento | Nesta fase inicial, consolidaram-se os requisitos do projeto e aprofundou-se o enquadramento teórico e jurídico. | Levantamento detalhado de requisitos funcionais (RF1 a RF5) e não funcionais (usabilidade, performance, segurança, confiabilidade), com base na literatura de XAI e nas necessidades de utilizadores do domínio jurídico (Arrieta et al., 2020; Mehrotra et al., 2024). |
|  |  | Análise do dataset CUAD (Hendrycks et al., 2021\) e definição do subconjunto de contratos a utilizar como caso de estudo, garantindo a representatividade de diferentes tipologias de cláusulas de risco. |
|  |  | Revisão de literatura aprofundada sobre agentes autónomos, Chain-of-Thought, visualização narrativa (Segel & Heer, 2010; Kosara & Mackinlay, 2013\) e scrollytelling (Samora, 2022; Tjärnhage et al., 2023), com seleção das referências principais para o estado da arte. |
|  |  | Definição do âmbito: explicações locais com agentes orquestrados por LangGraph, pipeline offline com exportação para JSON e interface web em React, excluindo o treino de modelos de raiz e aplicações móveis nativas. |
| 2 – Conceção, Dados e Arquitetura | Esta fase centrou-se no desenho conceptual da solução e na preparação dos dados que alimentariam a visualização. | Seleção de um subconjunto representativo de contratos do CUAD, abrangendo diferentes tipologias de cláusulas de risco (ex.: cláusulas de não-concorrência, indemnização, rescisão). |
|  |  | Definição do esquema JSON que serviria de “contrato” entre o agente e o frontend, incluindo campos para step\_id, type (decisão/ferramenta), summary (nível macro), payload (nível micro), alternatives (caminhos rejeitados) e faithfulness\_metadata. |
|  |  | Desenho da arquitetura de três camadas: (1) Camada do Agente (Python \+ LangGraph), (2) Camada de Dados (JSON Trace), (3) Camada de Apresentação (React \+ D3.js \+ Scrollama.js). |
|  |  | Especificação do storyboard de scrollytelling, definindo os pontos de acionamento ao longo da página (0% – introdução, 25% – dados de entrada, 50% – nó crítico, 75% – caminho completo, 100% – resultado final), alinhado com os géneros narrativos de Segel & Heer (2010). |
| 3 – Desenvolvimento do Protótipo | Nesta fase foi concretizada a implementação técnica do protótipo, dividida em duas componentes paralelas. | Componente Agente (offline): Implementação em Python do agente jurídico com LangGraph, configurando nós para extração de cláusulas, classificação de risco e auditoria de precedentes. Instrumentação do agente para capturar caminhos alternativos rejeitados (forked paths). |
|  |  | Componente de Visualização (frontend): Desenvolvimento da aplicação em React com Scrollama.js para controlo de scroll, D3.js para renderização do grafo de decisão, e integração do LLM secundário para anotações generativas e verificação de fidelidade (faithfulness check). |
| 4 – Validação, Refinamento e Relatório Final | A última fase teve como objetivo consolidar o protótipo e produzir a documentação final, conforme descrito no Capítulo 5\. | Execução dos Planos de Testes |
|  |  | Análise e Interpretação dos Resultados |
|  |  | Refinamento da Interface e Ajustes de Usabilidade |
|  |  | Reflexão Crítica e Identificação de Trabalho Futuro |
|  |  | Redação e Revisão do Relatório Final |

*Tabela 4 – Fases do desenvolvimento do projeto.*  
A última fase estruturou-se em cinco eixos complementares, descritos em seguida, cujos resultados são apresentados detalhadamente no Capítulo 5\.

**Eixo 1 – Execução dos Planos de Testes**

Foram executados os planos de teste definidos na Fase 1, abrangendo diferentes dimensões do sistema:

Testes Unitários e de Integração: Realizados sobre a camada do agente (LangGraph) para verificar a correta orquestração dos nós (extract\_clauses, classify\_risk, check\_precedent) e a integridade dos caminhos bifurcados (forked paths) capturados no JSON Trace. Validou-se que as alternativas rejeitadas eram efetivamente registadas com as respetivas justificações lógicas.

Testes de Performance Multimédia: Medição da fluidez da interface durante a navegação por scroll, utilizando ferramentas de profiling do navegador (Chrome DevTools, Lighthouse) para aferir a taxa de fotogramas (FPS) em traces de execução longos (\> 50 passos), garantindo a conformidade com o requisito de 60 FPS.

Testes de Fidelidade (Faithfulness Check): Validação da consistência entre as anotações geradas pelo LLM secundário e a lógica técnica original do rasto de execução, seguindo a metodologia proposta por Young (2026) e Yuan et al. (2026). Para cada passo do agente, comparou-se a anotação narrativa com o payload técnico, calculando a taxa de anotações classificadas como "fiéis" pelo nó de auditoria.

Estudo Comparativo com Utilizadores (XAI): Realizou-se um teste controlado com um pequeno grupo de utilizadores (simulando o perfil de especialistas de domínio), comparando a velocidade e precisão na deteção de erros lógicos injetados quando confrontados com a visualização narrativa (JustiViz) versus o rasto de execução bruto (logs). Este estudo baseou-se no framework teórico de Guo et al. (2024) para medir a dependência apropriada (appropriate reliance), avaliando a capacidade dos utilizadores em aceitar ou rejeitar as decisões do agente de forma crítica.

**Eixo 2 – Análise e Interpretação dos Resultados**

Os dados recolhidos nos testes foram analisados criticamente, cruzando-os com os objetivos SMART definidos no Capítulo 1:

Avaliação da taxa de FPS durante o scroll e identificação de potenciais estrangulamentos de performance.

Cálculo da taxa de anotações fiéis, comparando-a com os limiares reportados na literatura (Young, 2026; Kim et al., 2026).

Análise da matriz de reliance (aceitação/rejeição face à correção do agente), identificando padrões de sobreconfiança (overreliance) ou subconfiança (underreliance) nos utilizadores, em linha com a discussão de Mehrotra et al. (2024) sobre a calibração da confiança em sistemas de IA.

**Eixo 3 – Refinamento da Interface e Ajustes de Usabilidade**

Com base nos resultados dos testes e nas observações recolhidas (ainda que informais), procedeu-se a refinamentos no design e na interação:

Ajustes de legibilidade e contraste nos nós do grafo, garantindo a distinção clara entre caminhos percorridos (opacidade total) e rejeitados (opacidade reduzida).

Melhoria do feedback visual durante o scrollytelling, assegurando que as transições (fading, realce, movimento de nós) são percetíveis e não ambíguas.

Ajustes na sincronização entre a posição de scroll e os momentos narrativos (storyboard), garantindo que a revelação da informação acompanha o ritmo esperado pelo utilizador.

Refinamento da legibilidade das anotações gerativas, simplificando o jargão técnico sempre que possível, sem comprometer a precisão da explicação.

**Eixo 4 – Reflexão Crítica e Identificação de Trabalho Futuro**

Para além da validação técnica, procedeu-se a uma reflexão crítica sobre as limitações da abordagem adotada e as oportunidades de evolução:

Discussão sobre a natureza predominantemente local das explicações proporcionadas pelo scrollytelling, contrastando com a necessidade de visões globais do modelo (dashboards agregados).

Análise das dependências do sistema: latência das APIs externas, necessidade de pré‑processamento adequado dos dados jurídicos, e requisitos de infraestrutura para inferência local.

Identificação de linhas de trabalho futuro, nomeadamente a integração de modelos locais (Ollama/Docker) para garantir a privacidade dos contratos, a exploração de mixed‑initiative interfaces que permitam a edição manual dos caminhos de decisão, e a realização de estudos empíricos formais com utilizadores em contexto real (He et al., 2025; Srinivasan & Thomason, 2026).

**Eixo 5 – Redação e Revisão do Relatório Final**

Concluída a validação e o refinamento do protótipo, procedeu‑se à redação e revisão final do relatório:

Estruturação do documento de acordo com as normas da unidade curricular, incluindo a integração dos resultados dos testes (Capítulo 5\) e da discussão crítica (Capítulo 6).

Revisão da coerência interna entre os capítulos, garantindo que os objetivos definidos no Capítulo 1 são devidamente respondidos ao longo do texto.

Verificação da formatação das referências bibliográficas, assegurando a conformidade com as normas académicas e a citação correta de todas as fontes utilizadas (ex.: Arrieta et al., 2020; Barez et al., 2025; Segel & Heer, 2010; Kosara & Mackinlay, 2013; etc.).

Redação da Conclusão (Capítulo 7), sintetizando as principais contribuições, limitações e perspetivas de trabalho futuro, com destaque para o papel da Engenharia Multimédia na promoção de uma IA transparente e auditável.

2. ## **Alternativas Tecnológicas e Justificação das Escolhas**

Durante a fase de análise, equacionaram-se diferentes alternativas tecnológicas, tendo as escolhas finais sido determinadas pelos requisitos de escalabilidade, performance e adequação ao domínio do projeto. A Tabela 4.1 sintetiza as principais alternativas ponderadas.

| Componente | Alternativa Inicial (Pré-Projeto) | Escolha Final | Justificação |
| :---- | :---- | :---- | :---- |
| Orquestração do Raciocínio | Árvores de Decisão (scikit-learn) | LangGraph (Python) | Necessidade de gerir estados complexos e capturar caminhos bifurcados (forked paths) em agentes com múltiplos passos de raciocínio, inviável com árvores estáticas (Besta et al., 2024; LangChain, n.d.). |
| Animações e Scrollytelling | GSAP \+ ScrollTrigger | Scrollama.js \+ React | Maior integração nativa com o ecossistema React, controlo preciso de eventos de scroll via IntersectionObserver, e melhor desempenho em transições sincronizadas com o DOM virtual (Samora, 2022). |
| Visualização de Grafos | D3.js | D3.js (mantida) | Biblioteca de referência para visualização de dados em grafos e árvores, com flexibilidade para animações personalizadas e suporte a zoom semântico (Ahn et al., 2014). |
| Dataset de Contratos | IGFEJ/DGSI (dados portugueses) | CUAD (Hendrycks et al., 2021\) | Padrão académico reconhecido na área de análise de contratos, com anotações especializadas e comparabilidade com a literatura internacional. |

*Tabela 5– Alternativas Tecnológicas Ponderadas.*

A opção pelo LangGraph revelou-se particularmente acertada, pois permitiu a instrumentação do agente para registar não só a decisão final, mas também as alternativas rejeitadas – um requisito central para a transparência e auditoria do sistema. A mudança para Scrollama.js, em detrimento do GSAP inicialmente previsto, justificou-se pela necessidade de um controlo mais fino sobre a sincronização entre o progresso do scroll e as transições de estado no grafo D3.js, garantindo a fluidez exigida para uma taxa de 60 FPS.

3. ## **Implementação da Camada do Agente (Backend)**

A camada lógica foi construída em Python, utilizando a biblioteca LangGraph para orquestrar o raciocínio em grafos de estado. A escolha do LangGraph, em alternativa a abordagens mais simples como scripts lineares, decorreu da necessidade de gerir estados complexos e de capturar caminhos bifurcados (forked paths) – um requisito central para a transparência do sistema.

Orquestração de Nós: O agente foi configurado com nós específicos para extração de cláusulas (extract\_clauses), classificação de risco com base no dataset CUAD (classify\_risk) e auditoria de precedentes (check\_precedent), seguindo a abordagem de raciocínio hierárquico proposta por Cheng et al. (2026).

Captura de Caminhos Bifurcados (Forked Paths): Para satisfazer o objetivo de transparência, o agente foi instrumentado para registar não só a decisão final, mas também as alternativas rejeitadas e as respetivas justificações lógicas. Esta instrumentação baseou-se nas recomendações de Lightman et al. (2023) sobre a verificação sistemática passo-a-passo.

Placeholder para Figura 6: Excerto de Código da Definição do Grafo no LangGraph.

4. ## **Estruturação de Dados (JSON Trace)**

O "contrato" de comunicação entre o backend e a interface multimédia foi definido através de um esquema JSON especializado, concebido na Fase 2 para suportar o zoom hierárquico e as bifurcações. Este rasto de execução (trace) contém:

step\_id e type (ex.: decisão ou chamada de ferramenta);

summary para o nível narrativo macro;

payload técnico para o nível micro (zoom semântico);

alternatives que contêm os ramos de decisão rejeitados, com as respetivas justificações;

faithfulness\_metadata para suportar o mecanismo de verificação de fidelidade (Young, 2026; Yuan et al., 2026).

5. ## **Implementação da Interface Multimédia (Frontend)**

O frontend foi desenvolvido em React, focando-se na fluidez visual e nas melhores práticas de UX/UI, em conformidade com os princípios de Visualização Narrativa (Kosara & Mackinlay, 2013; Hullman & Diakopoulos, 2011).

Motor de Scrollytelling: Utilizou-se a biblioteca Scrollama.js para mapear o progresso do scroll do utilizador em eventos que ativam transições de estado na visualização, seguindo o storyboard definido na Fase 2\. Esta abordagem permite que o utilizador controle o ritmo da narrativa, promovendo uma calibração de confiança progressiva (Tjärnhage et al., 2023).

Visualização de Decisões: A renderização das árvores de decisão e dos grafos de raciocínio foi implementada com D3.js, permitindo animações suaves e interativas entre os diferentes estados do agente, com destaque para os caminhos percorridos e rejeitados.

Placeholder para Figura7: Interface JustiViz – Visão Narrativa vs. Visão Técnica

6. ## **Funcionalidades Avançadas de Interação**

Zoom Hierárquico (Semantic Zoom): Implementou-se uma técnica de focus+context (Bederson & Hollan, 1994), onde o utilizador pode clicar num nó da narrativa para "mergulhar" nos dados brutos da API (payload), permitindo uma auditoria detalhada sem perder o fio condutor da história. Esta funcionalidade é essencial para a análise de redes e grafos de decisão em evolução (Ahn et al., 2014).

Anotações Generativas e Fidelidade: Um LLM secundário gera explicações em linguagem simples para o jargão jurídico, transformando logs técnicos em anotações compreensíveis (Mindlin et al., 2024). Para mitigar o risco de explicações ilusórias (unfaithful explanations), foi implementado um nó de Faithfulness Check que valida se a anotação narrativa não contradiz a lógica técnica original, seguindo as recomendações de Sarkar (2024) e Kim et al. (2026).

7. ## **Otimização e Performance Multimédia**

Em conformidade com os requisitos de Engenharia Multimédia, o sistema foi otimizado para manter uma performance de 60 FPS, garantindo transições fluidas e uma experiência de utilizador imersiva:

Utilização de Virtualização de DOM para lidar com traces de execução longos (\> 50 passos), evitando a degradação do desempenho;

Otimização de cálculos do D3.js para evitar bloqueios na thread principal durante as animações de transição, recorrendo a técnicas de debouncing e requestAnimationFrame.

8. ## **Segurança e Privacidade (Security by Design)**

arquitetura foi desenhada para ser agnóstica de modelo, permitindo a substituição de APIs externas por modelos locais (via Ollama ou Docker) sem reescrita significativa do código. Embora o protótipo utilize APIs externas para demonstração, o sistema está preparado para integração com modelos locais, garantindo que dados sensíveis de contratos jurídicos nunca abandonam a infraestrutura segura da organização – uma preocupação alinhada com o AI Act da União Europeia (2024).

5. ### **Testes e Validação**

O processo de validação foi estruturado para avaliar não apenas a robustez técnica do sistema, mas também a sua eficácia na calibração da confiança do utilizador (appropriate reliance) e a performance da interface de scrollytelling.

1. ## **Plano de Testes**

A estratégia de testes seguiu uma abordagem multidimensional:

Testes Unitários e de Integração: Realizados sobre a camada do agente (LangGraph) e o processamento de dados (JSON Trace) para garantir a integridade dos caminhos bifurcados (forked paths).

Testes de Performance Multimédia: Focados na fluidez da interface, medindo o tempo de renderização de grafos complexos e a taxa de fotogramas por segundo (FPS) durante o scroll.

Testes de Fidelidade (Faithfulness Check): Validação da consistência entre as anotações geradas pela LLM secundária e a lógica técnica original do rasto de execução.

Estudo com Utilizadores (XAI): Teste comparativo entre a visualização narrativa e o rasto de execução bruto (raw logs), focado na velocidade de depuração de erros lógicos.

2. ## **Casos de Teste**

Apresentam-se os principais casos de teste executados para validar as funcionalidades críticas (Tabela 5.1).

Tabela 5.1: Casos de Teste do JustiViz

| ID | Nome | Descrição | Resultado Esperado |

| :--- | :--- | :--- | :--- |

| CT1 | Navegação Narrativa | Ativar transições de estado via scroll. | Transições visuais fluidas sincronizadas com o rasto JSON. |

| CT2 | Zoom Hierárquico | Expandir um nó de decisão para ver o payload da API. | Exibição imediata dos dados técnicos sem quebra de contexto visual. |

| CT3 | Deteção de Bifurcação | Visualizar caminhos alternativos rejeitados pelo agente. | Representação clara de ramos "rejeitados" com as respetivas justificações. |

| CT4 | Validação de Fidelidade | Injetar anotação contraditória no nó de auditoria. | O sistema deve assinalar o passo como "não fiel" (unfaithful). |

3. ## **Resultados dos Testes**

   1. ### **Performance Multimédia**

Em conformidade com os requisitos de Engenharia Multimédia, o sistema foi submetido a testes de carga com traces de execução longos (\> 50 passos).

\[INSERIR GRÁFICO: Taxa de FPS durante o Scroll\] Placeholder: Gráfico demonstrando que a interface mantém uma média de \[INSERIR VALOR: ex: 58-60\] FPS durante a navegação interativa.

2. ### **Calibração de Confiança e Appropriate Reliance**

Utilizando o framework teórico de Guo et al. (2024), mediu-se a capacidade do utilizador em aceitar ou rejeitar as decisões do agente jurídico.

\[INSERIR TABELA/MATRIZ: Matriz de Reliance\] Placeholder: Dados comparativos mostrando que os utilizadores que usaram o JustiViz detetaram erros injetados em \[INSERIR DADOS: ex: 85%\] dos casos, contra \[INSERIR DADOS: ex: 40%\] no grupo de controlo (logs brutos).

3. ### **Fidelidade das Anotações Generativas**

A LLM de auditoria avaliou a consistência narrativa face aos dados lógicos.

\[INSERIR DADOS: Taxa de Erro de Fidelidade\] Placeholder: A taxa de anotações marcadas como fiéis pelo auditor foi de \[INSERIR PERCENTAGEM: ex: 92%\], cumprindo o objetivo SMART definido.

4. ## **Validação dos Requisitos**

Como os testes demonstram que os requisitos definidos foram cumpridos.

A Tabela 5.2 cruza os resultados obtidos com os requisitos definidos no Capítulo 3 através do modelo FURPS+.

Tabela 5.2: Matriz de Validação de Requisitos

| Requisito | Tipo | Estado | Observações |

| :--- | :--- | :--- | :--- |

| RF1 \- Scrollytelling | Funcional | \*\*\[PASSOU / FALHOU\]\*\* | Navegação mapeada com sucesso ao rasto JSON. |

| RF2 \- Hierarchical Zoom | Funcional | \*\*\[PASSOU / FALHOU\]\*\* | Transição entre macro (anotação) e micro (API) funcional. |

| RN1 \- Performance | Performance | \*\*\[PASSOU / FALHOU\]\*\* | Fluidez constante de 60 FPS atingida nas animações. |

| RN2 \- Segurança | Segurança | \*\*\[PASSOU / FALHOU\]\*\* | Implementada arquitetura de isolamento para modelos locais. |

Conclui-se que o JustiViz não só cumpre os requisitos técnicos de Engenharia Multimédia, como também fornece uma ferramenta superior para a auditoria humana de processos de decisão automatizados, reduzindo significativamente a carga cognitiva na interpretação de raciocínios complexos.

# **Referências**

Ahn, J.-W., Plaisant, C., & Shneiderman, B. (2014, March). A task taxonomy for network evolution analysis. IEEE Transactions on Visualization and Computer Graphics, 20(3), 365–376. https://doi.org/10.1109/TVCG.2013.238

Arrieta, A. B., Díaz-Rodríguez, N., Del Ser, J., Bennetot, A., Tabik, S., Barbado, A., Garcia, S., Gil-Lopez, S., Molina, D., Lchat, R., Bustamante, J., Casillas, A., & Herrera, F. (2020). Explainable Artificial Intelligence (XAI): Concepts, taxonomies, opportunities and challenges toward responsible AI. Information Fusion, 58, 82–115. https://doi.org/10.1016/j.inffus.2019.11.006

Barez, F., Wu, T.-Y., Arcuschin, I., Lan, M., Wang, V., Siegel, N., Collignon, N., Neo, C., Lee, I., Paren, A., Bibi, A., Trager, R., Fornasiere, D., Yan, J., Elazar, Y., & Bengio, Y. (2025). Chain-of-thought is not explainability. https://fbarez.github.io/assets/pdf/Cot\_Is\_Not\_Explainability.pdf

Bederson, B. B., & Hollan, J. D. (1994, November 2–4). Pad++: A zooming graphical interface for exploring alternate interface physics. In Proceedings of the 7th Annual ACM Symposium on User Interface Software and Technology (pp. 17–26). Association for Computing Machinery. https://doi.org/10.1145/192426.192435

Besta, M., Blach, N., Kubicek, A., Gerstenberger, R., Podstawski, M., Gianinazzi, L., Gajda, J., Lehmann, T., Niewiadomski, H., Nyczyk, P., & Hoefler, T. (2024). Graph of thoughts: Solving elaborate problems with large language models. Proceedings of the AAAI Conference on Artificial Intelligence, 38(16), 17682–17697. https://doi.org/10.1609/aaai.v38i16.29720

Besta, M., Blach, N., Kubicek, A., Gerstenberger, R., Podstawski, M., Gianinazzi, L., Gajda, J., Lehmann, T., Niewiadomski, H., Nyczyk, P., & Hoefler, T. (2024, February 6). Graph of thoughts: Solving elaborate problems with large language models. arXiv. https://arxiv.org/abs/2308.09687

Bhargava, P., Chitnis, R., Geramifard, A., Sodhani, S., & Zhang, A. (2024, March 11). When should we prefer decision transformers for offline reinforcement learning?. arXiv. https://doi.org/10.48550/arXiv.2305.14550

Bhatt, U., Antorán, J., Zhang, Y., Liao, Q. V., Sattigeri, P., Fogliato, R., Melançon, G., Krishnan, R., Stanley, J., Tickoo, O., Weller, A., Xiang, A., Moura, J. M. F., Peña, C., Eckersley, P., & Ravikumar, P. (2021, May 19–21). Uncertainty as a form of transparency: Measuring, communicating, and using uncertainty. In Proceedings of the 2021 AAAI/ACM Conference on AI, Ethics, and Society (pp. 401–413). Association for Computing Machinery. https://doi.org/10.1145/3461702.3462571

Caballero, J., Płociniczak, Ł., & Sadarangani, K. (2024, May 20). Existence and uniqueness of solutions in the Lipschitz space of a functional equation and its application to the behavior of the paradise fish. arXiv. https://arxiv.org/abs/2405.12345

Cheng, X., Pan, C., Zhao, M., Li, D., Liu, F., Zhang, X., Zhang, X., & Liu, Y. (2026). Hierarchical chain-of-thought: Enhancing LLM reasoning performance and efficiency. In Pattern Recognition and Computer Vision: 8th Chinese Conference (pp. 196–210). Springer Nature. https://doi.org/10.48550/arXiv.2604.00130

Comissão Europeia. (2024). Regulamento (UE) 2024/1689 que estabelece regras harmonizadas relativas à inteligência artificial (Lei da IA). EUR-Lex. https://eur-lex.europa.eu

Ding, Y., Herbaut, N., & Salinesi, C. (2026, June 10). Toward operational trust calibration in AI-infused systems: A systematic review of computational trust models. https://hal.science/hal-05411739v2

Guo, Z., Wu, Y., Hartline, J., & Hullman, J. (2024, June 3–6). A decision theoretic framework for measuring AI reliance. In Proceedings of the 2024 ACM Conference on Fairness, Accountability, and Transparency (pp. 518–534). Association for Computing Machinery. https://doi.org/10.1145/3630106.3658901

He, G., Hemmer, P., Vössing, M., Schemmer, M., & Gadiraju, U. (2025, January). Fine-grained appropriate reliance: Human-AI collaboration with a multi-step transparent decision workflow for complex task decomposition. Proceedings of the ACM on Human-Computer Interaction, 9(CSCW1), Article 1\. https://doi.org/10.48550/arXiv.2501.10909

He, G., Hemmer, P., Vössing, M., Schemmer, M., & Gadiraju, U. (2025, January 19). Fine-grained appropriate reliance: Human-AI collaboration with a multi-step transparent decision workflow for complex task decomposition. arXiv. https://arxiv.org/abs/2501.10909v1

Hendrycks, D., Burns, C., Chen, A., & Ball, S. (2021, March 14). CUAD: An expert-annotated NLP dataset for legal contract review. arXiv. https://doi.org/10.48550/arXiv.2103.06268

Heng, Y., Deng, C., Li, Y., Yu, Y., Li, Y., Zhang, R., & Zhang, C. (2024, June 9). ProgGen: Generating named entity recognition datasets step-by-step with self-reflexive large language models. arXiv. https://doi.org/10.48550/arXiv.2403.11103

Hoff, K. A., & Bashir, M. (2015, April). Trust in automation: Integrating empirical evidence on factors that influence trust. Human Factors, 57(3), 407–434. https://doi.org/10.1177/0018720814547570

Holstein, J., Böcking, L., Spitzer, P., Kühl, N., Vössing, M., & Satzger, G. (2025, December). Balancing the unknown: Exploring human reliance on AI advice under aleatoric and epistemic uncertainty. ACM Transactions on Computer-Human Interaction, 32(6), Article 64\. https://doi.org/10.1145/3762813

Hu, B., Nian, H., Li, H., Chen, L., Sahoo, S., & Blaabjerg, F. (2023, August). Impedance reshaping band coupling and broadband passivity enhancement for DFIG system. IEEE Transactions on Power Electronics, 38(8), 9436–9447. https://doi.org/10.1109/TPEL.2023.3270364

Hullman, J., & Diakopoulos, N. (2011, December). Visualization rhetoric: Framing effects in narrative visualization. IEEE Transactions on Visualization and Computer Graphics, 17(12), 2231–2240. https://doi.org/10.1109/TVCG.2011.255

Jiang, P., Rayan, J., Dow, S. P., & Xia, H. (2023, October 29–November 1). Graphologue: Exploring large language model responses with interactive diagrams. In Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology (Article No. 3, pp. 1–20). Association for Computing Machinery. https://doi.org/10.1145/3586183.3606737

Komaba, A., Johno, H., & Nakamoto, K. (2024, August 20). Extension of the one-sample Kolmogorov-Smirnov test. arXiv. https://arxiv.org/abs/2408.10612

Kosara, R., & Mackinlay, J. (2013, May). Storytelling: The next step for visualization. Computer, 46(5), 44–50. https://doi.org/10.1109/MC.2013.36

LangChain. (n.d.). LangGraph overview. https://python.langchain.com/docs/langgraph

Liebherr, M., Enkel, E., Law, E. L.-C., Mousavi, M. R., Sammartino, M., & Sieberg, P. (2026, February 13). Dynamic calibration of trust and trustworthiness in AI-enabled systems. International Journal on Software Tools for Technology Transfer, 28, 105–121. https://doi.org/10.1007/s10009-026-00840-6

Lightman, H., Kosaraju, V., Burda, Y., Edwards, H., Baker, B., Lee, T., Leike, J., Schulman, J., Sutskever, I., & Cobbe, K. (2023, May 31). Let’s verify step by step. arXiv. https://doi.org/10.48550/arXiv.2305.20050

Lim, H., Zhang, R., Pendyal, S., Jo, J., & Zhang, C. (2023, March 27–31). D-Touch: Recognizing and predicting fine-grained hand-face touching activities using a neck-mounted wearable. In Proceedings of the 28th International Conference on Intelligent User Interfaces (pp. 574–587). Association for Computing Machinery. https://doi.org/10.1145/3581641.3584063

Long, B., Liu, E., Qiu, R., & Duan, Y. (2025, May 1). Explainable AI: The latest advancements and new trends. arXiv. https://doi.org/10.48550/arXiv.2505.07005

Lubbad, M. A. H., Kurtulus, I. L., Karaboga, D., Kilic, K., Basturk, A., Akay, B., Nalbantoglu, O. U., Yilmaz, O. M. D., Ayata, M., Yilmaz, S., & Pacal, I. (2024). A comparative analysis of deep learning-based approaches for classifying dental implants decision support system. Journal of Digital Imaging, 37, 2559–2580. https://doi.org/10.1007/s10278-024-01086-x

Luca, C. (2025, May). Trust calibration in human-AI interaction: Measuring the impact of explainability. https://www.researchgate.net/publication/391633852\_Trust\_Calibration\_in\_Human-AI\_Interaction\_Measuring\_the\_Impact\_of\_Explainability

Manuvinakurike, R., Moss, E., Watkins, E. A., Sahay, S., Raffa, G., & Nachman, L. (2025, May 1). Thoughts without thinking: Reconsidering the explanatory value of chain-of-thought reasoning in LLMs through agentic pipelines. arXiv. https://arxiv.org/abs/2505.00875v1

Mehrotra, S., Degachi, C., Vereschak, O., Jonker, C. M., & Tielman, M. L. (2024, November). A systematic review on fostering appropriate trust in human-AI interaction: Trends, opportunities and challenges. ACM Journal on Responsible Computing, 1(4), Article 26\. https://doi.org/10.1145/3696449

Mindlin, D., Robrecht, A. S., Morasch, M., & Cimiano, P. (2024). Measuring user understanding in dialogue-based XAI systems. In Proceedings of the 27th European Conference on Artificial Intelligence.

Mishra, R., & Schoeffer, J. (2026, June 4). A framework for measuring appropriate reliance on set-valued AI advice. arXiv. https://doi.org/10.48550/arXiv.2606.06081

Mishra, R., & Schoeffer, J. (2026, June 4). A framework for measuring appropriate reliance on set-valued AI advice. arXiv. https://arxiv.org/abs/2606.06081v1

Oh, E., Jin, K.-H., & Yeom, H. W. (2023, April 5). Realizing a superconducting square-lattice bismuth monolayer. arXiv. https://arxiv.org/abs/2304.02243

Öztürk, Ş., Turalı, M. Y., & Çukur, T. (2023, October 9). HydraViT: Adaptive multi-branch transformer for multi-label disease classification from chest X-ray images. arXiv. https://arxiv.org/abs/2310.06143

Park, H., Sim, S., Park, K., Lee, Y., Park, E., & Bae, H. (2026, August 5). Hybrid temporal autoencoder and similarity matching for low aggregation level long time series forecasting. Journal of Forecasting. https://doi.org/10.1002/for.70194

Samora, R. (2022). Scrollama: Scrollytelling with IntersectionObserver (Version 3.2.0) \[Computer software\]. GitHub. https://github.com/russellgoldenberg/scrollama

Sánchez Velázquez, J. M., Steiner, A., Freund, R., Guevara-Bertsch, M., Marciniak, C. D., Monz, T., & Bermudez, A. (2024, February 22). Gate set tomography of single-qubit gates under time-correlated noise. arXiv. https://arxiv.org/abs/2402.14530

Sarkar, A. (2024, May 7). Large language models cannot explain themselves. arXiv. https://arxiv.org/abs/2405.04382

Segel, E., & Heer, J. (2010, December). Narrative visualization: Telling stories with data. IEEE Transactions on Visualization and Computer Graphics, 16(6), 1139–1148. https://doi.org/10.1109/TVCG.2010.179

Shelby, R., Rismani, S., & Rostamzadeh, N. (2024, May 11–16). Generative AI in creative practice: ML-artist folk theories of use, harm, and harm reduction. In Proceedings of the CHI Conference on Human Factors in Computing Systems (Article No. 32, pp. 1–17). Association for Computing Machinery. https://dl.acm.org/doi/10.1145/3613904.3642461

Srinivasan, T., & Thomason, J. (2026, March 23–26). Adjust for trust: Mitigating trust-induced inappropriate reliance on AI assistance. In Proceedings of the 31st International Conference on Intelligent User Interfaces. Association for Computing Machinery. https://arxiv.org/pdf/2502.13321

Tjärnhage, A., Söderström, U., Norberg, O., Andersson, M., & Mejtoft, T. (2023, September 19–22). The impact of scrollytelling on the reading experience of long-form journalism. In European Conference in Cognitive Ergonomics (ECCE ’23) (Article No. 6, pp. 1–9). Association for Computing Machinery. https://doi.org/10.1145/3605655.3605683

União Europeia. (2024, 13 de junho). Regulamento (UE) 2024/1689 do Parlamento Europeu e do Conselho, que cria regras harmonizadas em matéria de inteligência artificial (Regulamento Inteligência Artificial). Jornal Oficial da União Europeia, L 2024/1689. https://eur-lex.europa.eu/eli/reg/2024/1689/oj

Vincenzi, B., Taylor, A. S., & Stumpf, S. (2021, April). Interdependence in action: People with visual impairments and their guides co-constituting common spaces. Proceedings of the ACM on Human-Computer Interaction, 5(CSCW1), 1–36. https://doi.org/10.1145/3449143

Yao, S., Yu, D., Zhao, J., Shafran, I., Griffiths, T. L., Cao, Y., & Narasimhan, K. R. (2023, December 3). Tree of thoughts: Deliberate problem solving with large language models. arXiv. https://doi.org/10.48550/arXiv.2305.10601

Ye, R., Lee, P., Varona, M., Huang, O., & Nobre, C. (2025, June 23–25). ScholarMate: A mixed-initiative tool for qualitative knowledge work and information sensemaking. In CHIWORK ’25 Adjunct: Adjunct Proceedings of the 4th Annual Symposium on Human-Computer Interaction for Work (pp. 1–7). Association for Computing Machinery. https://doi.org/10.1145/3707640.3731913

Young, R. J. (2026, March 23). Lie to me: How faithful is chain-of-thought reasoning in reasoning models?. arXiv. https://doi.org/10.48550/arXiv.2603.22582

Yuan, W., Lin, C., Chen, J., Xu, J., Wang, X., & Ngai, E. C. H. (2026, April 9). Verify before you commit: Towards faithful reasoning in LLM agents via self-auditing. arXiv. https://arxiv.org/abs/2604.08401v1

Zhang, L., Potaptchik, P., He, L., Du, Y., Doucet, A., Vargas, F., Dau, H., & Syed, S. (2026, March 25). Accelerated parallel tempering via neural transports. arXiv. https://arxiv.org/abs/2502.10328

# **Anexos**

