// Régénère le sommaire (index.html) depuis les dossiers réellement présents.
//
// Pourquoi un générateur et pas une page écrite à la main : l'ancienne page
// listait 307 routes pour 324 réellement en ligne — 23 dossiers publiés
// n'apparaissaient nulle part, et 6 entrées pointaient vers des dossiers sans
// index.html (403 chez nginx). Autrement dit : du travail invisible d'un côté,
// des liens morts de l'autre.
//
// Ce script est appelé À LA CONSTRUCTION DE L'IMAGE (voir Dockerfile), donc à
// chaque déploiement Coolify. Personne n'a à y penser. Il tourne aussi très
// bien à la main :  node build-index.mjs
//
// Trois règles tenues ici :
//   1. Une route n'est listée que si elle contient un index.html. Un lien mort
//      dans un sommaire coûte plus cher que son absence.
//   2. Le titre affiché est le <title> réel de la page. Rien n'est inventé.
//   3. Le tri est chronologique, du plus récent au plus ancien, dans chaque
//      groupe. C'est ce qui rend « à jour » visible d'un coup d'œil.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Le chemin est déduit de l'emplacement du script : il était codé en dur sur
// /work/previsualisation, ce qui rendait le script inutilisable dans l'image
// Docker (où le site vit dans /usr/share/nginx/html).
const BASE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(BASE, 'index.html');
const SIDECAR = path.join(BASE, 'descriptions.json');
const DATES = path.join(BASE, 'dates.json');

/* ── 1. Ce qu'on ne liste jamais ──────────────────────────────────────────
   L'outillage interne (tableau de bord, feuille d'appel, liens de partage) et
   la plomberie du serveur. Ces routes existent, certaines sont même protégées
   par mot de passe, mais elles n'ont rien à faire dans un sommaire de
   maquettes. */
const OUTILLAGE = new Set([
  'taches', 'appels', 'carte', 'partage', 'a-envoyer', 'cta', 'sites-clients',
  'tri',

  'docker-entrypoint.d', 'styles',
  '.git', '.claude', 'node_modules', 'assets', 'cartographie',
]);

/* ── 2. Les descriptions déjà écrites à la main ───────────────────────────
   Elles ne sont pas reconstructibles depuis un nom de dossier : on les garde.
   Seul le badge de statut en est tiré — le nom affiché, lui, vient du <title>
   réel de la page (règle 2). */
const connus = new Map(Object.entries(
  fs.existsSync(SIDECAR) ? JSON.parse(fs.readFileSync(SIDECAR, 'utf8')) : {},
));

/* ── 3. Les dates ─────────────────────────────────────────────────────────
   Piège : dans le conteneur, tous les fichiers portent la date du clone. Le
   mtime y est donc uniformément faux et le tri « par fraîcheur » n'y voudrait
   plus rien dire.

   La source de vérité est donc l'historique git, relevé quand le script tourne
   ici (une seule passe, pas 324 appels), et mémorisé dans dates.json. L'image
   Docker, qui n'a pas d'historique git, relit ce fichier. Une route absente du
   manifeste retombe sur son mtime : elle remonte en tête comme « nouvelle »,
   ce qui est au pire une imprécision — jamais une absence.

   Second piège, mesuré : prendre bêtement le dernier commit qui touche un
   dossier donnait 181 routes datées du 21 août — celles balayées d'un coup par
   « sortir les 190 videos du depot vers R2 ». Un tri par fraîcheur où la moitié
   du site a bougé le même jour ne trie plus rien. On écarte donc les commits de
   masse (plus de SEUIL dossiers touchés) : ce sont des refactos, pas du travail
   sur la route. Ils restent le recours ultime pour une route qui n'aurait
   jamais été touchée autrement. */
const SEUIL_COMMIT_DE_MASSE = 10;

function datesDepuisGit() {
  let brut;
  try {
    brut = execFileSync(
      'git', ['log', '--format=@%ct', '--name-only', '--no-merges'],
      { cwd: BASE, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch { return null; } // pas de git (image Docker) : on lira le manifeste

  // Un commit = une date + l'ensemble des dossiers de premier niveau touchés.
  const commits = [];
  let courant = null;
  for (const ligne of brut.split('\n')) {
    if (ligne.startsWith('@')) {
      courant = { t: Number(ligne.slice(1)), dossiers: new Set() };
      commits.push(courant);
      continue;
    }
    if (!ligne || !courant) continue;
    const racine = ligne.split('/')[0];
    if (racine && racine !== ligne) courant.dossiers.add(racine); // fichier dans un dossier
  }

  // git log sort du plus récent au plus ancien : la première vue est la bonne.
  const vues = new Map();
  const secours = new Map();
  for (const c of commits) {
    const masse = c.dossiers.size > SEUIL_COMMIT_DE_MASSE;
    for (const d of c.dossiers) {
      if (!secours.has(d)) secours.set(d, c.t);
      if (!masse && !vues.has(d)) vues.set(d, c.t);
    }
  }
  for (const [d, t] of secours) if (!vues.has(d)) vues.set(d, t);

  return vues.size ? vues : null;
}

const manifeste = new Map(Object.entries(
  fs.existsSync(DATES) ? JSON.parse(fs.readFileSync(DATES, 'utf8')) : {},
));
const depuisGit = datesDepuisGit();
if (depuisGit) for (const [k, v] of depuisGit) manifeste.set(k, v);

/* ── 4. Scanner ───────────────────────────────────────────────────────────── */
const routes = fs.readdirSync(BASE, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !OUTILLAGE.has(d.name))
  .map((d) => d.name)
  // Règle 1 : pas d'index.html, pas d'entrée. nginx répondrait 403 sur ces
  // dossiers (l'autoindex est désactivé), pas même un 404 honnête.
  .filter((n) => fs.existsSync(path.join(BASE, n, 'index.html')));

// Groupes visibles, dans l'ordre d'affichage.
const GROUPES = [
  ['Maquettes clientes', /^client-/],
  ['Projets Koytcha', /^koytcha/],
  ['Vidéos Autoboost', /^autoboost|^veille/],
  ['Journaux IA', /^journal-/],
  ['Le reste', /.^/], // ne matche rien : fourre-tout final
];
const groupe = (n) => (GROUPES.find(([, r]) => r.test(n)) || ['Le reste'])[0];

// Famille fine — sert de pastille et de filtre rapide. Elle se lit sur le
// préfixe : c'est la seule information fiable sans ouvrir 324 dossiers.
const FAMILLES = [
  [/^journal-ia/, 'Journal IA'],
  [/^prompt-reveal/, 'Prompt reveal'],
  [/^befresh/, 'BeFresh'],
  [/^foodboost/, 'FoodBoost'],
  [/^essai/, 'Essais'],
  [/^shortforge/, 'ShortForge'],
  [/^autoboost|^veille/, 'Autoboost'],
  [/^koytcha/, 'Koytcha'],
  [/^family-arena/, 'Family Arena'],
  [/^automatisationboost/, 'Site Autoboost'],
  [/^videoboost/, 'VideoBoost'],
  [/^client-|^site-/, 'Clients'],
];
const famille = (n) => (FAMILLES.find(([r]) => r.test(n)) || [, 'Divers'])[1];

/* Une seule lecture de la page sert deux réponses : son titre et la présence
   d'une vidéo.

   Sur la vidéo, le piège : le commit c09cc0c a sorti les 190 vidéos du dépôt
   pour les héberger sur R2. Chercher un fichier .mp4 sur le disque, comme le
   faisait la version précédente, ne trouve donc plus que 8 routes sur 190 — et
   l'ancienne page affichait toujours « 171 avec vidéo », un chiffre devenu
   faux. On regarde donc les deux : le fichier local S'IL existe encore, et la
   référence .mp4 dans la page (assets.automatisationboost.com).

   Sur le titre : on retire le préfixe « Prévisualisation — », qui ne dit rien.
   Si ce qui reste n'est que le nom du dossier, on retombe sur le nom écrit à
   la main — et à défaut sur le nom du dossier. Aucun titre n'est fabriqué. */
function analyser(dir, nom) {
  let h = '';
  try { h = fs.readFileSync(path.join(dir, 'index.html'), 'utf8'); }
  catch { /* page illisible : on garde la route, sans titre ni marqueur */ }

  let t = '';
  const m = h.match(/<title>([\s\S]*?)<\/title>/i);
  if (m) t = m[1].replace(/\s+/g, ' ').trim();
  t = t.replace(/^Pr[ée]visualisation\s*[—–-]\s*/i, '').trim();
  if (!t || t.toLowerCase() === nom.toLowerCase()) {
    const k = connus.get(nom);
    t = (k && k.nom) ? String(k.nom) : nom;
  }

  return { titre: t, videoDansLaPage: /\.mp4/i.test(h) };
}

// Les titres montent jusqu'à 560 caractères. Sur une liste de 324 lignes ça
// devient illisible. On coupe à la dernière unité de sens avant la limite —
// jamais au milieu d'un mot — et le texte entier reste dans l'infobulle ET
// dans l'index de recherche.
function court(txt, max = 78) {
  const t = String(txt).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return { court: t, complet: t, coupe: false };
  const zone = t.slice(0, max);
  let i = Math.max(zone.lastIndexOf(' · '), zone.lastIndexOf(' — '), zone.lastIndexOf(' – '));
  if (i < max * 0.45) i = zone.lastIndexOf(', ');
  if (i < max * 0.45) i = zone.lastIndexOf(' ');
  if (i < max * 0.45) i = max;
  return { court: t.slice(0, i).replace(/[·,—–\s]+$/, '') + ' …', complet: t, coupe: true };
}

/* ── Les dates, écrites à la main ─────────────────────────────────────────
   toLocaleDateString('fr-FR', …) a été essayé et rendait « Aug 25 » sur le
   serveur : le paquet nodejs d'Alpine est compilé en small-icu, il ne connaît
   que l'anglais et retombe dessus SANS prévenir. Le bug ne se voit pas ici,
   où Node a l'ICU complet — seulement en production.
   La Réunion est à UTC+4 toute l'année, sans heure d'été : un décalage fixe
   suffit, et le résultat ne dépend plus d'aucune bibliothèque. */
const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin',
              'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const REUNION = 4 * 60 * 60 * 1000;
const partsReunion = (ms) => {
  const d = new Date(ms + REUNION);
  return {
    jour: d.getUTCDate(), mois: d.getUTCMonth(), annee: d.getUTCFullYear(),
    h: d.getUTCHours(), min: d.getUTCMinutes(),
  };
};

const MAINTENANT = new Date();
const ANNEE = partsReunion(MAINTENANT.getTime()).annee;
function jolieDate(ms) {
  const p = partsReunion(ms);
  return `${p.jour} ${MOIS[p.mois]}` + (p.annee !== ANNEE ? ` ${p.annee}` : '');
}

const items = routes.map((nom) => {
  const dir = path.join(BASE, nom);
  let fichiers = [];
  try { fichiers = fs.readdirSync(dir); } catch { /* illisible : on garde la route */ }
  const { titre, videoDansLaPage } = analyser(dir, nom);
  const video = videoDansLaPage || fichiers.some((f) => /\.mp4$/i.test(f));

  let t = manifeste.has(nom) ? Number(manifeste.get(nom)) * 1000 : 0;
  if (!t) { try { t = fs.statSync(dir).mtimeMs; } catch { t = Date.now(); } }

  // Du badge on ne garde que le statut : ce qui suit un tiret cadratin est du
  // détail technique, il descend sous le nom.
  const k = connus.get(nom);
  let badge = (k && k.badge) || '', detail = '';
  const coupe = badge.split(/\s+[—–-]\s+/);
  if (coupe.length > 1) { badge = coupe[0].trim(); detail = coupe.slice(1).join(' — ').trim(); }
  if (badge.length > 26) { detail = (badge + (detail ? ' — ' + detail : '')).trim(); badge = ''; }

  const c = court(titre);
  return {
    nom, titre: c.court, titreComplet: c.complet, coupe: c.coupe,
    badge, detail, groupe: groupe(nom), famille: famille(nom), video, t,
  };
});

items.sort((a, b) => b.t - a.t); // le plus récent d'abord, partout

const parFamille = {};
for (const it of items) parFamille[it.famille] = (parFamille[it.famille] || 0) + 1;
const famillesTriees = Object.entries(parFamille).sort((a, b) => b[1] - a[1]);

// Les descriptions stockées portent déjà des entités HTML (&amp;, &#039;) :
// les ré-échapper afficherait « &amp; » en clair. On décode d'abord, on
// échappe ensuite.
const dec = (s) => String(s)
  .replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8217;/g, '’').replace(/&nbsp;/g, ' ');
const esc = (s) => dec(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ligne = (i) => `    <li data-fam="${esc(i.famille)}" data-mp4="${i.video ? 1 : 0}" data-k="${esc((i.nom + ' ' + i.titreComplet + ' ' + i.famille + ' ' + i.groupe).toLowerCase())}"><a href="/${esc(i.nom)}/"${i.coupe ? ` title="${esc(i.titreComplet)}"` : ''}>
      <span class="nom">${esc(i.titre)}<small>/${esc(i.nom)}</small>${i.detail ? `<small>${esc(i.detail)}</small>` : ''}</span>
      <span class="droite">${i.video ? '<span class="mp4">mp4</span>' : ''}${i.badge ? `<span class="badge">${esc(i.badge)}</span>` : ''}<span class="fam">${esc(i.famille)}</span><time datetime="${new Date(i.t).toISOString()}">${esc(jolieDate(i.t))}</time></span>
    </a></li>`;

const sections = GROUPES.map(([g]) => {
  const dedans = items.filter((i) => i.groupe === g);
  if (!dedans.length) return '';
  return `<section class="grp" data-grp="${esc(g)}">
  <h2>${esc(g)} <b>${dedans.length}</b></h2>
  <!-- le compteur du groupe suit le filtre : voir appliquer() -->
  <ul>
${dedans.map(ligne).join('\n')}
  </ul>
</section>`;
}).filter(Boolean).join('\n\n');

const g = partsReunion(MAINTENANT.getTime());
const genere = `${g.jour} ${MOIS[g.mois]} ${g.annee} à ${g.h}h${String(g.min).padStart(2, '0')}`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Prévisualisation — Autoboost</title>
<style>
:root{
  --bg:#0a0a0f; --panel:#111117; --panel-2:#16161e; --border:#242430;
  --jaune:#eab308; --violet:#8b5cf6; --texte:#f2f2f5; --mut:#8f8f9e;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--texte);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  padding:1.1rem .9rem 4rem;font-size:15px;line-height:1.5}
.wrap{max-width:760px;margin:0 auto}

/* Titre volontairement discret : c'est un outil de travail, pas une vitrine. */
header{display:flex;align-items:baseline;justify-content:space-between;gap:.8rem;
  margin-bottom:1rem;flex-wrap:wrap}
header h1{font-size:.95rem;margin:0;font-weight:700;letter-spacing:.01em;color:var(--texte)}
header h1 i{font-style:normal;color:var(--jaune)}
header .compte{font-size:.75rem;color:var(--mut);font-variant-numeric:tabular-nums}
.outils-bar{margin:0 0 1rem;font-size:.8rem;color:var(--mut);
  background:var(--panel);border:1px solid var(--border);border-radius:9px;padding:.6rem .8rem}
.outils-bar a{color:var(--jaune);font-weight:600;text-decoration:none}

/* Barre de filtre — collante, pour rester accessible sur 300+ entrées */
.filtres{position:sticky;top:0;z-index:5;background:var(--bg);
  padding:.5rem 0 .7rem;margin-bottom:.3rem;border-bottom:1px solid var(--border)}
#q{width:100%;background:var(--panel);border:1px solid var(--border);color:var(--texte);
  padding:.6rem .8rem;border-radius:9px;font-size:.9rem;font-family:inherit}
#q:focus{outline:none;border-color:var(--jaune)}
#q::placeholder{color:var(--mut)}
.chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.55rem}
.chip{background:var(--panel);border:1px solid var(--border);color:var(--mut);
  padding:.28rem .6rem;border-radius:999px;font-size:.72rem;cursor:pointer;
  font-family:inherit;transition:border-color .15s,color .15s}
.chip:hover{color:var(--texte)}
.chip[aria-pressed=true]{border-color:var(--jaune);color:var(--jaune);
  background:rgba(234,179,8,.08)}
.chip b{font-weight:600;opacity:.55;margin-left:.3rem;font-variant-numeric:tabular-nums}

.grp{margin-top:1.6rem}
.grp h2{font-size:.72rem;text-transform:uppercase;letter-spacing:.09em;
  color:var(--mut);margin:0 0 .5rem;font-weight:600}
.grp h2 b{color:var(--jaune);font-variant-numeric:tabular-nums;font-weight:600}
ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.4rem}
li a{display:flex;max-width:100%;overflow:hidden;justify-content:space-between;align-items:center;gap:.7rem;
  background:var(--panel);border:1px solid var(--border);border-radius:9px;
  padding:.65rem .85rem;text-decoration:none;color:var(--texte);transition:border-color .15s}
li a:hover{border-color:var(--jaune);background:var(--panel-2)}
.nom{font-size:.86rem;font-weight:500;min-width:0;overflow-wrap:anywhere}
.nom small{display:block;color:var(--mut);font-size:.72rem;font-weight:400;margin-top:.12rem}
.droite{display:flex;align-items:center;gap:.4rem;flex-shrink:0;max-width:58%;overflow:hidden}
.fam{font-size:.66rem;color:var(--mut);border:1px solid var(--border);
  padding:.16rem .45rem;border-radius:999px;white-space:nowrap}
.badge{font-size:.66rem;font-weight:600;padding:.16rem .45rem;border-radius:999px;
  white-space:nowrap;max-width:11rem;overflow:hidden;text-overflow:ellipsis;background:rgba(234,179,8,.12);color:var(--jaune);
  border:1px solid rgba(234,179,8,.28)}
.mp4{font-size:.66rem;color:var(--violet);border:1px solid rgba(139,92,246,.3);
  padding:.16rem .4rem;border-radius:999px}
time{font-size:.68rem;color:var(--mut);white-space:nowrap;font-variant-numeric:tabular-nums;
  min-width:3.6rem;text-align:right}
@media (max-width:520px){.fam{display:none}.droite{max-width:48%}}
#vide{display:none;color:var(--mut);text-align:center;padding:2rem .5rem;font-size:.85rem}
footer{margin-top:2.4rem;padding-top:.9rem;border-top:1px solid var(--border);
  color:var(--mut);font-size:.72rem;line-height:1.7}
footer code{color:var(--texte);font-size:.9em}
</style>
</head>
<body>
<div class="wrap">

<header>
  <h1>Prévisualisation <i>Autoboost</i></h1>
  <span class="compte"><b id="n">${items.length}</b> / ${items.length} routes</span>
</header>
<!-- Les outils de travail ne sont pas des maquettes, mais sans un lien ici ils
     n'existent pour personne : /tri-clips/ et /videos/ n'etaient references
     nulle part sur le site. -->
<p class="outils-bar"><a href="/outils/">Mes outils</a> · <a href="/studio-video/">Studio vidéo</a> · <a href="/tri/">Trier au pouce</a> · <a href="/carte/">La carte</a> — tout ce que j'ai fabriqué est rangé dans <a href="/outils/">Mes outils</a>.</p>

<div class="filtres">
  <input id="q" type="search" placeholder="Filtrer : nom de route, sujet, client…" autocomplete="off">
  <div class="chips" id="chips">
    <button class="chip" data-f="" aria-pressed="true">Tout <b>${items.length}</b></button>
${famillesTriees.map(([f, n]) => `    <button class="chip" data-f="${esc(f)}" aria-pressed="false">${esc(f)} <b>${n}</b></button>`).join('\n')}
    <button class="chip" data-f="__mp4" aria-pressed="false">Avec vidéo <b>${items.filter((i) => i.video).length}</b></button>
  </div>
</div>

${sections}

<p id="vide">Aucune route ne correspond.</p>

<footer>
  Sommaire généré automatiquement le ${esc(genere)} (heure de La Réunion) —
  ${items.length} routes, ${items.filter((i) => i.video).length} avec vidéo.<br>
  Il est reconstruit à chaque déploiement depuis les dossiers réellement présents :
  une route n'y figure que si elle contient un <code>index.html</code>.
  Pour le régénérer à la main : <code>node build-index.mjs</code>.
</footer>

</div>
<script>
(function(){
  var q = document.getElementById('q');
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var lis = [].slice.call(document.querySelectorAll('.grp li'));
  var grps = [].slice.call(document.querySelectorAll('.grp'));
  var n = document.getElementById('n');
  var vide = document.getElementById('vide');
  var fam = '';

  function appliquer(){
    var t = q.value.trim().toLowerCase();
    // Chaque mot doit matcher : « befresh beat » trouve la beat-sync BeFresh.
    var mots = t ? t.split(/\\s+/) : [];
    var vus = 0;
    lis.forEach(function(li){
      var okFam = !fam || (fam === '__mp4' ? li.dataset.mp4 === '1' : li.dataset.fam === fam);
      var k = li.dataset.k;
      var okTxt = mots.every(function(w){ return k.indexOf(w) !== -1; });
      var ok = okFam && okTxt;
      li.style.display = ok ? '' : 'none';
      if (ok) vus++;
    });
    // Un titre de groupe sans aucune ligne visible — ou qui annonce 109 quand
    // une seule reste — est un titre qui ment. Il suit le filtre.
    grps.forEach(function(g){
      var dedans = [].slice.call(g.querySelectorAll('li')).filter(function(li){
        return li.style.display !== 'none';
      }).length;
      g.style.display = dedans ? '' : 'none';
      g.querySelector('h2 b').textContent = dedans;
    });
    n.textContent = vus;
    vide.style.display = vus ? 'none' : 'block';
  }

  q.addEventListener('input', appliquer);
  chips.forEach(function(c){
    c.addEventListener('click', function(){
      fam = c.dataset.f;
      chips.forEach(function(x){ x.setAttribute('aria-pressed', String(x === c)); });
      appliquer();
    });
  });
  // Échap vide la recherche sans toucher au filtre de famille.
  q.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){ q.value = ''; appliquer(); }
  });
})();
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);

// Le manifeste n'est réécrit que si git a parlé : dans l'image Docker, où git
// n'existe pas, on ne doit surtout pas l'écraser avec des mtimes de clone.
if (depuisGit) {
  const trie = Object.fromEntries([...manifeste.entries()].sort((a, b) => b[1] - a[1]));
  fs.writeFileSync(DATES, JSON.stringify(trie, null, 1) + '\n');
}

const parGroupe = GROUPES.map(([g]) => [g, items.filter((i) => i.groupe === g).length])
  .filter(([, n]) => n);
console.log(`  ${items.length} routes listées · ${items.filter((i) => i.video).length} avec vidéo`);
console.log('  groupes : ' + parGroupe.map(([g, n]) => `${g} ${n}`).join(' · '));
console.log('  dates : ' + (depuisGit ? `git (${depuisGit.size} routes, manifeste réécrit)` : `manifeste dates.json (${manifeste.size} routes)`));
console.log(`  descriptions conservées : ${connus.size}`);
