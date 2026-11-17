import { ImageResponse } from "next/og";
import { APP_ICON_VARIANTS, AppIconArt } from "@/lib/pwa/appIcon";

// Story 6.1: ícones do app gerados no build a partir da arte única em lib/pwa/appIcon.tsx.
// Cada variante vira uma rota `/icon/<id>` (favicon, ícones do manifest, variante maskable).

export function generateImageMetadata() {
  return APP_ICON_VARIANTS.map((variant) => ({
    id: variant.id,
    size: { width: variant.size, height: variant.size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = String(await id);
  const variant = APP_ICON_VARIANTS.find((v) => v.id === iconId) ?? APP_ICON_VARIANTS[0]!;

  return new ImageResponse(<AppIconArt size={variant.size} maskable={variant.maskable} />, {
    width: variant.size,
    height: variant.size,
  });
}
