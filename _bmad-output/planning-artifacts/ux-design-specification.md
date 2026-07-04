---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ["d:\\projeto_app_mente\\_bmad-output\\planning-artifacts\\prd.md"]
projectName: "Aplicativo de Diário Digital para Bem-Estar Mental"
designPhase: "MVP"
documentVersion: "4.0"
lastUpdated: "2026-06-27"
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

## Desired Emotional Response

### Primary Emotional Goal

**"Descoberta Genuína"**

O usuário deve sair de cada sessão com a sensação de ter descoberto algo real sobre si mesmo. Não é alívio momentâneo ou validação rasa. É o sentimento de "finalmente entendo algo que antes eu não conseguia articular".

Essa sensação de descoberta é o que cria vontade de voltar—não por vício, mas por curiosidade contínua de entender mais profundamente a si mesmo.

### Emotional Journey Mapping

**Momento 1: Primeiro Contato (0-30 segundos)**
- **Emoção Desejada:** Acolhimento na expectativa de jornada
- **Tradução:** Usuário sente "este é um espaço seguro, e há algo a explorar aqui"
- **Design Implication:** Visual deve comunicar segurança + possibilidade (não vazio, não intrusivo)

**Momento 2: Abertura da Conversa (30 seg - 2 min)**
- **Emoção Desejada:** Curiosidade + confiança emergente
- **Tradução:** Agente faz pergunta que parece simples mas que convida para profundidade
- **Design Implication:** Abertura adapta-se ao usuário (não template); sensação de "ele realmente quer entender"

**Momento 3: Exploração (2-15 min)**
- **Emoção Desejada:** Emoção + curiosidade
- **Tradução:** Usuário está engajado, explorando, às vezes vulnerável, às vezes reflexivo
- **Design Implication:** Interface desaparece; foco é conteúdo; agente valida e aprofunda

**Momento 4: Descoberta (8-18 min, dependendo)**
- **Emoção Desejada:** "Aha!" moment — clareza súbita + esclarecimento
- **Tradução:** Agente nomeia padrão que usuário não conseguia ver
- **Design Implication:** Momento é destacado (não visual explosivo, mas clareza narrativa)

**Momento 5: Síntese (15-20 min)**
- **Emoção Desejada:** Gratidão + esclarecimento + alívio
- **Tradução:** Usuário sente que conversa foi significativa; há closure mas não conclusão (há mais para explorar)
- **Design Implication:** Síntese é clara, acionável, abre para próxima exploração

**Momento 6: Encerramento & Retorno**
- **Emoção Desejada:** Desejo de voltar + reconhecimento
- **Tradução:** Usuário sai pensando "tenho mais perguntas, quero voltar amanhã"
- **Design Implication:** Reconhecimento é personalizado (não genérico); não pareça concluído

### Micro-Emotions (Nuances)

| Micro-Emoção | Por quê Importa | Design Implication |
|---|---|---|
| **Segurança** | Usuário só se abre se confia que é privado | Privacidade comunicada visualmente + no copy |
| **Entendimento** | Usuário quer sentir que agente *realmente* entende | Respostas específicas (não templates) |
| **Validação** | Sentir que suas emoções/experiências são "normais" | Agente normaliza sem diminuir |
| **Autonomia** | Não ser "dito" o que fazer | Agente oferece direção, não prescrição |
| **Esperança** | Sentir que mudança é possível | Reconhecimento de progresso pequeno |
| **Alívio** | Tensão de não entender-se é reduzida | Síntese libera a mente (clareza = alívio) |

**Emoções a EVITAR a Todo Custo:**
- ❌ **Julgamento:** Usuário nunca deve sentir criticado
- ❌ **Superficialidade:** Resposta vazia = morte do app
- ❌ **Invasão:** Nunca parecer que dados são roubados/usados
- ❌ **Dependência Terapêutica:** Clareza que não substitui profissional
- ❌ **Incompetência:** Erros técnicos quebram confiança rapidamente
- ❌ **Isolamento:** Agente deve comunicar "você não está sozinho nisso"

### Design Implications

**1. Ton de Voz**
- **Abordagem:** Profissional mas Caloroso (confiável + acolhedor)
- **Manifestação:**
   - Linguagem clara, sem jargão
   - Referências pessoais ("Você mencionou...")
   - Vulnerabilidade apropriada (agente admite quando não tem resposta)
   - Respeito absoluto (nunca sarcasmo, sempre dignidade)

**Exemplo BOM:**
"Você disse que se sente preso. Quando você fala sobre isso, há uma tensão entre querer mudar mas ter medo. Essa tensão é real. Vale a pena explorar o que especificamente assusta?"

**Exemplo RUIM:**
"Deve ser frustrante se sentir preso! Mas não se preocupe, você consegue! 😊"

**2. Feedback Moments**
- **Abordagem:** Variável conforme situação (não template)
- **Adaptações:**
   - Primeira descoberta: Enfatiza o "aha"
   - Confirmação de padrão: Aprofunda reflexão
   - Momento difícil: Valida dor, abre para exploração
   - Progresso: Reconhece sem minimizar esforço
  
**Exemplo:**
- Se usuário descobre algo novo: "Isso que você acabou de dizer, você tinha considerado isso dessa forma antes?"
- Se usuário confirma padrão: "Então toda vez que X acontece, você tem essa reação. Vale a pena investigar por que X te dispara assim?"
- Se usuário está vulnerável: "Isso é corajoso trazer. Há algo mais que você quer explorar sobre isso?"

**3. Visual Design**
- **Paleta:** Acolhedor + Inspirador (não ultra minimalista, tem presença)
- **Cores sugeridas:** Tons naturais, aquecidos (não clinicamente branco)
- **Espaçamento:** Generoso (breathing room, não aperto)
- **Tipografia:** Legível, acessível, mas elegante (comunica qualidade)
- **Elementos:** Sutil = conforto (não distrair, apenas apoiar)

**4. Loading/Thinking Moments**
- **Abordagem:** Indicador reconfortante (animação suave, sensação de presença)
- **Manifestação:**
   - Enquanto agente pensa: Indicador visual sutil (pulsação suave? movimento orgânico?)
   - Opcionalmente: "Estou pensando sobre o que você trouxe..."
   - Comunicar presença (não vazio)
   - Duração real (não fake-delay)

**5. Error Handling**
- **Abordagem:** Honesto mas Reconfortante
- **Manifestação:**
   - Se transcrição falha: "Não consegui entender bem. Pode tentar novamente?"
   - Se conexão cai: "Perdemos conexão, mas estou aqui. Retoma quando quiser"
   - Se agente falha: "Isso não faz sentido do que entendi. Pode explicar de novo?"
   - Nunca blame user, nunca técnico demais, sempre reconfortante

### Emotional Design Principles

1. **Autenticidade Antes de Perfeição**
   - Melhor resposta honesta mas imperfeita que resposta polida mas genérica
   - Agente admite limite ("Não tenho certeza, mas pode ser...") vs pretende onisciência

2. **Variação Conforme Contexto**
   - Não há "feedback template" que funciona para todos os momentos
   - Abertura tímido ≠ Abertura desinibido
   - Terceira sessão ≠ Primeira sessão

3. **Reconhecimento Sem Celebração**
   - Reconhece descoberta genuína sem parecer "parabéns por chorar"
   - Celebra insight, não quantidade

4. **Esperança Realista**
   - Comunica que entendimento leva a mudança possível (não garantida)
   - Valoriza jornada, não destino

5. **Privacidade = Segurança Emocional**
   - Cada aspecto visual/funcional comunica "seus dados são sagrados"
   - Não tem sensação de "vigilância", tem sensação de "proteção"

### Critical Emotional Success Moments

**Momento #1: Primeira Abertura Adapta-se**
- **Sucesso:** Usuário sente "ele entendeu meu tipo"
- **Fracasso:** Usuário sente "é um template genérico"

**Momento #2: Primeiro Padrão Identificado**
- **Sucesso:** Usuário tem "aha!" + "como não percebi isso antes?"
- **Fracasso:** Usuário pensa "isso é óbvio, não me ajuda"

**Momento #3: Síntese Honra a Conversa**
- **Sucesso:** Usuário sente "ele realmente me entendeu"
- **Fracasso:** Usuário sente "é só um resumo de palavras-chave"

**Momento #4: Vontade de Voltar**
- **Sucesso:** Usuário dorme pensando "amanhã quero explorar mais"
- **Fracasso:** Usuário pensa "já explorei, fim"

---

*UX Design constructed using BMAD collaborative methodology. Strategic priorities defined. Core experience validated with audio/text input.*

## Step 5 — Design Inspiration

### Objetivo

Reunir referências de produtos reais que resolvem problemas semelhantes e extrair padrões concretos que podemos prototipar rapidamente no MVP. Foco: experiência de conversação, entrada de áudio, síntese de sessão, onboarding claro e sinais de privacidade.

### Apps & Produtos para Estudo (prioridade)

- **Calm / Headspace** — Onboarding orientado por propósito, paleta calmante, micro-animações de transição, foco em ritual diário.
- **Wysa / Replika** — Conversação empática, tom de voz personalizado, manuseio de tópicos sensíveis, modelos de fallback para crise.
- **Reflectly / Jour / Daylio** — Diário orientado por prompts, visuais de progresso, resumos periódicos fáceis de consumir.
- **Notion / Roam (UX patterns)** — Histórico e navegação por notas, busca rápida, linkagem de contextos (bom exemplo para memórias de conversa).
- **Otter.ai / Descript** — UX de transcrição de áudio, visualização de waveform, edição de transcrição (para referência técnica).
- **Bear / Ulysses (microcopy and breathing room)** — Tipografia e espaçamento que favorecem leitura reflexiva.

### Padrões de UX a Reutilizar / Prototipar

- **Onboarding claro e breve**: tela única com 3 pontos: propósito do app, privacidade e não-terapia; botão "Começar" direto.
- **Chat/Conversa centrada no conteúdo**: bolhas grandes, margem generosa, timestamp discreto, opção persistente de transcrição/áudio.
- **Mic + Waveform**: botão de gravação sempre presente; mostrar waveform sutil durante gravação para confirmar que áudio foi capturado.
- **Transcrição instantânea**: inline editável (permitir correção rápida antes de enviar ao agente).
- **Synthesis card**: resultado da sessão apresentado como um cartão destacável (título curto, 2-3 bullets de insight, link "Explorar mais").
- **Resumo semanal/mensal**: cartão temporal com temas principais e sentimento dominante (visual simples: chips + linha do tempo).
- **Privacidade UI**: selo visível de criptografia, CTA "Como seus dados são usados" no rodapé do chat, fluxo simples para deletar conta/dados.
- **Loading humane**: animação orgânica + copy reconfortante "Pensando sobre o que você disse..."
- **Error handling gentle**: mensagens curtas, reconfortantes e opção fácil para regravar/reenviar.

### Visual / Interaction Inspiration

- Paleta: tons naturais aquecidos (bege, oliva suave, azul-petróleo suave) — evite brancos estéreis.
- Tipografia: fonte com x-height confortável (legibilidade em mobile à noite).
- Componentes: chat single-column, fixed mic FAB, bottom sheet para resumo, card-based timeline.
- Motion: micro-interactions suaves (200-350ms) e transições com easing orgânico.

### Research Tasks (prático)

1. Capturar screenshots / gravações dos flows: onboarding, gravação de áudio, chat, síntese de sessão (5 produtos listados acima).
2. Extrair microcopy (20-30 frases) para inspiração — onboarding, confirmações, disclaimers de privacidade, síntese.
3. Criar um moodboard visual (paleta + tipografia + exemplos de UI) — 1 página simples para guiar a implementação.

### Resultado Esperado para o MVP

- Um conjunto de padrões concretos e replicáveis que permitam criar wireframes de baixa fidelidade em 1-2 dias.
- Microcopy inicial pronta para testes com 5-10 beta users.
- Moodboard que alimenta a Step 6 (Design System).

---

*Próximo: Step 6 — construir o Design System baseado nessas inspirações.*

### Collected Microcopy & Patterns (extraction)

Exemplos curtos de microcopy e padrões observados nas referências pesquisadas (úteis para onboarding, confirmações, disclaimers e estados de gravação/transcrição):

- Headspace: "Unpack what’s on your mind with Ebb, our empathetic AI companion." / "Always-there support" / "By signing up, you’re agreeing to receive marketing emails" (privacy CTA).
- Calm: "We're here to help you feel better." / "Calm your mind. Change your life." / "Start your free trial of Calm Premium."
- Descript: "Text-based editing" / "You’ll get an instant transcript" / "Edit your video by editing the text." (transcription + edit UX pattern).
- Otter.ai: "See the words, as they’re spoken." / "Get instant summaries you can trust." / "Your AI notetaker is now also your Conversational Knowledge Engine." (live transcript + summaries pattern).
- Daylio: "Keep a diary and capture your day without writing down a single word!" / "MAX PRIVACY" / "Lock your diary and make it private." (privacy-first journaling microcopy).
- Ulysses / Bear: Minimal, focus-first microcopy: "distraction-free", "built-in proofreader", emphasis on reading comfort and typography.

Microcopy patterns to reuse

- Onboarding: 3-point single-screen flow: Purpose / Privacy / What to expect — each with a 6–12 word line and a soft CTA.
- Recording: clear affordance + live feedback: "Recording..." + subtle waveform + small cancel/redo action.
- Transcription: editable inline transcript with a small hint: "Tap any word to edit" and a lightweight "Save transcript" CTA.
- Synthesis: card headline + 2–3 bullets + action "Explore more" or "Save insight".
- Privacy reassurance: short badge + link: "Transcriptions stored locally and encrypted — Learn more".

UX element notes

- Waveform + mic FAB: Descript and Otter show that visible audio feedback increases trust during capture.
- Inline-edit transcripts: reduces friction for users who want to correct recognition errors before analysis.
- Gentle crisis language: apps like Wysa/Replika (AI companions) use fallback copy and immediate human resources links — include a brief warning + "If you are in danger" CTA in onboarding and footer.

Status: research excerpts captured; next: compile screenshots and build a one-page moodboard for Step 6.
