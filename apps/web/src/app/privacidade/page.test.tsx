// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacyPolicyPage from "./page";

describe("PrivacyPolicyPage", () => {
  it("descreve o modelo real de criptografia, sem prometer E2EE literal (AC2)", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole("heading", { name: "Como seus dados são usados" })).toBeInTheDocument();
    expect(screen.getByText(/TLS 1\.3\+/)).toBeInTheDocument();
    expect(screen.getAllByText(/AES-256/).length).toBeGreaterThan(0);
    expect(screen.getByText(/fisicamente incompatível/)).toBeInTheDocument();
    expect(screen.queryByText(/ponta a ponta na infraestrutura/)).not.toBeInTheDocument();
  });
});
