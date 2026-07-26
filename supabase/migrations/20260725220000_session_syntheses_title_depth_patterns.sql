-- Alinha session_syntheses ao layout real da Story 3.1 ("Aura - Síntese"): adiciona o
-- título poético gerado pela IA e a profundidade da sessão, e transforma "patterns" de
-- frase única em lista (o design mostra padrões como cartões individuais).

alter table public.session_syntheses
  add column if not exists title text not null default '';

alter table public.session_syntheses
  add column if not exists depth integer not null default 0;

alter table public.session_syntheses
  drop constraint if exists session_syntheses_patterns_check;

alter table public.session_syntheses
  alter column patterns type text[] using
    case when patterns is null or char_length(patterns) = 0 then '{}'::text[] else array[patterns] end,
  alter column patterns set default '{}';

alter table public.session_syntheses
  add constraint session_syntheses_patterns_not_empty check (array_length(patterns, 1) > 0);
