// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }));

vi.mock("@/lib/actions/logout", () => ({
  logout: logoutMock,
}));

import { LogoutButton } from "./LogoutButton";

describe("LogoutButton", () => {
  beforeEach(() => {
    logoutMock.mockReset();
  });

  it("não exibe a confirmação até que 'Sair' seja selecionado", () => {
    render(<LogoutButton />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("exibe uma confirmação antes de encerrar a sessão", () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /^Sair$/i }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("preserva o estado atual e não encerra a sessão quando o usuário cancela", () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /^Sair$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("encerra a sessão quando o usuário confirma", async () => {
    logoutMock.mockResolvedValue(undefined);
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /^Sair$/i }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^Sair$/i }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalled());
  });

  it("exibe erro sem fechar a confirmação quando a Server Action falha", async () => {
    logoutMock.mockResolvedValue({
      error: "Não foi possível encerrar sua sessão agora. Tente novamente.",
    });
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /^Sair$/i }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^Sair$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Não foi possível encerrar/i);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("não exibe dois botões com o nome acessível 'Sair' simultaneamente enquanto a confirmação está aberta", () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /^Sair$/i }));

    expect(screen.getAllByRole("button", { name: /^Sair$/i })).toHaveLength(1);
  });

  it("fecha a confirmação ao pressionar Escape", () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /^Sair$/i }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("mantém o foco dentro do diálogo ao pressionar Tab a partir do último elemento focável", () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /^Sair$/i }));
    const dialog = screen.getByRole("alertdialog");
    const cancelButton = within(dialog).getByRole("button", { name: /Cancelar/i });
    const confirmButton = within(dialog).getByRole("button", { name: /^Sair$/i });

    confirmButton.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });

    expect(document.activeElement).toBe(cancelButton);
  });

  it("mantém o foco dentro do diálogo ao pressionar Shift+Tab a partir do primeiro elemento focável", () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /^Sair$/i }));
    const dialog = screen.getByRole("alertdialog");
    const cancelButton = within(dialog).getByRole("button", { name: /Cancelar/i });
    const confirmButton = within(dialog).getByRole("button", { name: /^Sair$/i });

    cancelButton.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(confirmButton);
  });
});
