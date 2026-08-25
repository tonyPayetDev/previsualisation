/* Lit le mapping CTA tel qu'il est RÉELLEMENT, dans la dernière exécution
   réussie du workflow Auto-DM — pas depuis une note. On récupère au passage
   le `row_number` de chaque ligne : sans lui, dire à Tony « remplis la cellule
   FABLE » l'oblige à la chercher dans 43 lignes. */
import fs from 'node:fs';

let K;
for (const p of ['/work/.claude/settings.json', '/work/.claude/settings.local.json']) {
  try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if ((j.env || {}).N8N_API_KEY) { K = j.env.N8N_API_KEY; break; } } catch {}
}
const B = 'https://n7n.automatisationboost.com/api/v1';
const H = { 'X-N8N-API-KEY': K };
const WF = 'U0U6yjMp88h9cH2A';

const ex = await (await fetch(`${B}/executions?workflowId=${WF}&status=success&limit=5`, { headers: H })).json();
let lignes = null, idUtilise = null;
for (const e of (ex.data || [])) {
  const full = await (await fetch(`${B}/executions/${e.id}?includeData=true`, { headers: H })).json();
  const n = full.data?.resultData?.runData?.['Lire mapping ressources'];
  const items = n?.[0]?.data?.main?.[0];
  if (items && items.length) {
    lignes = items.map((x) => x.json);
    idUtilise = e.id;
    break;
  }
}
if (!lignes) { console.log('  mapping introuvable dans les 5 dernières exécutions'); process.exit(1); }

console.log(`  mapping lu dans l'exécution ${idUtilise} · ${lignes.length} lignes`);
const avec = lignes.filter((l) => String(l['Lien Ressource'] || '').trim());
console.log(`  ${avec.length} avec lien · ${lignes.length - avec.length} sans`);
fs.writeFileSync('/tmp/mapping-cta.json', JSON.stringify({ execution: idUtilise, lignes }, null, 2));

console.log('\n  ── lignes SANS lien, avec leur numéro ──');
for (const l of lignes) {
  if (String(l['Lien Ressource'] || '').trim()) continue;
  console.log(`   ligne ${String(l.row_number).padStart(3)}  ${l['Mot-cle CTA']}`);
}
