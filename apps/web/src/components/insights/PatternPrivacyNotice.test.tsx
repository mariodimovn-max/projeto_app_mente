// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatternPrivacyNotice } from "./PatternPrivacyNotice";

describe("PatternPrivacyNotice", () => {
  it("mostra o aviso e some ao ser dispensado", () => {
    render(<PatternPrivacyNotice />);

    expect(screen.getByRole("status")).toHaveTextContent(/temas, emoções e gatilhos/i);

    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
