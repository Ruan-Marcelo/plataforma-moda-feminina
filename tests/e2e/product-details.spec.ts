import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { cookieConsentStorageKey } from "../../src/features/cookie-consent/consent";

const databaseUrl = process.env.E2E_DATABASE_URL;
test.skip(!databaseUrl, "Requer PostgreSQL isolado em E2E_DATABASE_URL; não utiliza o banco da loja.");
test.describe.configure({ mode: "serial" });

let prisma: PrismaClient;
let product: { id: string; slug: string; name: string };
let soldOut: { id: string; slug: string };
let noVariants: { id: string; slug: string };
let draft: { id: string; slug: string };
let availableId: string;
let blackId: string;
let foreignId: string;
let categoryId: string;
let userId: string;
const productIds: string[] = [];
const marker = randomUUID();
const adminEmail = `admin-${marker}@example.test`;
const adminPassword = randomUUID();

test.beforeAll(async () => {
  if (!databaseUrl) return;
  const url = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^belin_product_e2e_[a-z0-9_]+$/.test(url.pathname.slice(1))) {
    throw new Error("Use somente um banco local dedicado belin_product_e2e_*. Não execute contra dados da loja.");
  }
  prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const category = await prisma.category.create({ data: { name: "Categoria E2E", slug: `e2e-${marker}` } });
  categoryId = category.id;
  product = await prisma.product.create({ data: {
    name: "E2E — Peça de demonstração", slug: `e2e-peca-${marker}`, status: "PUBLISHED", categoryId, priceCents: 15990,
    description: "Descrição completa de teste.\nSegunda linha preservada para verificar a apresentação.",
    variants: { create: [
      { color: "Bordô", colorHex: "#8D263B", size: "P", available: true },
      { color: "Bordô", colorHex: "#8D263B", size: "M", available: false },
      { color: "Preto", colorHex: "#202020", size: "M", available: true },
      { color: "Preto", colorHex: "#202020", size: "G", available: true },
      { color: "Nude", size: "G", available: false },
    ] },
    images: { create: [
      { url: "/demo/blusa-frente.svg", alt: "Frente — ilustração de teste", sortOrder: 0 },
      { url: "/demo/blusa-costas.svg", alt: "Costas — ilustração de teste", sortOrder: 1 },
    ] },
  } });
  productIds.push(product.id);
  const variants = await prisma.productVariant.findMany({ where: { productId: product.id } });
  availableId = variants.find(variant => variant.color === "Bordô" && variant.available)!.id;
  blackId = variants.find(variant => variant.color === "Preto" && variant.size === "M")!.id;
  const related = await prisma.product.create({ data: { name: "E2E — Peça relacionada", slug: `e2e-relacionada-${marker}`, status: "PUBLISHED", categoryId } });
  productIds.push(related.id);
  soldOut = await prisma.product.create({ data: { name: "E2E — Esgotada", slug: `e2e-esgotada-${marker}`, status: "PUBLISHED", variants: { create: { size: "M", color: "Preto", available: false } } } });
  productIds.push(soldOut.id);
  foreignId = (await prisma.productVariant.findFirstOrThrow({ where: { productId: soldOut.id } })).id;
  noVariants = await prisma.product.create({ data: { name: "E2E — Sem variantes", slug: `e2e-sem-variantes-${marker}`, status: "PUBLISHED" } });
  productIds.push(noVariants.id);
  draft = await prisma.product.create({ data: { name: "E2E — Rascunho privado", slug: `e2e-rascunho-${marker}`, status: "DRAFT" } });
  productIds.push(draft.id);
  userId = (await prisma.user.create({ data: { email: adminEmail, passwordHash: await hash(adminPassword, 12), role: "ADMIN" } })).id;
});

test.afterAll(async () => {
  if (!prisma) return;
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
  if (userId) await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  // Refuse optional cookies so the banner does not cover controls in this interaction test.
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false, marketing: false })), cookieConsentStorageKey);
});

test("galeria navega por controles, teclado e toque sem capturar rolagem vertical", async ({ page }) => {
  await page.goto(`/produto/${product.slug}`);
  const gallery = page.getByRole("region", { name: `Galeria de ${product.name}`, exact: true });
  await expect(gallery.getByText("Fotografia 1 de 2")).toBeVisible();
  await gallery.getByRole("button", { name: "Próxima imagem", exact: true }).click();
  await expect(gallery.getByRole("img", { name: "Costas — ilustração de teste", exact: true })).toBeVisible();
  await gallery.getByRole("button", { name: "Ver fotografia 1", exact: true }).click();
  const frame = gallery.locator('[tabindex="0"]');
  await frame.focus();
  await page.keyboard.press("ArrowRight");
  await expect(gallery.getByText("Fotografia 2 de 2")).toBeVisible();
  await page.keyboard.press("Home");
  async function swipe(endX: number, endY: number) {
    await frame.evaluate((target, end) => {
      const start = new Touch({ identifier: 1, target, clientX: 260, clientY: 120 });
      const finish = new Touch({ identifier: 1, target, clientX: end.x, clientY: end.y });
      target.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [start], changedTouches: [start] }));
      target.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [finish] }));
    }, { x: endX, y: endY });
  }
  await swipe(80, 125);
  await expect(gallery.getByText("Fotografia 2 de 2")).toBeVisible();
  await swipe(195, 350);
  await expect(gallery.getByText("Fotografia 2 de 2")).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("variantes respeitam combinações existentes e encaminham a escolha ao provador sem IA", async ({ page }) => {
  let fittingRequests = 0;
  page.on("request", request => { if (request.url().includes("/api/virtual-fitting")) fittingRequests += 1; });
  await page.goto(`/produto/${product.slug}`);
  const options = page.getByRole("region", { name: "Opções da peça", exact: true });
  await expect(options.getByRole("button", { name: "M — indisponível", exact: true })).toBeDisabled();
  await expect(options.getByRole("button", { name: "Nude — indisponível", exact: true })).toBeDisabled();
  await options.getByRole("button", { name: "Preto", exact: true }).click();
  await expect(options.getByRole("button", { name: "P — não existe nesta cor", exact: true })).toBeDisabled();
  await expect(options.getByRole("status")).toContainText("Disponível · Preto · M");
  await expect(options.getByRole("link", { name: "Experimentar virtualmente", exact: true })).toHaveAttribute("href", `/provador?productId=${product.id}&variantId=${blackId}`);
  await options.getByRole("link", { name: "Experimentar virtualmente", exact: true }).click();
  const selection = page.getByRole("region", { name: "Peça selecionada", exact: true });
  await expect(selection).toContainText(product.name);
  await expect(selection).toContainText("Preto");
  await expect(selection).toContainText("M");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  expect(fittingRequests).toBe(0);
});

test("preço, descrição, referência e relacionados refletem o cadastro e a configuração", async ({ page }) => {
  await page.goto(`/produto/${product.slug}`);
  await expect(page.getByText(`Referência: ${product.slug}`, { exact: true })).toBeVisible();
  await expect(page.getByText(/Segunda linha preservada/)).toBeVisible();
  if (process.env.E2E_SHOW_PRICES === "false") {
    await expect(page.getByLabel("Preço", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Preço sob consulta", { exact: true }).first()).toBeVisible();
  } else await expect(page.getByLabel("Preço", { exact: true })).toContainText("159,90");
  await expect(page.getByRole("list", { name: "Produtos relacionados", exact: true })).toContainText("E2E — Peça relacionada");
});

test("WhatsApp usa os dados atuais do banco e rejeita variantes trocadas ou indisponíveis", async ({ request }) => {
  const endpoint = `/api/products/${product.id}/interest`;
  const response = await request.get(`${endpoint}?variantId=${availableId}`, { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  const whatsapp = new URL(response.headers().location);
  expect(whatsapp.origin).toBe("https://wa.me");
  for (const value of [product.name, product.slug, availableId, "cor: Bordô", "tamanho: P"]) expect(whatsapp.searchParams.get("text")).toContain(value);
  expect((await request.get(`${endpoint}?variantId=invalid`, { maxRedirects: 0 })).status()).toBe(400);
  expect((await request.get(`${endpoint}?variantId=${availableId}&variantId=${blackId}`, { maxRedirects: 0 })).status()).toBe(400);
  const foreign = await request.get(`${endpoint}?variantId=${foreignId}`, { maxRedirects: 0 });
  expect(new URL(foreign.headers().location).pathname).toBe(`/produto/${product.slug}`);
  await prisma.productVariant.update({ where: { id: availableId }, data: { available: false } });
  try {
    const stale = await request.get(`${endpoint}?variantId=${availableId}`, { maxRedirects: 0 });
    expect(stale.status()).toBe(303);
    expect(new URL(stale.headers().location).searchParams.get("selection")).toBe("unavailable");
  } finally { await prisma.productVariant.update({ where: { id: availableId }, data: { available: true } }); }
});

test("peças esgotadas, sem variantes, rascunhos e parâmetros adulterados são tratados", async ({ page, request }) => {
  await page.goto(`/produto/${soldOut.slug}`);
  await expect(page.getByRole("button", { name: "Tenho interesse", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Experimentar virtualmente", exact: true })).toBeDisabled();
  await expect(page.getByText("Esta peça está indisponível no momento.", { exact: true })).toBeVisible();
  await expect(page.getByText("As fotografias desta peça ainda não foram cadastradas.", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Produtos relacionados", exact: true })).toHaveCount(0);
  await page.goto(`/produto/${noVariants.slug}`);
  await expect(page.getByText("Esta peça ainda não possui variantes cadastradas.", { exact: true })).toBeVisible();
  expect((await request.get(`/produto/${draft.slug}`)).status()).toBe(404);
  await page.goto(`/provador?productId=${product.id}&variantId=${foreignId}`);
  await expect(page.getByRole("heading", { name: "Seleção indisponível", exact: true })).toBeVisible();
  await page.goto(`/provador?productId=${product.id}&variantId=${availableId}&variantId=${blackId}`);
  await expect(page.getByRole("heading", { name: "Seleção indisponível", exact: true })).toBeVisible();
});

test("login encaminha o administrador diretamente ao painel", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(adminEmail);
  await page.getByLabel("Senha", { exact: true }).fill(adminPassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Painel da loja", exact: true })).toBeVisible();
});
