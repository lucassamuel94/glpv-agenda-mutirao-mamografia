import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  EmptyStateIllustration,
  type EmptyStateKind,
  type EmptyStateMode,
} from "./empty-state-illustration";

function renderIllustration(kind: EmptyStateKind, mode: EmptyStateMode) {
  return render(<EmptyStateIllustration kind={kind} mode={mode} />);
}

describe("EmptyStateIllustration", () => {
  it("exposes the patients no-data context as decorative artwork", () => {
    const { container } = renderIllustration("patients", "no-data");
    const root = container.firstElementChild;

    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("empty-state-illustration");
    expect(root).toHaveAttribute("data-empty-state-kind", "patients");
    expect(root).toHaveAttribute("data-empty-state-mode", "no-data");
  });

  it("keeps search result context distinct from record emptiness", () => {
    const { container } = renderIllustration("search", "no-results");
    const root = container.firstElementChild;

    expect(root).toHaveAttribute("data-empty-state-kind", "search");
    expect(root).toHaveAttribute("data-empty-state-mode", "no-results");
  });
});
