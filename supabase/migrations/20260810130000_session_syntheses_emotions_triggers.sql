-- Story 4.4: o resumo semanal precisa de "emoções dominantes" com recorte por semana, mas
-- emotions/triggers hoje só existem como agregado vitalício em user_patterns (Story 3.3) —
-- sem granularidade por sessão/data não dá para saber quais emoções apareceram nos últimos
-- 7 dias especificamente. generateSessionSynthesis já calcula emotions/triggers por sessão
-- (lib/agent/synthesis.ts), só não eram persistidos; esta migration só abre espaço para
-- guardar o que já é gerado, sem nenhuma chamada nova à IA.
alter table public.session_syntheses
  add column if not exists emotions text[] not null default '{}';

alter table public.session_syntheses
  add column if not exists triggers text[] not null default '{}';
