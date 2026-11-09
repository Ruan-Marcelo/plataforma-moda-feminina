import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { cookieConsentStorageKey } from "../../src/features/cookie-consent/consent";

const databaseUrl = process.env.E2E_DATABASE_URL;
test.skip(!databaseUrl, "Requires a dedicated local database, never the store database.");
let db: PrismaClient;
let userId: string;
let categoryId: string;
let product: { id: string; slug: string; name: string };
const suffix = randomUUID();
const email = `audit-${suffix}@example.test`;
const password = randomUUID();
test.beforeAll(async () => {
  if (!databaseUrl) return;
  const url = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^belin_product_e2e_[a-z0-9_]+$/.test(url.pathname.slice(1))) throw new Error("Unsafe database");
  db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  userId = (await db.user.create({ data: { email, role: "ADMIN", passwordHash: await hash(password, 12) } })).id;
  categoryId = (await db.category.create({ data: { name: "Categoria de auditoria", slug: `audit-${suffix}` } })).id;
  product = await db.product.create({ data: { name: `Auditoria ${suffix}`, slug: `audit-${suffix}`, categoryId, status: "PUBLISHED", variants: { create: [{ color: "Bordô", size: "M", available: true }] } } });
});
test.afterAll(async () => { if (!db) return; await db.product.deleteMany({ where: { id: product.id } }); await db.category.delete({ where: { id: categoryId } }); await db.auditLog.deleteMany({ where: { actorId: userId } }); await db.user.delete({ where: { id: userId } }); await db.$disconnect(); });
test.beforeEach(async ({ page }) => { await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false, marketing: false })), cookieConsentStorageKey); });

test("keyboard skip link, menu Escape, visible focus and native cookie dialog", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Pular para o conteúdo", exact: true });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#page-content")).toBeFocused();
  const menu = page.getByRole("button", { name: "Abrir menu", exact: true });
  await menu.focus(); await page.keyboard.press("Enter");
  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Catálogo", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused(); await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Preferências de cookies", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Privacidade e cookies", exact: true });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 6; i++) { await page.keyboard.press("Tab"); expect(await dialog.evaluate(element => document.activeElement === document.body || element.contains(document.activeElement))).toBe(true); }
  await dialog.getByRole("button", { name: "Recusar opcionais", exact: true }).focus();
  await menu.evaluate(element => element.focus());
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations).toEqual([]);
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Preferências de cookies", exact: true })).toBeFocused();
});

test("blocked cookie storage fails safely, optional cookies stay off", async ({ page }) => {
  await page.addInitScript(key => { const read = Storage.prototype.getItem; const write = Storage.prototype.setItem; Storage.prototype.getItem = function (name) { if (name === key) throw new DOMException("Blocked"); return read.call(this, name); }; Storage.prototype.setItem = function (name, value) { if (name === key) throw new DOMException("Blocked"); return write.call(this, name, value); }; }, cookieConsentStorageKey);
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Privacidade e cookies", exact: true });
  await expect(dialog).toContainText("Sua escolha valerá somente nesta página");
  await dialog.getByRole("button", { name: "Recusar opcionais", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Preferências de cookies · somente nesta página", exact: true })).toBeVisible();
});

test("search, category and availability filters query real persisted products", async ({ page }) => {
  await page.goto("/catalogo");
  await page.getByLabel("Buscar por nome", { exact: true }).fill(product.name);
  await page.getByRole("combobox", { name: "Categoria", exact: true }).selectOption(categoryId);
  await page.getByRole("combobox", { name: "Disponibilidade", exact: true }).selectOption("available");
  await page.getByRole("button", { name: /Aplicar/ }).click();
  await expect(page.getByRole("heading", { name: product.name, exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("categoryId")).toBe(categoryId);
  await page.getByLabel("Buscar por nome", { exact: true }).fill(`nenhum-${suffix}`);
  await page.getByRole("button", { name: /Aplicar/ }).click();
  await expect(page.getByRole("heading", { name: product.name, exact: true })).toHaveCount(0);
});

test("admin image upload, private draft access, export, and seven viewport widths", async ({ page, request }) => {
  expect((await request.get("/api/admin/products")).status()).toBe(401);
  await page.goto("/admin"); await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: product.name, exact: true }) });
  await card.getByLabel("Arquivo", { exact: true }).setInputFiles("public/brand/belin-logo.jpeg");
  await card.getByLabel("Texto alternativo", { exact: true }).fill("Imagem de auditoria sem dados pessoais");
  await card.getByRole("button", { name: "Enviar", exact: true }).click();
  const image = card.getByRole("img", { name: "Imagem de auditoria sem dados pessoais", exact: true });
  await expect(image).toBeVisible({ timeout: 15000 });
  const imageUrl = (await image.getAttribute("src"))!;
  expect((await request.get(imageUrl)).status()).toBe(200);
  await db.product.update({ where: { id: product.id }, data: { status: "DRAFT" } });
  expect((await request.get(imageUrl)).status()).toBe(404);
  expect((await page.request.get(imageUrl)).status()).toBe(200);
  for (const width of [320,375,390,430,768,1024,1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Admin overflow at ${width}`).toBe(true);
  }
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations).toEqual([]);
  const exportResponse = await page.request.get("/api/admin/analytics/export?days=7");
  expect(exportResponse.status()).toBe(200);
  page.once("dialog", dialog => dialog.accept());
  await card.getByRole("button", { name: "Excluir", exact: true }).first().click();
  await expect(image).toHaveCount(0);
  expect((await page.request.get(imageUrl)).status()).toBe(404);
  await db.product.update({ where: { id: product.id }, data: { status: "PUBLISHED" } });
});
