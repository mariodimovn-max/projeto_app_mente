import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { APP_ICON_VARIANTS, AppIconArt, getIconMarkSize, iconUrl } from "./appIcon";

describe("arte do ícone do app", () => {
  it("na variante maskable, a marca inteira cabe no círculo seguro de 80% do lado", () => {
    for (const size of [192, 512]) {
      const { glow } = getIconMarkSize(size, true);
      expect(glow).toBeLessThanOrEqual(size * 0.8);
    }
  });

  it("na variante comum, a marca ocupa mais do ícone que na maskable", () => {
    expect(getIconMarkSize(512, false).core).toBeGreaterThan(getIconMarkSize(512, true).core);
    expect(getIconMarkSize(512, false).glow).toBeLessThanOrEqual(512);
  });

  it("renderiza um elemento do tamanho pedido para o ImageResponse", () => {
    const element = AppIconArt({ size: 192 });
    expect(isValidElement(element)).toBe(true);
    expect((element.props as { style: { width: number; height: number } }).style).toMatchObject({
      width: 192,
      height: 192,
    });
  });

  it("monta a URL da rota gerada pelo Next para cada variante", () => {
    expect(APP_ICON_VARIANTS.map(iconUrl)).toEqual([
      "/icon/32",
      "/icon/192",
      "/icon/512",
      "/icon/512-maskable",
    ]);
  });
});
