// Liste les engagements DÉPASSÉS : demandés par Tony, pas livrés, échéance
// passée. Sort en code 1 s'il y en a, pour qu'un appelant puisse s'arrêter.
//
// Règle de Tony, 2026-08-25 : « ce genre que j'ai donné il faut le mettre dans
// le backlog de tâches, et si le lendemain j'arrive ça doit être fini ».
// Le cas qui a déclenché ça : la vidéo Koytcha, demandée le 24/08 à 19h15,
// toujours pas montée le lendemain matin — il a fallu qu'il redemande.
import fs from 'node:fs';

const F = '/work/previsualisation/taches/taches.json';
const t = JSON.parse(fs.readFileSync(F, 'utf8'));
const arr = Array.isArray(t) ? t : (t.taches || t.items || Object.values(t)[0]);

/* Aujourd'hui à La Réunion, pas en UTC : à 22 h UTC il est déjà demain ici. */
const aujourdhui = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);

const retards = arr
  .filter((x) => x.echeance && x.etat !== 'livre' && x.echeance < aujourdhui)
  .sort((a, b) => (a.echeance || '').localeCompare(b.echeance || ''));

const jours = (d) => Math.round((new Date(aujourdhui) - new Date(d)) / 86400e3);

if (!retards.length) {
  console.log('  aucun engagement en retard');
  process.exit(0);
}
console.log(`  ${retards.length} ENGAGEMENT(S) EN RETARD :`);
for (const r of retards) {
  const n = jours(r.echeance);
  console.log(`   ⏰ ${n} jour${n > 1 ? 's' : ''} · [${r.cash}] ${r.t.slice(0, 62)}`);
  if (r.lien) console.log(`        ${r.lien}`);
}
process.exit(1);
