/* Trier les ~1 490 lignes du journal pour retrouver les VRAIES demandes de
 * travail jamais traitées.
 *
 * Première tentative : 79 % classés « demande » — un tri qui ne trie rien.
 * En lisant les lignes j'ai vu pourquoi : beaucoup portent déjà leur
 * résolution, collée après un tiret (« c'est fait ? — patch vérifié et
 * publié »). Ce sont des comptes rendus, pas des demandes en attente.
 *
 * Les règles sont écrites en clair pour qu'on puisse contester un classement.
 * En cas de doute, la ligne reste en DEMANDE : mieux vaut en relire une de
 * trop qu'en perdre une — c'est comme ça que le skill d'histoire du soir a
 * disparu.
 */
import fs from 'node:fs';

const brut = fs.readFileSync('/work/TASKLOG.md', 'utf8').split('\n');
const lignes = [];
let jour = '';
for (const l of brut) {
  const j = l.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
  if (j) { jour = j[1]; continue; }
  const m = l.match(/^- \[([ x~!])\]\s+`(\d{2}:\d{2})`\s+([\s\S]*?)(?:\s+<sub>(\w+)<\/sub>)?\s*$/);
  if (m) lignes.push({ jour, etat: m[1], heure: m[2], texte: m[3].trim() });
}

const RONDE = /RONDE HORAIRE|^\/loop|trouve UNE? t[âa]che que tu peux faire seul/i;
const COMMANDE = /^(ls|cd |pwd|claude init|\/\w+|npm |git |node |cat |echo )/i;
const ACCUSE = /^(ok|oui|non|merci|super|nickel|parfait|d'accord|dac|yes|bien|top|ah ok|c'est bon|vas?[- ]?y|go|continue|ça marche|ca marche)\b[\s.!…,]*$/i;

/* Une ligne qui porte déjà son compte rendu : un tiret cadratin ou « — »
   suivi d'un texte au passé composé / d'un verbe de constat. */
const RESOLUE = /—\s*(NON\s+)?(fait|corrigé|corrige|vérifié|verifie|publié|publie|livré|livre|déployé|deploye|testé|teste|réparé|repare|ajouté|ajoute|écrit|ecrit|envoyé|envoye|patch|1re|aucune?|rien)/i;

/* Verbe d'action à l'impératif ou à l'infinitif = une vraie commande de travail. */
const ACTION = /\b(fais|faire|cr[ée]e?r?|corrige|corriger|ajoute|ajouter|publie|publier|envoie|envoyer|programme|programmer|planifie|planifier|g[ée]n[èe]re|g[ée]n[ée]rer|analyse|analyser|teste|tester|r[ée]pare|r[ée]parer|[ée]cris|[ée]crire|monte|monter|refais|refaire|install|configure|d[ée]ploie|d[ée]ployer|rajoute|rajouter|mets|mettre|change|changer|supprime|lance|lancer|construis|construire|pr[ée]pare|pr[ée]parer)\b/i;

const cat = (t) => {
  if (RONDE.test(t)) return 'ronde';
  if (COMMANDE.test(t)) return 'commande';
  if (ACCUSE.test(t)) return 'accuse';
  if (RESOLUE.test(t)) return 'deja-resolue';
  if (ACTION.test(t)) return 'demande';
  if (/\?\s*$/.test(t)) return 'question';
  if (t.length < 45) return 'echange';
  return 'demande';                       // doute → on relit
};

const par = {};
for (const l of lignes) { l.cat = cat(l.texte); (par[l.cat] = par[l.cat] || []).push(l); }

console.log(`  ${lignes.length} lignes\n`);
for (const [k, v] of Object.entries(par).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`    ${String(v.length).padStart(4)}  ${k}`);
}

const d = par.demande || [];
console.log(`\n  → ${d.length} demandes d'action à qualifier (${(d.length / lignes.length * 100).toFixed(0)} %)`);

/* Regrouper par thème pour la relecture : c'est ce qui rend le tri utile. */
const THEMES = [
  ['vidéo / montage', /vid[ée]o|montage|reel|avatar|hook|clip|seedance|higgsfield|hyperframe|voix|tts|sous-titre/i],
  ['réseaux / publication', /publie|programme|planifie|blotato|tiktok|instagram|linkedin|facebook|youtube|post\b/i],
  ['site / web', /site|page|landing|coolify|d[ée]ploie|html|css|previsualisation/i],
  ['n8n / workflow', /n8n|workflow|webhook|automatis|noeud|nœud/i],
  ['prospection / client', /lead|prospect|client|email|mail|relance|devis|restaurant/i],
  ['skill / outil', /skill|agent|mcp|claude code|opencode|cron/i],
];
const theme = (t) => (THEMES.find(([, r]) => r.test(t)) || ['autre'])[0];
const parTheme = {};
for (const x of d) { const th = theme(x.texte); (parTheme[th] = parTheme[th] || []).push(x); }

console.log('\n  ── par thème ──');
for (const [k, v] of Object.entries(parTheme).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`    ${String(v.length).padStart(4)}  ${k}`);
}

fs.writeFileSync('/tmp/claude-1000/-work/23c29362-cb5a-467e-ac5e-5a3aced20058/scratchpad/demandes.json',
  JSON.stringify({ parTheme, total: d.length }, null, 1));
console.log('\n  → demandes.json écrit');
