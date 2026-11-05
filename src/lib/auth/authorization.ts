// RUAN MARCELO RAMACIOTI LUZ
import { Role } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  role: Role;
};

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationDeniedError extends Error {
  constructor() {
    super("You are not allowed to perform this action");
    this.name = "AuthorizationDeniedError";
  }
}

export function requireRole(user: AuthenticatedUser | null | undefined, allowedRoles: readonly Role[]): AuthenticatedUser {
  if (!user) throw new AuthenticationRequiredError();
  if (!allowedRoles.includes(user.role)) throw new AuthorizationDeniedError();
  return user;
}

export function requireCatalogEditor(user: AuthenticatedUser | null | undefined) {
  return requireRole(user, [Role.ADMIN, Role.EDITOR]);
}

export function requireAdministrator(user: AuthenticatedUser | null | undefined) {
  return requireRole(user, [Role.ADMIN]);
}
