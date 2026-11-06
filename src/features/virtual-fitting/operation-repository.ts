import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const fittingProfileCredits = 2;
export type FittingLimits = { dailyCredits: number; ownerDailyRequests: number; concurrent: number };
export class FittingLimitError extends Error {
  constructor(public readonly code: "budget_exhausted" | "usage_limit" | "concurrency_limit" | "duplicate_request") { super(code); }
}

type Reservation = { requestId: string; ownerHash: string; productId: string; variantId: string; consentVersion: string };

export async function reserveFittingOperation(input: Reservation, limits: FittingLimits, db: PrismaClient = prisma) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async tx => {
        const now = new Date();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        if (await tx.virtualFittingOperation.findUnique({ where: { requestId: input.requestId } })) throw new FittingLimitError("duplicate_request");
        const credits = await tx.virtualFittingOperation.aggregate({ where: { createdAt: { gte: start } }, _sum: { reservedCredits: true } });
        if ((credits._sum.reservedCredits ?? 0) + fittingProfileCredits > limits.dailyCredits) throw new FittingLimitError("budget_exhausted");
        const requests = await tx.virtualFittingOperation.count({ where: { ownerHash: input.ownerHash, createdAt: { gte: start } } });
        if (requests >= limits.ownerDailyRequests) throw new FittingLimitError("usage_limit");
        const active = await tx.virtualFittingOperation.count({ where: { settledAt: null } });
        if (active >= limits.concurrent) throw new FittingLimitError("concurrency_limit");
        return tx.virtualFittingOperation.create({ data: { ...input, reservedCredits: fittingProfileCredits, expiresAt: new Date(now.getTime() + 30 * 86400_000) } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new FittingLimitError("duplicate_request");
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }
  throw new FittingLimitError("concurrency_limit");
}

export async function markFittingSubmitted(id: string, providerRequestId: string) {
  await prisma.virtualFittingOperation.update({ where: { id }, data: { status: "SUBMITTED", providerRequestId } });
}

export async function finishFittingOperation(id: string, outcome: { status: string; errorCode?: string; settled: boolean; actualCredits?: number }) {
  await prisma.virtualFittingOperation.update({ where: { id }, data: {
    status: outcome.status, errorCode: outcome.errorCode,
    settledAt: outcome.settled ? new Date() : null, actualCredits: outcome.actualCredits,
    ...(outcome.actualCredits !== undefined && outcome.actualCredits > fittingProfileCredits ? { reservedCredits: outcome.actualCredits } : {}),
  } });
}
