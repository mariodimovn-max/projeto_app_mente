import { describe, expect, it } from "vitest";
import manifest, { APP_DESCRIPTION, APP_NAME } from "./manifest";
import { PWA_BACKGROUND, PWA_THEME } from "@/lib/pwa/appIcon";

describe("manifest do PWA", () => {
  const result = manifest();

  it("declara os campos exigidos para instalação como app", () => {
    expect(result).toMatchObject({
      name: APP_NAME,
      short_name: "Diário",
      description: APP_DESCRIPTION,
      lang: "pt-BR",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: PWA_BACKGROUND,
      theme_color: PWA_THEME,
    });
  });

  it("não trava orientação — portrait e landscape continuam suportados (NFR5)", () => {
    expect(result).not.toHaveProperty("orientation");
  });

  it("aponta para ícones 192 e 512 e uma variante maskable nas rotas geradas por app/icon.tsx", () => {
    expect(result.icons).toEqual([
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ]);
  });
});
