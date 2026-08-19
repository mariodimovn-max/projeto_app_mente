// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteAccountMock } = vi.hoisted(() => ({ deleteAccountMock: vi.fn() }));

vi.mock("@/lib/actions/deleteAccount", () => ({
  deleteAccount: deleteAccountMock,
}));

const { DeleteAccountButton } = await import("./DeleteAccountButton");

describe("DeleteAccountButton", () => {
  beforeEach(() => {
    deleteAccountMock.mockReset();
  });

  it("não exibe a confirmação até que 'Excluir minha conta' seja selecionado", () => {
    render(<DeleteAccountButton />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("exibe uma confirmação explícita antes de excluir a conta (AC1)", () => {
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(deleteAccountMock).not.toHaveBeenCalled();
  });

  it("preserva a conta e não chama a Server Action quando o usuário cancela", () => {
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteAccountMock).not.toHaveBeenCalled();
  });

  it("chama a Server Action de exclusão quando o usuário confirma explicitamente (AC1)", async () => {
    deleteAccountMock.mockResolvedValue(undefined);
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Excluir permanentemente/i }));

    await waitFor(() => expect(deleteAccountMock).toHaveBeenCalled());
  });

  it("não chama a Server Action mais de uma vez ao clicar em confirmar repetidamente antes da resposta", async () => {
    let resolveDeleteAccount: (value: undefined) => void = () => {};
    deleteAccountMock.mockImplementation(
      () => new Promise((resolve) => { resolveDeleteAccount = resolve; })
    );
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    const dialog = screen.getByRole("alertdialog");
    const confirmButton = within(dialog).getByRole("button", { name: /Excluir permanentemente/i });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    resolveDeleteAccount(undefined);
    await waitFor(() => expect(deleteAccountMock).toHaveBeenCalledTimes(1));
  });

  it("exibe erro genérico e libera o botão quando a Server Action rejeita inesperadamente", async () => {
    deleteAccountMock.mockRejectedValue(new Error("network down"));
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Excluir permanentemente/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível excluir sua conta agora. Tente novamente em instantes."
    );
    expect(within(dialog).getByRole("button", { name: /Excluir permanentemente/i })).not.toBeDisabled();
  });

  it("exibe erro sem fechar a confirmação quando a Server Action falha", async () => {
    deleteAccountMock.mockResolvedValue({
      error: "Não foi possível excluir sua conta agora. Tente novamente em instantes.",
    });
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Excluir permanentemente/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Não foi possível excluir sua conta/i);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("fecha a confirmação ao pressionar Escape", () => {
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("mantém o foco dentro do diálogo ao pressionar Tab a partir do último elemento focável", () => {
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    const dialog = screen.getByRole("alertdialog");
    const cancelButton = within(dialog).getByRole("button", { name: /Cancelar/i });
    const confirmButton = within(dialog).getByRole("button", { name: /Excluir permanentemente/i });

    confirmButton.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });

    expect(document.activeElement).toBe(cancelButton);
  });

  it("mantém o foco dentro do diálogo ao pressionar Shift+Tab a partir do primeiro elemento focável", () => {
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    const dialog = screen.getByRole("alertdialog");
    const cancelButton = within(dialog).getByRole("button", { name: /Cancelar/i });
    const confirmButton = within(dialog).getByRole("button", { name: /Excluir permanentemente/i });

    cancelButton.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(confirmButton);
  });

  it("foca o botão Cancelar automaticamente ao abrir a confirmação", () => {
    render(<DeleteAccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));
    const dialog = screen.getByRole("alertdialog");

    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: /Cancelar/i }));
  });
});
