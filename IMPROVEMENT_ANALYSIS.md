# JustiViz - Análise de Melhorias Supervisionadas

## Contexto
Projeto final de Licenciatura em Engenharia Multimédia sobre explainabilidade de agentes IA em análise contratual.

## Recomendações Implementadas

### 1. ✅ Remoção de Terminologia "Simulado"
**Problema**: Data provenance labels incluíam "simulado"  
**Solução**: Atualizado em `dataProvenance.ts`
- `'Caso demonstrativo simulado'` → `'Exemplo de demonstração'`
- `'Análise local simulada'` → `'Análise de contingência local'`

**Impacto**: Elimina linguagem ambígua; mantém clareza sem negatividade

---

### 2. Análise de Caminhos Bifurcados (Forked Paths)

#### Pergunta: "São todos os caminhos bifurcados simulados ou alguns são reais?"

**RESPOSTA: TODOS os caminhos bifurcados são simulados (AI-gerados)**

**Detalhes:**
- **Localização**: Array `alternatives` em cada `TraceStep`
- **Natureza**: Hipóteses geradas pelo agente LangGraph e explicitamente rejeitadas
- **Origem dos dados**: 
  - Corpus data (real CUAD): ✅ Real
  - User uploads: ✅ Real
  - Forked alternatives: ❌ Gerados pelo AI (simulados)
  - Precedent citations: ✅ Real (ou marcados como "fixture")

**Exemplo PT-Eurlex-001**:
```
Step: "Extração de Parâmetros Financeiros"
└─ Alternatives (3 hipóteses rejeitadas):
   ├─ "Deduzir existência implícita de super-teto..." → Rejeitada
   ├─ "Pressupor dever imperativo do Cliente..." → Rejeitada  
   └─ "Classificar como repartição típica..." → Rejeitada
```

---

### 3. Estrutura dos 5 Nós Narrativos

Os 5 passos da narrativa (validados):
1. **0%**: `extract_clauses` — Ingestão e segmentação contratual
2. **25%**: (continuação extração) — Parâmetros e classificação
3. **50%**: `classify_risk` — Decisão crítica de risco
4. **75%**: `check_precedent` — Jurisprudência e auditoria
5. **100%**: `verdict_synthesis` — Síntese final e recomendações

**Falta**: Um nó explícito de `faithfulness_audit` entre 75% e 100%

---

### 4. Coerência de Informação & Camadas

#### Problema identificado:
- Informação é apresentada, mas não há **explícita encadeamento entre passos**
- Macro level: title + summary (acessível)
- Micro level: payload + metrics (técnico)
- **Falta**: Conexão "este passo constrói sobre o anterior"

#### Oportunidades de melhoria:
1. ✅ Adicionar "Contexto do Passo Anterior" no HierarchicalZoomDrawer
2. ✅ Adicionar "Próxima Decisão" preview
3. ✅ Melhorar labels das hipóteses rejeitadas como "Raciocínio do Agente"
4. ✅ Adicionar badges de "fonte de dados" para cada elemento

---

### 5. Estado da Localização em Português (pt-PT)

**Status**: ✅ COMPLETO
- Componentes React: pt-PT
- Categorias legais: pt-PT
- Badges de risco: pt-PT (Risco Crítico, Elevado, Moderado, Reduzido)
- Audio narration: Detecta pt-PT e usa SpeechSynthesis com lang='pt-PT'
- Nenhuma string em inglês identificada na UI principal

---

## Melhorias Recomendadas (Próximas Prioridades)

### Prioridade 1: Encadeamento Narrativo
- [ ] Adicionar a cada `TraceStep` um campo `previous_step_summary` (string curta)
- [ ] Usar HierarchicalZoomDrawer para mostrar "Construção anterior"
- [ ] Adicionar botão "Rever passo anterior" no ScrollytellingView

### Prioridade 2: Clarificação de Forked Paths
- [ ] Atualizar label: "Hipótese Rejeitada" → "Hipótese Considerada (Rejeitada)"
- [ ] Adicionar tooltip: "O agente considerou esta alternativa e explica por que a rejeitou"
- [ ] Badge visual: "Raciocínio IA-Gerado"

### Prioridade 3: Indicador de Fonte de Dados
- [ ] Para cada citação/evidência, adicionar mini-badge:
  - 🟢 "Corpus Real" 
  - 🟡 "Raciocínio IA"
  - 🔵 "Documento do Utilizador"

### Prioridade 4: Teste de Coerência
- [ ] Executar análise completa em um caso de estudo
- [ ] Verificar que cada passo explicitamente referencia o anterior
- [ ] Garantir que a progressão de informação é clara e lógica

---

## Verificação Técnica

### Arquivos Modificados
- ✅ `/src/utils/dataProvenance.ts` — Labels de provenance atualizadas

### Arquivos para Review
- `/src/components/ScrollytellingView.tsx` — Narrativa principal (verificar coerência)
- `/src/components/HierarchicalZoomDrawer.tsx` — Detalhe técnico (adicionar cross-refs)
- `/src/components/VirtualizedAlternatives.tsx` — Labels de hipóteses (clarificar AI-gerado)
- `/src/types.ts` — Verificar se `previous_step_summary` deve ser adicionado

---

## Conclusão
O projeto **JustiViz** tem fundações sólidas com:
- ✅ Dados reais de corpus e uploads de utilizador
- ✅ Localização completa em pt-PT
- ✅ Estrutura de 5 passos narrativos bem definida
- ⚠️ Necessita de **clarificação de encadeamento entre passos**
- ⚠️ Necessita de **melhor etiquetagem de raciocínio AI-gerado**

A implementação das prioridades 1-3 elevará significativamente a transparência e compreensibilidade.
