import { beforeEach, describe, expect, it, vi } from "vitest";

const createBrowserClientMock = vi.fn(() => ({ auth: {} }));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
}));

describe("createClient (browser)", () => {
  beforeEach(() => {
    vi.resetModules();
    createBrowserClientMock.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("cria o client do navegador com as credenciais públicas do Supabase", async () => {
    const { createClient } = await import("./client");
    createClient();

    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key"
    );
  });

  it("reutiliza a mesma instância em chamadas subsequentes (singleton)", async () => {
    const { createClient } = await import("./client");

    const first = createClient();
    const second = createClient();

    expect(first).toBe(second);
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
  });
});
