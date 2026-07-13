import { beforeEach, describe, expect, it, vi } from "vitest";

type CookieMethods = {
  getAll(): { name: string; value: string }[];
  setAll(
    cookies: { name: string; value: string; options: Record<string, unknown> }[]
  ): void;
};

type CreateServerClientArgs = [url: string, key: string, options: { cookies: CookieMethods }];

const createServerClientMock = vi.fn(() => ({ auth: {} }));
const cookieStore = {
  getAll: vi.fn(() => [{ name: "sb-session", value: "abc" }]),
  set: vi.fn(),
};

function getCallOptions() {
  const call = createServerClientMock.mock.calls[0] as unknown as CreateServerClientArgs;
  return call[2];
}

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

describe("createClient (server)", () => {
  beforeEach(() => {
    createServerClientMock.mockClear();
    cookieStore.getAll.mockClear();
    cookieStore.set.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("cria o client de servidor lendo cookies da requisição", async () => {
    const { createClient } = await import("./server");
    await createClient();

    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.objectContaining({ cookies: expect.any(Object) })
    );

    const options = getCallOptions();
    expect(options.cookies.getAll()).toEqual(cookieStore.getAll());
  });

  it("grava cookies recebidos do Supabase via setAll", async () => {
    const { createClient } = await import("./server");
    await createClient();

    const options = getCallOptions();
    options.cookies.setAll([{ name: "sb-session", value: "xyz", options: {} }]);

    expect(cookieStore.set).toHaveBeenCalledWith("sb-session", "xyz", {});
  });

  it("ignora falha ao gravar cookies fora de um contexto que permite mutação, mas loga o erro", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const writeError = new Error("Cookies can only be modified in a Server Action or Route Handler");
    cookieStore.set.mockImplementationOnce(() => {
      throw writeError;
    });

    const { createClient } = await import("./server");
    await createClient();
    const options = getCallOptions();

    expect(() =>
      options.cookies.setAll([{ name: "sb-session", value: "xyz", options: {} }])
    ).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Falha ao gravar cookies"),
      writeError
    );

    consoleErrorSpy.mockRestore();
  });
});
