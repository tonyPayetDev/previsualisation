/* Les médias des maquettes répondent-ils, et avec le bon type ?
 *
 * Une route peut renvoyer 200 et n'afficher que des cadres vides : le code HTTP
 * de la page ne dit rien de ce qu'elle charge. Ce contrôle appelle donc chaque
 * média réellement référencé par les pages que Tony envoie à ses prospects.
 *
 * Deux défauts cherchés, et le second ne se voit pas à l'œil :
 *   · 404 / 403 — le fichier n'est pas là
 *   · type MIME faux — un .mp4 servi en `application/octet-stream` ne se lit
 *     PAS dans Safari iOS ni dans les navigateurs intégrés de WhatsApp et
 *     Instagram : le lecteur reste noir. Déjà payé deux fois, sur la vidéo de
 *     The Grill puis sur sept vidéos de prévisualisation le 25/08.
 *
 * Deux pièges de mesure, tous deux payés en écrivant ce fichier :
 *
 * 1. Ne PAS écarter les URL absolues comme « externes ». Les vidéos vivent sur
 *    `assets.automatisationboost.com` — le bucket R2 de Tony. Le premier jet
 *    les sautait et annonçait fièrement « 0 anomalie » sur 263 médias, en
 *    ayant ignoré les seuls fichiers qui comptaient.
 *
 * 2. Cache-buster OBLIGATOIRE, R2 compris. Cloudflare garde les en-têtes 4 h
 *    (`max-age=14400`). Sans lui, un type déjà corrigé ressort encore fautif
 *    et on rouvre un défaut réglé — ou pire, on « recorrige » à l'aveugle.
 */
import fs from 'node:fs';

const BASE = 'https://previsualisation.automatisationboost.com';
const AUTH = 'Basic ' + Buffer.from('tony:mGjmvScSTzjUySVBEcTJ').toString('base64');

/* Les routes viennent des tâches elles-mêmes : ce sont les liens que Tony
   envoie réellement, pas une liste tenue à part qui se périme. */
const j = JSON.parse(fs.readFileSync('/work/previsualisation/taches/taches.json', 'utf8'));
const routes = [...new Set((Array.isArray(j) ? j : (j.taches || []))
  .map((x) => x.lien).filter((l) => l && l.startsWith('/')))];

const ATTENDU = {
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav',
  css: 'text/css', js: 'text/javascript', woff2: 'font/woff2',
};

/* Les domaines de Tony, R2 inclus. Seuls les tiers sont écartés. */
const MIENS = /^https?:\/\/([a-z0-9-]+\.)*automatisationboost\.com\//i;

const resoudre = (u, route) => {
  if (/^(data:|blob:|#|mailto:|tel:)/i.test(u)) return null;
  if (/^https?:/i.test(u)) return MIENS.test(u) ? u : null;
  if (u.startsWith('//')) return MIENS.test('https:' + u) ? 'https:' + u : null;
  if (u.startsWith('/')) return BASE + u;
  return BASE + route.replace(/[^/]*$/, '') + u;
};

const cb = (u) => u + (u.includes('?') ? '&' : '?') + 'cb=' + Date.now() + Math.random();

const anomalies = [];
let total = 0;

for (const route of routes) {
  let html;
  try {
    const r = await fetch(cb(BASE + route), { headers: { Authorization: AUTH } });
    if (!r.ok) { console.log(`  ⚠️  ${route} → HTTP ${r.status}`); continue; }
    html = await r.text();
  } catch (e) { console.log(`  ⚠️  ${route} → ${e.message}`); continue; }

  const urls = new Set();
  for (const m of html.matchAll(/<(?:img|video|source|audio|script)\b[^>]*?\bsrc=["']([^"']+)["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/<(?:img|video)\b[^>]*?\bposter=["']([^"']+)["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/<link\b[^>]*?\bhref=["']([^"']+\.(?:css|woff2?))["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+\.(?:jpg|jpeg|png|webp|gif|svg|avif|mp4|woff2?))["']?\s*\)/gi)) urls.add(m[1]);

  const aTester = [...urls].map((u) => ({ brut: u, abs: resoudre(u, route) })).filter((x) => x.abs);
  let ko = 0;

  for (const { brut, abs } of aTester) {
    total++;
    try {
      /* GET avec Range plutôt que HEAD : des serveurs statiques répondent 405
         à HEAD, ce qui se lirait à tort comme un média cassé. */
      const h = { Range: 'bytes=0-1023' };
      if (abs.startsWith(BASE)) h.Authorization = AUTH;   // R2 refuserait l'auth
      const r = await fetch(cb(abs), { headers: h });
      const ct = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const ext = (abs.split('?')[0].match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
      const att = ATTENDU[ext];
      if (r.status >= 400) { anomalies.push({ route, brut, pb: `HTTP ${r.status}` }); ko++; }
      else if (att && ct && ct !== att && !(ext === 'js' && /javascript|ecmascript/.test(ct))) {
        anomalies.push({ route, brut, pb: `type ${ct || '(vide)'} au lieu de ${att}` }); ko++;
      }
    } catch (e) { anomalies.push({ route, brut, pb: e.message }); ko++; }
  }
  console.log(`  ${ko ? '⚠️ ' : '✅'} ${route.padEnd(48)} ${String(aTester.length).padStart(3)} médias${ko ? ` · ${ko} en défaut` : ''}`);
}

console.log(`\n  ${total} médias appelés sur ${routes.length} routes · ${anomalies.length} anomalies`);
if (anomalies.length) {
  console.log('');
  for (const a of anomalies) console.log(`  ✗ ${a.route}\n      ${a.brut}\n      → ${a.pb}`);
  console.log(`\n  Réparer un type MIME : retélécharger l'objet puis le renvoyer typé —`);
  console.log(`  curl -X POST -F "data=@f.mp4;type=video/mp4" \\`);
  console.log(`    "https://n7n.automatisationboost.com/webhook/upload-r2-asset?cle=<cle>"`);
}
