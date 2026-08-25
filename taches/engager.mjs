// Enregistre un ENGAGEMENT : une chose que Tony a demandée et qui doit être
// finie à une date donnée. Par défaut le lendemain — sa règle, écrite le
// 2026-08-25 : « si le lendemain j'arrive ça doit être fini ».
//
// POURQUOI CE FICHIER EXISTE
// TASKLOG.md compte 1333 lignes « ouvertes », dont l'écrasante majorité sont des
// `ls` ou des questions. Il enregistre des PROMPTS, pas des engagements. Une
// alarme branchée dessus crierait 1333 fois et serait ignorée dès le deuxième
// jour — la même erreur que le garde-fou qui recalait « xAI — Grok 4.6 ».
// D'où une liste courte, tenue à la main, et donc crédible.
//
//   node engager.mjs "Vidéo Koytcha dynamique" --cash direct --lien /koytcha-video/
//   node engager.mjs "Refaire le hook" --echeance 2026-08-27
import fs from 'node:fs';

const F = '/work/previsualisation/taches/taches.json';
const a = process.argv.slice(2);
const titre = a.find((x) => !x.startsWith('--'));
if (!titre) { console.error('usage: engager.mjs "<ce que Tony a demandé>" [--cash direct|proche|loin] [--lien /route/] [--echeance AAAA-MM-JJ]'); process.exit(2); }

const opt = (n) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : null; };

/* Par défaut : demain. On calcule sur l'heure de La Réunion (UTC+4), sinon une
   demande faite à 23 h heure locale se voit attribuer la veille. */
const maintenant = new Date(Date.now() + 4 * 3600e3);
const demain = new Date(maintenant.getTime() + 24 * 3600e3);
const iso = (d) => d.toISOString().slice(0, 10);

const t = JSON.parse(fs.readFileSync(F, 'utf8'));
const arr = Array.isArray(t) ? t : (t.taches || t.items || Object.values(t)[0]);

if (arr.some((x) => x.t === titre)) { console.log('  déjà engagé, rien ajouté'); process.exit(0); }

arr.unshift({
  t: titre,
  etat: 'attente',
  lien: opt('lien') || '',
  note: opt('note') || '',
  cash: opt('cash') || 'proche',
  cashNote: '',
  demande_le: iso(maintenant),
  echeance: opt('echeance') || iso(demain),
});

fs.writeFileSync(F, JSON.stringify(t, null, 1));
console.log(`  engagé : « ${titre.slice(0, 60)} »`);
console.log(`  échéance : ${opt('echeance') || iso(demain)}`);
console.log('  → relancer cash.mjs puis build.mjs pour publier le tableau');
