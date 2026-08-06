// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { usePathnameMock } = vi.hoisted(() => ({ usePathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

import { PrimaryNav } from "./PrimaryNav";

describe("PrimaryNav", () => {
  it("exibe os três destinos principais como links", () => {
    usePathnameMock.mockReturnValue("/");
    render(<PrimaryNav />);

    expect(screen.getByRole("link", { name: /Início/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Histórico/i })).toHaveAttribute("href", "/historico");
    expect(screen.getByRole("link", { name: /Insights/i })).toHaveAttribute("href", "/insights");
  });

  it("marca o destino correspondente à rota atual com aria-current", () => {
    usePathnameMock.mockReturnValue("/historico");
    render(<PrimaryNav />);

    expect(screen.getByRole("link", { name: /Histórico/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Início/i })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: /Insights/i })).not.toHaveAttribute("aria-current");
  });

  it("não marca nenhum destino como atual quando a rota não é uma das três telas principais", () => {
    usePathnameMock.mockReturnValue("/chat");
    render(<PrimaryNav />);

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("expõe uma landmark de navegação com rótulo acessível", () => {
    usePathnameMock.mockReturnValue("/");
    render(<PrimaryNav />);

    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
  });
});
