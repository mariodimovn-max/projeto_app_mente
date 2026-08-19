import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn(() => ({ auth: { admin: {} } }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

describe("createAdminClient", () => {
  beforeEach(() => {
    createClientMock.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  it("cria o client com a service role key, sem persistir ou renovar sessão", async () => {
    const { createAdminClient } = await import("./admin");
    createAdminClient();

    expect(createClientMock).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-service-role-key",
      expect.objectContaining({
        auth: expect.objectContaining({ autoRefreshToken: false, persistSession: false }),
      })
    );
  });

  it("lança um erro claro quando SUPABASE_SERVICE_ROLE_KEY não está configurada", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createAdminClient } = await import("./admin");

    expect(() => createAdminClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("lança um erro claro quando NEXT_PUBLIC_SUPABASE_URL não está configurada", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { createAdminClient } = await import("./admin");

    expect(() => createAdminClient()).toThrow();
  });

  it("recusa rodar no browser, mesmo com as variáveis de ambiente configuradas", async () => {
    const { createAdminClient } = await import("./admin");
    const originalWindow = globalThis.window;
    // @ts-expect-error -- simula um contexto de browser para o guard de server-only
    globalThis.window = {};

    try {
      expect(() => createAdminClient()).toThrow(/browser/);
      expect(createClientMock).not.toHaveBeenCalled();
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
