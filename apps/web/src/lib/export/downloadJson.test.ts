// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadJsonFile } from "./downloadJson";

describe("downloadJsonFile", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn<(obj: Blob) => string>>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn<() => void>>;
  let clickMock: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => "blob:mock-url");
    revokeObjectURLMock = vi.fn();
    clickMock = vi.fn();
    URL.createObjectURL = createObjectURLMock as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURLMock as unknown as typeof URL.revokeObjectURL;
    HTMLAnchorElement.prototype.click = clickMock as unknown as typeof HTMLAnchorElement.prototype.click;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cria um blob JSON, dispara o clique no link de download com o nome informado e libera a URL", () => {
    downloadJsonFile({ a: 1 }, "meus-dados-2026-08-19.json");

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const [blob] = createObjectURLMock.mock.calls[0]!;
    expect(blob.type).toBe("application/json");

    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
  });
});
