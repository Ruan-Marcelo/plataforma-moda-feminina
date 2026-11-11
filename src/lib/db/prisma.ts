// RUAN MARCELO RAMACIOTI LUZ
import { PrismaClient } from "@prisma/client";
import { createDatabaseClient } from "./client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createDatabaseClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
