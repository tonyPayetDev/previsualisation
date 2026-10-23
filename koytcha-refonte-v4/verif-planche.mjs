// Contrôle du bloc image refait en v4 (« Notre histoire »).
// Il vérifie ce que la v3 ratait, PUIS il capture le bloc pour jugement à l'œil :
// aucune de ces mesures ne dit si c'est beau, elles disent seulement que les
// conditions du langage d'image validé sont réunies.
//
// À servir en HTTP, jamais en file:// : le mask:url() du logo (plus bas dans la
// page) est bloqué par la politique d'origine et disparaît sans erreur.
//
//   node verif-planche.mjs http://127.0.0.1:8834/koytcha-refonte-v4/
import pw from '/work/autoboost-neon-videos/autoboost-23-design/node_modules/playwright/index.js';
process.env.LD_LIBRARY_PATH = [
  '/home/claude/tools/chromelibs/usr/lib/x86_64-linux-gnu',
  '/home/claude/tools/chromelibs/lib/x86_64-linux-gnu',
].join(':');
process.env.FONTCONFIG_PATH = '/home/claude/tools/chromelibs/etc/fonts';

const url = process.argv[2] || 'https://previsualisation.automatisationboost.com/koytcha-refonte-v4/';
const dest = process.argv[3] || '/tmp/claude-1000/-work/23c29362-cb5a-467e-ac5e-5a3aced20058/scratchpad';
const ok = (b) => (b ? '✓' : '✗');
const nav = await pw.chromium.launch({ args: ['--no-sandbox'] });
const pg = await nav.newPage({ viewport: { width: 1280, height: 900 } });

const erreurs = [], reqKO = [];
pg.on('pageerror', (e) => erreurs.push(e.message));
pg.on('console', (m) => { if (m.type() === 'error') erreurs.push('console: ' + m.text()); });
pg.on('response', (r) => { if (r.status() >= 400) reqKO.push(r.status() + ' ' + r.url()); });

for (const [W, H] of [[390, 844], [1280, 900]]) {
  await pg.setViewportSize({ width: W, height: H });
  await pg.goto(url, { waitUntil: 'load' });
  await pg.waitForTimeout(1200);

  // Parcourir toute la page : les images en loading="lazy" ne se chargent pas
  // tant qu'on ne les a pas approchées, et les compter avant ferait passer une
  // page saine pour une page cassée.
  const total = await pg.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.floor(H * 0.7)) {
    await pg.evaluate((v) => window.scrollTo(0, v), y);
    await pg.waitForTimeout(350);
  }
  await pg.waitForTimeout(1200);

  const r = await pg.evaluate(() => {
    const p = document.getElementById('planche');
    const figs = [...p.querySelectorAll('figure')];
    const mesure = (f) => {
      const b = f.getBoundingClientRect();
      const im = f.querySelector('img');
      const cs = getComputedStyle(f);
      return {
        w: Math.round(b.width), h: Math.round(b.height),
        rayon: cs.borderRadius,
        ombre: cs.boxShadow,
        fit: getComputedStyle(im).objectFit,
        filtre: getComputedStyle(im).filter,
        // Un pseudo-élément posé sur l'image = un tracé par-dessus la photo.
        // C'est exactement ce qui barrait les disques de la v3.
        avant: getComputedStyle(f, '::before').content,
        apres: getComputedStyle(f, '::after').content,
        // Recadrage réel : la photo fait 3:2, le cadre aussi → zéro rognage.
        ratioCadre: +(b.width / b.height).toFixed(3),
        ratioPhoto: +(im.naturalWidth / im.naturalHeight).toFixed(3),
        nw: im.naturalWidth,
      };
    };
    // Chevauchement : deux figures ne doivent jamais se superposer.
    const boites = figs.map((f) => f.getBoundingClientRect());
    let chevauche = 0;
    for (let i = 0; i < boites.length; i++)
      for (let j = i + 1; j < boites.length; j++) {
        const a = boites[i], b = boites[j];
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) chevauche++;
      }
    return {
      figs: figs.map(mesure),
      chevauche,
      cercles: document.querySelectorAll('.cercle, .sat, .eclat').length,
      deb: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      cassees: [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute('src')),
      alts: figs.map((f) => f.querySelector('img').alt),
    };
  });

  console.log(`\n── ${W}×${H} ──────────────────────────────`);
  r.figs.forEach((f, i) => {
    console.log(`  vue ${i + 1} : ${f.w}×${f.h} · rayon ${f.rayon} · fit ${f.fit} · filtre ${f.filtre}`);
    console.log(`          cadre ${f.ratioCadre} / photo ${f.ratioPhoto} → rognage ${(Math.abs(f.ratioCadre - f.ratioPhoto) / f.ratioPhoto * 100).toFixed(1)}%`);
    console.log(`          ombre ${f.ombre}`);
    console.log(`          ${ok(f.rayon === '0px')} angles droits  ${ok(f.avant === 'none' && f.apres === 'none')} rien par-dessus  ${ok(f.filtre === 'none')} aucun filtre  ${ok(f.nw > 0)} image chargée`);
  });
  console.log(`  ${ok(!r.chevauche)} aucun chevauchement (${r.chevauche})   ${ok(!r.cercles)} plus aucun disque .cercle/.sat/.eclat (${r.cercles})`);
  console.log(`  ${ok(r.deb <= 0)} débordement ${r.deb}px   ${ok(!r.cassees.length)} images cassées ${r.cassees.length}`);
  console.log(`  alt : ${r.alts.map((a) => '« ' + a + ' »').join(' · ')}`);

  // Capture du bloc, à REGARDER — la mesure ne dit rien du rendu.
  await pg.evaluate(() => document.getElementById('apropos').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await pg.waitForTimeout(900);
  await pg.locator('#planche').screenshot({ path: `${dest}/v4-planche-${W}.png` });
  await pg.locator('#apropos').screenshot({ path: `${dest}/v4-apropos-${W}.png` });
}

console.log(`\n  erreurs JS/console ${erreurs.length} ${ok(!erreurs.length)}${erreurs.length ? ' → ' + erreurs.join(' | ') : ''}`);
console.log(`  réponses 4xx ${reqKO.length} ${ok(!reqKO.length)}${reqKO.length ? ' → ' + reqKO.join(' | ') : ''}`);
await nav.close();
