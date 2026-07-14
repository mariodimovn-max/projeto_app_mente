# Story 1.5: Login com Sessão Persistente

Status: in review

## Story

As a usuário com conta ativa,
I want fazer login com email e senha e permanecer conectado por mais de 24 horas,
so that eu não precise reautenticar a cada visita ao app.

## Acceptance Criteria

1. **Given** um usuário com conta ativada, **when** ele inserir email e senha corretos na tela de login, **then** uma sessão é criada via `@supabase/ssr` e persistida por mais de 24 horas.
2. **Given** a sessão ativa, **when** o usuário navegar pelo app, **then** o cookie de sessão é renovado automaticamente em requisições subsequentes.
3. **Given** tentativas repetidas de login incorreto, **when** o limite de 5 tentativas em 5 minutos for atingido, **then** o sistema bloqueia novas tentativas com mensagem gentil e sem expor se o email existe.
4. **Given** falhas de autenticação, **when** o usuário tentar entrar, **then** as mensagens de erro são claras e acolhedoras.

## Tasks / Subtasks

- [x] Criar a tela de login e o fluxo de autenticação.
- [x] Configurar sessão persistente e renovação de cookie.
