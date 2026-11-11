import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { createDatabaseClient } from "../../src/lib/db/client";
import { expect, test } from "@playwright/test";
import { favoritesStorageKey } from "../../src/features/favorites/contracts";
import { cookieConsentStorageKey } from "../../src/features/cookie-consent/consent";

const databaseUrl = process.env.E2E_DATABASE_URL;
test.skip(!databaseUrl, "Requires isolated local PostgreSQL; never writes to the store database.");
let prisma: PrismaClient;
let product: { id: string; slug: string; name: string };
let unavailable: { id: string; name: string };
let draft: { id: string; name: string };
const marker = randomUUID();
const ids: string[] = [];

test.beforeAll(async () => {
  if (!databaseUrl) return;
  const url = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^belin_product_e2e_[a-z0-9_]+$/.test(url.pathname.slice(1))) throw new Error("Unsafe test database");
  prisma = createDatabaseClient(databaseUrl);
  product = await prisma.product.create({ data: { name: `Favoritos & Bordô ${marker}`, slug: `favoritos-${marker}`, status: "PUBLISHED", variants: { create: { size: "M", color: "Bordô", available: true } } } }); ids.push(product.id);
  unavailable = await prisma.product.create({ data: { name: `Esgotada ${marker}`, slug: `esgotada-${marker}`, status: "PUBLISHED", variants: { create: { size: "P", color: "Preto", available: false } } } }); ids.push(unavailable.id);
  draft = await prisma.product.create({ data: { name: `Privada ${marker}`, slug: `privada-${marker}`, status: "DRAFT" } }); ids.push(draft.id);
});
test.afterAll(async () => { if (prisma) { await prisma.product.deleteMany({ where: { id: { in: ids } } }); await prisma.$disconnect(); } });
test.beforeEach(async ({ page, context }) => {
  await context.route("https://wa.me/**", route => route.abort());
  await context.route("https://instagram.com/**", route => route.abort());
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false, marketing: false })), cookieConsentStorageKey);
});

test("favorites persist across catalog, details and reload without duplicates", async ({ page }) => {
  await page.goto(`/catalogo?q=${encodeURIComponent(product.name)}`);
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: product.name, exact: true }) });
  await card.getByRole("button", { name: `Adicionar aos favoritos: ${product.name}`, exact: true }).click();
  await expect(card.getByRole("button", { name: `Remover dos favoritos: ${product.name}`, exact: true })).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("link").filter({ has: page.getByRole("heading", { name: product.name, exact: true }) }).click();
  await expect(page.getByRole("button", { name: `Remover dos favoritos: ${product.name}`, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: `Remover dos favoritos: ${product.name}`, exact: true })).toBeEnabled();
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), favoritesStorageKey);
  expect(stored).toEqual({ version: 1, ids: [product.id] });
  await page.goto("/favoritos");
  await expect(page.getByRole("heading", { name: product.name, exact: true })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: product.name, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Limpar favoritos", exact: true }).click();
  await expect(page.getByText("Você ainda não salvou peças.", { exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), favoritesStorageKey)).toBeNull();
});

test("removed/unpublished and unavailable pieces remain removable without revealing private data", async ({ page }) => {
  await page.addInitScript(({ key, values }) => localStorage.setItem(key, JSON.stringify({ version: 1, ids: values })), { key: favoritesStorageKey, values: [unavailable.id, draft.id] });
  await page.goto("/favoritos");
  await expect(page.getByRole("heading", { name: unavailable.name, exact: true })).toBeVisible();
  await expect(page.getByText("Indisponível no momento", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Peças fora do catálogo", exact: true })).toBeVisible();
  await expect(page.getByText(draft.name, { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Remover dos favoritos: Peça fora do catálogo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Peças fora do catálogo", exact: true })).toHaveCount(0);
});

test("malformed storage recovers and blocked storage keeps the interaction usable", async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, "not valid JSON"), favoritesStorageKey);
  await page.goto("/favoritos");
  await expect(page.getByText("Você ainda não salvou peças.", { exact: true })).toBeVisible();
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name: string, value: string) { if (name === key) throw new DOMException("Blocked", "QuotaExceededError"); return original.call(this, name, value); };
  }, favoritesStorageKey);
  await page.goto(`/produto/${product.slug}`);
  await page.getByRole("button", { name: `Adicionar aos favoritos: ${product.name}`, exact: true }).click();
  await expect(page.getByRole("button", { name: `Remover dos favoritos: ${product.name}`, exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status").filter({ hasText: "Não foi possível salvar" })).toBeVisible();
});

test("catalog outages preserve favorites and retry recovers", async ({ page }) => {
  await page.addInitScript(({ key, id }) => localStorage.setItem(key, JSON.stringify({ version: 1, ids: [id] })), { key: favoritesStorageKey, id: product.id });
  await page.route("**/api/favorites", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "catalog_unavailable" }) }));
  await page.goto("/favoritos");
  await expect(page.getByRole("alert").filter({ hasText: "Seus favoritos foram preservados" })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).ids, favoritesStorageKey)).toEqual([product.id]);
  await page.unroute("**/api/favorites");
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await expect(page.getByRole("heading", { name: product.name, exact: true })).toBeVisible();
});

test("favorites synchronize across browser tabs", async ({ page, context }) => {
  await page.goto(`/produto/${product.slug}`);
  const other = await context.newPage();
  await other.goto("/favoritos");
  await expect(other.getByText("Você ainda não salvou peças.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: `Adicionar aos favoritos: ${product.name}`, exact: true }).click();
  await expect(other.getByRole("heading", { name: product.name, exact: true })).toBeVisible();
  await other.getByRole("button", { name: `Remover dos favoritos: ${product.name}`, exact: true }).click();
  await expect(page.getByRole("button", { name: `Adicionar aos favoritos: ${product.name}`, exact: true })).toHaveAttribute("aria-pressed", "false");
  await other.close();
});

test("contact channels and catalog interest use configured data and encoded context", async ({ page, request }) => {
  await page.goto("/contato");
  await expect(page.getByRole("link", { name: "Instagram @usebelin", exact: true })).toHaveAttribute("href", "https://instagram.com/usebelin");
  const contact = page.getByRole("link", { name: "Conversar pelo WhatsApp", exact: true });
  await expect(contact).toBeVisible();
  expect(new URL((await contact.getAttribute("href"))!).hostname).toBe("wa.me");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto(`/catalogo?q=${encodeURIComponent(product.name)}`);
  const link = page.getByRole("link", { name: "Tenho interesse", exact: true });
  await expect(link).toHaveAttribute("href", `/api/products/${product.id}/interest`);
  const response = await request.get((await link.getAttribute("href"))!, { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  const text = new URL(response.headers().location).searchParams.get("text")!;
  expect(text).toContain(product.name);
  expect(text).toContain(product.slug);
  expect(text).not.toContain("tamanho:");
  expect(text).not.toContain("data:image");
});
