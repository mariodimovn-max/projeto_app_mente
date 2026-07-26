// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionRestedNotice } from "./SessionRestedNotice";

describe("SessionRestedNotice", () => {
  it("mostra o convite para ver a síntese e chama onReveal ao clicar", () => {
    const onReveal = vi.fn();
    render(<SessionRestedNotice onReveal={onReveal} />);

    expect(screen.getByText("A sessão repousou")).toBeInTheDocument();
    expect(screen.getByText(/Encerrada automaticamente após 60 min/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver a síntese" }));

    expect(onReveal).toHaveBeenCalledTimes(1);
  });
});
