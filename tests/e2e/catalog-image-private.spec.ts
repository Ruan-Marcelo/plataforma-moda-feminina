import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { hash } from "bcryptjs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { createDatabaseClient } from "../../src/lib/db/client";
import { cookieConsentStorageKey } from "../../src/features/cookie-consent/consent";

const databaseUrl = process.env.E2E_DATABASE_URL;
test.skip(!databaseUrl, "Exige banco local isolado.");
test("imagens privadas exigem autorização e a exclusão registra limpeza durável", async ({ page, playwright }) => {
  test.setTimeout(90_000);
  const url = new URL(databaseUrl!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^belin_product_e2e_[a-z0-9_]+$/.test(url.pathname.slice(1))) throw new Error("Banco de teste inseguro");
  const db = createDatabaseClient(databaseUrl);
  const marker = randomUUID();
  const email = `image-${marker}@example.test`, password = randomUUID();
  const user = await db.user.create({ data: { email, passwordHash: await hash(password, 12), role: "ADMIN" } });
  const product = await db.product.create({ data: { name: "Teste", slug: `image-${marker}`, status: "DRAFT" } });
  let anonymous: APIRequestContext | undefined;
  let storageKey: string | undefined;
  try {
    await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false, marketing: false })), cookieConsentStorageKey);
    await page.goto("/login");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 20000 });
    const uploaded = await page.request.post(`/api/admin/products/${product.id}/images`, { multipart: { alt: "Imagem de teste", file: { name: "teste.jpeg", mimeType: "image/jpeg", buffer: await readFile("public/brand/belin-logo.jpeg") } } });
    expect(uploaded.status()).toBe(201);
    const image = (await uploaded.json()).image as { id: string; storageKey: string };
    storageKey = image.storageKey;
    const listing = await page.request.get(`/api/admin/products/${product.id}/images`);
    const listed = (await listing.json()).items[0] as { url: string; storageKey?: string };
    expect(listed.url).toBe(`/api/catalog-images/${image.storageKey}`);
    expect(listed.storageKey).toBeUndefined();
    anonymous = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL });
    expect((await anonymous.get(listed.url)).status()).toBe(404);
    const privateImage = await page.request.get(listed.url);
    expect(privateImage.status()).toBe(200);
    expect(privateImage.headers()["cache-control"]).toContain("no-store");
    await db.product.update({ where: { id: product.id }, data: { status: "PUBLISHED" } });
    expect((await anonymous.get(listed.url)).status()).toBe(200);
    await db.product.update({ where: { id: product.id }, data: { status: "DRAFT" } });
    expect((await anonymous.get(listed.url)).status()).toBe(404);
    expect((await page.request.delete(`/api/admin/products/${product.id}/images/${image.id}`)).status()).toBe(200);
    const task = await db.storageDeletionTask.findUniqueOrThrow({ where: { storageKey: image.storageKey } });
    expect(task.completedAt).not.toBeNull();
    expect((await page.request.get(listed.url)).status()).toBe(404);
  } finally {
    await anonymous?.dispose();
    if (storageKey) await db.storageDeletionTask.deleteMany({ where: { storageKey } });
    await db.product.deleteMany({ where: { id: product.id } });
    await db.auditLog.deleteMany({ where: { actorId: user.id } });
    await db.user.deleteMany({ where: { id: user.id } });
    await db.$disconnect();
  }
});
