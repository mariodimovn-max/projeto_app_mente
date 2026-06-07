---
stepsCompleted: [1, 2, 3]
inputDocuments: ["d:\\projeto_app_mente\\_bmad-output\\planning-artifacts\\prd.md"]
projectName: "Aplicativo de Diário Digital para Bem-Estar Mental"
designPhase: "MVP"
documentVersion: "3.0"
lastUpdated: "2026-06-07"
strategicPriorities:
  northStarPersona: "Ana (Autoconhecimento + Propósito)"
  priorityTriangle: "Valores Estratégicos (Privacidade, Honestidade, Profundidade)"
  successMetric: "Insights genuínos (qualitativo)"
  designApproach: "1 design sólido, iterar após MVP"
---

# UX Design Specification - Aplicativo de Diário Digital para Bem-Estar Mental

**Autor:** Mario Dimov  
**Data:** 7 de Junho de 2026  
**Versão:** 2.0 - Strategic Priorities Defined  
**Timeline:** 3 meses (design + development)  
**Status:** Fase 2 - Prioridades Estratégicas Definidas

---

## Executive Summary

### Visão

Criar tecnologia que "toca a alma e desperta a mente"—um espaço digital seguro e acolhedor onde usuários exploram suas próprias emoções, padrões e consciência através de conversação inteligente com um agente IA empático. 

Não é terapia (não cura), não é prescrição (não diz o que fazer). É um espelho reflexivo que transforma caos emocional em padrões observáveis, permitindo auto-descoberta genuína.

### Usuários-Alvo

**Persona 1: Ana (32) — NORTH STAR PARA MVP**
- Profissional em carreira estável, frustrada com vazio existencial
- Quer entender "quem é realmente" e "para que vive"
- Context de uso: Noites na cama, ou períodos íntimos após dia intenso
- **Job-to-be-Done:** Descobrir por que está presa; conectar-se consigo mesma

**Persona 2: Carlos (28) — Suportado, não prioritário**
- Recém-formado, perdido entre opções, paralisia de decisão
- Context de uso: Noites tranquilas, momentos de reflexão estruturada
- **Job-to-be-Done:** Sair do loop mental; ganhar clareza sobre próximos passos

**Persona 3: Julia (35) — Suportada, não prioritária**
- Mãe em terapia profissional 1x/mês, gerencia ansiedade
- Context de uso: Momentos de crise, reflexão noturna
- **Job-to-be-Done:** Complementar terapia; ter espaço entre sessões profissionais

### Strategic Priorities (Triângulo de Priorização)

**PRIORIDADE #1: Valores Estratégicos**
- Privacidade Radical ✓ (dados invioláveis)
- Honestidade Radical ✓ (não vende esperança falsa)
- Profundidade > Escala ✓ (qualidade sobre quantidade)

**PRIORIDADE #2: Design Extraordinário** (suportando valores)
- Minimalista + Caloroso (visualmente relaxante)
- Transparência total (usuário entende agente)
- Acolhimento como fundação

**PRIORIDADE #3: JTBD Perfeito** (para Ana; Carlos e Julia recebem suporte adequado)
- Ana tem JTBD primária ("auto-descoberta profunda")
- Carlos/Julia têm JTBDs secundárias (abordadas em versões futuras se necessário)

---

## User Journeys

### Persona 1: Ana (32) - NORTH STAR

**Contexto:** Profissional em carreira estável, frustrada com vazio existencial

**Jornada:**
1. **Descoberta** → Encontra app via recomendação ou busca "autoconhecimento"
2. **Onboarding** → Lê propósito claro: "Este é um espaço para conhecer você melhor" + aviso "Não é terapia profissional"
3. **Primeira Sessão** → Conversa com agente sobre como se sente hoje
4. **Exploração** → Agente guia reflexão sobre valores, contradições, padrões
5. **Primeiro Insight** → Agente sintetiza: "Percebi que você valoriza autenticidade mas está vivendo conforme expectativas externas"
6. **Reconhecimento Personalizado** → Sistema reconhece o padrão específico descoberto (não genérico)
7. **Retorno** → Ana volta próxima noite porque quer explorar mais
8. **Padrão de Longo Prazo** → Após 2 semanas, resumo mostra: "Você mencionou rotina 6x, propósito 8x"
9. **Transformação** → Após 30 dias, Ana relata em feedback "Finalmente entendo minhas próprias contradições"

**UX Principles Aplicadas:**
- ✓ Acolhimento antes de eficiência
- ✓ Primeiro insight real (não falso)
- ✓ Transparência total
- ✓ Reconhecimento personalizado
- ✓ Padrões emergem de dados reais

### Persona 2: Carlos (28) - Suportado

**Contexto:** Recém-formado, paralisia de decisão

**Jornada - Abordagem Adequada (não otimizada):**
1. Onboarding claro (similar a Ana)
2. Primeiras sessões exploram: "O que te energiza? O que te assusta?"
3. Agente detecta padrão: "Você se emociona quando fala de impacto social"
4. Síntese: "Medo de instabilidade financeira vs desejo de impacto"
5. **Diferença do MVP:** Estrutura pode parecer um pouco mais direcionada (vs profundamente reflexiva para Ana)
6. Não há gamification (mantém valores)
7. Reconhecimento: "Você nomeou uma pergunta mais clara"

**Observação:** Carlos *pode* ter bons insights, mas não é prioridade MVP. Se funcionar bem, ótimo. Se precisar de ajustes, versão 1.1.

### Persona 3: Julia (35) - Suportada

**Contexto:** Ansiedade, terapia profissional 1x/mês

**Jornada - Complementar Terapia:**
1. Onboarding com destaque extra: "IMPORTANTE: Este app complementa, não substitui terapia profissional"
2. Usa entre sessões terapêuticas (2-3x por semana)
3. Quando ansiedade surge, conversa com agente
4. Agente reconforta E deixa claro: "Isso é importante explorar com seu psicólogo"
5. Resumos semanais ajudam Julia a trazer padrões para sessão profissional
6. **Não é prioridade MVP**, mas suportada e segura

**Observação:** Julia precisa de "clareza" mais que "caloroso". Design atende ambas, mas se houver trade-off, clareza ganha.

---

## Core Design Decisions (Resultado da Roundtable)

### Decisão 1: Mitigação de Risco Terapêutico

**Insight da Roundtable (Mary):** "Usuário pode confundir app com terapia. Como vocês deixam claro que não é?"

**Resposta:**

**Momento 1: Onboarding (Primeiro Contato)**
- Explicação visual clara: "O que este app é" vs "O que este app não é"
- "É espelho reflexivo" vs "Não é terapia profissional"
- Linguagem simples, não legal (fácil de entender)
- Duração: <2 minutos, não como obstáculo

**Momento 2: Disclaimer Antes de Cada Sessão (Reforço)**
- Breve e contexto: "Quando você estiver pronto, abrimos um espaço seguro de reflexão"
- "Não é terapia profissional; é auto-descoberta"
- Não assusta, mas deixa claro
- Duração: <10 segundos

**Cenário Crítico:** Se usuário menciona pensamentos suicidas, abandono de medicação, ou crise severa:
- Agente oferece número de crise/profissional
- "Você está em crise. Fale com profissional agora. Aqui é espaço para depois"

**Trade-off:** Disclaimer reforçado pode parecer repetitivo. Solução: Faça parecer natural na conversa, não aviso legal.

---

### Decisão 2: Design Approach — 1 Design Sólido

**Insight da Roundtable (Sally):** "Design não é neutro. Invista em iterações ou vai rápido?"

**Resposta:** MVP vai **rápido** (1 design sólido) **mas** com fundação forte.

**O que isso significa:**

✓ Definir design system completo ANTES de código (cores, tipografia, componentes)  
✓ 2-3 wireframes de baixa fidelidade com feedback de 1-2 beta testers  
✓ NÃO iterar design após lançamento beta  
✓ Iterar comportamento/conteúdo (conversação, padrões), não design visual  

**Racionale:** Design comunica valores. Se é fraco, usuário não confia que é "profundo". Investir no começo = menos refactor depois.

---

### Decisão 3: Success Metric Real

**Insight da Roundtable (Mary):** "'Pessoas voltam' vs 'Pessoas têm insights que mudam comportamento'. Qual é a real?"

**Resposta:** **Insights Genuínos (Qualitativo)**

**Métrica Primária MVP (Qualitativa):**
- ≥70% dos usuários beta relatam: "Descobri algo novo sobre mim mesmo"
- Exemplos: "Percebi que tenho medo de rejeição", "Entendi por que procrastino"
- Método: Entrevista pós-sessão ou formulário aberto

**Métrica Secundária (Quantitativa - suporte):**
- Taxa de retenção ≥ 60% aos 30 dias
- Sessões médias ≥ 15 minutos

**Por que essa priorização?**
- Valores > retenção em números
- Um usuário com insight genuíno > 5 usuários que abrem e saem
- MVP é validação de conceito, não scale

---

### Decisão 4: Reconhecimento Personalizado (vs Genérico)

**Insight da Roundtable (Sally):** "Como fazer reconhecimento autêntico, não patronizante?"

**Resposta:** **Reconhecimento é Reflexo do que Aconteceu, Não Algoritmo Celebrando**

**Exemplo RUIM:** "Parabéns, você completou uma sessão! 🎉"  
**Exemplo BOM:** "Você nomeou algo que antes você não conseguia articular. Isso é o primeiro passo real."

**Implementação:**

Para Ana (auto-descoberta):
- Reconhece: Padrões descobertos, contradições articuladas, vulnerabilidade
- Exemplo: "Percebi que quando você fala sobre propósito, sua voz muda. Vale explorar isso"
- NÃO: Duração da sessão, quantidade de mensagens

Para Carlos (paralisia):
- Reconhece: Clareza de pergunta, movimento de pensamento, decisão
- Exemplo: "Você saiu de 'não sei nada' para 'a questão é X'. Isso é progresso"
- NÃO: Velocidade, estrutura perfeita

Para Julia (complementar terapia):
- Reconhece: Conexão com terapeuta, clareza antes de sessão
- Exemplo: "Isso é bom material para trazer ao seu psicólogo na próxima vez"
- NÃO: Resolução (porque não resolve, só complementa)

---

## Core User Experience

### Defining Experience

O núcleo do app é a **conversa significativa**—um diálogo entre usuário e agente IA que gera auto-descoberta genuine.

Não é chat superficial. Não é questionário. É exploração estruturada mas fluida, onde o agente adapta-se ao usuário em tempo real.

**Arquitetura de Sessão:**

1. **Abertura Adaptativa (0-2 min)**
   - Usuário desinibido: Agente abre com convite simples: "Olá! Me conte sobre seu dia"
   - Usuário tímido/reservado: Agente abre com estímulo: "Como você se sentiu hoje? Algo em específico?"
   - Adapta-se ao padrão de resposta (respostas curtas = mais estímulo; respostas longas = espaço)

2. **Exploração com Perguntas-Guia (10-15 min)**
   - Agente faz perguntas baseadas no que usuário trouxe
   - Ciclo: Pergunta → Escuta → Referencia a resposta anterior → Próxima pergunta
   - Vai do superficial para profundo (não inverte)
   - Exemplo: "Você disse que se sente preso. Preso em relação ao quê especificamente?"

3. **Síntese & Insight (2-5 min)**
   - Quando usuário parece pronto (ou solicita), agente sintetiza
   - Traz padrão: "Percebi que quando você fala de X, sua voz muda"
   - Oferece próxima pergunta reflexiva: "Vale explorar isso mais fundo?"

**Flexibilidade:** Usuário controla quando termina. Não há "tempo limite"—se quer explorar 35 min, explora.

### Platform Strategy

**Primary Platform:** Android (mobile, touch-first)
- Interface otimizada para toque (botões maiores, scroll natural)
- **Input Flexível: Texto OU Áudio**
  - Digitação: Teclado touch confortável em cama/sofá
  - Gravação de áudio: Usuário fala (nota de voz ou transcrição em tempo real)
  - Ambos disponíveis na mesma interface (toggle simples)
  - Transcrição automática de áudio para texto (sem armazenar arquivo de áudio)
- Orientações: Portrait é principal, landscape suportado
- **Acessibilidade:** Áudio + texto serve usuários cansados (voz) e usuários em ambientes compartilhados (texto)

**Secondary Platform:** Web (navegador)
- Acessível para usuários que preferem desktop
- Sincronização: Não é necessária no MVP (dados independentes)
- Input também suporta Texto + Áudio (microfone do PC)
- Pode ser usado como backup ou complemento

**Device Context:**
- Primário: Smartphone em mão (cama, sofá, sala privada) — áudio natural
- Secundário: Desktop/tablet para consultar histórico ou revisitar insights — ambos
- Uso particular: Escritório de casa após trabalho — pode ser áudio ou texto conforme preferência

### Effortless Interactions

**#1: Começar uma Conversa**
- Um toque na tela leva direto para conversa (não 3 cliques)
- Abertura já está lá, esperando
- Nenhuma fricção entre "quero conversar" e "conversa começa"
- Escolha imediata: ícone de mic (gravar) ou campo de texto (digitar)

**#2: Falar OU Digitar (Sem Atrito)**
- Usuário na cama, cansado: Toca mic, fala, transcrição automática
- Usuário em casa onde outros estão: Digita naturalmente
- Troca entre ambos em qualquer momento (não é locked)
- Interface pequena e desapercebida (não compete com a conversa)

**#3: Agente Entende & Analisa**
- Effortlessness não está na interface, está na IA
- Usuário escreve/fala, agente *realmente* entende a dor
- Resposta não é genérica, é específica e esclarecedora
- Exemplo ruim: "Entendo que você se sente preso"
- Exemplo bom: "Você mencionou sentir preso, mas cada vez que fala sobre mudança, há medo. Qual é maior, a vontade de mudar ou o medo?"

**#4: Ver o Histórico**
- Um swipe/scroll traz conversas passadas
- Contexto anterior é acessível sem busca
- Agente referencia: "Há 3 dias você trouxe isso..."

**#5: Receber Síntese**
- Ao final (ou sob demanda), agente oferece: "Quer que eu sintetize o que descobrimos?"
- Síntese é clara, personalizada, acionável

### Critical Success Moments

**Momento 1: Primeira Abertura (Sessão 1, Min 0-2)**
- **O quê:** Usuário escolhe entre texto/áudio e envia primeira resposta
- **Por quê é crítico:** Se parecer robô, usuário pensa "é só chatbot, não vai entender"
- **Sucesso:** Abertura adapta-se (tímido ≠ desinibido); escolha texto/áudio é natural
- **Fracasso:** Mesma pergunta para todos; UI de áudio/texto é confusa

**Momento 2: Primeira Escuta (Sessão 1, Min 2-5)**
- **O quê:** Agente responde à primeira entrada de usuário
- **Por quê é crítico:** Usuário percebe se agente realmente entendeu ou só processou
- **Sucesso:** Resposta é específica; transcrição de áudio é precisa; referencia o que foi dito
- **Fracasso:** Resposta genérica; transcrição tem erros; não avança

**Momento 3: Primeiro Insight (Sessão 1 ou 2)**
- **O quê:** Agente identifica padrão ou contradição que usuário não via
- **Por quê é crítico:** É o momento "aha!" — se não acontecer, usuário não retorna
- **Sucesso:** "Notei que você diz querer X, mas cada vez que pensa em tentar, menciona medo de Y"
- **Fracasso:** Sem padrão identificado; apenas conversa rasa

**Momento 4: Decisão de Retorno (Fim de Sessão 1)**
- **O quê:** Usuário sente vontade de voltar amanhã
- **Por quê é crítico:** Hábito se forma em dia 2-3
- **Sucesso:** Síntese significativa + reconhecimento genuíno + "há mais para explorar"
- **Fracasso:** Sessão parecer concluída; nada pendente

### Experience Principles

1. **Adaptação é Fundação**
   - Não há experiência "one-size-fits-all"
   - Abertura muda: tímido ≠ desinibido
   - Input muda: texto OU áudio conforme contexto do usuário
   - Profundidade muda: primeiro dia ≠ dia 10
   
2. **Escuta Profunda > Eficiência**
   - Melhor agente responder em 2s com qualidade que em 0.5s genérico
   - Agente toma tempo para realmente processar o que foi dito
   - Referencia conversas anteriores (mostra que lembra, não só lê)
   - Transcrição de áudio precisa (não "tecnologia", mas qualidade)

3. **Effortless on Interaction, Rich in Insight**
   - Interface desaparece (não pensa em como usar)
   - Substância aparece (pensa no que descobriu)
   - Escolher entre falar/digitar é tão natural quanto respirar

4. **Usuário Tem Controle Total**
   - Não há "sessão ideal de 20 min"
   - Se quer 8 min, tudo bem
   - Se quer 40 min, tudo bem
   - Pode mudar entre texto/áudio sempre que quiser
   - Agente respeita ritmo do usuário

5. **Significado Primeiro, Métrica Segundo**
   - Uma sessão com insight genuíno > 5 superficiais
   - Sucesso = "Descobri algo sobre mim" não "Usei o app"
   - Qualidade de áudio/transcição importa porque comunica respeito pelos dados

---

## Próximas Fases

1. ✅ **Step 1-3:** Discovery, Prioridades Estratégicas, Core Experience
2. **Step 4:** Emotional Response (ton, feedback, sensações)
3. **Step 5:** Design Inspiration (estudar apps similares)
4. **Step 6:** Design System (cores, tipografia, componentes)
5. **Step 7:** UX Patterns (histórico, resumos, indicadores)
6. **Step 8:** Accessibility (WCAG 2.1 AA)

---

*UX Design constructed using BMAD collaborative methodology. Strategic priorities defined. Core experience validated with audio/text input.*
