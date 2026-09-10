/* Aperçu prêt-à-montrer pour les prospects NON-restaurant des 611 leads.
 *
 * Pourquoi : les 16 démos existantes sont des feeds de plats. Elles ne parlent
 * pas à un hôtel, un gîte, un institut ou un garage. Or le script d'appel dit
 * « je pars de vos propres photos ». Il faut donc, avant de décrocher, une page
 * qui montre LEURS photos remises en page — pas une image générée.
 *
 * Ce que fait ce script : il lit le site public que le lead déclare déjà dans
 * leads.json, en extrait les photos, les réduit, et compose une page statique.
 * Aucun texte n'est inventé : seuls le nom, la commune et l'URL du lead sont
 * écrits. Les libellés de la colonne « ce que je propose » sont génériques et
 * identiques pour tous — ils ne prétendent rien sur l'établissement.
 *
 * Coût : 0 token, 0 centime. Aucun appel à un modèle, aucun webhook.
 *
 * Un lead sans site, ou dont le site rend moins de MIN_PHOTOS images
 * exploitables, est SAUTÉ. Pas de page à moitié vide dans la main d'un prospect.
 *
 * Usage :  node apercus-secteurs.mjs heberg 12
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SECTEUR = process.argv[2] || 'heberg';
const COMBIEN = Number(process.argv[3] || 12);
const MIN_PHOTOS = 4;
const MAX_PHOTOS = 9;

const LEADS = '/work/previsualisation/appels/secteurs/leads.json';
const SORTIE = '/work/automationboost/apercu';          // public, automatisationboost.com/apercu/<id>/
const REGISTRE = '/work/previsualisation/appels/apercus.json';
const BASE_PUB = 'https://automatisationboost.com/apercu';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const REJET = /(logo|icone?|icon|sprite|favicon|pixel|spinner|loader|placeholder|avatar|flag|drapeau|badge|banner-?ad|wp-emoji|captcha)/i;

async function html(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'fr' }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return { texte: await r.text(), finale: r.url || url };
}

/* Les images sont prises dans l'ordre du document : la première grande image
   d'une page d'hôtel est presque toujours la photo d'ambiance. */
function candidates(h, base) {
  const out = [];
  const pousse = (u) => { if (u) out.push(u); };
  for (const m of h.matchAll(/property=["']og:image["'][^>]*content=["']([^"']+)["']/gi)) pousse(m[1]);
  for (const m of h.matchAll(/<img\b[^>]*>/gi)) {
    const t = m[0];
    const srcset = (t.match(/\bsrcset=["']([^"']+)["']/i) || [])[1];
    if (srcset) {
      /* on garde la plus large déclarée */
      const parts = srcset.split(',').map((s) => s.trim().split(/\s+/));
      parts.sort((a, b) => (parseInt(b[1]) || 0) - (parseInt(a[1]) || 0));
      pousse(parts[0] && parts[0][0]);
    }
    pousse((t.match(/\bdata-src=["']([^"']+)["']/i) || [])[1]);
    pousse((t.match(/\bsrc=["']([^"']+)["']/i) || [])[1]);
  }
  for (const m of h.matchAll(/url\(\s*["']?([^"')]+\.(?:jpe?g|png|webp))(?:\?[^"')]*)?["']?\s*\)/gi)) pousse(m[1]);

  const vus = new Set(); const abs = [];
  for (let u of out) {
    u = u.trim();
    if (!u || /^data:/i.test(u)) continue;
    if (REJET.test(u)) continue;
    let a; try { a = new URL(u, base).href; } catch { continue; }
    if (!/^https?:/i.test(a)) continue;
    if (vus.has(a)) continue;
    vus.add(a); abs.push(a);
  }
  return abs;
}

/* Réduction + contrôle des dimensions par Pillow : une vignette de 90 px
   étirée dans une grille se voit immédiatement et tue la démonstration. */
/* Renvoie l'empreinte perceptuelle de l'image retenue, ou null si rejetee. */
function traiter(brut, dest) {
  const py = `
import sys, io
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
try:
    im = Image.open(src)
    im.load()
except Exception as e:
    print("REJET illisible"); raise SystemExit(0)
w, h = im.size
if w < 600 or h < 400: print("REJET petite %dx%d" % (w, h)); raise SystemExit(0)
r = w / h
if r < 0.45 or r > 2.8: print("REJET ratio %.2f" % r); raise SystemExit(0)
# Un logo, un badge « destination d'excellence » ou un bandeau de texte a un
# fond plat et peu de couleurs. Mesure sur les photos deja produites : les
# vraies photos plafonnent a 0,39 de couleur dominante ; les badges montent a
# 0,64 avec moins de 45 teintes. On coupe entre les deux.
from collections import Counter
mini = im.convert("RGB").resize((32, 32), Image.LANCZOS)
q = Counter((r // 32, g // 32, b // 32) for r, g, b in mini.getdata())
dom = q.most_common(1)[0][1] / 1024.0
if dom >= 0.45 and len(q) < 45:
    print("REJET aplat %.2f/%d" % (dom, len(q))); raise SystemExit(0)
im = im.convert("RGB")
if w > 1080:
    im = im.resize((1080, round(h * 1080 / w)), Image.LANCZOS)
im.save(dst, "JPEG", quality=82, optimize=True)
# empreinte perceptuelle : deux tirages d'une meme photo (miniature + pleine
# taille) sont identiques a l'oeil mais differents octet pour octet.
g = im.convert("L").resize((8, 8), Image.LANCZOS)
px = list(g.getdata())
moy = sum(px) / 64.0
print("OK " + "".join("1" if v > moy else "0" for v in px))
`;
  const tmp = '/tmp/apercu-py.py';
  fs.writeFileSync(tmp, py);
  const res = execFileSync('python3', [tmp, brut, dest], { encoding: 'utf8' }).trim();
  return res.startsWith('OK') ? res.slice(3) : null;
}

/* Part de couleur dominante d'une image deja enregistree : sert a choisir la
   photo d'ouverture. Un bandeau-logo qui a passe le filtre (« Cote cannelle »,
   « Doudou ») reste plus plat qu'une vraie photo — il finit dans la grille,
   jamais en grand. */
function aplat(fichier) {
  const py = `
import sys
from collections import Counter
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB").resize((32, 32), Image.LANCZOS)
q = Counter((r // 32, g // 32, b // 32) for r, g, b in im.getdata())
print("%.4f" % (q.most_common(1)[0][1] / 1024.0))
`;
  fs.writeFileSync('/tmp/apercu-aplat.py', py);
  return Number(execFileSync('python3', ['/tmp/apercu-aplat.py', fichier], { encoding: 'utf8' }).trim());
}

/* La moins plate des photos : la seule vue en grand ne doit pas etre un logo. */
function heroDe(photos, doms) {
  if (!doms || doms.length !== photos.length) return photos[0];
  let hero = photos[0], min = Infinity;
  photos.forEach((f, k) => { if (doms[k] < min) { min = doms[k]; hero = f; } });
  return hero;
}

function page(lead, photos, source, hero) {
  const nom = esc(lead.nom);
  const lieu = (lead.commune || '').trim();
  /* Une derniere rangee incomplete se voit tout de suite : on coupe au
     multiple de trois plutot que de laisser un trou dans la grille. */
  const enGrille = photos.slice(0, Math.max(3, Math.floor(Math.min(photos.length, 9) / 3) * 3));
  const grille = enGrille.map((p, i) => `<div class="v" style="background-image:url(photos/${p})"${i === 0 ? ' id="v1"' : ''}></div>`).join('');
  return `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${nom} — aperçu préparé par Automation Boost</title>
<meta name="description" content="Aperçu de présentation pour ${nom}, composé à partir des photos de son propre site.">
<style>
:root{--bg:#0b0b0d;--carte:#141418;--trait:#26262c;--or:#f0a500;--doux:#9b9ba4;--txt:#f4f4f6}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--txt);font:400 16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:30px 16px 60px;display:flex;flex-direction:column;align-items:center}
.w{width:min(100%,470px)}
.sur{font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--doux);text-align:center}
h1{font-size:clamp(22px,5.4vw,30px);letter-spacing:-.02em;text-align:center;margin:8px 0 4px;text-wrap:balance}
.s{color:var(--doux);text-align:center;font-size:14.5px;margin-bottom:24px}
.story{position:relative;aspect-ratio:9/16;max-height:70vh;margin:0 auto 26px;border-radius:20px;overflow:hidden;border:1px solid var(--trait);background:#000;background-size:cover;background-position:center}
.story .bas{position:absolute;left:0;right:0;bottom:0;padding:60px 20px 22px;background:linear-gradient(to top,#000000ee,transparent)}
.story .bas b{display:block;font-size:22px;letter-spacing:-.02em;line-height:1.2}
.story .bas span{display:block;font-size:13px;color:#d6d6dd;margin-top:4px}
.story .tag{position:absolute;top:16px;left:16px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;background:#0b0b0dcc;border:1px solid var(--trait);border-radius:99px;padding:6px 11px;color:var(--or)}
.tel{background:var(--carte);border:1px solid var(--trait);border-radius:16px;overflow:hidden;margin-bottom:24px}
.tete{padding:15px;display:flex;gap:12px;align-items:center}
.pp{width:56px;height:56px;border-radius:50%;background-size:cover;background-position:center;flex:none;border:2px solid var(--or)}
.tid b{display:block;font-size:16.5px;letter-spacing:-.01em}
.tid span{font-size:13px;color:var(--doux)}
.gr{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.v{aspect-ratio:1;background-size:cover;background-position:center}
.bloc{background:var(--carte);border:1px solid var(--trait);border-radius:14px;padding:16px 17px;margin-bottom:14px}
.bloc h2{font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--or);margin-bottom:9px}
.bloc li{list-style:none;font-size:14.5px;color:#dcdce2;padding:5px 0 5px 16px;position:relative}
.bloc li:before{content:"";position:absolute;left:0;top:13px;width:6px;height:6px;border-radius:50%;background:var(--or)}
.bloc p{font-size:14px;color:var(--doux)}
.bloc a{color:#7fb2ff}
.cta{display:block;text-align:center;background:var(--or);color:#0b0b0d;font-weight:700;text-decoration:none;border-radius:12px;padding:14px;margin-top:6px}
footer{font-size:12px;color:var(--doux);text-align:center;margin-top:22px;line-height:1.7}
</style>
<div class="w">
<div class="sur">Aperçu préparé pour</div>
<h1>${nom}</h1>
<p class="s">${lieu ? esc(lieu) + ' · ' : ''}composé à partir des photos de votre site</p>

<div class="story" style="background-image:url(photos/${hero})">
  <div class="tag">format story · 9:16</div>
  <div class="bas"><b>${nom}</b>${lieu ? `<span>${esc(lieu)} — La Réunion</span>` : ''}</div>
</div>

<div class="tel">
  <div class="tete">
    <div class="pp" style="background-image:url(photos/${hero})"></div>
    <div class="tid"><b>${nom}</b><span>${lieu ? esc(lieu) : 'La Réunion'}</span></div>
  </div>
  <div class="gr">${grille}</div>
</div>

<div class="bloc">
  <h2>Ce que vous regardez</h2>
  <p>Vos propres photos, reprises telles quelles sur <a href="${esc(source)}" target="_blank" rel="noopener nofollow">votre site</a> et remises en page au format téléphone. Rien n'a été ajouté, rien n'a été retouché, aucun texte n'a été écrit à votre place.</p>
</div>

<div class="bloc">
  <h2>Ce que je propose</h2>
  <ul>
    <li>Une vidéo verticale de dix secondes à partir de ces mêmes photos</li>
    <li>Un jeu de publications prêtes à poster, à votre rythme</li>
    <li>Aucun tournage, aucun déplacement, rien à préparer de votre côté</li>
  </ul>
</div>

<footer>Automation Boost — Tony PAYET, La Réunion<br>Page privée, non référencée, faite pour vous être montrée. Photos issues de votre site public.</footer>
</div>
`;
}

/* Re-rendu du gabarit sur les apercus deja produits, sans un seul appel
   reseau : utile quand la mise en page change. `node apercus-secteurs.mjs --rerendre` */
if (process.argv[2] === '--rerendre') {
  const reg = JSON.parse(fs.readFileSync(REGISTRE, 'utf8'));
  const tousLeads = JSON.parse(fs.readFileSync(LEADS, 'utf8')).leads;
  for (const [id, a] of Object.entries(reg)) {
    const lead = tousLeads.find((l) => l.id === id);
    if (!lead) { console.log(`  ⊘ ${id} absent de leads.json`); continue; }
    const dossier = path.join(SORTIE, id);
    const ph = fs.readdirSync(path.join(dossier, 'photos')).filter((f) => f.endsWith('.jpg')).sort();
    const hero = heroDe(ph, ph.map((f) => aplat(path.join(dossier, 'photos', f))));
    fs.writeFileSync(path.join(dossier, 'index.html'), page(lead, ph, a.source, hero));
    a.hero = hero; a.photos = ph.length;
    console.log(`  ↻ ${lead.nom}`);
  }
  fs.writeFileSync(REGISTRE, JSON.stringify(reg, null, 1));
  sommaire(reg);
  process.exit(0);
}

/* ---- exécution ---- */
const tous = JSON.parse(fs.readFileSync(LEADS, 'utf8')).leads;
const cibles = tous.filter((l) => l.secteur === SECTEUR && (l.site || '').trim());
console.log(`  ${cibles.length} leads « ${SECTEUR} » avec un site déclaré — objectif ${COMBIEN} aperçus\n`);

fs.mkdirSync(SORTIE, { recursive: true });
const registre = fs.existsSync(REGISTRE) ? JSON.parse(fs.readFileSync(REGISTRE, 'utf8')) : {};
let faits = 0;

for (const lead of cibles) {
  if (faits >= COMBIEN) break;
  if (registre[lead.id]) { faits++; continue; }
  const dossier = path.join(SORTIE, lead.id);
  try {
    /* Certaines fiches portent le domaine nu : sans schema, fetch refuse. */
    const depart = /^https?:\/\//i.test(lead.site.trim()) ? lead.site.trim() : 'https://' + lead.site.trim();
    const { texte, finale } = await html(depart);
    const liste = candidates(texte, finale);
    if (!liste.length) { console.log(`  ⊘ ${lead.nom.padEnd(34)} aucune image dans la page`); continue; }

    fs.mkdirSync(path.join(dossier, 'photos'), { recursive: true });
    const gardees = []; const doms = []; const empreintes = new Set();
    for (const u of liste) {
      if (gardees.length >= MAX_PHOTOS) break;
      try {
        const r = await fetch(u, { headers: { 'User-Agent': UA, Referer: finale }, signal: AbortSignal.timeout(20000) });
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length < 9000) continue;
        const brut = '/tmp/apercu-brut.bin';
        fs.writeFileSync(brut, buf);
        const nomf = 'p' + String(gardees.length + 1).padStart(2, '0') + '.jpg';
        const cible = path.join(dossier, 'photos', nomf);
        const emp = traiter(brut, cible);
        if (!emp) continue;
        if (empreintes.has(emp)) { fs.rmSync(cible, { force: true }); continue; }
        empreintes.add(emp);
        gardees.push(nomf); doms.push(aplat(cible));
      } catch { /* image morte : on passe à la suivante */ }
    }

    if (gardees.length < MIN_PHOTOS) {
      fs.rmSync(dossier, { recursive: true, force: true });
      console.log(`  ⊘ ${lead.nom.padEnd(34)} ${gardees.length} photo(s) exploitable(s) — sauté`);
      continue;
    }

    const hero = heroDe(gardees, doms);
    fs.writeFileSync(path.join(dossier, 'index.html'), page(lead, gardees, depart, hero));
    registre[lead.id] = { nom: lead.nom, secteur: lead.secteur, url: `${BASE_PUB}/${lead.id}/`, photos: gardees.length, hero, source: depart, genere: new Date().toISOString().slice(0, 10) };
    faits++;
    console.log(`  ✅ ${lead.nom.padEnd(34)} ${gardees.length} photos`);
  } catch (e) {
    console.log(`  ⛔ ${lead.nom.padEnd(34)} ${e.message.slice(0, 50)}`);
  }
}

fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 1));
console.log(`\n  ${faits} aperçus au total dans le registre — ${REGISTRE}`);
sommaire(registre);

/* Sommaire prive : la liste de ce qui est deja pret, pour Tony seul.
   Chaque carte porte une photo du prospect, donc rien a inventer. */
function sommaire(registre) {
const cartes = Object.entries(registre).map(([id, a]) =>
  `<a class="c" href="${id}/"><span class="im" style="background-image:url(${id}/photos/${a.hero || 'p01.jpg'})"></span>`
  + `<span class="t">${esc(a.nom)}</span><span class="q">${a.photos} photos · ${esc(a.secteur)}</span></a>`).join('\n');
fs.writeFileSync(path.join(SORTIE, 'index.html'), `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Aperçus prêts — Automation Boost</title>
<style>
:root{--bg:#0b0b0d;--carte:#141418;--trait:#26262c;--or:#f0a500;--doux:#9b9ba4;--txt:#f4f4f6}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--txt);font:400 16px/1.6 system-ui,-apple-system,sans-serif;padding:32px 18px 70px}
.w{max-width:960px;margin:0 auto}
h1{font-size:clamp(24px,5vw,32px);letter-spacing:-.02em}
p.s{color:var(--doux);max-width:60ch;margin:10px 0 26px}
.g{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.c{display:block;background:var(--carte);border:1px solid var(--trait);border-radius:14px;overflow:hidden;text-decoration:none;color:inherit}
.c:hover{border-color:var(--or)}
.im{display:block;aspect-ratio:4/3;background-size:cover;background-position:center}
.t{display:block;padding:12px 14px 0;font-weight:700;letter-spacing:-.01em}
.q{display:block;padding:2px 14px 14px;font-size:13px;color:var(--doux)}
</style>
<div class="w">
<h1>${Object.keys(registre).length} aperçus prêts à montrer</h1>
<p class="s">Une page par prospect, composée avec ses propres photos publiques. À ouvrir pendant que le téléphone sonne. Pages privées, non référencées.</p>
<div class="g">
${cartes}
</div>
</div>
`);
console.log(`  sommaire : ${SORTIE}/index.html`);
}
