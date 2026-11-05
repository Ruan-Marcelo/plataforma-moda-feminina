// RUAN MARCELO RAMACIOTI LUZ
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User { role?: Role; }
  interface Session { user: { id: string; role: Role } & NonNullable<Session["user"]>; }
}

declare module "next-auth/jwt" {
  interface JWT { role?: Role; }
}
