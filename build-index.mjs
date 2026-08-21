// Régénère la page d'index de previsualisation depuis les dossiers réels.
//
// Pourquoi un générateur et pas une page écrite à la main : l'ancienne listait
// 150 entrées pour 297 routes existantes. Chaque publication ajoutait un dossier
// sans toucher l'index, donc la moitié du travail était invisible.
//
// Les descriptions déjà écrites dans l'ancien index sont conservées : elles ont
// de la valeur, elles ne sont pas reconstructibles depuis le nom du dossier.
import fs from 'fs';
import path from 'path';

const BASE = '/work/previsualisation';
const OUT = path.join(BASE, 'index.html');

// --- 1. Les descriptions vivent dans un fichier à part -------------------------
// Elles étaient relues depuis index.html : au deuxième passage le générateur
// relisait sa PROPRE sortie, ne reconnaissait plus ses balises, et les 150
// descriptions disparaissaient d'un coup. Elles sont maintenant dans un sidecar,
// donc régénérer la page autant de fois qu'on veut ne détruit plus rien.
//
// Pour décrire une nouvelle route : ajouter son entrée dans descriptions.json
// sous la forme { "nom-de-route": { "nom": "...", "badge": "..." } }.
const SIDECAR = path.join(BASE, 'descriptions.json');
const connus = new Map(Object.entries(
  fs.existsSync(SIDECAR) ? JSON.parse(fs.readFileSync(SIDECAR, 'utf8')) : {}
));

// --- 2. Scanner les dossiers ---------------------------------------------------
const IGNORE = new Set(['.git', '.claude', 'node_modules', 'assets', 'cartographie']);
const routes = fs.readdirSync(BASE, { withFileTypes: true })
  .filter(d => d.isDirectory() && !IGNORE.has(d.name) && !d.name.startsWith('.'))
  .map(d => d.name)
  .sort();

// La famille sert de filtre. Elle se lit sur le préfixe du nom de route :
// c'est la seule information fiable sans ouvrir 297 dossiers.
const FAMILLES = [
  [/^journal-ia/,            'Journal IA'],
  [/^prompt-reveal/,         'Prompt reveal'],
  [/^befresh/,               'BeFresh'],
  [/^foodboost/,             'FoodBoost'],
  [/^essai/,                 'Essais'],
  [/^shortforge/,            'ShortForge'],
  [/^autoboost|^veille/,     'Autoboost'],
  [/^koytcha/,               'Koytcha'],
  [/^family-arena/,          'Family Arena'],
  [/^automatisationboost/,   'Site Autoboost'],
  [/^client-|^site-/,        'Clients'],
];
const famille = (n) => (FAMILLES.find(([r]) => r.test(n)) || [, 'Divers'])[1];

// Les descriptions montent jusqu'à 560 caractères, moyenne 85, et 50 dépassent
// 70. Sur une liste de 297 lignes ça devient illisible. On coupe à la dernière
// unité de sens avant la limite — jamais au milieu d'un mot — et le texte
// entier reste dans l'infobulle ET dans l'index de recherche.
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

const items = routes.map(nom => {
  const dir = path.join(BASE, nom);
  let fichiers = [];
  try { fichiers = fs.readdirSync(dir); } catch { /* dossier illisible : on garde la route */ }
  const video = fichiers.some(f => f.endsWith('.mp4'));
  const page = fichiers.includes('index.html');
  const k = connus.get(nom);
  // Le badge ne garde que le statut : ce qui suit un tiret cadratin est du
  // detail technique, il descend sous le nom.
  let badge = k?.badge || "", detail = "";
  const coupe = badge.split(/\s+[—–-]\s+/);
  if (coupe.length > 1) { badge = coupe[0].trim(); detail = coupe.slice(1).join(" — ").trim(); }
  if (badge.length > 26) { detail = (badge + (detail ? " — " + detail : "")).trim(); badge = ""; }
  // mtime = tri par fraîcheur, bien plus utile que l'ordre alphabétique
  let t = 0;
  try { t = fs.statSync(dir).mtimeMs; } catch { /* ignore */ }
  return {
    nom,
    ...(() => {
      const c = court(k?.nom || nom);
      return { titre: c.court, titreComplet: c.complet, coupe: c.coupe };
    })(),
    badge, detail,
    famille: famille(nom),
    video, page, t,
  };
});

items.sort((a, b) => b.t - a.t);

const parFamille = {};
for (const it of items) parFamille[it.famille] = (parFamille[it.famille] || 0) + 1;
const famillesTriees = Object.entries(parFamille).sort((a, b) => b[1] - a[1]);

// Les descriptions stockees portent deja des entites HTML (&amp;, &#039;) :
// les re-echapper afficherait « &amp; » en clair. On decode d abord, on echappe ensuite.
const dec = s => String(s)
  .replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#8217;/g, "’").replace(/&nbsp;/g, " ");
const esc = s => dec(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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

/* Barre de filtre — collante, pour rester accessible sur 297 entrées */
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

ul{list-style:none;margin:.6rem 0 0;padding:0;display:flex;flex-direction:column;gap:.4rem}
li a{display:flex;max-width:100%;overflow:hidden;justify-content:space-between;align-items:center;gap:.7rem;
  background:var(--panel);border:1px solid var(--border);border-radius:9px;
  padding:.65rem .85rem;text-decoration:none;color:var(--texte);transition:border-color .15s}
li a:hover{border-color:var(--jaune);background:var(--panel-2)}
.nom{font-size:.86rem;font-weight:500;min-width:0;overflow-wrap:anywhere}
.nom small{display:block;color:var(--mut);font-size:.72rem;font-weight:400;margin-top:.12rem}
.droite{display:flex;align-items:center;gap:.4rem;flex-shrink:0;max-width:55%;overflow:hidden}
.fam{font-size:.66rem;color:var(--mut);border:1px solid var(--border);
  padding:.16rem .45rem;border-radius:999px;white-space:nowrap}
.badge{font-size:.66rem;font-weight:600;padding:.16rem .45rem;border-radius:999px;
  white-space:nowrap;max-width:11rem;overflow:hidden;text-overflow:ellipsis;background:rgba(234,179,8,.12);color:var(--jaune);
  border:1px solid rgba(234,179,8,.28)}
.mp4{font-size:.66rem;color:var(--violet);border:1px solid rgba(139,92,246,.3);
  padding:.16rem .4rem;border-radius:999px}
#vide{display:none;color:var(--mut);text-align:center;padding:2rem .5rem;font-size:.85rem}
</style>
</head>
<body>
<div class="wrap">

<header>
  <h1>Prévisualisation <i>Autoboost</i></h1>
  <span class="compte"><b id="n">${items.length}</b> / ${items.length} routes</span>
</header>

<div class="filtres">
  <input id="q" type="search" placeholder="Filtrer : nom de route, sujet, client…" autocomplete="off">
  <div class="chips" id="chips">
    <button class="chip" data-f="" aria-pressed="true">Tout <b>${items.length}</b></button>
${famillesTriees.map(([f, n]) => `    <button class="chip" data-f="${esc(f)}" aria-pressed="false">${esc(f)} <b>${n}</b></button>`).join('\n')}
    <button class="chip" data-f="__mp4" aria-pressed="false">Avec vidéo <b>${items.filter(i => i.video).length}</b></button>
  </div>
</div>

<ul id="liste">
${items.map(i => `  <li data-fam="${esc(i.famille)}" data-mp4="${i.video ? 1 : 0}" data-k="${esc((i.nom + ' ' + i.titreComplet + ' ' + i.famille).toLowerCase())}"><a href="/${esc(i.nom)}/"${i.coupe ? ` title="${esc(i.titreComplet)}"` : ''}>
    <span class="nom">${esc(i.titre === i.nom ? i.nom : i.titre)}${i.titre !== i.nom ? `<small>/${esc(i.nom)}</small>` : ''}${i.detail ? `<small>${esc(i.detail)}</small>` : ''}</span>
    <span class="droite">${i.video ? '<span class="mp4">mp4</span>' : ''}${i.badge ? `<span class="badge">${esc(i.badge)}</span>` : ''}<span class="fam">${esc(i.famille)}</span></span>
  </a></li>`).join('\n')}
</ul>

<p id="vide">Aucune route ne correspond.</p>

</div>
<script>
(function(){
  var q = document.getElementById('q');
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var lis = [].slice.call(document.querySelectorAll('#liste li'));
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
console.log(`  ${items.length} routes · ${famillesTriees.length} familles · ${items.filter(i => i.video).length} avec vidéo`);
console.log('  familles : ' + famillesTriees.map(([f, n]) => `${f} ${n}`).join(' · '));
console.log(`  descriptions conservées : ${connus.size}`);
