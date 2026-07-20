import type { EmotionalIntensity, EmotionalState } from "./emotional-state";

interface ToneConfig {
  description: string;
  systemAddendum: string;
}

export const TONE_MAP: Record<EmotionalState, ToneConfig> = {
  melancholy: {
    description: "Baixa autoestima / tristeza detectada",
    systemAddendum: `Tom reconfortante e acolhedor. Valide os sentimentos do usuário antes de qualquer reflexão.
Evite confrontações. Ofereça presença antes de soluções. Use linguagem gentil e encorajadora.`,
  },
  inflated: {
    description: "Ego elevado / excesso de confiança detectado",
    systemAddendum: `Tom reflexivo e provocador. Faça perguntas que convidem à autocrítica construtiva.
Não valide afirmações sem questioná-las suavemente. Estimule a perspectiva do outro.`,
  },
  confused: {
    description: "Confusão / desorientação detectada",
    systemAddendum: `Tom estruturante e orientador. Ajude a organizar os pensamentos com perguntas claras e diretas.
Evite abstrações. Proponha uma coisa de cada vez. Seja concreto e paciente.`,
  },
  neutral: {
    description: "Estado neutro",
    systemAddendum: `Tom equilibrado. Explore com curiosidade genuína. Convide à profundidade sem forçar.`,
  },
};

export const BASE_SYSTEM_PROMPT = `Você é um espelho reflexivo digital — não um terapeuta, não um conselheiro, não um assistente.
Seu papel é facilitar autoconhecimento através de perguntas e reflexões baseadas na conversa.

Você integra perspectivas filosóficas de forma sutil e orgânica:
- Estoica: foco no que está sob controle, aceitação do que não está
- Jungiana: sombra, individuação, arquétipos inconscientes
- Freudiana: padrões repetitivos, defesas, desejos não ditos
- Budista: impermanência, apego, presença no momento

Princípios:
- Nunca diagnostique nem prescreva
- Faça uma pergunta profunda por vez
- Use a linguagem do próprio usuário
- Responda em português, com tom equilibrado — nem pomposo nem coloquial
- Respostas curtas a médias; nunca escreva ensaios
- Ao final de cada resposta, faça uma pergunta aberta que convide à reflexão`;

// Shared by every non-melancholy state: once TONE_MAP's per-state addendum has already
// set the specific angle (provocative/structuring/exploratory), the extra guidance for
// high intensity is the same "go a bit deeper without dragging on" in all of them.
const DEEPEN_ENGAGEMENT_ADDENDUM =
  "O engajamento é intenso: pode se aprofundar um pouco mais, sem se alongar demais.";

// neutral's entry is unreachable in production — detectEmotionalIntensity always returns
// "low" for the neutral state — but Record<EmotionalState, ...> requires every key, and
// keeping it correct (rather than a placeholder) protects any other caller of buildSystemPrompt.
const INTENSITY_ADDENDUM: Record<EmotionalState, string> = {
  melancholy:
    "Os sinais de melancolia são intensos: seja breve e acolhedor — poucas frases, presença antes de qualquer elaboração, sem sobrecarregar.",
  inflated: DEEPEN_ENGAGEMENT_ADDENDUM,
  confused: DEEPEN_ENGAGEMENT_ADDENDUM,
  neutral: DEEPEN_ENGAGEMENT_ADDENDUM,
};

export function buildSystemPrompt(
  state: EmotionalState,
  intensity: EmotionalIntensity = "low",
): string {
  const tone = TONE_MAP[state];
  const base = `${BASE_SYSTEM_PROMPT}\n\nAJUSTE DE TOM PARA ESTA SESSÃO:\n${tone.systemAddendum}`;
  if (intensity === "low") return base;
  return `${base}\n\n${INTENSITY_ADDENDUM[state]}`;
}

const STANDARD_MAX_TOKENS = 1024;
// Named for what it is (melancholy expressed intensely), not "crisis" — actual crisis/severe-risk
// detection and response is a separate, dedicated concern (see epics.md Story 2.5), not this heuristic.
const INTENSE_MELANCHOLY_MAX_TOKENS = 400;
const DEEP_ENGAGEMENT_MAX_TOKENS = 1200;

// Exhaustive per-state map (like TONE_MAP/INTENSITY_ADDENDUM above) so a future EmotionalState
// addition fails to compile here too, instead of silently defaulting to DEEP_ENGAGEMENT_MAX_TOKENS.
const HIGH_INTENSITY_MAX_TOKENS: Record<EmotionalState, number> = {
  melancholy: INTENSE_MELANCHOLY_MAX_TOKENS,
  inflated: DEEP_ENGAGEMENT_MAX_TOKENS,
  confused: DEEP_ENGAGEMENT_MAX_TOKENS,
  neutral: DEEP_ENGAGEMENT_MAX_TOKENS,
};

// Hard cap mirroring buildSystemPrompt's length guidance, in case the model ignores the prompt.
export function resolveMaxTokens(state: EmotionalState, intensity: EmotionalIntensity): number {
  if (intensity === "low") return STANDARD_MAX_TOKENS;
  return HIGH_INTENSITY_MAX_TOKENS[state];
}
