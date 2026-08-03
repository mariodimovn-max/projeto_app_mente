import type { EmotionalIntensity, EmotionalState } from "./emotional-state";
import type { SessionOpeningContext } from "./memory";

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

// Story 3.6 (AC1): pergunta-guia estruturada padrão usada na primeira sessão do usuário —
// nunca uma sessão subsequente, que abre de forma adaptativa (ver buildOpeningAddendum).
export const STANDARD_OPENING_QUESTION = "Como você se sente hoje?";

// Achado de review: sem limite, uma resposta anterior incomum longa (nada no código limita
// o tamanho de uma resposta do assistente) seria reembutida por inteiro a cada nova sessão.
const MAX_PREVIOUS_OPENING_PHRASE_LENGTH = 200;

function truncatePreviousOpeningPhrase(phrase: string): string {
  if (phrase.length <= MAX_PREVIOUS_OPENING_PHRASE_LENGTH) {
    return phrase;
  }
  return `${phrase.slice(0, MAX_PREVIOUS_OPENING_PHRASE_LENGTH)}…`;
}

// Story 3.6 (AC1/AC2/AC3): instrução de abertura da sessão, anexada ao prompt apenas na
// primeira mensagem de uma sessão (o restante da conversa não precisa dessa orientação).
function buildOpeningAddendum(context: SessionOpeningContext): string {
  if (context.isFirstSession) {
    return `ABERTURA DESTA SESSÃO (primeira sessão do usuário): comece sua resposta com a pergunta-guia estruturada padrão, usando exatamente esta frase: "${STANDARD_OPENING_QUESTION}"`;
  }

  const stimulusLine =
    context.responsePattern === "curto"
      ? "Nas respostas mais recentes o usuário tende a escrever mensagens curtas — abra oferecendo mais estímulo: uma pergunta concreta ou um gancho específico que ajude a começar."
      : context.responsePattern === "longo"
        ? "Nas respostas mais recentes o usuário tende a escrever mensagens longas e elaboradas — abra com mais espaço: uma pergunta ampla e pouco diretiva, deixando-o guiar o que trazer."
        : "Adapte a abertura ao perfil e aos padrões do usuário descritos acima.";

  // Achado de review (AC2): sem isso, o único ponto de contato desta instrução com
  // `user_patterns` era a linha de fallback acima — que na prática nunca dispara, já que
  // toda sessão começa com pelo menos uma mensagem do usuário. Os temas recorrentes entram
  // aqui incondicionalmente quando existem, para que AC2 ("considera o user_patterns e o
  // padrão de resposta recente") valha nos casos comuns, não só na exceção.
  const themesLine =
    context.topThemes.length > 0
      ? `Temas recorrentes no histórico do usuário: ${context.topThemes.join(", ")}. Deixe isso influenciar sutilmente a abertura quando fizer sentido — nunca cite a lista mecanicamente.`
      : null;

  const avoidRepeatLine = context.previousOpeningPhrase
    ? `A sessão imediatamente anterior abriu com: "${truncatePreviousOpeningPhrase(context.previousOpeningPhrase)}". Nunca repita essa frase literalmente — varie a forma de abrir a conversa.`
    : null;

  return [
    "ABERTURA DESTA SESSÃO (sessão subsequente): não é a primeira sessão do usuário — não use a pergunta-guia padrão de forma genérica ou repetitiva.",
    stimulusLine,
    themesLine,
    avoidRepeatLine,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function buildSystemPrompt(
  state: EmotionalState,
  intensity: EmotionalIntensity = "low",
  // Story 3.4 (AC1/AC2): bloco de memória em camadas (sínteses recentes + agregado de
  // padrões), montado por lib/agent/memory.ts#buildMemoryContext. null quando o usuário
  // ainda não tem sessões anteriores — nesse caso o prompt não menciona memória alguma.
  memoryContext: string | null = null,
  // Story 3.6 (AC1/AC2/AC3): contexto de abertura adaptativa, montado por
  // lib/agent/memory.ts#buildSessionOpeningContext. Deve ser passado apenas quando esta é a
  // primeira mensagem da sessão atual — o chamador decide isso (ver /api/chat), pois é quem
  // conhece o histórico de mensagens já carregado da sessão em curso.
  openingContext: SessionOpeningContext | null = null,
): string {
  const tone = TONE_MAP[state];
  let prompt = `${BASE_SYSTEM_PROMPT}\n\nAJUSTE DE TOM PARA ESTA SESSÃO:\n${tone.systemAddendum}`;
  if (intensity !== "low") {
    prompt = `${prompt}\n\n${INTENSITY_ADDENDUM[state]}`;
  }
  if (memoryContext) {
    prompt = `${prompt}\n\n${memoryContext}`;
  }
  if (openingContext) {
    prompt = `${prompt}\n\n${buildOpeningAddendum(openingContext)}`;
  }
  return prompt;
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
