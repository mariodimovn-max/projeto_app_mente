import { ImageResponse } from "next/og";
import { APPLE_ICON_SIZE, AppIconArt } from "@/lib/pwa/appIcon";

// Story 6.1: apple-touch-icon gerado a partir da mesma arte única (lib/pwa/appIcon.tsx).

export const size = { width: APPLE_ICON_SIZE, height: APPLE_ICON_SIZE };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconArt size={APPLE_ICON_SIZE} />, { ...size });
}
