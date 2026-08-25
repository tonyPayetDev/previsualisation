/* Les médias des sites clients EN PRODUCTION répondent-ils ?
 *
 * `medias.mjs` couvre les maquettes de previsualisation. Personne n'avait
 * jamais vérifié les sites livrés et facturés, ceux qui tournent sous
 * *.automatisationboost.com. Or une image cassée sur le site d'un client
 * paye ne se signale nulle part : ni Coolify, ni le tableau de bord. Le
 * client la voit, lui — ou pire, ses propres clients.
 *
 * On part de la liste réelle des applications Coolify, pas d'une liste tenue
 * à la main qui se périme au premier déploiement.
 *
 * Pièges déjà payés, tenus ici :
 *  · cache-buster partout (Cloudflare garde les en-têtes 4 h) ;
 *  · GET avec Range plutôt que HEAD (des serveurs statiques répondent 405) ;
 *  · les URL absolues vers les domaines de Tony NE SONT PAS « externes ».
 */
import fs from 'node:fs';

const ATTENDU = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm',
  css: 'text/css', js: 'text/javascript', woff2: 'font/woff2',
};
const MIENS = /^https?:\/\/([a-z0-9-]+\.)*automatisationboost\.com\//i;
const MAX_MEDIAS = 20;          // au-delà, on mesure la même chose plus longtemps

const cb = (u) => u + (u.includes('?') ? '&' : '?') + 'cb=' + Date.now() + Math.random();

/* ── 1. La liste des sites vient de Coolify ────────────────────────────── */
/* Le jeton n est PAS dans /work/.deploy.env (qui ne porte que le PAT GitHub) :
   il vient de l environnement, alimenté par .claude/settings.json. Le lire au
   mauvais endroit donne un « jeton absent » trompeur. */
function reglages() {
  for (const f of ["/work/.claude/settings.json", "/work/.claude/settings.local.json"]) {
    try { const j = JSON.parse(fs.readFileSync(f, "utf8")); if (j.env && j.env.COOLIFY_ACCESS_TOKEN) return j.env; } catch {}
  }
  return {};
}
const R = reglages();
const TOKEN = process.env.COOLIFY_ACCESS_TOKEN || R.COOLIFY_ACCESS_TOKEN;
let BASE = (process.env.COOLIFY_BASE_URL || R.COOLIFY_BASE_URL || "http://158.220.127.234:8000").replace(/\/$/, "");
if (!/\/api\/v1$/.test(BASE)) BASE += "/api/v1";   // la variable porte l hôte nu

if (!TOKEN) { console.log("  jeton Coolify introuvable (ni env, ni settings.json)"); process.exit(0); }

const apps = await (await fetch(`${BASE}/applications`, {
  headers: { Authorization: `Bearer ${TOKEN}` }, signal: AbortSignal.timeout(40000),
})).json();

/* On ne garde que les vrais sites clients : un domaine propre, pas l'adresse
   de repli sslip.io, et pas les outils internes de Tony. */
/* Outils internes de Tony, à ne pas confondre avec les sites clients.
   ⚠️ Ne PAS mettre « automatisationboost\.com$ » ici : le motif n étant pas
   ancré au début, il correspond à TOUS les sous-domaines et vide la liste.
   Le domaine racine est déjà écarté juste au-dessus, par égalité exacte. */
const INTERNES = /^previsualisation\.|^tony\.|^videoboost\.|^facepuppet\.|^omniroute\.|^resto\./i;
const sites = [];
for (const a of apps) {
  for (const f of String(a.fqdn || '').split(',')) {
    const u = f.trim();
    if (!u || !MIENS.test(u + '/')) continue;
    const hote = u.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (hote === 'automatisationboost.com' || hote === 'www.automatisationboost.com') continue;
    if (INTERNES.test(hote)) continue;
    sites.push({ nom: a.name, url: 'https://' + hote, statut: a.status });
    break;
  }
}
console.log(`  ${sites.length} sites clients à vérifier\n`);

/* ── 2. Pour chacun : la page répond-elle, et ses médias ? ─────────────── */
const casse = [];
let totalMedias = 0;

for (const s of sites) {
  let html;
  try {
    const r = await fetch(cb(s.url), { signal: AbortSignal.timeout(25000), redirect: 'follow' });
    if (!r.ok) { console.log(`  ⛔ ${s.nom.padEnd(40)} page HTTP ${r.status}`); casse.push({ ...s, pb: `page HTTP ${r.status}` }); continue; }
    html = await r.text();
  } catch (e) { console.log(`  ⛔ ${s.nom.padEnd(40)} injoignable (${e.name})`); casse.push({ ...s, pb: `injoignable (${e.name})` }); continue; }

  const urls = new Set();
  for (const m of html.matchAll(/<(?:img|video|source|script)\b[^>]*?\bsrc=["']([^"']+)["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/<link\b[^>]*?\bhref=["']([^"']+\.(?:css|woff2?))["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+\.(?:jpg|jpeg|png|webp|gif|svg|avif|mp4))["']?\s*\)/gi)) urls.add(m[1]);

  const resoudre = (u) => {
    if (/^(data:|blob:|#|mailto:|tel:)/i.test(u)) return null;
    if (/^https?:/i.test(u)) return MIENS.test(u) ? u : null;
    if (u.startsWith('//')) return null;
    if (u.startsWith('/')) return s.url + u;
    return s.url + '/' + u;
  };

  const liste = [...urls].map(resoudre).filter(Boolean).slice(0, MAX_MEDIAS);
  let ko = 0;
  const defauts = [];
  for (const abs of liste) {
    totalMedias++;
    try {
      const r = await fetch(cb(abs), { headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(20000) });
      const ct = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const ext = (abs.split('?')[0].match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
      const att = ATTENDU[ext];
      if (r.status >= 400) { defauts.push(`HTTP ${r.status} — ${abs.slice(-70)}`); ko++; }
      else if (att && ct && ct !== att && !(ext === 'js' && /javascript|ecmascript/.test(ct))
               && !(ext === 'svg' && /xml|text/.test(ct))) {
        defauts.push(`type ${ct || '(vide)'} au lieu de ${att} — ${abs.slice(-60)}`); ko++;
      }
    } catch { defauts.push(`injoignable — ${abs.slice(-70)}`); ko++; }
  }
  console.log(`  ${ko ? '⚠️ ' : '✅'} ${s.nom.slice(0, 40).padEnd(42)} ${String(liste.length).padStart(2)} médias${ko ? `  · ${ko} en défaut` : ''}`);
  if (ko) casse.push({ ...s, defauts });
}

console.log(`\n  ${totalMedias} médias appelés sur ${sites.length} sites · ${casse.length} site(s) en défaut`);
if (casse.length) {
  console.log('');
  for (const c of casse) {
    console.log(`  ✗ ${c.nom}  (${c.url})`);
    if (c.pb) console.log(`      ${c.pb}`);
    (c.defauts || []).slice(0, 5).forEach((d) => console.log(`      ${d}`));
    if ((c.defauts || []).length > 5) console.log(`      … +${c.defauts.length - 5} autres`);
  }
}
fs.writeFileSync('/tmp/medias-clients.json', JSON.stringify(casse, null, 2));
