# Story 1.6: Recuperação de Senha

Status: planned

## Story

As a usuário que esqueceu sua senha,
I want solicitar uma redefinição de senha por email,
so that eu recupere o acesso à minha conta sem depender do administrador.

## Acceptance Criteria

1. **Given** um usuário com conta ativa que esqueceu a senha, **when** ele solicitar “Esqueci minha senha”, **then** um link de redefinição é enviado por email via Supabase Auth.
2. **Given** o link recebido por email, **when** o usuário clicar nele, **then** ele consegue definir uma nova senha.
3. **Given** a redefinição concluída, **when** a nova senha for salva, **then** ela substitui a anterior imediatamente.

## Tasks / Subtasks

- [ ] Implementar o fluxo de esqueci minha senha.
- [ ] Validar o fluxo completo de reset por email.
