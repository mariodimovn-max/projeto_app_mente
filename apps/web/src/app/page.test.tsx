// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("Home onboarding page", () => {
  it("renders the onboarding pillars and the entry CTA", () => {
    render(<HomePage />);

    expect(screen.getAllByText(/Propósito/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Privacidade/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Começar/i).length).toBeGreaterThan(0);

    const cta = screen.getByRole("link", { name: /Começar sessão/i });
    expect(cta.getAttribute("href")).toBe("/auth");
  });

  it("shows the immediate risk notice and privacy explanation", () => {
    render(<HomePage />);

    expect(screen.getAllByText(/Se estiver em risco imediato/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Como usamos seus dados/i).length).toBeGreaterThan(0);
  });
});
