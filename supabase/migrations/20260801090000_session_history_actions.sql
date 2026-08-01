-- Story 3.5: ações rápidas da tela de Histórico ("Marcar" e "Excluir", AC3). `sessions`
-- não tinha coluna de update nem policy de update/delete até agora (só select/insert) —
-- adiciona o mínimo necessário para essas duas ações, sem introduzir soft-delete: excluir
-- uma sessão remove a linha de fato, e `on delete cascade` nas FKs de `messages` e
-- `session_syntheses` já cuida de apagar as transcrições e a síntese junto.
alter table public.sessions
  add column if not exists marked boolean not null default false;

create policy "sessions_update_own" on public.sessions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions_delete_own" on public.sessions
  for delete using (auth.uid() = user_id);
