// RUAN MARCELO RAMACIOTI LUZ
import { hash } from "bcryptjs";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const input = z.object({ email: z.string().email(), password: z.string().min(12), confirm: z.literal("YES") }).parse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, confirm: process.env.ADMIN_PROVISION_CONFIRM });
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await hash(input.password, 12);
  await prisma.user.upsert({ where: { email: input.email.toLowerCase() }, update: { passwordHash, role: "ADMIN" }, create: { email: input.email.toLowerCase(), passwordHash, role: "ADMIN" } });
  console.log("Administrador provisionado ou atualizado. A senha nao foi exibida.");
}
main().catch((error) => { console.error("Falha ao provisionar administrador:", error instanceof Error ? error.message : "erro desconhecido"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
