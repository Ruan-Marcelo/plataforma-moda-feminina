import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { PrismaClient } from "@prisma/client";
import { createDatabaseClient } from "../../src/lib/db/client";
import { expect, test, type Page, type Route } from "@playwright/test";
import { cookieConsentStorageKey } from "../../src/features/cookie-consent/consent";

const databaseUrl = process.env.E2E_DATABASE_URL;
const disabledMode = process.env.E2E_FITTING_ENABLED === "false";
test.skip(!databaseUrl, "Exige banco PostgreSQL temporário; nunca usa o banco da loja.");
test.describe.configure({ mode: "serial" });
let prisma: PrismaClient;
let productId: string;
let variantId: string;
let localProductId: string;
let localVariantId: string;
let fixture: Buffer;
let resultUrl: string;

test.beforeAll(async () => {
  if (!databaseUrl) return;
  const url = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^belin_product_e2e_[a-z0-9_]+$/.test(url.pathname.slice(1))) throw new Error("Use um banco de testes isolado belin_product_e2e_*");
  prisma = createDatabaseClient(databaseUrl);
  fixture = await readFile("public/brand/belin-logo.jpeg"); // Non-personal asset, never a customer's photograph.
  resultUrl = `data:image/jpeg;base64,${fixture.toString("base64")}`;
  const marker = randomUUID();
  const product = await prisma.product.create({ data: {
    name: "E2E — Peça para o provador", slug: `e2e-provador-${marker}`, status: "PUBLISHED",
    variants: { create: { color: "Bordô", size: "M", available: true } },
    images: { create: { url: "https://images.example.test/e2e-garment.jpg", alt: "Imagem de teste do contrato" } },
  }, include: { variants: true } });
  productId = product.id; variantId = product.variants[0].id;
  await prisma.productImage.updateMany({ where: { productId }, data: { storageKey: `products/${productId}/${randomUUID()}.jpg` } });
  const local = await prisma.product.create({ data: {
    name: "E2E — Ilustração local", slug: `e2e-local-${marker}`, status: "PUBLISHED",
    variants: { create: { color: "Preto", size: "P", available: true } },
    images: { create: { url: "/demo/blusa-frente.svg", alt: "Ilustração de teste" } },
  }, include: { variants: true } });
  localProductId = local.id; localVariantId = local.variants[0].id;
});

test.afterAll(async () => {
  if (!prisma) return;
  await prisma.product.deleteMany({ where: { id: { in: [productId, localProductId].filter(Boolean) } } });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false, marketing: false })), cookieConsentStorageKey);
  await page.route("https://images.example.test/**", route => route.fulfill({ contentType: "image/jpeg", body: fixture }));
  await page.route("https://cdn.fashn.ai/**", route => route.fulfill({ contentType: "image/jpeg", body: fixture }));
});

async function start(page: Page, local = false) {
  await page.goto(`/provador?productId=${local ? localProductId : productId}&variantId=${local ? localVariantId : variantId}`);
  await page.getByRole("button", { name: "Começar agora", exact: true }).click();
  await expect(page.getByRole("region", { name: "Peça selecionada", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continuar para fotografia", exact: true }).click();
}

async function choosePhoto(page: Page, camera = false) {
  await page.getByLabel(camera ? "Fotografia pela câmera" : "Fotografia da galeria", { exact: true }).setInputFiles({ name: "e2e-photo.jpeg", mimeType: "image/jpeg", buffer: fixture });
  await expect(page.getByRole("img", { name: "Pré-visualização da sua fotografia", exact: true })).toBeVisible();
}

async function authorize(page: Page) {
  await choosePhoto(page);
  await page.getByRole("button", { name: "Continuar para autorização", exact: true }).click();
  const consent = page.getByRole("checkbox", { name: /Li as informações de privacidade/ });
  await expect(consent).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Gerar simulação", exact: true })).toBeDisabled();
  await consent.check();
}

test("foto é local, formato/tamanho são validados, câmera é opcional e cancelamento limpa a sessão", async ({ page }) => {
  let submissions = 0;
  page.on("request", request => { if (request.url().includes("/api/virtual-fitting")) submissions += 1; });
  await start(page);
  const gallery = page.getByLabel("Fotografia da galeria", { exact: true });
  await gallery.setInputFiles({ name: "wrong.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not a jpeg") });
  await expect(page.getByRole("region", { name: "Experimentação virtual", exact: true }).getByRole("alert")).toContainText("JPG, PNG ou WebP");
  await gallery.setInputFiles({ name: "large.jpeg", mimeType: "image/jpeg", buffer: Buffer.alloc(8 * 1024 * 1024 + 1) });
  await expect(page.getByRole("region", { name: "Experimentação virtual", exact: true }).getByRole("alert")).toContainText("até 8 MB");
  expect(await page.getByLabel("Fotografia pela câmera", { exact: true }).getAttribute("capture")).toBe("user");
  await choosePhoto(page, true);
  const preview = await page.getByRole("img", { name: "Pré-visualização da sua fotografia", exact: true }).getAttribute("src");
  expect(preview).toMatch(/^blob:/);
  expect(submissions).toBe(0);
  await page.getByRole("button", { name: "Remover fotografia", exact: true }).click();
  await expect(page.locator("[data-fitting-status]")).toHaveAttribute("data-fitting-status", "cancelled");
  await expect(page.getByRole("img", { name: "Pré-visualização da sua fotografia", exact: true })).toHaveCount(0);
  expect(await page.evaluate(url => fetch(url!).then(() => false, () => true), preview)).toBe(true);
  await page.getByRole("button", { name: "Recomeçar", exact: true }).click();
  await expect(page.locator("[data-fitting-status]")).toHaveAttribute("data-fitting-status", "idle");
});

test("serviço desabilitado não envia a fotografia mesmo com autorização", async ({ page, request }) => {
  test.skip(!disabledMode, "Executado com serviço desabilitado no servidor de teste");
  let submissions = 0;
  page.on("request", value => { if (value.url().includes("/api/virtual-fitting")) submissions += 1; });
  await start(page);
  await authorize(page);
  await expect(page.getByRole("button", { name: "Gerar simulação", exact: true })).toBeDisabled();
  await expect(page.getByText(/Sua fotografia não será enviada/)).toBeVisible();
  expect(submissions).toBe(0);
  expect((await request.post("/api/virtual-fitting")).status()).toBe(503);
});

test("consentimento é obrigatório e perde validade ao substituir a fotografia", async ({ page }) => {
  test.skip(disabledMode);
  await start(page);
  await authorize(page);
  await expect(page.getByRole("button", { name: "Gerar simulação", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Rever fotografia", exact: true }).click();
  await choosePhoto(page);
  await page.getByRole("button", { name: "Continuar para autorização", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: /Li as informações de privacidade/ })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Gerar simulação", exact: true })).toBeDisabled();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("uma resposta de contrato válida exibe resultado e comparação; cliques repetidos enviam uma vez", async ({ page }) => {
  test.skip(disabledMode);
  let submissions = 0;
  let release: (() => void) | undefined;
  await page.route("**/api/virtual-fitting", async route => {
    submissions += 1;
    await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ status: 200, json: { resultUrl } });
  });
  await start(page);
  await authorize(page);
  await page.getByRole("button", { name: "Gerar simulação", exact: true }).click({ clickCount: 2 });
  await expect.poll(() => submissions).toBe(1);
  await expect(page.locator("[data-fitting-status]")).toHaveAttribute("data-fitting-status", /uploading|processing/);
  release?.();
  await expect(page.getByRole("heading", { name: "Sua simulação visual.", exact: true })).toBeVisible();
  await expect(page.locator("[data-fitting-status]")).toHaveAttribute("data-fitting-status", "completed");
  await page.getByRole("button", { name: "Lado a lado", exact: true }).click();
  await expect(page.getByRole("img", { name: "Sua fotografia original", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Simulação visual retornada pelo serviço", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Conversar com a loja", exact: true })).toHaveAttribute("href", `/api/products/${productId}/interest?variantId=${variantId}`);
  expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })) ).not.toContain("e2e-photo");
  await page.getByRole("button", { name: "Experimentar outra peça", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Qual peça você quer experimentar?", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Sua fotografia original", exact: true })).toHaveCount(0);
});

test("falhas permitem nova tentativa, e resposta inválida nunca vira resultado", async ({ page }) => {
  test.skip(disabledMode);
  let attempts = 0;
  await page.route("**/api/virtual-fitting", async route => {
    attempts += 1;
    if (attempts === 1) await route.abort("failed");
    else await route.fulfill({ status: 200, json: { resultUrl: "https://untrusted.example/fake.jpg" } });
  });
  await start(page);
  await authorize(page);
  await page.getByRole("button", { name: "Gerar simulação", exact: true }).click();
  await expect(page.getByRole("region", { name: "Experimentação virtual", exact: true }).getByRole("alert")).toContainText("Confira sua conexão");
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await expect(page.getByRole("region", { name: "Experimentação virtual", exact: true }).getByRole("alert")).toContainText("não retornou uma imagem válida");
  await expect(page.locator("[data-fitting-status]")).toHaveAttribute("data-fitting-status", "failed");
  await expect(page.getByRole("img", { name: "Simulação visual retornada pelo serviço", exact: true })).toHaveCount(0);
  expect(attempts).toBe(2);
});

test("cancelar uma solicitação impede uma conclusão tardia", async ({ page }) => {
  test.skip(disabledMode);
  let pendingRoute: Route | undefined;
  await page.route("**/api/virtual-fitting", route => { pendingRoute = route; });
  await start(page);
  await authorize(page);
  await page.getByRole("button", { name: "Gerar simulação", exact: true }).click();
  await expect.poll(() => Boolean(pendingRoute)).toBe(true);
  await page.getByRole("button", { name: "Cancelar envio e espera", exact: true }).click();
  await expect(page.locator("[data-fitting-status]")).toHaveAttribute("data-fitting-status", "cancelled");
  await pendingRoute?.fulfill({ status: 200, json: { resultUrl } }).catch(() => undefined);
  await expect(page.locator("[data-fitting-status]")).toHaveAttribute("data-fitting-status", "cancelled");
  await expect(page.getByRole("img", { name: "Simulação visual retornada pelo serviço", exact: true })).toHaveCount(0);
});

test("uma ilustração local não habilita geração real", async ({ page }) => {
  test.skip(disabledMode);
  await start(page, true);
  await authorize(page);
  await expect(page.getByText(/ilustrações de demonstração/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Gerar simulação", exact: true })).toBeDisabled();
});
