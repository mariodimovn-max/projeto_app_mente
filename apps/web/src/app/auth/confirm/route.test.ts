import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtpMock = vi.fn();
const createClientMock = vi.fn(async () => ({
  auth: { verifyOtp: verifyOtpMock },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

describe("GET /auth/confirm", () => {
  beforeEach(() => {
    verifyOtpMock.mockReset();
  });

  it("redireciona para /auth/definir-senha após verificar o convite com sucesso", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });
    const { GET } = await import("./route");

    const request = new NextRequest(
      "https://app.exemplo.com/auth/confirm?token_hash=abc123&type=invite"
    );
    const response = await GET(request);

    expect(verifyOtpMock).toHaveBeenCalledWith({
      type: "invite",
      token_hash: "abc123",
    });
    expect(response.headers.get("location")).toBe(
      "https://app.exemplo.com/auth/definir-senha"
    );
  });

  it("respeita o parâmetro next informado no link do convite", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });
    const { GET } = await import("./route");

    const request = new NextRequest(
      "https://app.exemplo.com/auth/confirm?token_hash=abc123&type=invite&next=/chat"
    );
    const response = await GET(request);

    expect(response.headers.get("location")).toBe("https://app.exemplo.com/chat");
  });

  it("redireciona para /auth com erro quando o token é inválido", async () => {
    verifyOtpMock.mockResolvedValue({ error: new Error("invalid") });
    const { GET } = await import("./route");

    const request = new NextRequest(
      "https://app.exemplo.com/auth/confirm?token_hash=bad&type=invite"
    );
    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://app.exemplo.com/auth?erro=convite-invalido"
    );
  });

  it("redireciona para /auth com erro quando faltam parâmetros obrigatórios", async () => {
    const { GET } = await import("./route");
    const request = new NextRequest("https://app.exemplo.com/auth/confirm");
    const response = await GET(request);

    expect(verifyOtpMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://app.exemplo.com/auth?erro=convite-invalido"
    );
  });

  it("rejeita type diferente de invite mesmo com token válido", async () => {
    const { GET } = await import("./route");
    const request = new NextRequest(
      "https://app.exemplo.com/auth/confirm?token_hash=abc123&type=recovery"
    );
    const response = await GET(request);

    expect(verifyOtpMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://app.exemplo.com/auth?erro=convite-invalido"
    );
  });

  it("ignora um next vazio e usa o destino padrão", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });
    const { GET } = await import("./route");

    const request = new NextRequest(
      "https://app.exemplo.com/auth/confirm?token_hash=abc123&type=invite&next="
    );
    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://app.exemplo.com/auth/definir-senha"
    );
  });

  it("não permite redirecionar para um host externo via next (open redirect)", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });
    const { GET } = await import("./route");

    const request = new NextRequest(
      "https://app.exemplo.com/auth/confirm?token_hash=abc123&type=invite&next=" +
        encodeURIComponent("@evil.com/phish")
    );
    const response = await GET(request);

    const location = response.headers.get("location")!;
    expect(new URL(location).host).toBe("app.exemplo.com");
    expect(location).toBe("https://app.exemplo.com/auth/definir-senha");
  });

  it("não permite next protocol-relative (//host) escapar para outro domínio", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });
    const { GET } = await import("./route");

    const request = new NextRequest(
      "https://app.exemplo.com/auth/confirm?token_hash=abc123&type=invite&next=" +
        encodeURIComponent("//evil.com/phish")
    );
    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://app.exemplo.com/auth/definir-senha"
    );
  });
});
