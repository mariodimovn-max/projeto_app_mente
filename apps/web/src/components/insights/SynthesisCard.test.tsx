// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SynthesisCard } from "./SynthesisCard";

const synthesis = {
  id: "synthesis-1",
  title: "Hoje você tocou no medo de não dar conta.",
  themes: ["Sono", "Rotina"],
  explored: "Você explorou como a rotina noturna afeta seu sono.",
  patterns: [
    "Pequenas vitórias recentes parecem reduzir sua ansiedade.",
    "O tema 'ser suficiente' já apareceu antes.",
  ],
  openQuestion: "O que mudaria se você desse à sua noite a mesma atenção que dá ao dia?",
  depth: 8,
  durationMinutes: 23,
  exchangeCount: 14,
  createdAt: "2026-07-22T23:54:00Z",
};

describe("SynthesisCard", () => {
  it("exibe o título, os chips temáticos, o que foi explorado, os padrões e a pergunta aberta", () => {
    render(<SynthesisCard synthesis={synthesis} />);

    expect(screen.getByRole("heading", { name: synthesis.title })).toBeInTheDocument();
    expect(screen.getByText("Sono")).toBeInTheDocument();
    expect(screen.getByText("Rotina")).toBeInTheDocument();
    expect(screen.getByText(synthesis.explored)).toBeInTheDocument();
    expect(screen.getByText(synthesis.patterns[0]!)).toBeInTheDocument();
    expect(screen.getByText(synthesis.patterns[1]!)).toBeInTheDocument();
    expect(screen.getByText(synthesis.openQuestion)).toBeInTheDocument();
  });

  it("exibe as estatísticas da sessão (profundidade, duração e trocas)", () => {
    render(<SynthesisCard synthesis={synthesis} />);

    expect(screen.getByText("23 min")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText(/−8m/)).toBeInTheDocument();
    expect(screen.getByText(/Fundo/)).toBeInTheDocument();
  });

  it("não renderiza a lista de chips quando não há temas", () => {
    render(<SynthesisCard synthesis={{ ...synthesis, themes: [] }} />);

    expect(screen.queryByText("Sono")).not.toBeInTheDocument();
  });

  it("expõe a região com um rótulo acessível", () => {
    render(<SynthesisCard synthesis={synthesis} />);

    expect(screen.getByRole("region", { name: "Síntese da sessão" })).toBeInTheDocument();
  });

  it("mostra as ações 'Guardar no diário' e 'Ver a conversa' desabilitadas, sem funcionalidade ainda", () => {
    render(<SynthesisCard synthesis={synthesis} />);

    expect(screen.getByRole("button", { name: "Guardar no diário" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ver a conversa" })).toBeDisabled();
  });

  it("renderiza o dock de reação à síntese (Story 3.2)", () => {
    render(<SynthesisCard synthesis={synthesis} />);

    expect(screen.getByText("Como isso ressoou em você?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Me pegou fundo" })).toBeInTheDocument();
  });

  it("usa uma key estável mesmo com temas e padrões duplicados, sem quebrar a renderização", () => {
    render(
      <SynthesisCard
        synthesis={{ ...synthesis, themes: ["Sono", "Sono"], patterns: ["Repetido", "Repetido"] }}
      />
    );

    expect(screen.getAllByText("Sono")).toHaveLength(2);
    expect(screen.getAllByText("Repetido")).toHaveLength(2);
  });
});
