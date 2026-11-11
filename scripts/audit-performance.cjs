const { chromium } = require('@playwright/test');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('node:fs');
const path = require('node:path');

// Local laboratory measurements only: no telemetry is added to the shipped application.
async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });
  const browser = await chromium.launch();
  const results = [];
  const base = process.env.AUDIT_BASE_URL || 'http://localhost:3200';
  try {
    fs.mkdirSync('.codex', { recursive: true });
    const product = await db.product.findFirstOrThrow({ where: { status: 'PUBLISHED', variants: { some: { available: true } } } });
    const library = fs.readFileSync(path.resolve('node_modules/web-vitals/dist/web-vitals.iife.js'), 'utf8');
    for (const width of [390, 1440]) for (const route of ['/', '/catalogo', `/produto/${product.slug}`]) for (let sample = 1; sample <= 3; sample++) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const metrics = {};
      await context.exposeBinding('__reportAuditVital', (_source, metric) => { metrics[metric.name] = { value: metric.value, rating: metric.rating }; });
      await context.addInitScript({ content: library + `;for (const name of ['LCP','CLS','INP']) webVitals['on'+name](metric => window.__reportAuditVital({name:metric.name,value:metric.value,rating:metric.rating}), {reportAllChanges:true});` });
      await context.addInitScript(() => localStorage.setItem('moda-cookie-consent:v1', JSON.stringify({ necessary: true, analytics: false, marketing: false })));
      const page = await context.newPage();
      const session = await context.newCDPSession(page);
      await session.send('Network.setCacheDisabled', { cacheDisabled: true });
      await session.send('Emulation.setCPUThrottlingRate', { rate: width === 390 ? 4 : 1 });
      await page.goto(base + route);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
      const initialResources = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        return { requests: entries.length, jsEncodedBytes: entries.filter(e=>e.initiatorType === 'script').reduce((sum,e)=>sum+e.encodedBodySize,0), images: entries.filter(e=>e.initiatorType === 'img').length };
      });
      const preference = page.getByRole('button', { name: 'Preferências de cookies', exact: true });
      await preference.click();
      await page.keyboard.press('Escape');
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));
      const resources = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        return { requests: entries.length, jsEncodedBytes: entries.filter(e=>e.initiatorType === 'script').reduce((sum,e)=>sum+e.encodedBodySize,0), images: entries.filter(e=>e.initiatorType === 'img').length };
      });
      await page.goto('about:blank');
      const row = { width, route, sample, cpuSlowdown: width === 390 ? 4 : 1, metrics: { LCP: metrics.LCP || null, CLS: metrics.CLS || null, INP: metrics.INP || null }, initialResources, resources };
      results.push(row);
      console.log(JSON.stringify(row));
      await context.close();
    }
  } finally { fs.writeFileSync('.codex/performance-final.json', JSON.stringify(results, null, 2)); await browser.close(); await db.$disconnect(); }
}
main().catch(error => { console.error(error.name); process.exitCode = 1; });
