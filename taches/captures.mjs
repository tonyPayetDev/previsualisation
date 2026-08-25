// Capture une vignette du site de chaque lead de la feuille d'appel.
//
// Pourquoi : avant de décrocher, Tony veut voir à quoi ressemble leur présence
// en ligne. Un site à l'abandon, ou une simple page Facebook, change ce qu'on
// dit au téléphone.
//
// On capture ce qui est PUBLIC et rien d'autre : la page d'accueil, en visiteur
// anonyme, sans compte et sans contourner quoi que ce soit. Les sites qui
// refusent la visite sont marqués comme tels — on ne triche pas pour y entrer.
import { chromium } from '/work/.agents/skills/playwright-skill/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const SRC = '/work/prospection-formation/restaurants-reunion-osm.json';
const OUT = '/work/previsualisation/appels/vignettes';
fs.mkdirSync(OUT, { recursive: true });

const CHAINES = /\b(mc ?donald|burger king|kfc|subway|domino|pizza hut|quick|starbucks|del arte|brioche dor|paul\b|o'?tacos|five guys|buffalo grill|la mie c[aâ]line|columbus caf|speed burger|g[ée]ant|carrefour|leader ?price|super ?u|casino|vapiano)\b/i;
const COEUR = ['Saint-Denis', 'Sainte-Marie', 'Sainte-Clotilde', 'Saint-Paul', 'Le Port', 'La Possession'];

const tous = JSON.parse(fs.readFileSync(SRC, 'utf8'))
  .filter((r) => r.telephone).filter((r) => !CHAINES.test(r.nom));
const dc = (r) => COEUR.some((c) => (r.commune || '').toLowerCase().includes(c.toLowerCase()));
const ech = tous.filter((r) => !r.site && !dc(r) && r.type === 'fast_food').slice(0, 3);
const vrais = tous.filter((r) => r.site && dc(r) && !ech.includes(r)).slice(0, 12);

const cle = (nom) => nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const nav = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const etat = {};

for (const r of vrais) {
  const k = cle(r.nom);
  const ctx = await nav.newContext({
    viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
  });
  const pg = await ctx.newPage();
  try {
    const rep = await pg.goto(r.site, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.waitForTimeout(2200);
    await pg.screenshot({ path: `${OUT}/${k}.jpg`, quality: 68, type: 'jpeg' });
    const txt = await pg.evaluate(() => (document.body.innerText || '').length);
    etat[k] = { ok: true, http: rep ? rep.status() : 0, texte: txt };
    console.log(`  ✓ ${r.nom.slice(0, 28).padEnd(28)} ${rep ? rep.status() : '?'} · ${txt} car.`);
  } catch (e) {
    etat[k] = { ok: false, erreur: String(e.message || e).slice(0, 60) };
    console.log(`  ✗ ${r.nom.slice(0, 28).padEnd(28)} ${etat[k].erreur}`);
  }
  await ctx.close();
}
await nav.close();

fs.writeFileSync(`${OUT}/etat.json`, JSON.stringify(etat, null, 1));
const ok = Object.values(etat).filter((x) => x.ok).length;
console.log(`\n  ${ok}/${vrais.length} sites capturés`);
