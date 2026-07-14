import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type CreateServerClientOptions = { cookies: { setAll: (cookies: unknown[]) => void } };
type GetUser = () => Promise<{ data: { user: null } }>;

const getUserMock = vi.fn<GetUser>();
const createServerClientMock = vi.fn<
  (url: string, key: string, options: CreateServerClientOptions) => { auth: { getUser: GetUser } }
>(() => ({
  auth: { getUser: getUserMock },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

describe("proxy", () => {
  beforeEach(() => {
    createServerClientMock.mockClear();
    getUserMock.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("chama getUser para renovar o token de sessão em toda requisição", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("./proxy");

    const request = new NextRequest("https://app.exemplo.com/diario");
    await proxy(request);

    expect(getUserMock).toHaveBeenCalled();
  });

  it("propaga na resposta os cookies de sessão renovados pelo Supabase", async () => {
    createServerClientMock.mockImplementation(
      (_url: string, _key: string, options: CreateServerClientOptions) => ({
        auth: {
          getUser: async () => {
            options.cookies.setAll([
              { name: "sb-access-token", value: "novo-token", options: { path: "/" } },
            ]);
            return { data: { user: null } };
          },
        },
      })
    );

    const { proxy } = await import("./proxy");
    const request = new NextRequest("https://app.exemplo.com/diario");
    const response = await proxy(request);

    expect(response.cookies.get("sb-access-token")?.value).toBe("novo-token");
  });

  it("segue adiante a requisição sem redirecionar quando não há sessão", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("./proxy");

    const request = new NextRequest("https://app.exemplo.com/diario");
    const response = await proxy(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get("location")).toBeNull();
  });
});
