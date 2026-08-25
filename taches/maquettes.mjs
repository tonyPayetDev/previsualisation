/* Les 109 maquettes clientes répondent-elles, et affichent-elles quelque chose ?
 *
 * `medias.mjs` ne couvre que les ~22 routes citées dans taches.json. Or le
 * dossier en contient plus de cent : ce sont des liens que Tony peut envoyer à
 * n'importe quel prospect, à n'importe quel moment. Une maquette vide ou une
 * image morte dans la main d'un prospect coûte le rendez-vous, et rien ne le
 * signale — ni Coolify, ni le tableau de bord.
 *
 * Trois contrôles, du moins cher au plus cher :
 *   1. la route répond-elle ?
 *   2. la page a-t-elle un contenu réel (pas une coquille de 200 octets) ?
 *   3. ses médias répondent-ils, avec le bon type MIME ?
 *
 * Pièges tenus : cache-buster partout (Cloudflare garde 4 h), GET avec Range
 * plutôt que HEAD (405 sur certains serveurs statiques), et les URL absolues
 * vers assets.automatisationboost.com ne sont PAS « externes » — c'est le R2
 * de Tony, et c'est là que vivent les vidéos.
 */
import fs from 'node:fs';

const BASE = 'https://previsualisation.automatisationboost.com';
const AUTH = 'Basic ' + Buffer.from('tony:mGjmvScSTzjUySVBEcTJ').toString('base64');
const MIENS = /^https?:\/\/([a-z0-9-]+\.)*automatisationboost\.com\//i;
const ATTENDU = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm',
};
const MAX_MEDIAS = 12;

const cb = (u) => u + (u.includes('?') ? '&' : '?') + 'cb=' + Date.now() + Math.random();

const dossiers = fs.readdirSync('/work/previsualisation', { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^client-/.test(d.name))
  .map((d) => d.name)
  .filter((n) => fs.existsSync(`/work/previsualisation/${n}/index.html`))
  .sort();

console.log(`  ${dossiers.length} maquettes clientes à vérifier\n`);

const casse = [];
let totalMedias = 0, vides = 0;

for (const nom of dossiers) {
  const url = `${BASE}/${nom}/`;
  let html;
  try {
    const r = await fetch(cb(url), { headers: { Authorization: AUTH }, signal: AbortSignal.timeout(25000) });
    if (!r.ok) { casse.push({ nom, pb: `page HTTP ${r.status}` }); console.log(`  ⛔ ${nom.padEnd(46)} HTTP ${r.status}`); continue; }
    html = await r.text();
  } catch (e) { casse.push({ nom, pb: `injoignable (${e.name})` }); console.log(`  ⛔ ${nom.padEnd(46)} ${e.name}`); continue; }

  /* Une page de moins de 1 500 octets n'est pas une maquette : c'est une
     coquille. On le signale plutôt que de compter un faux succès. */
  if (html.length < 1500) {
    vides++;
    casse.push({ nom, pb: `page quasi vide (${html.length} octets)` });
    console.log(`  ⚠️  ${nom.padEnd(46)} page quasi vide (${html.length} o)`);
    continue;
  }

  const urls = new Set();
  for (const m of html.matchAll(/<(?:img|video|source)\b[^>]*?\bsrc=["']([^"']+)["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/<(?:img|video)\b[^>]*?\bposter=["']([^"']+)["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+\.(?:jpg|jpeg|png|webp|gif|svg|avif|mp4))["']?\s*\)/gi)) urls.add(m[1]);

  const resoudre = (u) => {
    if (/^(data:|blob:|#|mailto:|tel:)/i.test(u)) return null;
    if (/^https?:/i.test(u)) return MIENS.test(u) ? u : null;
    if (u.startsWith('//')) return null;
    if (u.startsWith('/')) return BASE + u;
    return `${BASE}/${nom}/` + u;
  };

  const liste = [...urls].map(resoudre).filter(Boolean).slice(0, MAX_MEDIAS);
  const defauts = [];
  for (const abs of liste) {
    totalMedias++;
    try {
      const h = { Range: 'bytes=0-1023' };
      if (abs.startsWith(BASE)) h.Authorization = AUTH;   // R2 refuserait l'auth
      const r = await fetch(cb(abs), { headers: h, signal: AbortSignal.timeout(20000) });
      const ct = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const ext = (abs.split('?')[0].match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
      const att = ATTENDU[ext];
      if (r.status >= 400) defauts.push(`HTTP ${r.status} — ${abs.slice(-64)}`);
      else if (att && ct && ct !== att && !(ext === 'svg' && /xml|text/.test(ct))) {
        defauts.push(`type ${ct || '(vide)'} au lieu de ${att} — ${abs.slice(-56)}`);
      }
    } catch { defauts.push(`injoignable — ${abs.slice(-64)}`); }
  }
  if (defauts.length) {
    casse.push({ nom, defauts });
    console.log(`  ⚠️  ${nom.padEnd(46)} ${String(liste.length).padStart(2)} médias · ${defauts.length} en défaut`);
  } else {
    console.log(`  ✅ ${nom.padEnd(46)} ${String(liste.length).padStart(2)} médias`);
  }
}

console.log(`\n  ${dossiers.length} maquettes · ${totalMedias} médias appelés · ${casse.length} en défaut`);
if (casse.length) {
  console.log('');
  for (const c of casse) {
    console.log(`  ✗ ${c.nom}`);
    if (c.pb) console.log(`      ${c.pb}`);
    (c.defauts || []).slice(0, 4).forEach((d) => console.log(`      ${d}`));
    if ((c.defauts || []).length > 4) console.log(`      … +${c.defauts.length - 4} autres`);
  }
}
fs.writeFileSync('/tmp/maquettes.json', JSON.stringify(casse, null, 2));
