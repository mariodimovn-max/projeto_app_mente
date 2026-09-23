// Beta fechado é hoje só para usuários no Brasil (ver CLAUDE.md) — sem timezone por
// usuário salvo em lugar nenhum, um dia de calendário é decidido neste fuso fixo.
// Compartilhado entre o cálculo de streak (dashboard.ts) e o cache diário da mensagem
// de boas-vindas (welcomeMessage.ts) para que "hoje" signifique sempre o mesmo dia.
export const APP_TIMEZONE = "America/Sao_Paulo";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toDayKey(date: Date): string {
  return dayKeyFormatter.format(date);
}

export function todayDayKey(): string {
  return toDayKey(new Date());
}
