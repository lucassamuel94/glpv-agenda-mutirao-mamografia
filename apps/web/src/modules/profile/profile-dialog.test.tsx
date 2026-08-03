import { describe, expect, it } from "vitest";
import { PROFILE_NAME_CLASS } from "./profile-dialog";

describe("ProfileDialog — nome do perfil", () => {
  it("usa o foreground semântico da superfície nos dois temas", () => {
    expect(PROFILE_NAME_CLASS).toBe("text-slate-900 dark:text-white");
  });
});
