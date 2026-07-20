// Detects explicit signals of severe crisis (suicidal ideation, self-harm, medication
// abandonment) so the route handler can short-circuit the normal reflective flow and
// deliver a safety response instead. Deliberately separate from emotional-state.ts:
// that module tunes the *tone* of an LLM-generated reply, while this one decides whether
// to bypass the LLM entirely for a fixed, pre-reviewed response — the two must never merge,
// since a crisis response cannot depend on model behavior being followed correctly.
const CRISIS_SIGNALS: string[] = [
  // suicidal ideation
  "quero morrer",
  "quero me matar",
  "vou me matar",
  "vou me suicidar",
  "quero me suicidar",
  "cometer suicídio",
  "cometer suicidio",
  "pensamentos suicidas",
  "pensamento suicida",
  "penso em suicídio",
  "penso em suicidio",
  "pensando em me matar",
  "pensando em suicídio",
  "pensando em suicidio",
  "não aguento mais viver",
  "nao aguento mais viver",
  "não quero mais viver",
  "nao quero mais viver",
  "não quero mais existir",
  "nao quero mais existir",
  "acabar com a minha vida",
  "acabar com minha vida",
  "tirar a minha vida",
  "tirar minha vida",
  "dar um fim na minha vida",
  "não vejo motivo para viver",
  "nao vejo motivo para viver",
  "seria melhor se eu morresse",
  "melhor eu morrer",
  "queria estar morto",
  "queria estar morta",
  "queria não existir mais",
  "queria nao existir mais",
  // self-harm
  "me cortar",
  "cortar os pulsos",
  "cortar meus pulsos",
  "me machucar de propósito",
  "me machucar de proposito",
  "tomar todos os remédios",
  "tomar todos os remedios",
  "overdose",
  // medication abandonment
  "parei de tomar o remédio",
  "parei de tomar o remedio",
  "parei de tomar meu remédio",
  "parei de tomar meu remedio",
  "parei de tomar a medicação",
  "parei de tomar a medicacao",
  "parei a medicação",
  "parei a medicacao",
  "parei com o remédio",
  "parei com o remedio",
  "abandonei o tratamento",
  "abandonei a medicação",
  "abandonei a medicacao",
  "larguei o remédio",
  "larguei o remedio",
  "larguei a medicação",
  "larguei a medicacao",
];

// A signal immediately preceded by one of these reads as a denial, not a disclosure
// ("não penso em suicídio" / "nunca vou me matar") — only checked directly adjacent to
// the match, so it doesn't suppress genuine signals with an unrelated "não" earlier in
// the sentence (e.g. "não sei o que fazer, quero morrer" must still fire).
const NEGATION_PREFIXES = ["não ", "nao ", "nunca ", "jamais "];

// Common PT-BR idioms that share a signal's wording but carry no risk — checked
// immediately after the match ("quero morrer DE RIR", "overdose DE CAFEÍNA").
const IDIOM_SUFFIXES = [
  "de rir",
  "de tanto rir",
  "de vergonha",
  "de fome",
  "de sono",
  "de tédio",
  "de tedio",
  "de calor",
  "de frio",
  "de saudade",
  "de amores",
  "de cafeína",
  "de cafeina",
  "de trabalho",
  "de série",
  "de serie",
  "de séries",
  "de series",
  "de informação",
  "de informacao",
  "de netflix",
];

/**
 * Finds every occurrence of `signal` in `lower`, requiring a word-start boundary
 * (mirroring emotional-state.ts's approach) so short signals like "overdose" can't
 * fire as a substring of an unrelated longer word.
 */
function findSignalMatches(lower: string, signal: string): Array<{ start: number; end: number }> {
  const escaped = signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}`, "gu");
  const matches: Array<{ start: number; end: number }> = [];
  for (const match of lower.matchAll(pattern)) {
    matches.push({ start: match.index, end: match.index + match[0].length });
  }
  return matches;
}

function isNegated(lower: string, start: number): boolean {
  return NEGATION_PREFIXES.some((prefix) => lower.slice(Math.max(0, start - prefix.length), start) === prefix);
}

function isIdiomaticUse(lower: string, end: number): boolean {
  const after = lower.slice(end, end + 24).trimStart();
  return IDIOM_SUFFIXES.some((suffix) => after.startsWith(suffix));
}

/**
 * True when `message` contains an explicit severe-crisis signal (suicidal ideation,
 * self-harm, or medication abandonment) that isn't an immediate denial ("não ...") or a
 * common benign idiom ("... de rir"). Deliberately conservative — false negatives are
 * safer to accept than false positives that would derail an unrelated conversation into
 * a crisis script, but an unqualified match still wins: this only suppresses the two
 * specific, narrow patterns above, not general ambiguity.
 */
export function detectCrisisSignal(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_SIGNALS.some((signal) =>
    findSignalMatches(lower, signal).some((match) => !isNegated(lower, match.start) && !isIdiomaticUse(lower, match.end))
  );
}

// Fixed, pre-reviewed response — never model-generated. In a severe-risk moment we cannot
// risk the LLM omitting, softening, or hallucinating the help resources; this text always
// ships verbatim. Addresses both first-person disclosures and third-party mentions ("minha
// irmã tem tido pensamentos suicidas") in one message, since the signals above can't reliably
// tell the two apart. Mirrors the reference copy from ux-design-specification.md's "Cenário
// Crítico": "Você está em crise. Fale com profissional agora. Aqui é espaço para depois."
export const CRISIS_RESPONSE_MESSAGE = `Percebo que você trouxe algo muito sério — seja algo que você está vivendo, seja algo que uma pessoa próxima está enfrentando. Preciso ser direto: este espaço é de reflexão, não é atendimento de emergência ou terapêutico.

Se é você quem está em risco agora, busque ajuda neste momento:
- CVV (Centro de Valorização da Vida): ligue 188 (24h, gratuito) ou converse pelo chat em cvv.org.br
- Emergência médica: 192 (SAMU) ou vá ao pronto-socorro mais próximo
- Perigo imediato: 190

Se é outra pessoa que está passando por isso, você também pode ligar para o CVV (188) para saber como ajudá-la, e incentivá-la a buscar um profissional agora.

Se você parou de tomar uma medicação, entre em contato com seu médico ou psiquiatra o quanto antes — isso é importante para sua segurança.

Você está em crise. Fale com um profissional agora. Aqui é espaço para depois — eu vou estar aqui quando precisar.`;
