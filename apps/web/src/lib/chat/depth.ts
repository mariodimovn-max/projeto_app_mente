/**
 * Mecânica de "profundidade" do chat (medidor visual da coluna Aura):
 * a cada troca completa (usuário → resposta da aura), a profundidade sobe,
 * estimulando o usuário a se abrir mais ao longo da sessão.
 */

export type DepthLevel = "superficie" | "correntes" | "fundo";

export const MIN_DEPTH = 0;
export const MAX_DEPTH = 12;
export const DEPTH_INCREMENT_PER_EXCHANGE = 2;

const LEVEL_LABEL: Record<DepthLevel, string> = {
  superficie: "Superfície",
  correntes: "Correntes",
  fundo: "Fundo",
};

const LEVEL_HINT: Record<DepthLevel, string> = {
  superficie: "Você está na superfície. Respire — pode descer no seu tempo.",
  correntes: "Boas correntes. Aqui os padrões começam a aparecer.",
  fundo: "Você chegou ao fundo. É aqui que mora o que importa.",
};

export function resolveDepthLevel(depth: number): DepthLevel {
  if (depth <= 3) return "superficie";
  if (depth <= 7) return "correntes";
  return "fundo";
}

export function depthLevelLabel(depth: number): string {
  return LEVEL_LABEL[resolveDepthLevel(depth)];
}

export function depthLevelHint(depth: number): string {
  return LEVEL_HINT[resolveDepthLevel(depth)];
}

export function depthReadingLabel(depth: number): string {
  return `−${depth}m`;
}

export function nextDepth(depth: number): number {
  return Math.min(MAX_DEPTH, depth + DEPTH_INCREMENT_PER_EXCHANGE);
}

export function depthFraction(depth: number): number {
  return Math.min(1, Math.max(0, depth / MAX_DEPTH));
}
