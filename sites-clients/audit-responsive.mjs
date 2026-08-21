// Audit responsive des sites clients — les miens ET les leurs.
//
// Tony a posé la seule question qui compte : « est-ce qu'il y a une
// amélioration par rapport à avant ? » Y répondre à l'œil ne vaut rien.
// Ce script mesure les mêmes défauts, avec la même méthode, sur les deux
// côtés du comparateur, et laisse les chiffres trancher.
//
// Ce qu'on mesure, et pourquoi ce sont ceux-là :
//   · débordement horizontal à 390 px — LE défaut mobile. Le doigt balaie
//     latéralement, le texte sort de l'écran. Rien d'autre ne se remarque
//     aussi vite par un client sur son téléphone.
//   · balise viewport — absente, le mobile rend en 980 px puis dézoome :
//     tout le texte devient illisible. C'est binaire et c'est éliminatoire.
//   · boutons — on relève width/height/font-size bruts. Les seuils viennent
//     après, lus sur la distribution réelle : décider « trop gros » avant
//     d'avoir vu les chiffres, c'est inventer un défaut.
//   · cibles tactiles < 40 px et texte < 12 px — les deux plaintes qui
//     reviennent quand un site « marche » mais qu'on ne peut pas s'en servir.
//
// Usage :
//   node audit-responsive.mjs mes      → les sites publiés sur previsualisation
//   node audit-responsive.mjs avant    → les vrais sites actuels des clients
import fs from 'fs';
import path from 'path';
import pw from '/work/autoboost-neon-videos/autoboost-23-design/node_modules/playwright/index.js';
const { chromium } = pw;

process.env.LD_LIBRARY_PATH = [
  '/home/claude/tools/chromelibs/usr/lib/x86_64-linux-gnu',
  '/home/claude/tools/chromelibs/lib/x86_64-linux-gnu',
].join(':') + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
process.env.FONTCONFIG_PATH = '/home/claude/tools/chromelibs/etc/fonts';

const D = '/work/previsualisation/sites-clients';
// Ces fichiers vivaient dans /tmp, qui se vide : la galerie était
// irreproductible après un redémarrage. Rapatriés ici le 2026-08-21.
const DATA = path.join(D, 'data');
const cote = process.argv[2] === 'avant' ? 'avant' : 'mes';
const SORTIE = path.join(D, `audit-${cote}.json`);

const sites = JSON.parse(fs.readFileSync(path.join(DATA, 'sites.json'), 'utf8'));
const routes = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(DATA, 'capture-journal.json'), 'utf8')).map(j => [j.dir, j.route]));

let cibles;
if (cote === 'mes') {
  cibles = sites
    .filter(s => routes[s.dir])
    .map(s => ({ dir: s.dir, nom: s.nom, url: `https://previsualisation.automatisationboost.com/${routes[s.dir]}/` }));
} else {
  // Uniquement les domaines dont la capture « avant » a RÉUSSI : un domaine
  // mort n'a pas de responsive à auditer, et l'inclure fausserait la
  // comparaison en le comptant comme un site défaillant plutôt qu'absent.
  const av = JSON.parse(fs.readFileSync(path.join(DATA, 'avant-journal.json'), 'utf8'));
  const parDir = Object.fromEntries(sites.map(s => [s.dir, s.nom]));
  cibles = av.journal.filter(j => !j.err).map(j => ({ dir: j.dir, nom: parDir[j.dir] || j.dir, url: j.url }));
}

if (process.env.LIMITE) cibles = cibles.slice(0, Number(process.env.LIMITE));
console.log(`  ${cote} · ${cibles.length} sites à auditer`);

// --- La sonde, exécutée DANS la page -----------------------------------------
// Tout est mesuré sur les rectangles réels après rendu : un bouton peut être
// déclaré `padding: 1rem` et finir à 96 px de haut à cause d'un line-height
// hérité. Seul le rendu dit la vérité.
const sonde = () => {
  const vw = window.innerWidth;
  const de = document.documentElement;

  const meta = document.querySelector('meta[name="viewport"]');
  const contenu = meta ? (meta.getAttribute('content') || '') : '';

  // Débordement : on prend le max entre le document et le plus large des
  // éléments qui dépassent — un enfant peut déborder sans allonger le
  // scrollWidth si un parent a overflow:hidden, et le résultat visible est
  // quand même du contenu coupé.
  const debDoc = Math.max(0, de.scrollWidth - de.clientWidth, document.body.scrollWidth - vw);

  const coupables = [];
  const tous = document.querySelectorAll('body *');
  for (const el of tous) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 2 || r.left < -2) {
      const st = getComputedStyle(el);
      if (st.position === 'fixed' || st.visibility === 'hidden' || st.display === 'none') continue;
      coupables.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 40),
        depasse: Math.round(Math.max(r.right - vw, -r.left)),
        largeur: Math.round(r.width),
      });
    }
  }
  coupables.sort((a, b) => b.depasse - a.depasse);

  // Boutons : tout ce qu'un visiteur perçoit comme cliquable et coloré.
  const boutons = [];
  for (const el of document.querySelectorAll('button, a, [role="button"], input[type="submit"]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const st = getComputedStyle(el);
    const fond = st.backgroundColor;
    const plein = fond && fond !== 'rgba(0, 0, 0, 0)' && fond !== 'transparent';
    const borde = parseFloat(st.borderTopWidth) > 0;
    if (!plein && !borde) continue;           // un lien de texte n'est pas un bouton
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!txt) continue;
    boutons.push({
      texte: txt.slice(0, 30),
      l: Math.round(r.width), h: Math.round(r.height),
      police: Math.round(parseFloat(st.fontSize) * 10) / 10,
      partVw: Math.round(r.width / vw * 100),
    });
  }

  // Cibles tactiles trop petites : sous 40 px on rate la cible au doigt.
  const petites = boutons.filter(b => b.h < 40 || b.l < 40).length;

  // Texte trop petit : on ne regarde que les nœuds qui portent vraiment du
  // texte, sinon on compte les conteneurs vides et le chiffre ne veut rien dire.
  let minTexte = 99, nPetitTexte = 0;
  for (const el of document.querySelectorAll('p, li, span, td, div, a, h1, h2, h3, h4')) {
    const direct = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 12);
    if (!direct) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const fs2 = parseFloat(getComputedStyle(el).fontSize);
    if (fs2 < minTexte) minTexte = fs2;
    if (fs2 < 12) nPetitTexte++;
  }

  return {
    vw,
    viewportMeta: !!meta,
    viewportContenu: contenu,
    debordement: Math.round(debDoc),
    coupables: coupables.slice(0, 5),
    boutons,
    nBoutons: boutons.length,
    ciblesPetites: petites,
    texteMin: minTexte === 99 ? null : Math.round(minTexte * 10) / 10,
    nPetitTexte,
    hauteurPage: Math.round(de.scrollHeight),
  };
};

const nav = await chromium.launch({ args: ['--no-sandbox'] });
const resultats = [];
let n = 0;

for (const c of cibles) {
  n++;
  const ligne = { dir: c.dir, nom: c.nom, url: c.url };
  const ctx = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const pg = await ctx.newPage();
  try {
    await pg.goto(c.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pg.waitForTimeout(2000);
    ligne.tel = await pg.evaluate(sonde);
    // Bureau : un site peut être impeccable au téléphone et cassé en 1280.
    await pg.setViewportSize({ width: 1280, height: 900 });
    await pg.waitForTimeout(900);
    ligne.bureau = await pg.evaluate(sonde);
  } catch (e) {
    ligne.err = String(e.message || e).slice(0, 90);
  }
  await ctx.close();
  resultats.push(ligne);
  if (n % 10 === 0 || n === cibles.length) {
    const ko = resultats.filter(r => r.err).length;
    console.log(`  ${n}/${cibles.length} · ${ko} en échec`);
  }
}
await nav.close();

fs.writeFileSync(SORTIE, JSON.stringify(resultats, null, 1));
console.log(`  écrit ${SORTIE.replace(D, '')} · ${resultats.filter(r => !r.err).length} audités`);
