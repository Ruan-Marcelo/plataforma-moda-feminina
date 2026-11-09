const { chromium, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');
async function main() {
  const prisma = new PrismaClient();
  const browser = await chromium.launch();
  const results = [];
  try {
    fs.mkdirSync('.codex', { recursive: true });
    const product = await prisma.product.findFirstOrThrow({ where: { status: 'PUBLISHED', variants: { some: { available: true } } }, include: { variants: true } });
    const variant = product.variants.find(v => v.available);
    const base = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
    for (const width of [320,375,390,430,768,1024,1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.addInitScript(() => localStorage.setItem('moda-cookie-consent:v1', JSON.stringify({ necessary: true, analytics: false, marketing: false })));
      const page = await context.newPage();
      const routes = process.env.AUDIT_STATES_ONLY === 'true' ? [] : ['/', '/categorias', '/catalogo', `/produto/${product.slug}`, '/favoritos', `/provador?productId=${product.id}&variantId=${variant.id}`, '/login', '/contato', '/privacidade'];
      for (const path of routes) {
        const errors = [];
        const onError = error => errors.push(error.name);
        page.on('pageerror', onError);
        const response = await page.goto(base + path);
        await page.waitForLoadState('networkidle');
        const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth, elements: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }).slice(0,8).map(e => ({ tag: e.tagName, classes: e.className })) }));
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
        const row = { width, path: path.split('?')[0], status: response.status(), overflow: overflow.document > width, overflowDetails: overflow.document > width ? overflow : undefined, errors, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), incomplete: axe.incomplete.map(v => v.id) };
        results.push(row);
        console.log(JSON.stringify({ width, path: row.path, overflow: row.overflow, violations: row.violations.map(v => v.id), errors }));
        page.off('pageerror', onError);
      }
      const stateErrors = [];
      page.on('pageerror', error => stateErrors.push(error.name));
      let fittingRequests = 0;
      page.on('request', request => { if (new URL(request.url()).pathname === '/api/virtual-fitting') fittingRequests++; });
      async function inspectState(label) {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
        const row = { width, path: label, kind: 'interactive-state', status: 200, overflow, errors: stateErrors.splice(0), violations: axe.violations.map(v=>({ id:v.id, impact:v.impact, nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})) })), incomplete: axe.incomplete.map(v=>v.id) };
        results.push(row);
        console.log(JSON.stringify({width,path:label,overflow,violations:row.violations.map(v=>v.id)}));
      }
      await page.goto(base + '/');
      if (width < 1024) {
        await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
        await expect(page.getByRole('navigation',{name:'Navegação principal'})).toBeVisible();
        await inspectState('/#menu-open');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('button',{name:'Abrir menu',exact:true})).toBeFocused();
      }
      await page.getByRole('button',{name:'Preferências de cookies',exact:true}).click();
      await expect(page.getByRole('dialog',{name:'Privacidade e cookies',exact:true})).toBeVisible();
      await inspectState('/#cookie-dialog');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button',{name:'Preferências de cookies',exact:true})).toBeFocused();
      await page.goto(base + `/produto/${product.slug}`);
      await page.getByRole('button',{name:`Adicionar aos favoritos: ${product.name}`,exact:true}).click();
      await page.goto(base + '/favoritos');
      await expect(page.getByRole('heading',{name:product.name,exact:true})).toBeVisible();
      await inspectState('/favoritos#saved-piece');
      await page.getByRole('button',{name:'Limpar favoritos',exact:true}).click();
      await page.goto(base + `/provador?productId=${product.id}&variantId=${variant.id}`);
      await page.getByRole('button',{name:'Começar agora',exact:true}).click();
      await expect(page.getByRole('button',{name:'Continuar para fotografia',exact:true})).toBeVisible();
      await inspectState('/provador#selection');
      await page.getByRole('button',{name:'Continuar para fotografia',exact:true}).click();
      await page.getByLabel('Fotografia da galeria',{exact:true}).setInputFiles('public/brand/belin-logo.jpeg');
      await expect(page.getByRole('img',{name:'Pré-visualização da sua fotografia',exact:true})).toBeVisible();
      await inspectState('/provador#photo-preview');
      await page.getByRole('button',{name:'Continuar para autorização',exact:true}).click();
      await page.getByRole('checkbox',{name:/Li as informações de privacidade/}).check();
      await expect(page.getByRole('button',{name:'Gerar simulação',exact:true})).toBeDisabled();
      await inspectState('/provador#consent-disabled');
      if ([320,1440].includes(width)) await page.screenshot({path:`.codex/audit-consent-${width}.png`,fullPage:true});
      await page.getByRole('button',{name:'Cancelar e limpar fotografia',exact:true}).click();
      if (fittingRequests) throw new Error('Audit must never send a personal-photo processing request');
      await context.close();
    }
    if (results.some(row => row.overflow || row.errors.length || row.violations.length || row.status !== 200)) process.exitCode = 1;
  } finally { fs.writeFileSync(process.env.AUDIT_MATRIX_FILE || '.codex/audit-final.json', JSON.stringify(results,null,2)); await browser.close(); await prisma.$disconnect(); }
}
main().catch(error => { console.error(error.name); process.exitCode = 1; });
