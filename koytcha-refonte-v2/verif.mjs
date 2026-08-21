// Vérifie les cinq corrections demandées sur la page, dans un vrai navigateur.
// Lire le CSS ne prouve rien : ce qui compte est ce que le moteur calcule
// après cascade, et c'est là que se logent les collisions de classes.
import pw from '/work/autoboost-neon-videos/autoboost-23-design/node_modules/playwright/index.js';
process.env.LD_LIBRARY_PATH = [
  '/home/claude/tools/chromelibs/usr/lib/x86_64-linux-gnu',
  '/home/claude/tools/chromelibs/lib/x86_64-linux-gnu',
].join(':');
process.env.FONTCONFIG_PATH = '/home/claude/tools/chromelibs/etc/fonts';

const url = 'file:///work/previsualisation/koytcha-refonte-v2/index.html';
const nav = await pw.chromium.launch({ args: ['--no-sandbox'] });
const pg = await nav.newPage({ viewport: { width: 1440, height: 900 } });
const erreurs = [];
pg.on('pageerror', (e) => erreurs.push(e.message));
await pg.goto(url, { waitUntil: 'load' });
await pg.waitForTimeout(1200);

const ordre = await pg.$$eval('section[id]', (s) => s.map((x) => x.id));
console.log('1. ordre des sections :', ordre.join(' → '));
console.log(ordre[0] === 'biens' && ordre[1] === 'programmes'
  ? '   ✓ biens est passé avant programmes' : '   ✗ permutation non appliquée');

// 5. le cercle qui éclate
await pg.evaluate(() => document.getElementById('eclat').scrollIntoView({ block: 'center' }));
await pg.waitForTimeout(700);
const avant = await pg.$$eval('.sat', (s) => s.map((x) => +getComputedStyle(x).opacity));
await pg.hover('#eclat');
await pg.waitForTimeout(1100);
const apres = await pg.$$eval('.sat', (s) => s.map((x) => ({
  op: +getComputedStyle(x).opacity,
  box: x.getBoundingClientRect().width | 0,
  tr: getComputedStyle(x).transform.slice(0, 40),
})));
const cerc = await pg.$eval('#cercle', (x) => getComputedStyle(x).transform.slice(0, 40));
console.log(`5. cercle éclaté : ${avant.length} satellites, opacité ${avant.join('/')} → ${apres.map((a) => a.op).join('/')}`);
console.log(`   .cercle au survol : ${cerc}`);
console.log(apres.every((a) => a.op > 0.9) && apres.every((a) => a.box > 80)
  ? '   ✓ les deux vues sortent et sont visibles' : '   ✗ satellites invisibles ou nuls');

// 3. philosophie au survol
const ph = await pg.$('#philosophie');
await pg.evaluate(() => document.getElementById('philosophie').scrollIntoView({ block: 'center' }));
await pg.waitForTimeout(500);
const vAvant = await pg.$eval('#philosophie .derriere', (x) =>
  +getComputedStyle(x, '::after').opacity);
await ph.hover();
await pg.waitForTimeout(1100);
const vApres = await pg.$eval('#philosophie .derriere', (x) =>
  +getComputedStyle(x, '::after').opacity);
const imgVis = await pg.$eval('#philosophie .derriere img', (x) => {
  const r = x.getBoundingClientRect();
  return { w: r.width | 0, h: r.height | 0, src: x.currentSrc.split('/').pop() };
});
console.log(`3. philosophie : voile ${vAvant} → ${vApres}   image ${imgVis.w}x${imgVis.h} (${imgVis.src})`);
console.log(vApres < vAvant && imgVis.w > 0 ? '   ✓ le fond se découvre au survol' : '   ✗ rien ne bouge');

// 4. galerie une à une
const retards = await pg.$$eval('.metier .gal figure', (f) => f.map((x) => ({
  d: getComputedStyle(x).transitionDelay, o: +getComputedStyle(x).opacity,
})));
console.log(`4. galerie métier : retards ${retards.map((r) => r.d).join(', ')}`);
console.log(new Set(retards.map((r) => r.d)).size === retards.length
  ? '   ✓ chaque image a son propre retard' : '   ✗ retards identiques → apparition groupée');

// 2. effet sur le rose
const anim = await pg.$eval('.final .teinte', (x) => getComputedStyle(x, '::after').animationName);
console.log(`2. dernière section : animation « ${anim} »`);
console.log(anim && anim !== 'none' ? '   ✓ balayage actif' : '   ✗ aucune animation');

// débordement + erreurs
for (const w of [390, 768, 1440]) {
  await pg.setViewportSize({ width: w, height: 844 });
  await pg.waitForTimeout(350);
  const d = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`   ${w}px · débordement ${d}px ${d <= 0 ? '✓' : '✗'}`);
}
console.log(erreurs.length ? `✗ erreurs JS : ${erreurs.join(' | ')}` : '✓ aucune erreur JS');
await nav.close();
