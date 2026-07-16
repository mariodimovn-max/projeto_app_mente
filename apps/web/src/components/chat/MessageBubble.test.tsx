// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("exibe o conteúdo e um timestamp para uma mensagem do usuário", () => {
    const { container } = render(
      <MessageBubble
        message={{
          id: "1",
          role: "user",
          content: "Estou refletindo sobre meu dia.",
          createdAt: "2026-07-16T10:00:00Z",
        }}
      />
    );

    expect(screen.getByText("Estou refletindo sobre meu dia.")).toBeInTheDocument();
    expect(container.querySelector('time[datetime="2026-07-16T10:00:00Z"]')).toBeInTheDocument();
  });

  it("exibe o conteúdo de uma mensagem do agente", () => {
    render(
      <MessageBubble
        message={{
          id: "2",
          role: "assistant",
          content: "O que te leva a pensar nisso agora?",
          createdAt: "2026-07-16T10:00:05Z",
        }}
      />
    );

    expect(screen.getByText("O que te leva a pensar nisso agora?")).toBeInTheDocument();
  });
});
