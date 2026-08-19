// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadJsonFile } from "./downloadJson";

describe("downloadJsonFile", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let clickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => "blob:mock-url");
    revokeObjectURLMock = vi.fn();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
    clickMock = vi.fn();
    HTMLAnchorElement.prototype.click = clickMock;
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
