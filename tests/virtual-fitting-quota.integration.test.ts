import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { createDatabaseClient } from "../src/lib/db/client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { reserveFittingOperation } from "@/features/virtual-fitting/operation-repository";
import { fittingConsentVersion } from "@/features/virtual-fitting/contracts";

const databaseUrl = process.env.E2E_DATABASE_URL;
const requests: string[] = [];
let db: PrismaClient;
beforeAll(async () => {
  if (!databaseUrl) return;
  const url = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^belin_product_e2e_[a-z0-9_]+$/.test(url.pathname.slice(1))) throw new Error("Use only a dedicated local E2E database");
  db = createDatabaseClient(databaseUrl);
});
afterEach(async () => { if (db) await db.virtualFittingOperation.deleteMany({ where: { requestId: { in: requests.splice(0) } } }); });
afterAll(async () => { await db?.$disconnect(); });

function reservation(ownerHash = randomUUID()) {
  const requestId = randomUUID(); requests.push(requestId);
  return { ownerHash, requestId, productId: "cm123456789012345678901234", variantId: "cm123456789012345678901235", consentVersion: fittingConsentVersion };
}

describe.skipIf(!databaseUrl)("durable spending limits in PostgreSQL, isolated database only", () => {
  it("serializes competing reservations so the global credit budget cannot be overspent", async () => {
    const results = await Promise.allSettled([reserveFittingOperation(reservation(), { dailyCredits: 2, ownerDailyRequests: 3, concurrent: 2 }, db), reserveFittingOperation(reservation(), { dailyCredits: 2, ownerDailyRequests: 3, concurrent: 2 }, db)]);
    expect(results.filter(item => item.status === "fulfilled")).toHaveLength(1);
    const total = await db.virtualFittingOperation.aggregate({ _sum: { reservedCredits: true } });
    expect(total._sum.reservedCredits).toBe(2);
  });

  it("persists duplicate, per-owner and concurrency limits across calls", async () => {
    const first = reservation();
    const operation = await reserveFittingOperation(first, { dailyCredits: 10, ownerDailyRequests: 1, concurrent: 1 }, db);
    await expect(reserveFittingOperation(first, { dailyCredits: 10, ownerDailyRequests: 1, concurrent: 1 }, db)).rejects.toMatchObject({ code: "duplicate_request" });
    await expect(reserveFittingOperation(reservation(first.ownerHash), { dailyCredits: 10, ownerDailyRequests: 1, concurrent: 1 }, db)).rejects.toMatchObject({ code: "usage_limit" });
    await expect(reserveFittingOperation(reservation(), { dailyCredits: 10, ownerDailyRequests: 3, concurrent: 1 }, db)).rejects.toMatchObject({ code: "concurrency_limit" });
    await db.virtualFittingOperation.update({ where: { id: operation.id }, data: { settledAt: new Date(), status: "COMPLETED" } });
    await expect(reserveFittingOperation(reservation(), { dailyCredits: 10, ownerDailyRequests: 3, concurrent: 1 }, db)).resolves.toHaveProperty("id");
  });
});
