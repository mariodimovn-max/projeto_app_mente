---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-03-prd-structure"]
inputDocuments: ["d:\\Projetos\\projetos-bmad\\_bmad-output\\brainstorming\\brainstorming-session-2026-05-21-14-30.md"]
workflowType: 'prd'
projectName: 'Aplicativo de Diário Digital para Bem-Estar Mental'
brainstormingIdeas: 60
brownfieldProject: false
classification:
  projectType: 'Web + Mobile App (React/React Native - Web + Android)'
  domain: 'Mental Health & Wellness'
  complexity: 'MEDIUM'
  projectContext: 'greenfield'
  modeloAcesso: 'Beta Fechado (Convidados) - Gratuito Indefinidamente'
  mobileFirst: false
  communityInMVP: false
status: 'Complete (Step 3)'
documentVersion: '2.0'
lastUpdated: '2026-06-05'
---

# Product Requirements Document - Aplicativo de Diário Digital para Bem-Estar Mental

**Projeto:** Aplicativo de Diário Digital para Bem-Estar Mental  
**Autor:** Mario Dimov  
**Versão:** 2.0 - MVP Complete  
**Data de Atualização:** 5 de Junho de 2026  
**Timeline:** MVP em 3 meses  
**Status:** Pronto para Design UX e Arquitetura

---

## Executive Summary

**Visão:** Tecnologia para tocar a alma e despertar a mente.

O Aplikativo de Diário Digital para Bem-Estar Mental é um serviço inteligente que facilita auto-descoberta através de conversação estruturada, análise de padrões pessoais e insights baseados em dados históricos do próprio usuário. A aplicação não é terapêutica (não cura doenças mentais) nem prescritiva (não diz ao usuário o que fazer). Em vez disso, funciona como um espelho reflexivo—externalizando sentimentos, revelando padrões comportamentais, e permitindo que o usuário desenvolva clareza mental e auto-conhecimento genuíno.

### Problema

- **Aceleração + Saturação de Informação:** Indivíduos vivem em estado mental fragmentado, incapazes de processar emoções ou identificar padrões pessoais.
- **Acesso Desigual à Psicologia:** Terapia profissional é custosa, escassa e inconsistente. Muitos nunca terão acesso.
- **Carência de Auto-Conhecimento:** Falta de ferramentas para estruturar introspecção e transformar caos emocional em padrões observáveis.
- **Isolamento + Comparação Destrutiva:** Falta de espaço seguro para exploração íntima sem julgamento social.

### Solução

Um aplicativo que combina:
- **Conversação Inteligente:** Diálogo estruturado e acolhedor que guia o usuário a articular sentimentos profundos.
- **IA Adaptativa:** Um agente único que integra múltiplas perspectivas filosóficas (Estoica, Jungiana, Freudiana, Budista) e ajusta tom/abordagem conforme estado emocional do usuário.
- **Histórico Inteligente:** Memória persistente de conversas permite detecção de padrões emocionais ao longo do tempo.
- **Análises Multidimensionais:** Resumos periódicos, indicadores de evolução, e insights que emergem apenas quando há dados suficientes.

### Valores Fundamentais

- 🔐 **Inviolabilidade de Privacidade:** Dados pessoais são confiança sagrada. Zero venda de dados, Zero compartilhamento não-autorizado.
- ⚖️ **Honestidade Radical:** Recusa categórica de vender esperança falsa. App é ferramenta, não solução mágica.
- 🎯 **Profundidade > Escala:** Sucesso é ajudar UMA PESSOA genuinamente, não impressing milhões superficialmente.
- ✨ **Enriquecimento da Alma:** Métrica real de sucesso é clareza mental, consciência e virtude pessoal.

---

## Success Criteria

O MVP será considerado bem-sucedido se atingir:

1. **Retenção Comportamental**
   - Usuários mantêm hábito diário durante 30+ dias consecutivos
   - Taxa de retenção ≥ 60% aos 30 dias
   - Sessões médias ≥ 15 minutos/dia

2. **Insight Significativo**
   - ≥ 70% dos usuários relatam "descobrir algo novo sobre si mesmo" em feedback
   - Usuários conseguem articular pelo menos 1 padrão emocional identificado pelo agente
   - Feedback qualitativo menciona mudanças em clareza mental ou auto-conhecimento

3. **Satisfação e Lealdade**
   - Net Promoter Score (NPS) ≥ 50
   - ≥ 80% recomendariam a outros

4. **Privacidade e Confiança**
   - Zero violações de privacidade ou vazamento de dados
   - 100% conformidade com LGPD (Lei Geral de Proteção de Dados)
   - Auditoria de segurança independente com resultado "sem críticos"

5. **Estabilidade Técnica**
   - Uptime ≥ 99.5% durante fase beta
   - Taxa de crash ≤ 0.1%
   - Performance: Carregamento da interface < 2 segundos em conexão 4G

---

## Product Scope

### Incluído no MVP

#### Plataformas
- **Web:** Aplicação responsiva em navegador (Chrome, Firefox, Safari, Edge)
- **Android:** Aplicativo nativo ou PWA para smartphones Android

#### Funcionalidades Principais

**1. Conversação Inteligente Direcionada**
- Interface de diálogo com histórico visível
- Agente inicia com pergunta-guia estruturada (ex: "Como você se sente hoje?")
- Conversação evolui de estruturada (perguntas-chave) para fluida (diálogo natural)
- Adaptação dinâmica: Agente detecta estado emocional (melancolia, confiança, confusão) e ajusta tom
  - Se baixa auto-estima → abordagem reconfortante
  - Se ego inflado → abordagem reflexiva/provocadora
  - Se neutro → equilibrado

**2. Memória Persistente e Contexto**
- Sistema retém histórico completo de conversas
- Agente acessa histórico para detectar padrões emocionais longitudinais
- Capacidade de referenciar conversas anteriores ("Lembra que há 2 semanas você mencionava angústia com...?")

**3. Conclusões Inteligentes e Motivadoras**
- Ao final de cada sessão, agente sintetiza insights principais
- Feedback positivo reforçado (celebração de auto-descoberta, não gamification)
- Identificação de padrões quando dados permitem (ex: "Notei que você sente mais ansiedade nas quartas")

**4. Resumos Periódicos**
- Resumo de semana: Temas principais, emoções dominantes, progressos
- Resumo de mês: Padrões de longo prazo, evoluções, tendências
- Não são automáticos—gerados sob demanda quando usuário solicita

**5. Indicadores Básicos de Evolução**
- Tracking simples: Dias consecutivos, sessões completadas, temas explorados
- Visualização de tendências emocionais (gráfico simples mostrando oscilação sem dados sensíveis expostos)
- Marcadores pessoais de progresso (user-defined milestones)

#### Modelo de Acesso
- **Beta Fechado:** Apenas convidados selecionados podem se inscrever inicialmente
- **Gratuito:** Sem cobrança durante MVP e indefinidamente (modelo de negócio definido após aprendizado)
- **Autenticação:** Sistema de login seguro (email + senha com confirmação)

### Excluído do MVP (Fases Futuras)

- ❌ Compartilhamento com psicólogos profissionais
- ❌ Comunidades anônimas temáticas
- ❌ Integração com wearables (smartwatch, fitbit)
- ❌ Múltiplos agentes com escolha (apenas 1 agente integrado)
- ❌ Gamification ou sistema de pontos
- ❌ Consulta com profissionais pagos
- ❌ Exportação de dados em formatos complexos

---

## User Journeys

### Persona 1: Pessoa em Busca de Autoconhecimento
**Nome:** Ana | 32 anos | Profissional em carreira estável | Frustrada com falta de propósito

**Contexto:** Ana sente vazio existencial apesar de sucesso profissional. Quer entender "quem é realmente" e "para que vive".

**Jornada:**
1. Descobre app via recomendação de amiga
2. Cria conta com email
3. Primeiro diálogo com agente (pergunta: "Como você se sente hoje?")
4. Articula frustração com falta de propósito
5. Agente guia reflexão sobre valores e ambições
6. Ao final, agente sintetiza: "Percebi que você valoriza autenticidade mas está vivendo conforme expectativas externas"
7. Ana retorna próximo dia (hábito se forma)
8. Após 2 semanas: Resumo semanal revela padrão—ela menciona rotina 6x, propósito 8x
9. Agente oferece: "Quer explorar o que 'propósito' significa para você especificamente?"
10. Após 30 dias: Ana relata em feedback "Finalmente entendo minhas próprias contradições"

### Persona 2: Pessoa em Busca de Propósito de Vida
**Nome:** Carlos | 28 anos | Recém-formado | Perdido entre opções

**Contexto:** Carlos terminaram universidade mas não sabe que carreira seguir. Sente paralisia pela quantidade de possibilidades.

**Jornada:**
1. Instala app Android após pesquisa "como descobrir propósito"
2. Primeiras sessões exploram: O que te energiza? O que te assusta? O que o mundo precisa?
3. Agente detecta padrão: Carlos menciona "ajudar pessoas" em 7 das 10 primeiras entradas
4. Resumo de semana: "Percebi que você se emociona ao falar de impacto social, mas tem medo de estabilidade financeira"
5. Reflexão emerge: Não é "qual carreira" mas "como combinar impacto + segurança"
6. Carlos sente alívio ("finalmente uma pergunta clara")
7. Usa app para explorar essa nova pergunta estruturada

### Persona 3: Pessoa com Ansiedade/Depressão
**Nome:** Julia | 35 anos | Mãe | Diagnosticada com ansiedade e depressão leve

**Contexto:** Julia faz terapia profissional 1x/mês (cara, escassa). Precisa de espaço para processar entre sessões.

**Jornada:**
1. Descobre app por recomendação de seu psicólogo (importante: app NÃO substitui)
2. Usa app 3-4x por semana entre sessões terapêuticas
3. Quando sente crise de ansiedade, conversa com agente (não espera por próxima sessão)
4. Agente reconforta ("Estou aqui, isso é seguro para explorar")
5. Articula gatilhos de ansiedade (trabalho + responsabilidades maternais)
6. Agente oferece padrão observável: "Últimas 5 entradas, você menciona falta de tempo em 4 delas"
7. Insight: "Ansiedade não é sobre eventos específicos, é sobre sensação de falta de controle"
8. Julia compartilha observação com psicólogo na próxima sessão—torna-se ponto de exploração profunda
9. App serve como "ponte" entre sessões, não substituindo cuidado profissional

---

## Functional Requirements

### FR-1: Sistema de Autenticação e Gestão de Conta
**Capacidade:** Usuários podem criar conta segura, fazer login e manter sessão persistente.

**Requisitos Específicos:**
- Criação de conta via email único + senha (com confirmação por link de email)
- Login com email + senha
- Recuperação de senha via email
- Sessão persistente (24+ horas sem re-login)
- Logout explicit com confirmação
- Deletar conta com confirmação—dados criptografados são permanentemente destruídos

### FR-2: Interface de Conversação
**Capacidade:** Usuários conversam com agente IA em interface intuitiva com histórico visível.

**Requisitos Específicos:**
- Campo de entrada de texto livre (min 10, max 5000 caracteres por mensagem)
- Histórico de conversas exibido em timeline vertical (mais recentes no topo ou bottom, conforme UX define)
- Cada entrada do usuário + resposta do agente visíveis lado-a-lado ou em bolhas de chat
- Indicador visual de "agente está pensando/respondendo" (loading state)
- Timestamp em cada mensagem
- Capacidade de rolar histórico (lazy-load se volume > 500 mensagens)
- Botão para iniciar nova conversa

### FR-3: Agente IA com Adaptação Dinâmica
**Capacidade:** Um agente único que adapta tom, abordagem e perspectiva filosófica conforme contexto emocional do usuário.

**Requisitos Específicos:**
- Análise automática de estado emocional a partir de padrões no texto do usuário (melancolia, confiança, confusão, raiva, etc.)
- Integração de 4 perspectivas filosóficas (Estoica, Jungiana, Freudiana, Budista) em um agente coeso
- Ajuste dinâmico de tom:
  - Se melancolia detectada → abordagem reconfortante, validadora
  - Se confiança detectada → abordagem reflexiva, provocadora (para aprofundar)
  - Se confusão detectada → abordagem estruturante (guia clara)
- Tom de voz consistente: Educado, respeitoso, cordial, NEM pomposo NEM coloquial
- Comprimento de resposta adaptativo (curtas se usuário está em crise; longas se engajado em reflexão)
- Capacidade de fazer perguntas-guia que abrem exploração vs afirmações que fecham

### FR-4: Acesso a Histórico para Detecção de Padrões
**Capacidade:** Agente acessa histórico completo de conversas do usuário para identificar padrões emocionais longitudinais.

**Requisitos Específicos:**
- Armazenamento seguro de 100% do histórico (conversas antigas nunca são deletadas a menos que usuário request)
- Recuperação rápida (<1s) de histórico para análise
- Índice/busca por tema ou data
- Agente consegue referenciar conversas anteriores ("Há 3 semanas você mencionava...")
- Detecção automática de padrões (temas recorrentes, emoções, gatilhos)
- Avisos de privacidade antes de usar histórico para análise

### FR-5: Síntese de Insights ao Final de Sessão
**Capacidade:** Ao encerrar conversa, agente sintetiza aprendizados principais e oferece perspectiva clara.

**Requisitos Específicos:**
- Ao usuário clicar "Encerrar sessão" ou após 60+ min de inatividade, agente gera síntese automática
- Síntese contém: (1) O que foi explorado, (2) Padrões identificados, (3) Pergunta aberta para reflexão futura
- Exemplo: "Exploramos sua relação com responsabilidade. Notei que você menciona 'nunca fazer o suficiente' em conversas sobre trabalho. Pergunta para próxima vez: E se 'suficiente' fosse sua definição, não de outros?"
- Usuário pode dar feedback na síntese (reação emoji, comentário curto)

### FR-6: Resumos Periódicos (Sob Demanda)
**Capacidade:** Usuários podem solicitar resumos de semana/mês para ver tendências.

**Requisitos Específicos:**
- Botão "Gerar Resumo" em seção dedicada
- Resumo de Semana: Temas principais (top 5 tópicos mencionados), emoções dominantes (gráfico simples), progresso em áreas específicas
- Resumo de Mês: Padrões de longo prazo, evolução em auto-conhecimento, tendências (melhora/piora em áreas)
- Resumos são texto + visualizações simples (não gráficos complexos)
- Usuário pode exportar resumo (PDF) ou apenas ler na app
- Resumos respeitam privacidade (não expõem dados sensíveis explicitamente)

### FR-7: Indicadores Básicos de Evolução
**Capacidade:** Visualização simples do progresso pessoal sem gamification.

**Requisitos Específicos:**
- Dashboard home mostra:
  - Dias consecutivos de uso (counter simples)
  - Total de sessões completadas
  - Temas explorados (lista simples)
  - Tendência emocional gráfica (7 dias últimos; ex: ansiedade, tristeza, clareza)
- Usuário pode definir "marcos pessoais" (ex: "Quero entender meu relacionamento com dinheiro")
- Progress em marco pessoal é trackado (quantas vezes mencionado, progresso em entendimento)
- Tudo é subtle, não gamified (sem badges, estrelas, competição)

### FR-8: Segurança de Dados e Conformidade
**Capacidade:** Dados do usuário são armazenados com máxima segurança e conformidade LGPD.

**Requisitos Específicos:**
- Criptografia de ponta a ponta (E2EE) para dados de conversas (criptografia em repouso)
- Dados apenas no servidor; app não armazena dados sensíveis localmente
- Conformidade com LGPD (Lei Geral de Proteção de Dados)
- Política de privacidade clara em linguagem simples
- Usuário pode fazer export de dados (formato JSON) a qualquer momento
- Deletar conta = destruição permanente e irreversível de dados
- Audit trails para qualquer acesso a dados (interno/externo)
- Sem venda de dados, sem rastreamento de terceiros, sem ads

---

## Non-Functional Requirements

### NFR-1: Performance
**Requisito:** Sistema responde rapidamente mesmo em conexões lentas.

- Carregamento da página home < 2 segundos em conexão 4G
- Resposta do agente < 5 segundos (detecta estado emocional + gera resposta)
- Busca de histórico < 1 segundo
- Geração de resumo < 10 segundos
- API response time (p95) < 200ms

### NFR-2: Disponibilidade e Confiabilidade
**Requisito:** Aplicação está disponível quando usuários precisam.

- Uptime ≥ 99.5% (máximo 3.6 horas/mês de downtime)
- Taxa de crash ≤ 0.1% em produção
- Zero perda de dados durante crashes
- Backup automático a cada hora

### NFR-3: Escalabilidade
**Requisito:** Sistema consegue crescer de beta (100 usuários) para 10,000+ usuários conforme aprendizado.

- Arquitetura preparada para ≥ 10,000 usuários concorrentes
- Histórico de conversas cresce sem degradação (otimizar índices, archiving)
- Load balancing automático conforme tráfego aumenta

### NFR-4: Segurança
**Requisito:** Dados do usuário são invioláveis.

- HTTPS obrigatório (TLS 1.3+)
- Criptografia AES-256 para dados em repouso
- Hashing bcrypt para senhas (salt + pepper)
- CORS policy estrita
- Rate limiting para prevenir brute force (max 5 tentativas login/5 min)
- SQL injection prevention (prepared statements)
- XSS prevention (sanitização de inputs)
- Auditoria de segurança independente a cada trimestre

### NFR-5: Compatibilidade
**Requisito:** Funciona em múltiplos navegadores e dispositivos.

**Web:**
- Chrome ≥ v100
- Firefox ≥ v97
- Safari ≥ v15
- Edge ≥ v100

**Android:**
- Android ≥ 10 (SDK 29)
- Suporta telas de 4.5" a 6.7" (phones)
- Orientações portrait e landscape

### NFR-6: Acessibilidade
**Requisito:** Aplicação é acessível para pessoas com deficiências.

- WCAG 2.1 AA compliance
- Suporte a leitores de tela (ARIA labels)
- Contraste mínimo 4.5:1 em textos
- Tamanho de fonte ajustável (min 14px, max 24px)
- Navegação por teclado completa
- Suporte a dark mode

### NFR-7: Usabilidade
**Requisito:** Interface é intuitiva para usuários não-técnicos.

- Onboarding < 5 minutos (tutorial guiado)
- Primeira conversa produz insight (não pode parecer vazio)
- Help in-app acessível (FAQ, tooltips)
- Idioma português claro (nem acadêmico demais, nem simplista)

### NFR-8: Manutenibilidade
**Requisito:** Código é sustentável para evolução futura.

- Cobertura de testes ≥ 80%
- Documentação de arquitetura completa
- CI/CD pipeline automático (tests + deploy)
- Logs estruturados para debugging
- Rollback automático em caso de deploy com erros

---

## Constraints & Assumptions

### Constraints
- **Timeline:** MVP deve estar pronto em 3 meses
- **Orçamento:** Sem informação de orçamento específico (define limites técnicos)
- **Team:** Solo development com suporte de IA (Claude Code). Arquitetura deve ser simples o suficiente para uma pessoa implementar, validar e iterar. Objetivo: Protótipo de validação para uso próprio + poucos usuários beta (5-10 pessoas). Após aprendizado e validação de conceito, escalação para equipe múltipla em próximas fases.
- **Infraestrutura:** Sem dados de infra disponível—assume cloud provider simples (Vercel, Firebase, Supabase, etc) com setup mínimo
- **Stack Técnico:** Deve ser simples + rápido de iterar. Foco em velocidade de prototipagem > escalabilidade inicial

### Assumptions
- Usuários têm acesso a internet confiável (mobile/web)
- Usuários são maiores de 18 anos
- Usuários conseguem ler e escrever português fluentemente
- Usuários têm email válido para autenticação
- Beta testers são selecionados (não open signup no V1)
- **Prototipagem com IA:** Solo development é possível com suporte de IA (Claude Code) para velocidade; foco em aprendizado + validação > production-readiness inicial
- **Escopo realista para solo:** MVP será protótipo funcional para validação de conceito; refinamentos, escalabilidade e compliance full são iterações posteriores
- **Stack simples:** Tecnologias escolhidas devem permitir desenvolvimento rápido por 1 pessoa (ex: Next.js + Supabase, vs. microservices complexos)

---

## Timeline & Next Steps

**MVP Timeline:** 3 meses (alvo: Setembro de 2026)

### Próximas Fases (Pós-MVP)
1. **V2 (6 meses):** Integração profissional, dashboard para psicólogos, análises mais sofisticadas
2. **V3 (12 meses):** Comunidades anônimas temáticas, wearable integration, modelo de sustentabilidade
3. **V4+:** Escala, internacionalização, IA ainda mais sofisticada

---

## Approval & Sign-Off

- **PRD Owner:** Mario Dimov
- **Status:** Complete and Ready for UX Design + Architecture
- **Next:** Design UX specifications, Technical architecture design

---

*PRD constructed using BMAD methodology. All sections traceable to brainstorming session and user discovery.*
