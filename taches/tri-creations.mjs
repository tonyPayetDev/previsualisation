/* Deuxième passe : ne plus juger une demande au texte, mais vérifier si son
 * LIVRABLE existe.
 *
 * Le tri par mots-clés plafonne à 918 lignes « d'action » — trop pour une
 * relecture honnête, et surtout subjectif. Or une demande de création laisse
 * une trace vérifiable : un skill, un workflow, une page. Si la trace existe,
 * c'est fait ; sinon, c'est un vrai trou.
 *
 * On se concentre donc sur les demandes qui NOMMENT quelque chose à créer.
 * C'est exactement la classe à laquelle appartenait le skill d'histoire du
 * soir — celui qui a disparu pendant des jours.
 */
import fs from 'node:fs';

const brut = fs.readFileSync('/work/TASKLOG.md', 'utf8').split('\n');
const lignes = [];
let jour = '';
for (const l of brut) {
  const j = l.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
  if (j) { jour = j[1]; continue; }
  const m = l.match(/^- \[([ x~!])\]\s+`(\d{2}:\d{2})`\s+([\s\S]*?)(?:\s+<sub>\w+<\/sub>)?\s*$/);
  if (m) lignes.push({ jour, heure: m[2], texte: m[3].trim() });
}

/* Une demande de création : un verbe de création + un objet nommable. */
const CREER = /\b(cr[ée]e?r?|fais|faire|construis|construire|monte[rz]?|d[ée]veloppe|mets? en place|install)\b/i;
const OBJET = /\b(skill|workflow|agent|page|site|landing|ressource|template|script|outil|dashboard|tableau de bord|bot|application|app)\b/i;

const creations = lignes.filter((l) => CREER.test(l.texte) && OBJET.test(l.texte));
console.log(`  ${lignes.length} lignes · ${creations.length} demandes de CRÉATION nommant un objet\n`);

/* Inventaire de ce qui existe réellement. */
const listeSure = (d) => { try { return fs.readdirSync(d); } catch { return []; } };
const skills = [...listeSure('/work/.claude/skills'), ...listeSure('/work/.agents/skills')].map((s) => s.toLowerCase());
const routes = listeSure('/work/previsualisation').map((s) => s.toLowerCase());
const projets = listeSure('/work/autoboost-neon-videos').map((s) => s.toLowerCase());

/* Les mots significatifs d'une demande, pour chercher une trace. */
const VIDES = new Set(['pour', 'avec', 'dans', 'mon', 'mes', 'une', 'des', 'les', 'que', 'qui', 'sur', 'tout',
  'nouveau', 'nouvelle', 'skill', 'workflow', 'page', 'agent', 'site', 'faire', 'fais', 'creer', 'créer',
  'peux', 'stp', 'moi', 'plus', 'bien', 'utilise', 'exemple', 'aussi', 'comme', 'cette', 'cela']);
const motsCles = (t) => t.toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
  .filter((w) => w.length >= 5 && !VIDES.has(w));

const sansTrace = [];
for (const c of creations) {
  const mots = motsCles(c.texte).slice(0, 8);
  if (!mots.length) continue;
  const trace = mots.find((w) => skills.some((s) => s.includes(w)) || routes.some((r) => r.includes(w)) || projets.some((p) => p.includes(w)));
  if (!trace) sansTrace.push({ ...c, mots: mots.slice(0, 5) });
}

console.log(`  ${creations.length - sansTrace.length} ont une trace sur le disque`);
console.log(`  ⚠️  ${sansTrace.length} n'en ont AUCUNE — candidates à un vrai trou\n`);

sansTrace.sort((a, b) => (a.jour + a.heure).localeCompare(b.jour + b.heure));
console.log('  ── sans trace, de la plus ancienne à la plus récente ──');
for (const s of sansTrace) {
  console.log(`   ${s.jour} ${s.heure} · ${s.texte.replace(/\s+/g, ' ').slice(0, 96)}`);
}

fs.writeFileSync('/tmp/claude-1000/-work/23c29362-cb5a-467e-ac5e-5a3aced20058/scratchpad/sans-trace.json',
  JSON.stringify(sansTrace, null, 1));
