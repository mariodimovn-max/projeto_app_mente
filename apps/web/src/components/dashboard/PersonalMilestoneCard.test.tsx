// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalMilestone } from "@/lib/milestones/milestones";

const { updatePersonalMilestoneMock, deletePersonalMilestoneMock } = vi.hoisted(() => ({
  updatePersonalMilestoneMock: vi.fn(),
  deletePersonalMilestoneMock: vi.fn(),
}));

vi.mock("@/lib/actions/personalMilestones", () => ({
  updatePersonalMilestone: updatePersonalMilestoneMock,
  deletePersonalMilestone: deletePersonalMilestoneMock,
}));

const { PersonalMilestoneCard } = await import("./PersonalMilestoneCard");

const MILESTONE: PersonalMilestone = {
  id: "milestone-1",
  title: "Quero entender meu relacionamento com dinheiro",
  theme: "dinheiro",
  progress: 3,
  createdAt: "2026-08-01T10:00:00Z",
};

describe("PersonalMilestoneCard", () => {
  beforeEach(() => {
    updatePersonalMilestoneMock.mockReset();
    deletePersonalMilestoneMock.mockReset();
  });

  it("exibe título, tema e progresso sem elementos de gamification (Story 4.3, AC1/AC2)", () => {
    render(
      <ul>
        <PersonalMilestoneCard milestone={MILESTONE} onUpdated={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    expect(
      screen.getByText("Quero entender meu relacionamento com dinheiro")
    ).toBeInTheDocument();
    expect(screen.getByText("dinheiro")).toBeInTheDocument();
    expect(screen.getByText("Apareceu em 3 conversas.")).toBeInTheDocument();
    expect(screen.queryByText(/badge|medalha|troféu|nível|XP/i)).not.toBeInTheDocument();
  });

  it("mostra uma legenda acolhedora quando o progresso é zero", () => {
    render(
      <ul>
        <PersonalMilestoneCard
          milestone={{ ...MILESTONE, progress: 0 }}
          onUpdated={vi.fn()}
          onDeleted={vi.fn()}
        />
      </ul>
    );

    expect(screen.getByText("Ainda não apareceu nas suas conversas.")).toBeInTheDocument();
  });

  it("edita título e tema e chama updatePersonalMilestone com os valores normalizados (AC3)", async () => {
    updatePersonalMilestoneMock.mockResolvedValue({ success: true, progress: 5 });
    const onUpdated = vi.fn();

    render(
      <ul>
        <PersonalMilestoneCard milestone={MILESTONE} onUpdated={onUpdated} onDeleted={vi.fn()} />
      </ul>
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByDisplayValue("Quero entender meu relacionamento com dinheiro"), {
      target: { value: "Novo foco" },
    });
    fireEvent.change(screen.getByDisplayValue("dinheiro"), { target: { value: "Sono" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    // onUpdated é responsabilidade do container (PersonalMilestones) refletir de volta na
    // prop `milestone` — aqui, isolado, só é possível checar que o modo de edição fecha e
    // que o callback recebeu o payload normalizado esperado.
    expect(await screen.findByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(updatePersonalMilestoneMock).toHaveBeenCalledWith("milestone-1", {
      title: "Novo foco",
      theme: "Sono",
    });
    expect(onUpdated).toHaveBeenCalledWith({
      ...MILESTONE,
      title: "Novo foco",
      theme: "sono",
      progress: 5,
    });
  });

  it("mostra erro e mantém o modo de edição quando a atualização falha", async () => {
    updatePersonalMilestoneMock.mockResolvedValue({ error: "Não consegui salvar." });

    render(
      <ul>
        <PersonalMilestoneCard milestone={MILESTONE} onUpdated={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não consegui salvar.");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("pede confirmação antes de remover e só chama deletePersonalMilestone ao confirmar (AC3)", async () => {
    deletePersonalMilestoneMock.mockResolvedValue({ success: true });
    const onDeleted = vi.fn();

    render(
      <ul>
        <PersonalMilestoneCard milestone={MILESTONE} onUpdated={vi.fn()} onDeleted={onDeleted} />
      </ul>
    );

    fireEvent.click(screen.getByRole("button", { name: "Remover" }));
    expect(deletePersonalMilestoneMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Remover" }));

    expect(deletePersonalMilestoneMock).toHaveBeenCalledWith("milestone-1");
    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalledWith("milestone-1"));
  });

  it("cancela a exclusão sem chamar a Server Action", () => {
    render(
      <ul>
        <PersonalMilestoneCard milestone={MILESTONE} onUpdated={vi.fn()} onDeleted={vi.fn()} />
      </ul>
    );

    fireEvent.click(screen.getByRole("button", { name: "Remover" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(deletePersonalMilestoneMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });
});
