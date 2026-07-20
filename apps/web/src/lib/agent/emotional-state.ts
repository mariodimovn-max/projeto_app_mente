export type EmotionalState = "melancholy" | "inflated" | "confused" | "neutral";
export type EmotionalIntensity = "low" | "high";

const SIGNALS: Record<Exclude<EmotionalState, "neutral">, string[]> = {
  melancholy: [
    "triste", "tristeza", "deprimid", "sozinho", "sozinha", "vazio", "vazia",
    "sem sentido", "não vale", "nao vale", "fracass", "inútil", "inutil",
    "culpa", "vergonha", "chorei", "choro", "cansado de", "cansada de",
    "desanimad", "sem energia", "não consigo", "nao consigo", "desistir",
    "não quero", "nao quero", "mal", "horrible", "horrível",
  ],
  inflated: [
    "sempre fui melhor", "todos são", "todos sao", "ninguém entende", "ninguem entende",
    "óbvio que", "obviamente", "claramente eu", "eu sempre", "eu nunca erro",
    "minha ideia é", "eles não percebem", "eles nao percebem", "sou o único",
    "sou a única", "superior", "incompetentes", "idiota", "idiotas",
    "eu tenho razão", "eu tenho razao", "eles estão errados", "todo mundo erra menos eu",
  ],
  confused: [
    "não sei", "nao sei", "confuso", "confusa", "perdido", "perdida",
    "não entendo", "nao entendo", "o que fazer", "como assim",
    "não faz sentido", "nao faz sentido", "misturado", "misturada",
    "tudo ao mesmo tempo", "muita coisa", "não consigo pensar", "nao consigo pensar",
    "bagunça", "caos", "sobrecarregad",
  ],
};

// "mal" is the one bare short signal ambiguous enough to need whole-word matching
// (it would otherwise match as a prefix of "mala", "malandro", etc). Every other
// signal intentionally keeps prefix matching so stems like "fracass"/"deprimid"
// still catch "fracassado"/"deprimida", preserving the original detection recall.
const WHOLE_WORD_SIGNALS = new Set(["mal"]);

/**
 * Matches `signal` inside `text` starting at a word boundary, so short stems like
 * "mal" don't fire inside unrelated words like "normal" or "animal". Uses a
 * Unicode-aware lookbehind/lookahead (not `\b`) because plain `\b` doesn't treat
 * accented letters (á, ã, é, ó...) as word characters, which would misfire on
 * Portuguese text.
 */
function hasWordStartMatch(text: string, signal: string): boolean {
  const escaped = signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const trailingBoundary = WHOLE_WORD_SIGNALS.has(signal) ? "(?![\\p{L}\\p{N}])" : "";
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}${trailingBoundary}`, "u");
  return pattern.test(text);
}

function countSignals(lower: string, signals: string[]): number {
  return signals.filter((signal) => hasWordStartMatch(lower, signal)).length;
}

export function detectEmotionalState(message: string): EmotionalState {
  return analyzeEmotionalState(message).state;
}

// Three or more distinct signal matches for the detected state read as an intense
// expression of it (vs. a single passing remark), warranting a shorter, more contained response.
const INTENSITY_THRESHOLD = 3;

export function detectEmotionalIntensity(
  message: string,
  state: EmotionalState,
): EmotionalIntensity {
  if (state === "neutral") return "low";

  const count = countSignals(message.toLowerCase(), SIGNALS[state]);
  return count >= INTENSITY_THRESHOLD ? "high" : "low";
}

export interface EmotionalAnalysis {
  state: EmotionalState;
  intensity: EmotionalIntensity;
}

// Scores the message once and derives both state and intensity from that single pass,
// instead of the two independent regex scans that calling detectEmotionalState followed
// by detectEmotionalIntensity would otherwise perform on the same message.
export function analyzeEmotionalState(message: string): EmotionalAnalysis {
  const lower = message.toLowerCase();

  const scores: Record<Exclude<EmotionalState, "neutral">, number> = {
    melancholy: countSignals(lower, SIGNALS.melancholy),
    inflated: countSignals(lower, SIGNALS.inflated),
    confused: countSignals(lower, SIGNALS.confused),
  };

  const max = Math.max(scores.melancholy, scores.inflated, scores.confused);
  if (max === 0) return { state: "neutral", intensity: "low" };

  const winner =
    (Object.keys(scores) as Array<keyof typeof scores>).find((state) => scores[state] === max) ??
    "neutral";
  return { state: winner, intensity: max >= INTENSITY_THRESHOLD ? "high" : "low" };
}
