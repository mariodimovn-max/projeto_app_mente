// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replaceMock, setSessionMock, exchangeCodeForSessionMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  setSessionMock: vi.fn(),
  exchangeCodeForSessionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { setSession: setSessionMock, exchangeCodeForSession: exchangeCodeForSessionMock },
  }),
}));

import AuthCallbackPage from "./page";

function setUrl(pathWithQueryAndHash: string) {
  window.history.replaceState(null, "", pathWithQueryAndHash);
}

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    setSessionMock.mockReset();
    exchangeCodeForSessionMock.mockReset();
    setUrl("/auth/callback");
  });

  it("mostra um estado de carregamento acessível enquanto valida o link", () => {
    setUrl("/auth/callback#access_token=a&refresh_token=b&type=invite");
    setSessionMock.mockReturnValue(new Promise(() => {}));

    render(<AuthCallbackPage />);

    expect(screen.getByRole("status")).toHaveTextContent("confirmando seu acesso");
  });

  it("entrega os tokens do fragmento ao client e segue para definir senha no convite", async () => {
    setUrl("/auth/callback?next=/auth/definir-senha#access_token=a&refresh_token=b&type=invite");
    setSessionMock.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/auth/definir-senha"));
    expect(setSessionMock).toHaveBeenCalledWith({ access_token: "a", refresh_token: "b" });
  });

  it("segue para redefinir senha no fluxo de recuperação", async () => {
    setUrl("/auth/callback#access_token=a&refresh_token=b&type=recovery");
    setSessionMock.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/auth/redefinir-senha"));
  });

  it("redireciona para /auth com erro de convite quando o link já chega expirado", async () => {
    setUrl("/auth/callback?next=/auth/definir-senha#error=access_denied&error_code=otp_expired");

    render(<AuthCallbackPage />);

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/auth?erro=convite-invalido")
    );
    expect(setSessionMock).not.toHaveBeenCalled();
  });

  it("redireciona para /auth com erro quando o Supabase rejeita os tokens", async () => {
    setUrl("/auth/callback#access_token=a&refresh_token=b&type=recovery");
    setSessionMock.mockResolvedValue({ data: { session: null }, error: { message: "invalid" } });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/auth?erro=link-invalido"));
  });

  it("redireciona para /auth com erro quando setSession lança exceção", async () => {
    setUrl("/auth/callback#access_token=a&refresh_token=b&type=invite");
    setSessionMock.mockRejectedValue(new Error("network"));

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/auth?erro=convite-invalido"));
  });

  it("recuperação PKCE: troca o code pela sessão e segue para redefinir senha", async () => {
    setUrl("/auth/callback?next=/auth/redefinir-senha&code=abc-123");
    exchangeCodeForSessionMock.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/auth/redefinir-senha"));
    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("abc-123");
    expect(setSessionMock).not.toHaveBeenCalled();
  });

  it("recuperação PKCE: code rejeitado (ex.: aberto em outro navegador) vai para o erro de link", async () => {
    setUrl("/auth/callback?next=/auth/redefinir-senha&code=abc-123");
    exchangeCodeForSessionMock.mockResolvedValue({
      data: { session: null },
      error: { message: "code verifier not found" },
    });

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/auth?erro=link-invalido"));
  });
});
