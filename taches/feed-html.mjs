/* Maquette de profil Instagram composée en HTML, puis capturée.
 *
 * Pourquoi ne pas la faire générer par un modèle d'images : mesuré le
 * 2026-08-25 sur six tirages, seuls deux respectaient la consigne. Les quatre
 * autres inventaient des prix, des horaires et des avis clients signés — sur
 * une image envoyée par email au commerçant lui-même, qui connaît ses prix.
 * La consigne était pourtant correcte (vérifiée dans les données d'exécution) :
 * c'est le générateur qui décroche sur les longues listes d'interdictions.
 *
 * Ici rien n'est généré, donc rien ne peut être inventé. On prend ce que le
 * scrapping a réellement ramené — nom, pseudo, bio, compteurs, photo de profil
 * et les neuf dernières publications — et on le remet en page. L'argument de
 * vente devient : « ce sont VOS photos, mieux présentées ».
 *
 * Coût : zéro crédit. Rendu identique à chaque passage.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/work/.agents/skills/playwright-skill/node_modules/playwright/index.mjs';

const L = 1080, H = 1920;

/* Les catégories des pastilles sont des libellés de FORMAT, pas des faits sur
   le commerce : elles décrivent le plan de contenu proposé. */
/* Six libellés courts : au-delà de ~11 caractères le texte est tronqué sous
   une pastille de 145 px. « NOUVEAUTÉS » débordait. */
const CATEGORIES = [
  { t: 'MENU', d: 'M4 6h16M4 12h16M4 18h10' },
  { t: 'SIGNATURE', d: 'M12 4l2.2 5.2L20 10l-4 3.6L17 20l-5-2.9L7 20l1-6.4L4 10l5.8-.8z' },
  { t: 'COULISSES', d: 'M4 18V8l5-3 5 3v10M9 18v-5h5v5M14 11h6v7h-6' },
  { t: 'ÉQUIPE', d: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M17 9a2.5 2.5 0 100-5M16 20c0-2.6 1.6-4.2 4-4.2' },
  { t: 'NOUVEAU', d: 'M12 4v16M4 12h16' },
  { t: 'AVIS', d: 'M12 4l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z' },
];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Les images du CDN Instagram sont intégrées en base64 : un lien direct peut
   être refusé au moment du rendu, et une vignette vide ruine la maquette. */
async function enBase64(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!r.ok) return null;
    const ct = (r.headers.get('content-type') || '').split(';')[0];
    if (!/^image\//.test(ct)) return null;
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 800) return null;
    return `data:${ct};base64,${b.toString('base64')}`;
  } catch { return null; }
}

const nombre = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace('.', ',') + ' k' : String(v);
};

export async function rendre(profil, sortie, palette = {}) {
  const {
    fond = '#FFFFFF', texte = '#111111', doux = '#8E8E8E',
    accent = '#1F2A24', ligne = '#DBDBDB',
  } = palette;

  const avatar = await enBase64(profil.profilePicUrlHD || profil.profilePicUrl || '');

  /* Neuf publications réelles, images seulement — on écarte les vidéos, dont
     l'URL rend un mp4 et non une image. */
  const brut = (profil.latestPosts || []).filter((p) => p && p.displayUrl);
  const vignettes = [];
  for (const p of brut) {
    if (vignettes.length >= 9) break;
    const d = await enBase64(p.displayUrl);
    if (d) vignettes.push(d);
  }

  const compte = {
    pub: nombre(profil.postsCount),
    abo: nombre(profil.followersCount),
    suit: nombre(profil.followsCount),
  };

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${L}px;height:${H}px;background:${fond};color:${texte};overflow:hidden;
    font-family:-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .barre{display:flex;align-items:center;gap:26px;padding:34px 34px 26px}
  .fleche{width:34px;height:34px;border-left:4px solid ${texte};border-bottom:4px solid ${texte};
    transform:rotate(45deg);margin-left:8px}
  .pseudo{font-size:40px;font-weight:700;letter-spacing:-.02em}
  .points{margin-left:auto;font-size:44px;letter-spacing:.08em;line-height:.5;color:${texte}}
  .profil{display:flex;align-items:center;gap:34px;padding:6px 34px 0}
  .av{width:190px;height:190px;border-radius:50%;object-fit:cover;flex:0 0 auto;
    border:3px solid ${ligne};background:${ligne}}
  .av.vide{display:flex;align-items:center;justify-content:center;font-size:64px;color:${doux};font-weight:600}
  .ident{min-width:0}
  .nom{font-size:44px;font-weight:700;letter-spacing:-.02em;line-height:1.15}
  .bio{font-size:30px;line-height:1.42;color:${texte};margin-top:10px;
    display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .chiffres{display:flex;justify-content:space-around;padding:34px 34px 30px;text-align:center}
  .chiffres b{display:block;font-size:38px;font-weight:700}
  .chiffres span{font-size:28px;color:${doux}}
  .chiffres .sans b{color:${doux};font-weight:500;font-size:30px}
  /* 6 pastilles doivent tenir dans 1080 - 68 de marge = 1012 px.
     6x145 + 5x22 = 980. Avec 150 px et 30 px d'écart on tombait à 1050 :
     la sixième sortait du cadre. */
  .pastilles{display:flex;gap:22px;padding:4px 34px 30px}
  .p{width:145px;text-align:center;flex:0 0 auto}
  .p i{display:block;width:145px;height:145px;border-radius:50%;border:3px solid ${ligne};
    background:${accent};opacity:.92;display:flex;align-items:center;justify-content:center}
  .p i svg{width:62px;height:62px;stroke:#fff;fill:none;stroke-width:1.8;opacity:.92}
  .p em{display:block;font-size:24px;font-style:normal;margin-top:12px;color:${texte};
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .onglets{display:flex;border-top:2px solid ${ligne};margin-top:4px}
  .onglets div{flex:1;height:96px;display:flex;align-items:center;justify-content:center}
  .onglets div:first-child{border-bottom:5px solid ${texte}}
  .gr{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:0}
  .gr img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}
  .gr .trou{width:100%;aspect-ratio:1/1;background:${ligne};opacity:.45}
  .ico{width:52px;height:52px;stroke:${texte};fill:none;stroke-width:5}
  </style></head><body>

  <div class="barre">
    <div class="fleche"></div>
    <div class="pseudo">${esc(profil.username || '')}</div>
    <div class="points">⋯</div>
  </div>

  <div class="profil">
    ${avatar ? `<img class="av" src="${avatar}" alt="">`
             : `<div class="av vide">${esc((profil.fullName || '?').trim().charAt(0).toUpperCase())}</div>`}
    <div class="ident">
      <div class="nom">${esc(profil.fullName || profil.username || '')}</div>
      ${profil.biography ? `<div class="bio">${esc(profil.biography)}</div>` : ''}
    </div>
  </div>

  <div class="chiffres">
    ${['pub', 'abo', 'suit'].map((k, i) => {
      const lib = ['publications', 'abonnés', 'suivi(e)s'][i];
      /* Un compteur absent s'affiche en libellé seul : jamais un chiffre inventé. */
      return compte[k]
        ? `<div><b>${compte[k]}</b><span>${lib}</span></div>`
        : `<div class="sans"><b>—</b><span>${lib}</span></div>`;
    }).join('')}
  </div>

  <div class="pastilles">
    ${CATEGORIES.map((c) => `<div class="p"><i><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="${c.d}"/></svg></i><em>${esc(c.t)}</em></div>`).join('')}
  </div>

  <div class="onglets">
    <div><svg class="ico" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg></div>
    <div><svg class="ico" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><polygon points="10,8 16,12 10,16"/></svg></div>
    <div><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="9" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg></div>
  </div>

  <div class="gr">
    ${Array.from({ length: 9 }, (_, i) => vignettes[i]
      ? `<img src="${vignettes[i]}" alt="">` : '<div class="trou"></div>').join('')}
  </div>
  </body></html>`;

  const nav = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await (await nav.newContext({ viewport: { width: L, height: H }, deviceScaleFactor: 1 })).newPage();
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(400);
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  await pg.screenshot({ path: sortie });
  await nav.close();

  return { vignettes: vignettes.length, avatar: !!avatar, compte };
}

/* Utilisation directe : node feed-html.mjs <profil.json> <sortie.png> */
if (process.argv[1] && process.argv[1].endsWith('feed-html.mjs') && process.argv[2]) {
  const profil = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const r = await rendre(profil, process.argv[3] || '/tmp/feed.png');
  console.log(`  ${r.vignettes}/9 vignettes réelles · avatar ${r.avatar ? 'oui' : 'non'}`);
  console.log(`  compteurs : ${JSON.stringify(r.compte)}`);
}
