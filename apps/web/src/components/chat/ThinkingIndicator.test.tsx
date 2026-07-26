// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { THINKING_COPY, ThinkingIndicator } from "./ThinkingIndicator";

describe("ThinkingIndicator", () => {
  it("comunica com a copy reconfortante que o agente está processando a resposta", () => {
    render(<ThinkingIndicator />);

    expect(screen.getByText(THINKING_COPY)).toBeInTheDocument();
  });
});
