// Export only the rendered public presentation. No Next.js runtime or API data is shipped.
const { chromium } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const routes = {'/':'index.html','/catalogo':'catalogo.html','/categorias':'categorias.html','/favoritos':'favoritos.html','/contato':'contato.html','/privacidade':'privacidade.html','/provador':'provador.html','/produto/demo-blusa-bordo':'blusa.html','/produto/demo-saia-midi':'saia.html','/produto/demo-peca-indisponivel':'indisponivel.html'};
async function main(){
 const out=path.resolve('frontend-preview'); await fs.mkdir(path.join(out,'assets'),{recursive:true});
 for(const folder of ['brand','demo'])await fs.cp(path.join('public',folder),path.join(out,'assets',folder),{recursive:true});
 const browser=await chromium.launch();const css=new Map();
 try {const page=await browser.newPage();await page.addInitScript(()=>localStorage.setItem('moda-cookie-consent:v1',JSON.stringify({necessary:true,analytics:false,marketing:false})));
 for(const [route,file] of Object.entries(routes)){
 await page.goto('http://127.0.0.1:3000'+route,{waitUntil:'networkidle'});
 for(const url of await page.locator('link[rel="stylesheet"]').evaluateAll(nodes=>nodes.map(n=>n.href))){const key=url.split('?')[0];if(!css.has(key)){const name=`style-${css.size}.css`;const res=await page.request.get(url);if(!res.ok())throw Error('CSS unavailable');await fs.writeFile(path.join(out,'assets',name),await res.body());css.set(key,name);}}
 const html=await page.evaluate(({routes,css})=>{
 document.querySelectorAll('script,link[rel="preload"],link[rel="modulepreload"],link[rel="stylesheet"],nextjs-portal,meta[property^="og:"],link[rel="canonical"]').forEach(n=>n.remove());
 for(const name of css){const el=document.createElement('link');el.rel='stylesheet';el.href='assets/'+name;document.head.append(el);}
 const robots=document.createElement('meta');robots.name='robots';robots.content='noindex,nofollow';document.head.append(robots);
 for(const img of document.querySelectorAll('img')){let url=new URL(img.src);let src=url.searchParams.get('url')||url.pathname;if(src.startsWith('/brand/')||src.startsWith('/demo/'))img.src='assets'+src;else{img.removeAttribute('src');img.alt='Imagem indisponível nesta prévia';}img.removeAttribute('srcset');}
 for(const a of document.querySelectorAll('a[href]')){const href=a.getAttribute('href');if(href.startsWith('#'))continue;const u=new URL(href,location.href);if(u.origin===location.origin){a.href=routes[u.pathname]||'#preview-notice';}else if(!['https:','mailto:'].includes(u.protocol))a.removeAttribute('href');}
 for(const form of document.querySelectorAll('form')){form.removeAttribute('action');form.dataset.previewForm='true';}
 document.querySelectorAll('input[type="file"]').forEach(el=>el.disabled=true);
 const banner=document.createElement('aside');banner.id='preview-notice';banner.setAttribute('role','note');banner.style.cssText='padding:10px 16px;background:#86283f;color:white;text-align:center;font:12px/1.5 Arial';banner.textContent='PRÉVIA VISUAL · Produtos ilustrativos. Sem login, pedidos ou geração de IA.';document.body.prepend(banner);
 const status=document.createElement('p');status.id='preview-status';status.setAttribute('role','status');status.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:100;background:#fff;padding:16px;border:1px solid #86283f;border-radius:12px;display:none';document.body.append(status);
 const script=document.createElement('script');script.src='preview.js';script.defer=true;document.body.append(script);
 return '<!doctype html>\n'+document.documentElement.outerHTML;
 },{routes,css:[...css.values()]});
 await fs.writeFile(path.join(out,file),html,'utf8');
 }
 }finally{await browser.close();}
 await fs.writeFile(path.join(out,'.nojekyll'),'');
 console.log('Exported '+Object.keys(routes).length+' public HTML pages.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
