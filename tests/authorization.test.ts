// RUAN MARCELO RAMACIOTI LUZ
import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { AuthorizationDeniedError, AuthenticationRequiredError, requireAdministrator, requireCatalogEditor } from "@/lib/auth/authorization";

describe("authorization policies", () => {
  it("allows admins and editors to manage the catalog", () => {
    expect(requireCatalogEditor({ id: "admin", role: Role.ADMIN }).role).toBe(Role.ADMIN);
    expect(requireCatalogEditor({ id: "editor", role: Role.EDITOR }).role).toBe(Role.EDITOR);
  });

  it("denies clients and anonymous users", () => {
    expect(() => requireCatalogEditor({ id: "client", role: Role.CLIENTE })).toThrow(AuthorizationDeniedError);
    expect(() => requireCatalogEditor(null)).toThrow(AuthenticationRequiredError);
  });

  it("restricts administrator-only operations", () => {
    expect(() => requireAdministrator({ id: "editor", role: Role.EDITOR })).toThrow(AuthorizationDeniedError);
  });
});
