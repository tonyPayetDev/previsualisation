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

const ETATS = {
  livre:   { nom: 'Livré',            aide: 'testé en ligne, pas seulement poussé' },
  bloque:  { nom: 'Bloqué',           aide: 'une permission me refuse l\'action' },
  attente: { nom: 'En attente de toi', aide: "il me manque une décision ou une info" },
};

const n = e => data.taches.filter(t => t.etat === e).length;

const ligne = t => `<li class="t" data-etat="${t.etat}">
  <span class="pastille ${t.etat}" aria-hidden="true"></span>
  <div class="corps">
    <p class="titre">${esc(t.t)}</p>
    ${t.note ? `<p class="note">${esc(t.note)}</p>` : ''}
  </div>
  ${t.lien ? `<a class="voir" href="${esc(t.lien)}">Voir</a>` : '<span class="voir vide" aria-hidden="true"></span>'}
</li>`;

const ligneToi = t => `<li class="t toi">
  <span class="pastille toi" aria-hidden="true"></span>
  <div class="corps">
    <p class="titre">${esc(t.t)}</p>
    ${t.note ? `<p class="note">${esc(t.note)}</p>` : ''}
  </div>
</li>`;

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
</header>

<div class="compteurs">
  <button class="c livre"   data-f="livre"   aria-pressed="false"><b>${n('livre')}</b><span>Livré</span></button>
  <button class="c bloque"  data-f="bloque"  aria-pressed="false"><b>${n('bloque')}</b><span>Bloqué</span></button>
  <button class="c attente" data-f="attente" aria-pressed="false"><b>${n('attente')}</b><span>Attend toi</span></button>
</div>
<p class="aide" id="aide">Touche un chiffre pour ne voir que celles-là.</p>

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
  Les 7 lignes bleues ne sont pas des tâches que je peux prendre : ce sont des appels
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
var actif = null;

function appliquer(){
  var vus = 0;
  items.forEach(function(li){
    var ok = !actif || li.dataset.etat === actif;
    li.hidden = !ok;
    if (ok) vus++;
  });
  rien.hidden = vus > 0;
  boutons.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.f === actif)); });
  aide.textContent = actif ? AIDES[actif] : 'Touche un chiffre pour ne voir que celles-là.';
}

boutons.forEach(function(b){
  b.addEventListener('click', function(){
    actif = (actif === b.dataset.f) ? null : b.dataset.f;
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
