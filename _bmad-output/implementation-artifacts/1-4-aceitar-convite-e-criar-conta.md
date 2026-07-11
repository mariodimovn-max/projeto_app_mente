# Story 1.4: Aceitar Convite e Criar Conta

Status: planned

## Story

As a usuário convidado pelo administrador do beta,
I want receber um convite por email e definir minha senha para ativar minha conta,
so that eu consiga acessar o app com segurança sem um formulário público de cadastro.

## Acceptance Criteria

1. **Given** um administrador que enviou um convite via `supabase.auth.admin.inviteUserByEmail()`, **when** o usuário abrir o link do convite, **then** o fluxo de ativação é iniciado sem exigir um formulário público de cadastro.
2. **Given** o convite ativo, **when** o usuário definir a senha, **then** a conta é criada e vinculada ao email convidado.
3. **Given** o fluxo de ativação, **when** a conta for criada, **then** a senha é tratada pelo mecanismo de autenticação do Supabase conforme a política de segurança do projeto.
4. **Given** a conclusão do processo, **when** o usuário terminar a ativação, **then** ele é direcionado para o onboarding ou para o chat inicial.

## Tasks / Subtasks

- [ ] Implementar o fluxo de ativação por convite.
- [ ] Integrar a criação de conta com o fluxo de auth do Supabase.
