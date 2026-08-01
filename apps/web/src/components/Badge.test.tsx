import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it.each([
    ["neutral", "Inativo", "text-muted-foreground"],
    ["info", "Em andamento", "text-blue-700"],
    ["success", "Ativo", "text-emerald-700"],
    ["warning", "Pendente", "text-amber-800"],
    ["danger", "Perdida", "text-red-700"],
  ] as const)("aplica o estado semântico %s", (variant, label, expectedClass) => {
    render(<Badge variant={variant}>{label}</Badge>);
    expect(screen.getByText(label)).toHaveClass(expectedClass);
  });
});
