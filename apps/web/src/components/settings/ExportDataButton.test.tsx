// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { exportUserDataMock, downloadJsonFileMock } = vi.hoisted(() => ({
  exportUserDataMock: vi.fn(),
  downloadJsonFileMock: vi.fn(),
}));

vi.mock("@/lib/actions/exportData", () => ({
  exportUserData: exportUserDataMock,
}));

vi.mock("@/lib/export/downloadJson", () => ({
  downloadJsonFile: downloadJsonFileMock,
}));

const { ExportDataButton } = await import("./ExportDataButton");

const PAYLOAD = {
  exportedAt: "2026-08-19T12:00:00Z",
  user: { id: "user-1", email: "user@example.com" },
  sessions: [],
  patterns: null,
};

describe("ExportDataButton", () => {
  beforeEach(() => {
    exportUserDataMock.mockReset();
    downloadJsonFileMock.mockReset();
  });

  it("mostra o botão inicial sem erro nem confirmação", () => {
    render(<ExportDataButton />);

    expect(screen.getByRole("button", { name: "Exportar meus dados" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("chama a Server Action e dispara o download imediatamente com o resultado (AC1/AC2)", async () => {
    exportUserDataMock.mockResolvedValue({ data: PAYLOAD });
    render(<ExportDataButton />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar meus dados" }));

    expect(await screen.findByText("Download iniciado.")).toBeInTheDocument();
    expect(downloadJsonFileMock).toHaveBeenCalledTimes(1);
    const [data, filename] = downloadJsonFileMock.mock.calls[0]!;
    expect(data).toBe(PAYLOAD);
    expect(filename).toBe("meus-dados-2026-08-19.json");
  });

  it("exibe o erro retornado pela Server Action sem disparar download", async () => {
    exportUserDataMock.mockResolvedValue({
      error: "Não consegui exportar seus dados agora. Tente novamente.",
    });
    render(<ExportDataButton />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar meus dados" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não consegui exportar seus dados agora. Tente novamente."
    );
    expect(downloadJsonFileMock).not.toHaveBeenCalled();
  });

  it("exibe erro genérico quando a chamada rejeita inesperadamente", async () => {
    exportUserDataMock.mockRejectedValue(new Error("network down"));
    render(<ExportDataButton />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar meus dados" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não consegui exportar seus dados agora. Tente novamente."
    );
  });
});
