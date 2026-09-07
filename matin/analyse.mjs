#!/home/claude/tools/node/bin/node
// Le Matin — local analysis. Same maths as the n8n weekly report (stats.js).
// Usage: /home/claude/tools/node/bin/node /work/previsualisation/matin/analyse.mjs [--json] [--url URL]
import { analyserMatin } from './stats.js';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const urlIdx = args.indexOf('--url');
const URL_GET = urlIdx >= 0 ? args[urlIdx + 1] : 'https://n7n.automatisationboost.com/webhook/matin-journal';

const res = await fetch(URL_GET, { headers: { accept: 'application/json' } });
if (!res.ok) { console.error('GET ' + URL_GET + ' → HTTP ' + res.status); process.exit(1); }
const body = await res.json();
const rows = Array.isArray(body.rows) ? body.rows : [];
const s = analyserMatin(rows, new Date());

if (asJson) { console.log(JSON.stringify({ ...s, rows: undefined }, null, 2)); process.exit(0); }

const sg = v => v === null || v === undefined ? '  —' : ((v > 0 ? '+' : '') + v).padStart(4);
const pad = (v, n) => String(v === null || v === undefined ? '—' : v).padEnd(n);
const num = v => (v === null || v === undefined || v === '') ? null : Number(v);
const moy3 = (a, b, c) => { const xs = [a, b, c].map(num).filter(x => x !== null); return xs.length ? Math.round(xs.reduce((p, q) => p + q, 0) / xs.length * 10) / 10 : null; };

console.log('');
console.log('☀️  LE MATIN — analyse au ' + s.today + '  (' + s.n + ' séance' + (s.n > 1 ? 's' : '') + ' enregistrée' + (s.n > 1 ? 's' : '') + ')');
console.log('');
console.log('  date        heure  avant E/H/C   après E/H/C   Δ     prêt  étapes        action cash');
console.log('  ' + '-'.repeat(100));
for (const r of s.rows) {
  const av = moy3(r.energie_avant, r.humeur_avant, r.clarte_avant);
  const ap = moy3(r.energie_apres, r.humeur_apres, r.clarte_apres);
  const d = av !== null && ap !== null ? Math.round((ap - av) * 10) / 10 : null;
  console.log('  ' + pad(r.date, 11) + ' ' + pad(r.heure, 6) + ' ' +
    pad([r.energie_avant, r.humeur_avant, r.clarte_avant].map(x => x ?? '—').join('/'), 13) + ' ' +
    pad([r.energie_apres, r.humeur_apres, r.clarte_apres].map(x => x ?? '—').join('/'), 13) + ' ' +
    sg(d) + '  ' + pad(r.pret, 5) + ' ' + pad(r.etapes_faites, 13) + ' ' + String(r.action_cash || '').slice(0, 40));
}
console.log('');
console.log('  Séances sur 7 jours : ' + s.n7 + '/7   manquées : ' + s.manques7 + '   série en cours : ' + s.serie + ' jour' + (s.serie > 1 ? 's' : ''));
console.log('  Effet immédiat (après − avant) : énergie ' + sg(s.deltaMoy.energie) + '  humeur ' + sg(s.deltaMoy.humeur) + '  clarté ' + sg(s.deltaMoy.clarte) + '  global ' + sg(s.deltaGlobal));
console.log('  Prêt à attaquer (moyenne) : ' + (s.pretMoy ?? '—') + '/10');
console.log('  Niveau de base AVANT, pente par semaine : global ' + sg(s.penteSemaine.global) + '  énergie ' + sg(s.penteSemaine.energie) + '  humeur ' + sg(s.penteSemaine.humeur) + '  clarté ' + sg(s.penteSemaine.clarte));
console.log('  Moyenne avant ' + (s.avantMoy ?? '—') + '  →  après ' + (s.apresMoy ?? '—'));
console.log('');
console.log('  VERDICT : ' + s.verdict);
console.log('');
