/* Sort de l'onglet Sortie2 les leads QUALIFIÉS jamais contactés, au format que
 * lit déjà la feuille d'appel.
 *
 * Pourquoi ils valent mieux que la source OSM : ils portent un Lead Score, une
 * note Google, un nombre d'avis et un site web — de quoi ouvrir un appel avec
 * autre chose que « bonjour, je vends des vidéos ». Et 59 d'entre eux n'ont
 * jamais été contactés, ni par mail ni par SMS.
 *
 * Entrée : le dump du Sheet lu via le connecteur Drive.
 * Sortie : leads-qualifies-sheet.json
 */
import fs from 'node:fs';
import path from 'node:path';

const DUMP = process.argv[2];
if (!DUMP || !fs.existsSync(DUMP)) {
  console.error('usage: extraire-sortie2.mjs <dump-drive.txt>');
  process.exit(1);
}
const lignes = JSON.parse(fs.readFileSync(DUMP, 'utf8')).fileContent.split('\n');
const cells = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.replace(/\\/g, '').trim());

const iEntete = lignes.findIndex((l) => /\|\s*Lead Score\s*\|/.test(l));
if (iEntete === -1) { console.error('en-tête Sortie2 introuvable'); process.exit(1); }
const cols = cells(lignes[iEntete]);

const leads = [];
for (let i = iEntete + 1; i < lignes.length; i++) {
  if (!/^\|/.test(lignes[i] || '')) continue;
  const c = cells(lignes[i]);
  const o = {}; cols.forEach((k, j) => o[k] = c[j] ?? '');
  if (o.Nom) leads.push(o);
}

/* Le téléphone arrive préfixé d'un « 0 » parasite : « 0 +262 692 94 63 01 ».
   Certaines cellules ne contiennent que ce zéro — ce ne sont pas des numéros. */
const nettoyerTel = (t) => {
  const s = String(t || '').replace(/^0\s+/, '').trim();
  const chiffres = s.replace(/\D/g, '');
  return chiffres.length >= 9 ? s : '';
};

/* La commune se lit dans l'adresse : « 73 Chem. Lenormand, Saint-Pierre 97432, La Réunion ». */
const communeDe = (adr) => {
  const m = String(adr || '').match(/,\s*([A-Za-zÀ-ÿ' -]+?)\s*\d{5}/);
  return m ? m[1].trim() : '';
};

const dejaContacte = (l) => /oui/i.test(l.EmailEnvoye || '') || /oui/i.test(l['Sms envoyé'] || '')
  || /oui/i.test(l.EmailSiteEnvoye || '');

const sortie = leads
  .filter((l) => !dejaContacte(l))
  .map((l) => ({
    nom: l.Nom,
    type: l.Secteur || '',
    cuisine: '',
    commune: communeDe(l.Adresse),
    adresse: l.Adresse || '',
    telephone: nettoyerTel(l.Telephone),
    site: /^https?:/i.test(l['Site Web'] || '') ? l['Site Web'] : '',
    email: /@/.test(l.Email || '') ? l.Email : '',
    facebook: '',
    /* les trois seules choses qui changent un appel : */
    score: parseFloat(String(l['Lead Score']).replace(',', '.')) || 0,
    note: parseFloat(String(l['Score Google']).replace(',', '.')) || null,
    avis: parseFloat(String(l['Nombre Review']).replace(',', '.')) || null,
    qualifie: true,
  }))
  .filter((l) => l.telephone)
  .sort((a, b) => b.score - a.score);

const dest = path.join(path.dirname(new URL(import.meta.url).pathname), 'leads-qualifies-sheet.json');
fs.writeFileSync(dest, JSON.stringify({
  _source: 'Sheet 1E0OU8tl… onglet Sortie2, lu le ' + new Date().toISOString().slice(0, 10),
  _note: 'Leads jamais contactés (ni email, ni SMS). Le dernier scraping du Sheet date du 2026-04-27.',
  leads: sortie,
}, null, 1));

console.log(`${leads.length} leads dans Sortie2`);
console.log(`  déjà contactés    : ${leads.filter(dejaContacte).length}`);
console.log(`  jamais contactés  : ${leads.filter((l) => !dejaContacte(l)).length}`);
console.log(`  → avec téléphone exploitable : ${sortie.length}`);
console.log(`  dont avec site web : ${sortie.filter((l) => l.site).length} · avec email : ${sortie.filter((l) => l.email).length}`);
console.log(`\n  — les 8 premiers —`);
for (const l of sortie.slice(0, 8)) {
  console.log(`   ${String(l.score).padStart(3)} · ${l.nom.slice(0, 30).padEnd(30)} ${l.telephone.padEnd(20)} ${(l.commune || '—').padEnd(14)} ${l.note ? l.note + '★' : ''} ${l.avis ? '(' + l.avis + ' avis)' : ''}`);
}
console.log(`\n  écrit : ${dest}`);
