/* Rouvrir le robinet à leads restaurants, gratuitement.
 *
 * Le workflow C31 est mort depuis le 11/08 : son nœud Apify rend
 * « 403 Monthly usage hard limit exceeded ». Zéro nouveau prospect depuis.
 *
 * OSM ne peut PAS le remplacer tel quel — mesuré, pas supposé : sur les 1730
 * établissements de l'île, 10 % ont un site web, et les images qu'on y trouve
 * sont des LOGOS, pas des plats. Or l'aval de C31 demande « transforme cette
 * photo de plat en photo pro » : un logo n'y sert à rien. La chaîne vidéo
 * reste donc suspendue à Apify ou à une autre source de photos.
 *
 * Mais l'autre canal, lui, marche : OSM donne 474 numéros de téléphone
 * vérifiables. C'est de la matière à appeler dès demain, à coût nul.
 *
 * Deux pièges d'Overpass, tous deux payés en écrivant ceci :
 *  · `area["name"="Saint-Pierre"]` attrape PONTARLIER (Doubs) — le nom n'est
 *    pas unique en France. Et ajouter `area["ISO3166-1"="RE"]` puis filtrer
 *    par `(area.re)` ne corrige RIEN : on ne filtre pas une aire par une aire.
 *    Le résultat reste identique, ce qui ressemble à une confirmation.
 *    La parade qui marche est le cadre géographique de l'île.
 *  · sans en-tête `User-Agent`, le serveur rend un 406 qui ne ressemble pas
 *    à une erreur de requête.
 */
import fs from 'node:fs';
import path from 'node:path';

const BBOX = '-21.40,55.20,-20.85,55.85';          // La Réunion
const MIROIRS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const UA = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'AutomatisationBoost-leads/1.0 (tony.payet.professionnel@gmail.com)',
  Accept: 'application/json',
};

const Q = `[out:json][timeout:120];
(
  nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub|ice_cream)$"](${BBOX});
  nwr["shop"~"^(bakery|pastry|butcher|deli)$"](${BBOX});
);
out center tags;`;

let brut = null, miroir = null;
for (const m of MIROIRS) {
  try {
    const r = await fetch(m, { method: 'POST', body: 'data=' + encodeURIComponent(Q), headers: UA, signal: AbortSignal.timeout(150000) });
    const t = await r.text();
    if (t.trim().startsWith('{')) { brut = JSON.parse(t); miroir = m; break; }
    console.log(`  ~ ${m.split('/')[2]} : HTTP ${r.status}`);
  } catch (e) { console.log(`  ~ ${m.split('/')[2]} : ${e.name}`); }
}
if (!brut) { console.log('  ✗ aucun miroir Overpass ne répond'); process.exit(1); }
console.log(`  ${brut.elements.length} établissements · miroir ${miroir.split('/')[2]} · 0 €`);

/* Déjà clients : on ne prospecte pas quelqu'un qu'on a déjà livré. Les noms
   viennent des applications Coolify, pas d'une liste tenue à la main. */
const dejaClients = new Set();
try {
  const R = JSON.parse(fs.readFileSync('/work/.claude/settings.json', 'utf8')).env || {};
  const tok = process.env.COOLIFY_ACCESS_TOKEN || R.COOLIFY_ACCESS_TOKEN;
  let base = (process.env.COOLIFY_BASE_URL || R.COOLIFY_BASE_URL || '').replace(/\/$/, '');
  if (base && !/\/api\/v1$/.test(base)) base += '/api/v1';
  if (tok && base) {
    const apps = await (await fetch(`${base}/applications`, { headers: { Authorization: `Bearer ${tok}` }, signal: AbortSignal.timeout(30000) })).json();
    for (const a of apps) {
      const n = String(a.name || '').replace(/-(optimisation|seo|reunion|la-reunion|ile-de-la-reunion|ile-reunion|saint-\w+|v\d)$/gi, '')
        .replace(/-/g, ' ').trim().toLowerCase();
      if (n.length > 4) dejaClients.add(n);
    }
  }
} catch { /* best-effort : l'absence de cette liste ne doit pas bloquer */ }

/* Les maquettes livrées sur previsualisation ne sont pas des applications
   Coolify : sans elles, L'Unisson — un prospect à qui Tony a déjà envoyé un
   site — ressortait dans la liste des gens à démarcher. */
try {
  for (const d of fs.readdirSync("/work/previsualisation", { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const n = d.name.replace(/^client-/, "").replace(/-(scroll|optimisation|seo|reunion|la-reunion|ile-reunion|v\d)$/gi, "")
      .replace(/-/g, " ").trim().toLowerCase();
    if (n.length > 4) dejaClients.add(n);
  }
} catch {}

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

/* Le NOM d'enseigne ne suffit pas : OSM connaît la crêperie de Tony sous
   « La Saint Georges » alors que son dossier s'appelle
   `client-creperie-saintgeorges`. Aucun des deux ne contient l'autre, et elle
   ressortait donc dans la liste des gens à démarcher — alors qu'il lui a déjà
   envoyé un site.
   Le DOMAINE, lui, est un identifiant fiable : creperie-saintgeorges.re. */
const domaine = (url) => {
  if (!url) return '';
  try {
    const u = /^https?:/.test(url) ? url : 'https://' + url;
    return norm(new URL(u).hostname.replace(/^www\./, '').replace(/\.[a-z.]+$/, ''));
  } catch { return ''; }
};

const estClient = (nom, site) => {
  const n = norm(nom);
  const d = domaine(site);
  for (const c of dejaClients) {
    const k = norm(c);
    if (k.length <= 5) continue;
    if (n && (n.includes(k) || k.includes(n))) return true;
    if (d && (d.includes(k) || k.includes(d))) return true;
  }
  return false;
};

const vus = new Set();
const leads = [];
for (const e of brut.elements) {
  const t = e.tags || {};
  const tel = t.phone || t['contact:phone'] || t['contact:mobile'] || t.mobile;
  if (!tel) continue;                                   // sans numéro, rien à appeler
  const nom = String(t.name || '').trim();
  if (!nom) continue;
  const cle = norm(nom) + norm(tel);
  if (vus.has(cle)) continue;                           // OSM double parfois une enseigne
  vus.add(cle);
  leads.push({
    nom,
    tel: String(tel).replace(/\s+/g, ' ').trim(),
    genre: t.amenity || t.shop || '',
    ville: t['addr:city'] || t['addr:suburb'] || '',
    rue: [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '),
    site: t.website || t['contact:website'] || '',
    mail: t.email || t['contact:email'] || '',
    fb: t['contact:facebook'] || '',
    insta: t['contact:instagram'] || '',
    client: estClient(nom, t.website || t['contact:website'] || ''),
  });
}

const aAppeler = leads.filter((l) => !l.client);
const villes = {};
for (const l of aAppeler) { const v = l.ville || '(ville non renseignée)'; (villes[v] = villes[v] || []).push(l); }
/* Les communes nommées d'abord, par volume ; le lot sans ville en DERNIER.
   Trié par taille seule, le groupe « ville non renseignée » (le plus gros)
   passait en tête et enterrait les communes réellement exploitables. */
const SANS = "(ville non renseignée)";
const ordre = Object.entries(villes).sort((a, b) => {
  if (a[0] === SANS) return 1;
  if (b[0] === SANS) return -1;
  return b[1].length - a[1].length;
});

console.log(`  ${leads.length} avec un téléphone · ${leads.length - aAppeler.length} déjà clients écartés`);
console.log(`  → ${aAppeler.length} à appeler, dans ${ordre.length} communes`);
console.log(`  dont ${aAppeler.filter((l) => l.site).length} avec un site, ${aAppeler.filter((l) => l.mail).length} avec un email`);

/* ── La page ───────────────────────────────────────────────────────────── */
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telBrut = (t) => t.replace(/[^\d+]/g, '');

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Leads restaurants — OpenStreetMap</title>
<style>
:root{--noir:#0f1115;--carte:#171a21;--ligne:#262b36;--blanc:#eef1f6;--gris:#8b93a3;
      --vert:#3BC47D;--chaud:#F5A524}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--noir);color:var(--blanc);
  font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:20px 14px 70px}
.wrap{max-width:760px;margin:0 auto}
.sur{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gris)}
h1{font-size:clamp(25px,6vw,34px);line-height:1.08;font-weight:800;letter-spacing:-.03em;margin:8px 0 12px}
.intro{color:var(--gris);font-size:14.5px;line-height:1.7}
.intro b{color:var(--blanc)}
.compte{display:flex;gap:15px;flex-wrap:wrap;margin:16px 0 6px;padding:13px 15px;background:var(--carte);
  border:1px solid var(--ligne);border-radius:11px;font-size:12.5px;color:var(--gris)}
.compte b{display:block;color:var(--blanc);font-size:21px;line-height:1.2}
.compte .v b{color:var(--vert)}
h2{font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;
  margin:26px 0 8px;color:var(--chaud)}
.l{background:var(--carte);border:1px solid var(--ligne);border-radius:10px;
  padding:11px 13px;margin-bottom:7px}
.l .n{font-size:15.5px;font-weight:700}
.l .g{font-size:11.5px;color:var(--gris);text-transform:uppercase;letter-spacing:.08em}
.l .a{font-size:13px;color:var(--gris);margin-top:3px}
.act{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}
.act a{font-size:13px;text-decoration:none;border:1px solid var(--ligne);border-radius:7px;
  padding:6px 11px;color:var(--blanc)}
.act a.tel{border-color:rgba(59,196,125,.45);color:var(--vert)}
.pied{margin-top:26px;color:var(--gris);font-size:13px;line-height:1.7}
.pied b{color:var(--blanc)}
</style></head><body><div class="wrap">

<p class="sur">Prospection restaurants</p>
<h1>${aAppeler.length} restaurants à appeler</h1>
<p class="intro">Relevés dans <b>OpenStreetMap</b>, base publique et gratuite — aucun quota, aucune
clé. Chaque fiche porte un <b>numéro réel présent dans la base</b> : rien n'est deviné.
Les enseignes déjà clientes ont été écartées.</p>

<div class="compte">
  <span class="v"><b>${aAppeler.length}</b>à appeler</span>
  <span><b>${brut.elements.length}</b>établissements balayés</span>
  <span><b>${leads.length - aAppeler.length}</b>déjà clients, écartés</span>
  <span><b>${aAppeler.filter((l) => l.site).length}</b>avec un site</span>
  <span><b>${ordre.length}</b>communes</span>
</div>

<p class="intro" style="margin-top:14px">⚠️ <b>Pourquoi ceci et pas la reprise du workflow C31 :</b>
son nœud Apify rend « Monthly usage hard limit exceeded » depuis le 11/08. OSM ne peut pas le
remplacer tel quel — mesuré : 10 % des établissements ont un site, et les images qu'on y trouve
sont des <b>logos</b>, pas des plats. La chaîne vidéo reste donc suspendue. Le canal téléphone,
lui, n'a besoin d'aucune image.</p>

${ordre.map(([v, l]) => `
<h2>${esc(v)} — ${l.length}</h2>
${l.sort((a, b) => a.nom.localeCompare(b.nom)).map((x) => `  <div class="l">
    <div class="n">${esc(x.nom)}</div>
    <div class="g">${esc(x.genre)}</div>
    ${x.rue ? `<div class="a">${esc(x.rue)}</div>` : ''}
    <div class="act">
      <a class="tel" href="tel:${esc(telBrut(x.tel))}">${esc(x.tel)}</a>
      ${x.site ? `<a href="${esc(/^https?:/.test(x.site) ? x.site : 'https://' + x.site)}" target="_blank" rel="noopener">site</a>` : ''}
      ${x.mail ? `<a href="mailto:${esc(x.mail)}">email</a>` : ''}
      ${x.insta ? `<a href="https://instagram.com/${esc(x.insta.replace(/^@/, ''))}" target="_blank" rel="noopener">instagram</a>` : ''}
    </div>
  </div>`).join('\n')}`).join('\n')}

<p class="pied">Source : OpenStreetMap via Overpass (${esc(miroir.split('/')[2])}), contributeurs
OSM, licence ODbL. <b>Aucun numéro n'est inventé</b> : si la base n'en donne pas, la fiche
n'apparaît pas.<br>
Régénérer : <code>node previsualisation/taches/leads-osm.mjs</code><br>
Généré le ${new Date().toLocaleString('fr-FR', { timeZone: 'Indian/Reunion', dateStyle: 'short', timeStyle: 'short' })}.</p>
</div></body></html>`;

const R = '/work/previsualisation/leads-restaurants';
fs.mkdirSync(R, { recursive: true });
fs.writeFileSync(path.join(R, 'index.html'), html);
fs.writeFileSync(path.join(R, 'leads.json'), JSON.stringify(aAppeler, null, 2));
console.log(`  page écrite : ${R}/index.html`);
