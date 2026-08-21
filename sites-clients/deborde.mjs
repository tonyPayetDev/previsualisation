// Trouve ce qui fait RÉELLEMENT défiler une page latéralement.
//
// La version naïve — lister les éléments dont le rectangle dépasse la
// fenêtre — donne surtout des faux positifs : une image agrandie de 5 % à
// l'intérieur d'un conteneur qui la rogne dépasse « à l'œil » mais n'entraîne
// aucun défilement. Sur La Casa Blanca, elle désignait cinq images du
// diaporama alors que le seul vrai coupable était ailleurs.
//
// Ici on remonte la chaîne des ancêtres : si l'un d'eux rogne (overflow autre
// que visible), l'élément est innocenté. Ce qui reste est la vraie cause.
//
//   node deborde.mjs <chemin ou url> [largeur...]
import pw from '/work/autoboost-neon-videos/autoboost-23-design/node_modules/playwright/index.js';
const { chromium } = pw;
process.env.LD_LIBRARY_PATH = [
  '/home/claude/tools/chromelibs/usr/lib/x86_64-linux-gnu',
  '/home/claude/tools/chromelibs/lib/x86_64-linux-gnu',
].join(':');
process.env.FONTCONFIG_PATH = '/home/claude/tools/chromelibs/etc/fonts';

const cible = process.argv[2];
const url = /^https?:/.test(cible) ? cible : 'file://' + cible;
const largeurs = process.argv.slice(3).map(Number).filter(Boolean);
const L = largeurs.length ? largeurs : [390, 768, 1440];

const nav = await chromium.launch({ args: ['--no-sandbox'] });
for (const w of L) {
  const pg = await nav.newPage({ viewport: { width: w, height: 844 } });
  try {
    await pg.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (_) { await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); }
  await pg.waitForTimeout(700);

  const r = await pg.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const total = document.documentElement.scrollWidth - vw;
    if (total <= 0) return { total, coupables: [] };

    const rogne = (el) => {
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const st = getComputedStyle(p);
        if (st.overflowX !== 'visible' || st.overflow !== 'visible') return true;
        // Un ancêtre transformé crée un nouveau contexte : on s'arrête là,
        // le débordement se règle à ce niveau, pas au-dessus.
        if (st.transform !== 'none') return false;
      }
      return false;
    };

    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) return;
      const depasse = Math.max(b.right - vw, -b.left);
      if (depasse < 1) return;
      const st = getComputedStyle(el);
      if (st.position === 'fixed' || st.visibility === 'hidden') return;
      if (rogne(el)) return;                 // un ancêtre le contient déjà
      out.push({
        sel: el.tagName.toLowerCase()
          + (el.id ? '#' + el.id : '')
          + (el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
        depasse: Math.round(depasse),
        largeur: Math.round(b.width),
        w: st.width, maxW: st.maxWidth, pos: st.position,
        tr: st.transform === 'none' ? '' : ' transformé',
      });
    });
    out.sort((a, b) => b.depasse - a.depasse);
    return { total, coupables: out.slice(0, 5) };
  });

  console.log(`  ${String(w).padStart(4)}px · la page déborde de ${r.total}px`
    + (r.total <= 0 ? '  ✓' : ''));
  r.coupables.forEach((c) => console.log(
    `        ${String(c.depasse + 'px').padStart(6)}  ${c.sel}  (larg ${c.largeur}, width ${c.w}, max ${c.maxW}, ${c.pos}${c.tr})`));
  if (r.total > 0 && !r.coupables.length) {
    console.log('        aucun élément non rogné ne dépasse — le défilement vient');
    console.log('        d\'une marge, d\'un `width:100vw` sous barre de défilement, ou de <html>/<body>');
  }
  await pg.close();
}
await nav.close();
