// Relève du site réel de L'Unisson. On ne DESSINE rien tant qu'on n'a pas
// le contenu authentique : nom, adresse, horaires, plats, images.
// Règle absolue : ne jamais inventer de contenu client.
import { chromium } from '/work/.agents/skills/playwright-skill/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const B = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await B.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
});
const p = await ctx.newPage();
const url = 'https://www.creperie-saintgeorges.re/creperie-saint-denis-reunion.html';
let statut = 0;
try {
  const r = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  statut = r ? r.status() : 0;
} catch (e) { console.log('  navigation : ' + e.message.slice(0, 120)); }
console.log(`  ${url} → HTTP ${statut}`);
await p.waitForTimeout(3500);

/* Faire défiler toute la page : les sites de restaurant chargent leurs
   photos en lazy-loading, une capture immédiate ne ramène que des vides. */
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 220));
  }
  window.scrollTo(0, 0);
});
await p.waitForTimeout(1500);

const releve = await p.evaluate(() => {
  const txt = (s) => [...document.querySelectorAll(s)].map((e) => e.innerText.trim()).filter(Boolean);
  const imgs = [...document.querySelectorAll('img')].map((i) => ({
    src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight,
    alt: (i.alt || '').trim(),
  })).filter((i) => i.src && i.src.startsWith('http'));
  const bgs = [...document.querySelectorAll('*')].map((e) => {
    const b = getComputedStyle(e).backgroundImage;
    const m = b && b.match(/url\("?(https?:[^")]+)"?\)/);
    return m ? m[1] : null;
  }).filter(Boolean);
  return {
    titre: document.title,
    description: (document.querySelector('meta[name=description]') || {}).content || '',
    h1: txt('h1'), h2: txt('h2'), h3: txt('h3'),
    liens: [...document.querySelectorAll('a')].map((a) => ({ t: a.innerText.trim(), h: a.href }))
      .filter((a) => a.t).slice(0, 60),
    tel: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.href),
    corps: document.body.innerText.replace(/\n{3,}/g, '\n\n').slice(0, 6000),
    images: imgs, fonds: [...new Set(bgs)],
    hauteur: document.body.scrollHeight,
  };
});
fs.writeFileSync('/work/previsualisation/client-creperie-saintgeorges/src/releve.json', JSON.stringify(releve, null, 1));
await p.screenshot({ path: '/work/previsualisation/client-creperie-saintgeorges/src/avant-pleine-page.jpg', fullPage: true, quality: 72, type: 'jpeg' });
await p.screenshot({ path: '/work/previsualisation/client-creperie-saintgeorges/src/avant-hero.jpg', quality: 80, type: 'jpeg' });
console.log(`  titre    : ${releve.titre}`);
console.log(`  hauteur  : ${releve.hauteur}px`);
console.log(`  images   : ${releve.images.length}  ·  fonds CSS : ${releve.fonds.length}`);
console.log(`  h1/h2/h3 : ${releve.h1.length}/${releve.h2.length}/${releve.h3.length}`);
await B.close();
