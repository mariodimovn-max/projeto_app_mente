import type { MetadataRoute } from "next";
import {
  APP_ICON_VARIANTS,
  PWA_BACKGROUND,
  PWA_THEME,
  iconUrl,
} from "@/lib/pwa/appIcon";

// Story 6.1: manifest do PWA (servido em /manifest.webmanifest pela convenção do Next).
// Sem `orientation` de propósito — portrait e landscape são suportados (NFR5).

export const APP_NAME = "Diário Digital";
export const APP_DESCRIPTION =
  "Espelho reflexivo para autoconhecimento — tecnologia para tocar a alma e despertar a mente.";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: "Diário",
    description: APP_DESCRIPTION,
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: PWA_BACKGROUND,
    theme_color: PWA_THEME,
    icons: APP_ICON_VARIANTS.filter((variant) => variant.size >= 192).map((variant) => ({
      src: iconUrl(variant),
      sizes: `${variant.size}x${variant.size}`,
      type: "image/png",
      purpose: variant.maskable ? "maskable" : "any",
    })),
  };
}
