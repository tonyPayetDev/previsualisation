/* L'inventaire réel des 376 routes de previsualisation.
 *
 * Le problème que ce fichier résout : Tony ne retrouve plus rien. Ce n'est pas
 * un problème de design, c'est un problème de VOLUME non classé — 110 maquettes
 * clientes, 50 rapports d'agences, 60 vidéos et une douzaine de pages de
 * pilotage, toutes au même niveau, triées par ordre alphabétique.
 *
 * Trois choses sont calculées ici, jamais devinées :
 *   1. la DATE réelle de dernière modification (dernier commit qui touche le
 *      dossier), en une seule passe de `git log` — 376 appels git séparés
 *      prendraient des minutes ;
 *   2. les DOUBLONS : plusieurs routes pour un même client. `pizza-di-muro`
 *      en a trois, `sphb` en a quatre. C'est le « quelque chose qui cloche »
 *      le plus fréquent, et il est mesurable ;
 *   3. le POIDS de la page : une page sous 2 Ko est un gabarit vide, pas une
 *      maquette livrable.
 *
 * Ces trois signaux remontent en couleur sur la branche, pour qu'un coup d'œil
 * suffise à dire « il y a un souci par là ».
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const R = '/work/previsualisation';

/* --- dates : une passe unique sur tout l'historique ----------------------- */
const dates = {};
{
  const sortie = execSync('git log --format=@%at --name-only --no-renames', { cwd: R, maxBuffer: 256 * 1024 * 1024 }).toString();
  let t = 0;
  for (const l of sortie.split('\n')) {
    if (l.startsWith('@')) { t = +l.slice(1); continue; }
    if (!l) continue;
    const top = l.split('/')[0];
    if (!dates[top] || t > dates[top]) dates[top] = t;
  }
}

/* --- les familles ---------------------------------------------------------
 * L'ordre compte : la première règle qui matche gagne. Les règles précises
 * passent donc avant les génériques. */
const FAMILLES = [
  ["pilotage",    /^(taches|appels|carte|partage|a-envoyer|cta|sites-clients|cockpit|a-programmer-etude|dashboard-notion|sprint|onboarding|systeme|tokens)$/],
  ["prospection", /^(rapport-agence|analyse-seo|leads|leads-qualifies|leads-restaurants|reunion|reunion-vol|devis-auto|emplois-ia)/],
  ["demo",        /^(demo-|branchement-demo|feed-demo|maquettes|videoboost|test-voix)/],
  ["maquette",    /^client-/],
  ["koytcha",     /^koytcha/],
  ["journal",     /^journal-ia/],
  ["etude",       /^(etude-|pub-|pubs-|showcase-|concept-|cartographie|build-in-public)/],
  ["essai",       /^essai-/],
  ["autoboost",   /^(autoboost|prompt-reveal|veille|split-prompts|shortforge|hook-|clip-|trailer-|yapping|twingo|matrix-|combat-|tuto-)/],
  ["foodboost",   /^(foodboost|feed-|befresh|resto-|mrdonuts|the-grill|osmose-|conte-|livres-enfants)/],
  ["ressource",   /^(ressource-|outils|prompts-|banque|styles|sound-design|sous-titres|fable|content-ideas|createur|blog|formation-|pinterest-|seedance|render-hf|studio-|terminal|meta|kilo-code|claude-mem|tab-mind|open-generative-ai|my-video|meigen-|humian-|blacksshade|chanson-|chanson|videos-non-publiees|apercu-effets|clip)/],
  ["marque",      /^(tony-site|automatisationboost|site-neon|family-arena)/],
];
const famille = (n) => (FAMILLES.find(([, re]) => re.test(n)) || ['divers'])[0];

/* --- doublons de maquettes -------------------------------------------------
 * On retire les suffixes de variante pour retrouver le client derrière la
 * route. « client-sphb-production-huiles-optimise » et « client-sphb-optimisation-seo »
 * désignent la même affaire. */
const SUFFIXES = /-(optimisation-seo|seo-optimisation|optimisation|optimise|optimized|optimisee|seo|website|site|scroll|premium|landing|v[2-9])$/;
const noyau = (n) => {
  let s = n.replace(/^client-/, '');
  for (let i = 0; i < 4; i++) s = s.replace(SUFFIXES, '');
  return s.replace(/-(la-reunion|ile-de-la-reunion|ile-reunion|reunion|974)$/g, '')
          .split('-').slice(0, 3).join('-');
};

const MAINTENANT = Date.now() / 1000;
const routes = [];
for (const d of fs.readdirSync(R, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name === '.git' || d.name === 'docker-entrypoint.d') continue;
  const n = d.name;
  let titre = null, poids = 0;
  try {
    const h = fs.readFileSync(`${R}/${n}/index.html`, 'utf8');
    poids = h.length;
    const m = h.match(/<title>([^<]*)<\/title>/i);
    titre = m ? m[1].trim() : null;
  } catch { /* pas d'index.html : dossier de ressources */ }
  const sous = fs.readdirSync(`${R}/${n}`, { withFileTypes: true }).filter((x) => x.isDirectory()).length;
  const video = fs.existsSync(`${R}/${n}/video.mp4`);
  const t = dates[n] || 0;
  routes.push({
    n, titre: titre || n.replace(/-/g, ' '), fam: famille(n), poids, sous, video,
    jours: t ? Math.round((MAINTENANT - t) / 86400) : null,
  });
}

/* Les doublons ne se comptent que sur les maquettes : trois vidéos Autoboost
   sur un même sujet sont des variantes voulues, trois routes pour un même
   restaurant sont une hésitation qu'il faut trancher. */
const groupes = {};
for (const r of routes.filter((x) => x.fam === 'maquette')) (groupes[noyau(r.n)] ||= []).push(r.n);
const doublons = Object.entries(groupes).filter(([, v]) => v.length > 1)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([k, v]) => ({ client: k, routes: v }));
const enDoublon = new Set(doublons.flatMap((d) => d.routes));
for (const r of routes) {
  r.souci = [];
  if (enDoublon.has(r.n)) r.souci.push('doublon');
  if (r.poids > 0 && r.poids < 2000) r.souci.push('page vide');
  if (r.poids === 0 && !r.sous) r.souci.push('sans page');
  if (r.jours !== null && r.jours > 120) r.souci.push('dormante');
}

const inv = {
  maj: new Date().toISOString(),
  total: routes.length,
  routes: routes.sort((a, b) => (a.jours ?? 9999) - (b.jours ?? 9999)),
  doublons,
};
fs.writeFileSync('/work/previsualisation/cockpit/inventaire.json', JSON.stringify(inv, null, 1));

const parFam = {};
for (const r of routes) (parFam[r.fam] ||= []).push(r);
console.log(`${routes.length} routes`);
for (const [f, l] of Object.entries(parFam).sort((a, b) => b[1].length - a[1].length))
  console.log(`  ${f.padEnd(12)} ${String(l.length).padStart(3)} · ${l.filter((r) => r.souci.length).length} avec un souci`);
console.log(`\n${doublons.length} clients en doublon :`);
for (const d of doublons.slice(0, 8)) console.log(`  ${d.client.padEnd(26)} ${d.routes.length} routes`);

/* --- L'arbre du cockpit ----------------------------------------------------
 * Cinq objectifs, parce que c'est le nombre qu'on lit d'un coup d'œil sur un
 * cercle. Chaque objectif porte une phrase de but : sans elle, une branche
 * n'est qu'un dossier de plus.
 *
 * Règle de découpage : au-delà de 18 enfants, un nœud devient illisible sur un
 * cercle. On regroupe alors par SÉRIE (les deux premiers segments du nom :
 * « autoboost-45 », « client-pizza »), et si les séries sont elles-mêmes trop
 * nombreuses, par tranche alphabétique. Le regroupement n'invente rien — il
 * suit les noms que les dossiers portent déjà.
 */
const OBJECTIFS = [
  { id: 'vendre-sites', nom: 'Vendre des sites', but: 'Transformer 433 numéros joignables en factures.',
    fams: ['maquette', 'koytcha', 'demo', 'prospection'] },
  { id: 'videoboost', nom: 'VideoBoost', but: 'Prouver que le format le plus dur se produit sans monteur.',
    fams: ['autoboost', 'essai', 'etude'] },
  { id: 'foodboost', nom: 'FoodBoost', but: 'Un restaurant qui paie l’abonnement tous les mois.',
    fams: ['foodboost'] },
  { id: 'marque', nom: 'Ma marque', but: 'Être trouvé sans avoir à démarcher.',
    fams: ['marque', 'journal', 'ressource'] },
  { id: 'piloter', nom: 'Piloter', but: 'Ne plus perdre une info entre deux sessions.',
    fams: ['pilotage'] },
];
const NOM_FAM = {
  maquette: 'Maquettes clientes', koytcha: 'Koytcha Immo', demo: 'Démos commerciales',
  prospection: 'Prospection', autoboost: 'Vidéos Autoboost', essai: 'Essais contemplatifs',
  etude: 'Études & pubs', foodboost: 'FoodBoost', marque: 'Site & identité',
  journal: 'Journal IA', ressource: 'Ressources & outils', pilotage: 'Pages de pilotage',
};

const feuille = (r) => ({
  id: r.n, nom: r.titre, type: 'route', lien: `/${r.n}/`,
  jours: r.jours, souci: r.souci, video: r.video, poids: r.poids,
});

const serie = (n) => n.split('-').slice(0, 2).join('-');
const regrouper = (liste) => {
  if (liste.length <= 18) return liste.map(feuille);
  const par = {};
  for (const r of liste) (par[serie(r.n)] ||= []).push(r);
  let clefs = Object.keys(par).sort();
  /* Trop de séries : on retombe sur des tranches alphabétiques, qui restent
     prévisibles pour l'œil (on cherche un nom, on sait où regarder). */
  if (clefs.length > 18) {
    const par2 = {}, taille = Math.ceil(liste.length / 12);
    const tri = [...liste].sort((a, b) => a.n.localeCompare(b.n));
    for (let i = 0; i < tri.length; i += taille) {
      const lot = tri.slice(i, i + taille);
      const k = `${lot[0].n.replace(/^client-/, '').slice(0, 3)} → ${lot[lot.length - 1].n.replace(/^client-/, '').slice(0, 3)}`;
      par2[k] = lot;
    }
    return Object.entries(par2).map(([k, v]) => noeud(k, k, v));
  }
  return clefs.map((k) => (par[k].length === 1 ? feuille(par[k][0]) : noeud(k, k.replace(/-/g, ' '), par[k])));
};
function noeud(id, nom, liste) {
  return { id, nom, type: 'groupe', enfants: regrouper(liste),
           n: liste.length, soucis: liste.filter((r) => r.souci.length).length };
}

const arbre = {
  id: 'racine', nom: 'AutomatisationBoost', type: 'racine',
  enfants: OBJECTIFS.map((o) => {
    const fams = o.fams.map((f) => {
      const l = routes.filter((r) => r.fam === f);
      return { id: f, nom: NOM_FAM[f] || f, type: 'famille', enfants: regrouper(l),
               n: l.length, soucis: l.filter((r) => r.souci.length).length };
    }).filter((f) => f.n > 0);
    const n = fams.reduce((s, f) => s + f.n, 0);
    return { id: o.id, nom: o.nom, but: o.but, type: 'objectif', enfants: fams,
             n, soucis: fams.reduce((s, f) => s + f.soucis, 0) };
  }),
};
arbre.n = arbre.enfants.reduce((s, o) => s + o.n, 0);
arbre.soucis = arbre.enfants.reduce((s, o) => s + o.soucis, 0);

fs.writeFileSync('/work/previsualisation/cockpit/arbre.json',
  JSON.stringify({ maj: inv.maj, arbre, doublons }, null, 1));
console.log(`\narbre : ${arbre.n} routes · ${arbre.soucis} avec un souci`);
for (const o of arbre.enfants) console.log(`  ${o.nom.padEnd(20)} ${String(o.n).padStart(3)} routes · ${o.soucis} soucis · ${o.enfants.length} branches`);
