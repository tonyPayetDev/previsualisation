// Contrôle des correctifs v3 + du bloc image refait en v4, dans un vrai navigateur.
// Lire le CSS ne prouve rien : ce qui compte est ce que le moteur calcule
// après cascade — et deux des six correctifs (le masque du logo, la hauteur
// des sections en vh) ne se mesurent QUE sur une page rendue.
//
// À servir en HTTP, jamais en file:// : le `mask:url(...)` du logo est bloqué
// par la politique d'origine sur file://, et le brush disparaît alors sans la
// moindre erreur — faux négatif garanti.
//
//   node verif.mjs http://127.0.0.1:8834/koytcha-refonte-v4/
import pw from '/work/autoboost-neon-videos/autoboost-23-design/node_modules/playwright/index.js';
process.env.LD_LIBRARY_PATH = [
  '/home/claude/tools/chromelibs/usr/lib/x86_64-linux-gnu',
  '/home/claude/tools/chromelibs/lib/x86_64-linux-gnu',
].join(':');
process.env.FONTCONFIG_PATH = '/home/claude/tools/chromelibs/etc/fonts';

const url = process.argv[2] || 'https://previsualisation.automatisationboost.com/koytcha-refonte-v4/';
const ok = (b) => (b ? '✓' : '✗');
const nav = await pw.chromium.launch({ args: ['--no-sandbox'] });

// ── Ordinateur ────────────────────────────────────────────────────────────
const pg = await nav.newPage({ viewport: { width: 1280, height: 900 } });
const erreurs = [], reqKO = [];
pg.on('pageerror', (e) => erreurs.push(e.message));
pg.on('console', (m) => { if (m.type() === 'error') erreurs.push('console: ' + m.text()); });
pg.on('response', (r) => { if (r.status() >= 400) reqKO.push(r.status() + ' ' + r.url()); });
await pg.goto(url, { waitUntil: 'load' });
await pg.waitForTimeout(1500);

// 1. hauteur totale, et les deux sections qui pesaient 4 200 px à elles seules
const h = await pg.evaluate(() => ({
  total: document.documentElement.scrollHeight,
  vh: window.innerHeight,
  cine: Math.round(document.getElementById('cine').getBoundingClientRect().height),
  acc: Math.round(document.getElementById('accompagne').getBoundingClientRect().height),
}));
const ecrans = h.total / h.vh;
console.log(`1. hauteur ${h.total}px = ${ecrans.toFixed(2)} écrans (v2 : 11 427px / 12,70)`);
console.log(`   cine ${h.cine}px (v2 : 2 700) · accompagne ${h.acc}px (v2 : 1 403)`);
console.log(`   ${ok(ecrans < 9)} sous 9 écrans   ${ok(h.cine <= h.vh + 2)} cine tient dans un écran`);

// 1bis. l'effet de la cinématique est conservé : les chapitres tournent
const chapDe = () => pg.evaluate(() => [...document.querySelectorAll('#cine .chap')]
  .findIndex((c) => c.classList.contains('on')));
await pg.evaluate(() => document.getElementById('cine').scrollIntoView({ block: 'start' }));
await pg.waitForTimeout(1200);
const c0 = await chapDe();
await pg.waitForTimeout(6000);
const c1 = await chapDe();
await pg.click('#cine .jauge button:nth-child(3)');
await pg.waitForTimeout(1200);
const c2 = await chapDe();
console.log(`   chapitres ${c0} → ${c1} (temps) → ${c2} (clic jauge)   ${ok(c0 === 0 && c1 !== c0 && c2 === 2)}`);

// 2. le module de recherche sur ordinateur : plus gros, et à hauteur de regard
await pg.evaluate(() => window.scrollTo(0, 0));
await pg.waitForTimeout(700);
const f = await pg.evaluate(() => {
  const b = document.querySelector('.hero .boite').getBoundingClientRect();
  return { x: b.x | 0, y: b.y | 0, w: b.width | 0, h: b.height | 0, centre: (b.y + b.height / 2) / window.innerHeight };
});
console.log(`2. module ${f.w}×${f.h} à x=${f.x} · centre à ${(f.centre * 100).toFixed(0)}% de l'écran`);
console.log(`   ${ok(f.centre > .3 && f.centre < .7)} à hauteur de regard   ${ok(f.x > 640)} en colonne de droite`);

// 3. un seul bouton plein : le magenta ne doit rester que sur l'acheteur
const bt = await pg.evaluate(() => {
  const fond = (s) => getComputedStyle(document.querySelector(s)).backgroundColor;
  return { estim: fond('.nav .bt'), annonces: fond('.boite .bt') };
});
const plein = (c) => !/rgba\(0, 0, 0, 0\)|transparent/.test(c);
console.log(`3. « Estimation gratuite » ${bt.estim} · « Voir les annonces » ${bt.annonces}`);
console.log(`   ${ok(!plein(bt.estim) && plein(bt.annonces))} un seul rose plein, et c'est le parcours acheteur`);

// 4. un seul logo dans la philosophie — le filigrane était INCRUSTÉ dans la photo
const philo = await pg.evaluate(() => {
  const s = document.getElementById('philosophie');
  return {
    fond: s.querySelector('.derriere img').getAttribute('src'),
    brush: !!s.querySelector('.pinceau .fenetre'),
    posBrush: getComputedStyle(s.querySelector('.pinceau')).position,
  };
});
console.log(`4. fond « ${philo.fond} » · brush présent ${philo.brush} (${philo.posBrush})`);
console.log(`   ${ok(!/arrival/.test(philo.fond) && philo.brush)} photo recadrée sous le filigrane, brush conservé`);

// 5. trois chiffres, et aucun quatrième inventé
const ch = await pg.evaluate(() => [...document.querySelectorAll('#apropos .chiffre b')].map((b) => b.textContent.trim()));
console.log(`5. bande de chiffres : ${ch.join(' · ')}`);
console.log(`   ${ok(ch.length === 3 && !ch.some((t) => /Réunion/i.test(t)))} trois preuves chiffrées, pas de lieu, pas d'invention`);

// 6. plus d'aplat rose sur toute une section
const rose = await pg.evaluate(() => {
  const s = document.querySelector('.rose');
  return { voile: getComputedStyle(s, '::before').content, fond: getComputedStyle(s).backgroundColor };
});
console.log(`6. section « À propos » : fond ${rose.fond} · voile magenta ${rose.voile}`);
console.log(`   ${ok(rose.voile === 'none')} le grand dégradé pâle a disparu`);

// ── Débordement, erreurs, images, sur les deux formats ────────────────────
for (const [W, H] of [[1280, 900], [390, 844]]) {
  await pg.setViewportSize({ width: W, height: H });
  await pg.waitForTimeout(500);
  const total = await pg.evaluate(() => document.documentElement.scrollHeight);
  // Il faut vraiment parcourir la page : les images en `loading="lazy"` ne se
  // chargent pas tant qu'elles ne sont pas approchées, et les compter avant
  // ferait passer une page saine pour une page cassée.
  for (let y = 0; y < total; y += Math.floor(H * 0.7)) {
    await pg.evaluate((v) => window.scrollTo(0, v), y);
    await pg.waitForTimeout(400);
  }
  await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => ({
    deb: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ecr: +(document.documentElement.scrollHeight / window.innerHeight).toFixed(2),
    cassees: [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute('src')),
  }));
  console.log(`   ${W}×${H} · ${r.ecr} écrans · débordement ${r.deb}px ${ok(r.deb <= 0)} · images cassées ${r.cassees.length} ${ok(!r.cassees.length)}`);
  await pg.evaluate(() => window.scrollTo(0, 0));
}
console.log(`   erreurs JS/console ${erreurs.length} ${ok(!erreurs.length)}${erreurs.length ? ' → ' + erreurs.join(' | ') : ''}`);
console.log(`   réponses 4xx ${reqKO.length} ${ok(!reqKO.length)}${reqKO.length ? ' → ' + reqKO.join(' | ') : ''}`);
await nav.close();
