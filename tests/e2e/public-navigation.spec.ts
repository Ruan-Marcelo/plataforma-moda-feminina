// RUAN MARCELO RAMACIOTI LUZ
import { expect, test } from "@playwright/test";

test("home apresenta navegação pública e chamada para o catálogo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Você é essência, exale." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar catálogo" })).toHaveAttribute("href", "/catalogo");
  await expect(page.getByRole("link", { name: "Conhecer o provador virtual", exact: true })).toHaveAttribute("href", "/provador");
});

test("menu mobile abre e fecha com controle acessível", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Abrir menu" });
  await menuButton.click();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fechar menu" })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
});

test("catálogo sem banco não apresenta produtos inventados", async ({ page }) => {
  await page.goto("/catalogo");
  await expect(page.getByRole("heading", { name: "Peças selecionadas" })).toBeVisible();
  await expect(page.getByText("temporariamente indisponível")).toBeVisible();
});
