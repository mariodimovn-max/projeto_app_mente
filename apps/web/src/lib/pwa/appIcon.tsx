// Story 6.1: fonte ÚNICA da arte do ícone do app (PWA, favicon, apple-touch-icon).
// Ícone provisório derivado da paleta Aura — trocar pela arte final mexendo só neste arquivo.
// Renderizado por `ImageResponse` (next/og → Satori): só flexbox e um subconjunto de CSS.

/** Fundo do app (`--color-bg`) — também usado em manifest e `viewport.themeColor`. */
export const PWA_BACKGROUND = "#080f12";
/** Cor da barra de status/tema do app instalado. */
export const PWA_THEME = "#080f12";

const MARK_CORE_LIGHT = "#b9f0e8";
const MARK_ACCENT = "#7fd0c8"; // --color-accent-1
const MARK_DEEP = "#4ba39c"; // --color-accent-2

// Proporções da marca em relação ao lado do ícone. Na variante `maskable` o Android recorta o
// ícone numa forma própria (círculo, squircle…) e só garante visível o círculo central de 80%
// do lado — a marca inteira (orbe + brilho) precisa caber nele.
const CORE_RATIO_ANY = 0.5;
const CORE_RATIO_MASKABLE = 0.4;
const GLOW_FACTOR = 1.5;

export interface IconMarkSize {
  /** Diâmetro do orbe sólido. */
  core: number;
  /** Diâmetro do halo de brilho em volta do orbe (maior elemento visível da marca). */
  glow: number;
}

export function getIconMarkSize(size: number, maskable: boolean): IconMarkSize {
  const core = Math.round(size * (maskable ? CORE_RATIO_MASKABLE : CORE_RATIO_ANY));
  return { core, glow: Math.round(core * GLOW_FACTOR) };
}

interface AppIconArtProps {
  size: number;
  maskable?: boolean;
}

export function AppIconArt({ size, maskable = false }: AppIconArtProps) {
  const { core, glow } = getIconMarkSize(size, maskable);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PWA_BACKGROUND,
      }}
    >
      <div
        style={{
          width: glow,
          height: glow,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `radial-gradient(circle, rgba(127, 208, 200, 0.35) 0%, rgba(127, 208, 200, 0.12) 55%, rgba(127, 208, 200, 0) 70%)`,
        }}
      >
        <div
          style={{
            width: core,
            height: core,
            borderRadius: "50%",
            backgroundImage: `radial-gradient(circle at 38% 35%, ${MARK_CORE_LIGHT} 0%, ${MARK_ACCENT} 45%, ${MARK_DEEP} 100%)`,
          }}
        />
      </div>
    </div>
  );
}

export interface AppIconVariant {
  /** Segmento de URL gerado pelo Next para este ícone (`/icon/<id>`). */
  id: string;
  size: number;
  maskable: boolean;
}

/** Variantes geradas por `src/app/icon.tsx` e referenciadas pelo manifest. */
export const APP_ICON_VARIANTS: readonly AppIconVariant[] = [
  { id: "32", size: 32, maskable: false },
  { id: "192", size: 192, maskable: false },
  { id: "512", size: 512, maskable: false },
  { id: "512-maskable", size: 512, maskable: true },
];

export const APPLE_ICON_SIZE = 180;

export function iconUrl(variant: AppIconVariant): string {
  return `/icon/${variant.id}`;
}
