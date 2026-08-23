-- Cache diário da mensagem de boas-vindas gerada por IA para a Home (tela Início).
-- Guardada em user_patterns (não numa tabela nova) porque já é a linha lida a cada
-- carregamento da Home e o dono natural de "o que sabemos sobre este usuário" — evita
-- uma segunda tabela só para dois campos. Regenerada no máximo 1x por dia (comparação
-- por data, fuso America/Sao_Paulo, ver lib/dashboard/date.ts): daily_greeting_date
-- guarda a data (não timestamptz) porque só o dia importa para decidir se o cache
-- ainda é válido.
alter table public.user_patterns
  add column if not exists daily_greeting text,
  add column if not exists daily_greeting_date date;
