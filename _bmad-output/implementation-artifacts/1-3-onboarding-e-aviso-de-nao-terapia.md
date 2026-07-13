# Story 1.3: Onboarding e Aviso de Não-Terapia

Status: implemented

## Story

As a usuário convidado que abre o app pela primeira vez,
I want ver uma tela única explicando o propósito do app, a privacidade dos meus dados, e que isso não é terapia,
so that eu entenda o que esperar antes de começar a usar.

## Acceptance Criteria

1. **Given** um usuário sem sessão ativa que abre o app pela primeira vez, **when** a tela de onboarding for exibida, **then** ela mostra 3 pontos em uma única tela: Propósito, Privacidade e Começar.
2. **Given** a tela de onboarding, **when** o usuário a visualizar, **then** o aviso sobre risco imediato fica visível e orienta para os serviços de emergência locais.
3. **Given** o conteúdo de privacidade, **when** o usuário tocar em “Como usamos seus dados”, **then** ele acessa uma explicação clara e não-legal sobre o uso das informações.
4. **Given** a tela de onboarding, **when** o usuário clicar em “Começar sessão”, **then** ele é levado para a tela de login/criação de conta.
5. **Given** o fluxo de onboarding, **when** ele for concluído, **then** a experiência de leitura deve caber em menos de 2 minutos.

## Tasks / Subtasks

- [x] Criar a tela única de onboarding com os 3 pontos.
- [x] Garantir copy clara e CTA de entrada para autenticação.
