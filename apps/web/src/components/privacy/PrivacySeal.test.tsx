// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrivacySeal } from "./PrivacySeal";

describe("PrivacySeal", () => {
  it("mostra a copy de criptografia e um link para a política de privacidade (AC1/AC2)", () => {
    render(<PrivacySeal />);

    expect(screen.getByText(/Transcrições armazenadas com criptografia/i)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Como seus dados são usados" });
    expect(link).toHaveAttribute("href", "/privacidade");
  });
});
