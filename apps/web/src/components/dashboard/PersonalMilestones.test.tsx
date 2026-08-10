// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalMilestone } from "@/lib/milestones/milestones";

const {
  createPersonalMilestoneMock,
  updatePersonalMilestoneMock,
  deletePersonalMilestoneMock,
} = vi.hoisted(() => ({
  createPersonalMilestoneMock: vi.fn(),
  updatePersonalMilestoneMock: vi.fn(),
  deletePersonalMilestoneMock: vi.fn(),
}));

vi.mock("@/lib/actions/personalMilestones", () => ({
  createPersonalMilestone: createPersonalMilestoneMock,
  updatePersonalMilestone: updatePersonalMilestoneMock,
  deletePersonalMilestone: deletePersonalMilestoneMock,
}));

const { PersonalMilestones } = await import("./PersonalMilestones");

const EXISTING: PersonalMilestone = {
  id: "milestone-1",
  title: "Explorar meu sono",
  theme: "sono",
  progress: 2,
  createdAt: "2026-08-01T10:00:00Z",
};

describe("PersonalMilestones", () => {
  beforeEach(() => {
    createPersonalMilestoneMock.mockReset();
    updatePersonalMilestoneMock.mockReset();
    deletePersonalMilestoneMock.mockReset();
  });

  it("mostra uma mensagem de estado vazio quando o usuário ainda não tem marcos", () => {
    render(<PersonalMilestones initialMilestones={[]} />);

    expect(
      screen.getByText(
        "Defina um foco de exploração e acompanhe quantas vezes ele aparece nas suas conversas."
      )
    ).toBeInTheDocument();
  });

  it("lista os marcos existentes", () => {
    render(<PersonalMilestones initialMilestones={[EXISTING]} />);

    expect(screen.getByText("Explorar meu sono")).toBeInTheDocument();
    expect(screen.getByText("sono")).toBeInTheDocument();
    expect(screen.getByText("Apareceu em 2 conversas.")).toBeInTheDocument();
  });

  it("cria um novo marco pelo formulário e o exibe na lista (AC1)", async () => {
    createPersonalMilestoneMock.mockResolvedValue({ success: true, id: "milestone-2", progress: 0 });

    render(<PersonalMilestones initialMilestones={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Novo marco" }));
    fireEvent.change(screen.getByPlaceholderText(/Quero entender meu relacionamento com dinheiro/), {
      target: { value: "Quero entender meu relacionamento com dinheiro" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ex.: dinheiro"), {
      target: { value: "dinheiro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar marco" }));

    expect(
      await screen.findByText("Quero entender meu relacionamento com dinheiro")
    ).toBeInTheDocument();
    expect(createPersonalMilestoneMock).toHaveBeenCalledWith({
      title: "Quero entender meu relacionamento com dinheiro",
      theme: "dinheiro",
    });
    expect(screen.getByText("Ainda não apareceu nas suas conversas.")).toBeInTheDocument();
  });

  it("exibe o progresso já existente (não zero) quando o tema do novo marco já apareceu em user_patterns (AC2)", async () => {
    createPersonalMilestoneMock.mockResolvedValue({ success: true, id: "milestone-2", progress: 4 });

    render(<PersonalMilestones initialMilestones={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Novo marco" }));
    fireEvent.change(screen.getByPlaceholderText(/Quero entender meu relacionamento com dinheiro/), {
      target: { value: "Meu foco" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ex.: dinheiro"), {
      target: { value: "dinheiro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar marco" }));

    expect(await screen.findByText("Apareceu em 4 conversas.")).toBeInTheDocument();
  });

  it("mostra erro e mantém o formulário aberto quando a criação falha", async () => {
    createPersonalMilestoneMock.mockResolvedValue({ error: "Não consegui salvar." });

    render(<PersonalMilestones initialMilestones={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Novo marco" }));
    fireEvent.change(screen.getByPlaceholderText(/Quero entender meu relacionamento com dinheiro/), {
      target: { value: "Meu foco" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ex.: dinheiro"), {
      target: { value: "dinheiro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar marco" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não consegui salvar.");
    expect(screen.getByRole("button", { name: "Salvar marco" })).toBeInTheDocument();
  });

  it("cancela a criação sem chamar a Server Action", () => {
    render(<PersonalMilestones initialMilestones={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Novo marco" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(createPersonalMilestoneMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "+ Novo marco" })).toBeInTheDocument();
  });

  it("remove um marco da lista após a exclusão confirmada (AC3)", async () => {
    deletePersonalMilestoneMock.mockResolvedValue({ success: true });

    render(<PersonalMilestones initialMilestones={[EXISTING]} />);

    fireEvent.click(screen.getByRole("button", { name: "Remover" }));
    fireEvent.click(screen.getByRole("button", { name: "Remover" }));

    await screen.findByText(
      "Defina um foco de exploração e acompanhe quantas vezes ele aparece nas suas conversas."
    );
    expect(screen.queryByText("Explorar meu sono")).not.toBeInTheDocument();
  });
});
