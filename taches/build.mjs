// Génère /taches/index.html à partir de taches.json.
//
// Pourquoi un générateur pour une seule page : parce qu'une page de suivi
// écrite à la main dérive dès la deuxième mise à jour. Les compteurs se
// désynchronisent du contenu, et un tableau de bord faux est pire que pas de
// tableau de bord — Tony arrête de le croire, et il a raison.
// Ici les compteurs sont calculés, jamais saisis.
import fs from 'fs';
import path from 'path';

const D = path.dirname(new URL(import.meta.url).pathname);
const data = JSON.parse(fs.readFileSync(path.join(D, 'taches.json'), 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── Les outils, déclarés ici et VÉRIFIÉS avant d'être affichés ───────────
 *
 * Cette page est le point d'entrée : c'est elle que Tony ouvre. Or plusieurs
 * outils construits ces derniers jours n'y figuraient pas du tout — la liste
 * des leads, l'audit des promesses CTA, les livrables prêts à envoyer. Des
 * pages en ligne, utiles, et introuvables autrement qu'en connaissant l'URL.
 * C'est la même erreur que la ressource DEVIS publiée sans sa carte d'index.
 *
 * Deux règles pour que ça ne se reproduise pas :
 *  · un outil ajouté = une ligne ici, pas une balise <a> perdue dans le HTML ;
 *  · chaque lien est APPELÉ à la génération. Une route qui ne répond pas
 *    n'apparaît pas — mieux vaut un outil manquant qu'un lien mort dans un
 *    tableau de bord, parce qu'un lien mort fait douter de toute la page.
 */
const OUTILS = [
  { h: '/taches/',                 n: 'Mes demandes',      q: 'où en est chaque chose' },
  { h: '/a-envoyer/',              n: 'À envoyer',         q: 'fini, jamais parti' },
  { h: '/leads-qualifies/',        n: 'Leads qualifiés',   q: 'qui appeler, et pourquoi' },
  { h: '/leads-restaurants/',      n: 'Tous les leads',    q: 'la liste complète' },
  { h: '/appels/',                 n: 'Appels',            q: 'ce qui a été dit' },
  { h: '/etude-concurrents/',      n: 'Étude concurrents', q: 'qui vend quoi, à quel prix' },
  { h: '/cta/',                    n: 'Promesses vidéo',   q: 'les mots-clés sans porte' },
  { h: '/carte/',                  n: 'La carte',          q: 'vue d\'ensemble' },
  { h: '/sites-clients/vue.html',  n: 'Sites clients',     q: 'galerie et avant/après' },
  { h: '/partage/',                n: 'À partager',        q: 'prêt à montrer' },
  { h: '/feed-html-vs-ia/',        n: 'Maquette feed',     q: 'HTML contre générateur' },
  { h: '/',                        n: 'Prévisualisation',  q: 'tous les rendus' },
];

const BASE = 'https://previsualisation.automatisationboost.com';
const AUTH = 'Basic ' + Buffer.from('tony:mGjmvScSTzjUySVBEcTJ').toString('base64');

const outilsVivants = [];
for (const o of OUTILS) {
  try {
    const r = await fetch(`${BASE}${o.h}?cb=${Math.random()}`, {
      headers: { Authorization: AUTH }, signal: AbortSignal.timeout(15000),
    });
    /* 401 est un succès sur les routes protégées : la page existe, elle est
       simplement verrouillée pour qui n'a pas le mot de passe. */
    if (r.status === 200 || r.status === 401) outilsVivants.push(o);
    else console.log(`  ⚠️  ${o.h} rend ${r.status} — retiré de la barre`);
  } catch (e) { console.log(`  ⚠️  ${o.h} injoignable (${e.name}) — retiré de la barre`); }
}

const ETATS = {
  livre:   { nom: 'Livré',            aide: 'testé en ligne, pas seulement poussé' },
  bloque:  { nom: 'Bloqué',           aide: 'une permission me refuse l\'action' },
  attente: { nom: 'En attente de toi', aide: "il me manque une décision ou une info" },
};

const n = e => data.taches.filter(t => t.etat === e).length;

// L axe « proximite du cash », demande par Tony. Il est ORTHOGONAL a l etat :
// une tache peut etre livree ET rouge — c est meme le cas le plus frequent ici,
// et c est tout le probleme : le travail proche de l argent est fait, il n est
// jamais parti.
const CASH = {
  direct: { pic: "€€€", nom: "Cash direct",  aide: "un prospect nomme est au bout, agir dessus peut facturer cette semaine" },
  proche: { pic: "€€",  nom: "Amene du cash", aide: "sert la vente sans etre facturable tel quel" },
  loin:   { pic: "€",   nom: "Convertible",  aide: "outillage interne — personne ne paie pour ca aujourd hui" },
};
const c = k => data.taches.filter(t => t.cash === k).length;
// Ce qui est PRET A ENVOYER : cash direct et deja livre. C est la liste la plus
// courte et la plus rentable de la page.
const aEnvoyer = data.taches.filter(t => t.cash === "direct" && t.etat === "livre");

const ligne = t => `<li class="t" data-etat="${t.etat}" data-cash="${t.cash}">
  <span class="pastille ${t.etat}" aria-hidden="true"></span>
  <div class="corps">
    <p class="titre"><span class="eur ${t.cash}" title="${esc(CASH[t.cash].nom)} — ${esc(t.cashNote || '')}">${CASH[t.cash].pic}</span>${esc(t.t)}</p>
    ${t.note ? `<p class="note">${esc(t.note)}</p>` : ''}
  </div>
  ${t.lien ? `<a class="voir" href="${esc(t.lien)}">Voir</a>` : '<span class="voir vide" aria-hidden="true"></span>'}
</li>`;

const ligneToi = (x) => {
  const t = (typeof x === 'string') ? { t: x } : (x || {});
  if (!t.t) return '';
  return `<li class="t toi">
  <span class="pastille toi" aria-hidden="true"></span>
  <div class="corps">
    <p class="titre">${esc(t.t)}</p>
    ${t.note ? `<p class="note">${esc(t.note)}</p>` : ''}
  </div>
</li>`;
};

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Où en sont mes demandes</title>
<style>
:root{
  --fond:#0e1013; --carte:#16191e; --bord:#252a31;
  --texte:#e8eaed; --gris:#9aa3ad; --gris2:#6b747e;
  --vert:#3ecf8e; --ambre:#f0b429; --rouge:#e5544b; --bleu:#5b9dff;
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--fond); color:var(--texte);
  font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  -webkit-font-smoothing:antialiased;
}
.page{max-width:820px; margin:0 auto; padding:28px 18px 80px}
header h1{font-size:26px; line-height:1.2; margin:0 0 6px; letter-spacing:-.02em}
header p{margin:0; color:var(--gris); font-size:14px}
.nav{display:flex; flex-wrap:wrap; gap:7px; margin-top:12px}
.nav a{
  font-size:12.5px; color:var(--gris); text-decoration:none;
  border:1px solid var(--bord); border-radius:99px; padding:4px 11px;
}
.nav a:hover{color:var(--texte); border-color:#39414b}
/* La page courante est marquée, sinon on ne sait plus où on est une fois
   qu'il y a onze entrées. */
.nav a.ici{color:var(--texte); border-color:#4a5462; background:#1b1f26}

/* Compteurs — cliquables, ils FILTRENT. Un chiffre qui ne fait rien
   quand on le touche, sur téléphone, passe pour un bug. */
.compteurs{display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:22px 0 8px}
.c{
  background:var(--carte); border:1px solid var(--bord); border-radius:12px;
  padding:12px 10px; text-align:left; cursor:pointer; color:inherit;
  font:inherit; transition:border-color .15s, background .15s;
}
.c:hover{border-color:#39414b}
.c[aria-pressed="true"]{background:#1d2229; border-color:#454f5b}
.c b{display:block; font-size:26px; line-height:1; font-variant-numeric:tabular-nums; margin-bottom:5px}
.c span{font-size:12px; color:var(--gris); display:block}
.c.livre b{color:var(--vert)} .c.bloque b{color:var(--rouge)} .c.attente b{color:var(--ambre)}
.aide{font-size:12px; color:var(--gris2); margin:0 0 20px; min-height:16px}

/* ── L'axe « proximité du cash » ──────────────────────────────────────────
   Il se lit AVEC l'état, pas à sa place : le marqueur € est posé devant le
   titre, la pastille d'état reste à gauche. Deux informations, deux endroits. */
.eur{
  display:inline-block; font-weight:700; font-size:11px; letter-spacing:.04em;
  padding:2px 6px; border-radius:5px; margin-right:8px; vertical-align:2px;
  font-variant-numeric:tabular-nums; white-space:nowrap;
}
.eur.direct{color:#ffd9d6; background:rgba(229,84,75,.20); border:1px solid rgba(229,84,75,.55)}
.eur.proche{color:#ffe6bd; background:rgba(240,180,41,.16); border:1px solid rgba(240,180,41,.48)}
.eur.loin  {color:#c9f2df; background:rgba(62,207,142,.13); border:1px solid rgba(62,207,142,.40)}

.cash-f{display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:0 0 8px}
.cf{
  background:var(--carte); border:1px solid var(--bord); border-radius:12px;
  padding:11px 10px; text-align:left; cursor:pointer; color:inherit; font:inherit;
  transition:border-color .15s, background .15s;
}
.cf:hover{border-color:#39414b}
.cf[aria-pressed="true"]{background:#1d2229; border-color:#454f5b}
.cf b{display:block; font-size:22px; line-height:1; font-variant-numeric:tabular-nums; margin-bottom:4px}
.cf span{font-size:11.5px; color:var(--gris); display:block; line-height:1.3}
.cf.direct b{color:var(--rouge)} .cf.proche b{color:var(--ambre)} .cf.loin b{color:var(--vert)}

/* Le bloc d'envoi : la liste la plus courte et la plus rentable de la page. */
.envoi{
  border:1px solid rgba(229,84,75,.45); background:linear-gradient(180deg,#1d1416,#16191e);
  border-radius:13px; padding:16px 16px 14px; margin:22px 0 0;
}
.envoi h3{margin:0 0 4px; font-size:15px; letter-spacing:-.01em}
.envoi>p{margin:0 0 12px; font-size:13px; color:var(--gris); line-height:1.5}
.envoi ol{margin:0; padding:0 0 0 0; list-style:none; display:flex; flex-direction:column; gap:7px}
.envoi li{display:flex; gap:10px; align-items:center; font-size:14px; line-height:1.4}
.envoi li a{color:var(--bleu); text-decoration:none; border:1px solid #2c3b52;
  border-radius:7px; padding:3px 9px; font-size:12.5px; flex:0 0 auto; margin-left:auto}
.envoi li a:hover{background:#182338}
.envoi .pt{width:6px; height:6px; border-radius:50%; background:var(--rouge); flex:0 0 6px}

h2{font-size:13px; text-transform:uppercase; letter-spacing:.09em; color:var(--gris);
   margin:30px 0 10px; font-weight:600}
ul{list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px}
.t{
  display:flex; gap:11px; align-items:flex-start;
  background:var(--carte); border:1px solid var(--bord); border-radius:11px; padding:12px 13px;
}
.t[hidden]{display:none}
.pastille{width:8px; height:8px; border-radius:50%; margin-top:8px; flex:0 0 8px}
.pastille.livre{background:var(--vert)} .pastille.bloque{background:var(--rouge)}
.pastille.attente{background:var(--ambre)} .pastille.toi{background:var(--bleu)}
.corps{flex:1; min-width:0}
.titre{margin:0; font-size:15px; line-height:1.4}
.note{margin:4px 0 0; font-size:13px; color:var(--gris); line-height:1.45}
.voir{
  flex:0 0 auto; font-size:13px; color:var(--bleu); text-decoration:none;
  border:1px solid #2c3b52; border-radius:7px; padding:4px 10px; margin-top:1px;
}
.voir:hover{background:#182338}
.voir.vide{border:0; padding:0; width:0}
.toi .titre{font-weight:500}
.rappel{
  border:1px solid #2a3446; background:#141a24; border-radius:11px;
  padding:13px 14px; margin:10px 0 0; font-size:13.5px; color:#b8c4d4; line-height:1.5;
}
footer{margin-top:34px; font-size:12px; color:var(--gris2); line-height:1.6}
@media(max-width:520px){
  .compteurs{grid-template-columns:1fr 1fr 1fr; gap:7px}
  .c{padding:10px 8px} .c b{font-size:22px} .c span{font-size:11px}
  header h1{font-size:22px}
}
</style>
</head>
<body>
<div class="page">

<header>
  <h1>Où en sont mes demandes</h1>
  <p>Tout ce que tu m'as demandé, et où ça en est. Mis à jour le ${esc(data.maj)}.</p>
  <nav class="nav">
${outilsVivants.map(o => `    <a href="${esc(o.h)}"${o.h === '/taches/' ? ' class="ici"' : ''} title="${esc(o.q)}">${esc(o.n)}</a>`).join('\n')}
  </nav>
</header>

<div class="compteurs">
  <button class="c livre"   data-f="livre"   aria-pressed="false"><b>${n('livre')}</b><span>Livré</span></button>
  <button class="c bloque"  data-f="bloque"  aria-pressed="false"><b>${n('bloque')}</b><span>Bloqué</span></button>
  <button class="c attente" data-f="attente" aria-pressed="false"><b>${n('attente')}</b><span>Attend toi</span></button>
</div>
<p class="aide" id="aide">Touche un chiffre pour ne voir que celles-là.</p>

<h2>Proximité du cash</h2>
<div class="cash-f">
  <button class="cf direct" data-c="direct" aria-pressed="false"><b>${c('direct')}</b><span>€€€ Cash direct</span></button>
  <button class="cf proche" data-c="proche" aria-pressed="false"><b>${c('proche')}</b><span>€€ Amène du cash</span></button>
  <button class="cf loin"   data-c="loin"   aria-pressed="false"><b>${c('loin')}</b><span>€ Convertible</span></button>
</div>
<p class="aide" id="aideCash">Rouge : un prospect nommé est au bout. Vert : utile, mais personne ne paie pour ça aujourd'hui.</p>

<div class="envoi">
  <h3>À envoyer maintenant</h3>
  <p>${aEnvoyer.length} tâches sont à la fois <strong>cash direct</strong> et <strong>déjà livrées</strong>.
  Le travail est fait, il n'est simplement jamais parti. C'est là qu'est ton argent — pas dans ce qui reste à construire.</p>
  <ol>
${aEnvoyer.map(t => `    <li><span class="pt"></span><span>${esc(t.t)}</span>${t.lien ? `<a href="${esc(t.lien)}">Ouvrir</a>` : ''}</li>`).join('\n')}
  </ol>
</div>

<h2>De mon côté</h2>
<ul id="liste">
${data.taches.map(ligne).join('\n')}
</ul>
<p class="rappel" id="rien" hidden>Rien dans cette catégorie.</p>

<h2>De ton côté — personne d'autre ne peut le faire</h2>
<ul>
${data.aToi.map(ligneToi).join('\n')}
</ul>

<footer>
  ${esc(data.note)}<br>
  Les ${data.aToi.length} lignes bleues ne sont pas des tâches que je peux prendre : ce sont des appels
  et des connexions de compte. C'est là que se trouve ton chiffre d'affaires, pas ici.
</footer>

</div>

<script>
// Filtre. Un second clic sur le même chiffre remet tout — sinon on reste
// coincé dans une vue sans savoir comment en sortir.
var boutons = [].slice.call(document.querySelectorAll('.c'));
var items = [].slice.call(document.querySelectorAll('#liste .t'));
var aide = document.getElementById('aide');
var rien = document.getElementById('rien');
var AIDES = ${JSON.stringify(Object.fromEntries(Object.entries(ETATS).map(([k, v]) => [k, v.nom + ' — ' + v.aide])))};
// Les deux axes se combinent : on peut demander « bloqué ET cash direct ».
// Les garder indépendants évite d'avoir à inventer six boutons croisés.
var bCash = [].slice.call(document.querySelectorAll('.cf'));
var aideCash = document.getElementById('aideCash');
var AIDES_CASH = ${JSON.stringify(Object.fromEntries(Object.entries(CASH).map(([k, v]) => [k, v.pic + ' ' + v.nom + ' — ' + v.aide])))};
var actif = null;
var actifCash = null;

function appliquer(){
  var vus = 0;
  items.forEach(function(li){
    var ok = (!actif || li.dataset.etat === actif) && (!actifCash || li.dataset.cash === actifCash);
    li.hidden = !ok;
    if (ok) vus++;
  });
  rien.hidden = vus > 0;
  boutons.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.f === actif)); });
  bCash.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.c === actifCash)); });
  aide.textContent = actif ? AIDES[actif] : 'Touche un chiffre pour ne voir que celles-là.';
  aideCash.textContent = actifCash ? AIDES_CASH[actifCash]
    : "Rouge : un prospect nommé est au bout. Vert : utile, mais personne ne paie pour ça aujourd'hui.";
}

boutons.forEach(function(b){
  b.addEventListener('click', function(){
    actif = (actif === b.dataset.f) ? null : b.dataset.f;
    appliquer();
  });
});
bCash.forEach(function(b){
  b.addEventListener('click', function(){
    actifCash = (actifCash === b.dataset.c) ? null : b.dataset.c;
    appliquer();
  });
});
appliquer();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(D, 'index.html'), html);
console.log(`  taches/index.html · ${data.taches.length} demandes (${n('livre')} livrées, ${n('bloque')} bloquées, ${n('attente')} en attente) · ${data.aToi.length} pour Tony`);
