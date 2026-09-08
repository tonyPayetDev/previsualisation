/* La page « À envoyer » — la seule étape de la chaîne où plus rien ne bougeait.
 *
 * Constat du 2026-09-08 : 106 maquettes existent, 53 sont marquées envoyables,
 * et l'ancienne version de cette page — figée au 26/08 — n'en listait que 6.
 * Les deux générateurs n8n qui fabriquaient des sites sont morts fin août
 * (crédits OpenAI et Anthropic épuisés), mais ce n'est pas le manque : le stock
 * est là, c'est l'envoi qui ne part pas.
 *
 * Cette page n'est donc plus un instantané. Elle lit les décisions EN DIRECT
 * dans le même magasin que /tri-sites/ et vue.html (webhook `sites-etat`) :
 * ce que Tony marque « envoyable » au pouce apparaît ici sans regenerer quoi
 * que ce soit. Et ce qu'il envoie se coche ici, dans le même objet.
 */
import fs from 'fs';
import path from 'path';

const BASE = '/work/previsualisation';
const DOSSIER = path.join(BASE, 'sites-clients');
const OUT = path.join(BASE, 'a-envoyer', 'index.html');

const sites = JSON.parse(fs.readFileSync('/tmp/sites.json', 'utf8'));
const journal = fs.existsSync('/tmp/capture-journal.json')
  ? JSON.parse(fs.readFileSync('/tmp/capture-journal.json', 'utf8')) : [];
const routeDe = Object.fromEntries(journal.map((j) => [j.dir, j.route]));
const urlDe = Object.fromEntries(journal.filter((j) => !j.err).map((j) => [j.dir, j.url]));
const LEUR = Object.fromEntries(
  (fs.existsSync(path.join(DOSSIER, 'audit-avant.json'))
    ? JSON.parse(fs.readFileSync(path.join(DOSSIER, 'audit-avant.json'), 'utf8'))
    : []).filter((x) => x && x.dir).map((x) => [x.dir, x]));

/* Un fait mesuré chez EUX, ou rien. On ne reproche jamais un défaut qu'on n'a
   pas relevé : le site qui n'a pas répondu n'a pas de mesure. */
function fait(dir) {
  const x = LEUR[dir]; if (!x) return '';
  const t = x.tel || x.mesure; if (!t) return '';
  if (t.viewportMeta === false) return "votre site n'a pas de balise viewport : sur un téléphone il s'affiche à la taille d'un écran d'ordinateur";
  if (t.debordement > 8) return `sur un écran de téléphone votre page déborde de ${t.debordement} px sur la droite`;
  const b = t.boutons || [];
  const gros = b.filter((z) => z.partVw >= 90).length;
  if (gros) return `${gros} de vos boutons prennent toute la largeur de l'écran sur mobile`;
  const petit = b.filter((z) => z.police && z.police < 12).length;
  if (petit) return `${petit} de vos boutons ont un texte sous 12 px`;
  return '';
}

const SITE = 'https://previsualisation.automatisationboost.com';
const items = sites.map((s) => {
  const route = routeDe[s.dir] || ('client-' + s.dir);
  const f = fait(s.dir);
  const lien = `${SITE}/${route}/`;
  const msg = `Bonjour,\n\nTony PAYET, j'automatise et je fabrique des sites pour des entreprises de La Réunion.\n\n`
    + `J'ai refait une page pour ${s.nom}, sans rien vous demander. Elle est visible ici, elle n'engage à rien :\n${lien}\n\n`
    + (f ? `Ce qui m'a fait la faire : ${f}.\n\n` : '')
    + `Si elle vous plaît, on cale un quart d'heure et je vous la mets en ligne. Si elle ne vous plaît pas, dites-le-moi, ça se jette.\n\n`
    + `Tony PAYET — AutomatisationBoost\ntony.payet.professionnel@gmail.com`;
  return {
    /* `etatDef` : l'etat calcule par l'audit, celui qu'affiche deja vue.html
       quand Tony n'a rien decide lui-meme. Sans ce repli la page affichait
       zero, alors que 53 maquettes sont envoyables — le magasin n8n ne contient
       que 10 decisions manuelles, toutes des abandons. */
    dir: s.dir, nom: s.nom, act: s.act || '', tel: s.tel || '', route, lien, fait: f, msg,
    etatDef: s.etat || '',
    vig: fs.existsSync(path.join(DOSSIER, 'vignettes', s.dir + '.jpg')) ? `/sites-clients/vignettes/${s.dir}.jpg` : '',
    leur: urlDe[s.dir] || '',
  };
}).filter((i) => i.vig).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>À envoyer</title>
<style>
:root{--bg:#0a0a0f;--carte:#15151c;--bord:#26262e;--or:#eab308;--vert:#4ade80;--mut:#8b8b96;--txt:#f2f2f5}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--txt);font:400 15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:26px 16px 70px}
.w{max-width:860px;margin:0 auto}
h1{font-size:clamp(23px,4.4vw,31px);letter-spacing:-.02em}
.s{color:var(--mut);max-width:60ch;margin:9px 0 4px}
.n{color:var(--mut);font-size:13px;max-width:60ch;margin-bottom:18px}
.tm{font-size:12px;color:var(--mut)}
.tm.ok{color:var(--vert)} .tm.ko{color:#ef6461} .tm.encours{color:var(--or)}
.total{display:flex;align-items:baseline;gap:9px;margin:14px 0 6px}
.total b{font-size:34px;line-height:1}
.total span{color:var(--mut);font-size:13.5px}
.jauge{height:5px;background:#1c1c24;border-radius:3px;overflow:hidden;margin-bottom:20px}
.jauge i{display:block;height:100%;background:var(--or);width:0;transition:width .3s}
.filtres{display:flex;gap:7px;margin-bottom:16px;flex-wrap:wrap}
.filtres button{background:#16161d;border:1px solid var(--bord);color:var(--mut);border-radius:8px;padding:8px 12px;font:700 12.5px/1 inherit}
.filtres button[aria-pressed=true]{border-color:var(--or);color:var(--or)}
ul{list-style:none;display:grid;gap:13px}
li{background:var(--carte);border:1px solid var(--bord);border-radius:13px;padding:13px;display:grid;
  grid-template-columns:96px 1fr;gap:13px;align-items:start}
li.ok{opacity:.5}
li img{width:96px;height:128px;object-fit:cover;object-position:top center;border-radius:8px;background:#000}
h2{font-size:16.5px;letter-spacing:-.01em}
li.ok h2{text-decoration:line-through}
.meta{color:var(--mut);font-size:12.5px;margin-top:2px}
.f{color:var(--or);font-size:12.5px;margin-top:4px}
details{margin-top:8px}
summary{cursor:pointer;color:var(--mut);font-size:13px}
textarea{width:100%;margin-top:7px;background:#101018;border:1px solid var(--bord);color:var(--txt);
  border-radius:9px;padding:9px 11px;font:inherit;font-size:13px;min-height:150px;resize:vertical}
.btns{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}
.btns button,.btns a{font:700 12.5px/1 inherit;text-decoration:none;border-radius:8px;padding:9px 12px;
  background:#1c1c25;border:1px solid var(--bord);color:var(--txt)}
.btns .env{background:var(--or);border-color:var(--or);color:#1a1200}
.btns .cp.fait{border-color:var(--vert);color:var(--vert)}
li.ok .btns .env{background:none;border-color:var(--vert);color:var(--vert)}
.vide{color:var(--mut);padding:26px 0}
@media (max-width:560px){li{grid-template-columns:72px 1fr}li img{width:72px;height:96px}}
</style>
<div class="w">
<h1>À envoyer</h1>
<p class="s">Les maquettes que tu as marquées envoyables dans <a href="/tri-sites/" style="color:var(--or)">Trier les sites</a>.
Le message est déjà écrit, avec le lien vers la page. Tu copies, tu envoies, tu coches.</p>
<p class="n">Cette liste se lit en direct : ce que tu décides au pouce arrive ici sans que rien ne soit regénéré.
Le message ne cite un défaut que s'il a été mesuré sur leur vrai site. <span class="tm" id="tm">lecture…</span></p>

<div class="total"><b id="fait">0</b><span>envoyées sur <span id="tot">0</span> à envoyer</span></div>
<div class="jauge"><i id="jauge"></i></div>
<div class="filtres">
  <button id="fOk" aria-pressed="true">Envoyables</button>
  <button id="fFix" aria-pressed="false">Aussi « à corriger »</button>
  <button id="fTout" aria-pressed="false">Tout le stock</button>
</div>
<ul id="liste"></ul>
<p class="vide" id="vide" hidden>Rien à envoyer pour l'instant — passe d'abord par <a href="/tri-sites/" style="color:var(--or)">Trier les sites</a>.</p>
</div>
<script>
var SITES = ${JSON.stringify(items)};
(function(){
  var SERVEUR = 'https://n7n.automatisationboost.com/webhook/sites-etat';
  var CLE = 'etat_sites_clients';
  var etat = {}; try { etat = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (_) {}
  var tm = document.getElementById('tm');
  function dire(t,c){ tm.textContent = t; tm.className = 'tm ' + (c||''); }
  function cache(){ try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (_) {} }
  var enVol=false, sale=false, min=null;
  function envoyer(){
    if (enVol){ sale = true; return; }
    enVol = true; sale = false; dire('enregistrement…','encours');
    fetch(SERVEUR,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(etat)})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(){ dire('enregistré','ok'); })
      .catch(function(){ dire('hors ligne — gardé sur cet appareil','ko'); })
      .then(function(){ enVol=false; if(sale) envoyer(); });
  }
  function sauver(){ cache(); if(min) clearTimeout(min); min=setTimeout(function(){min=null;envoyer();},600); }

  var mode='ok';
  var liste=document.getElementById('liste'), vide=document.getElementById('vide');
  function retenus(){
    return SITES.filter(function(s){
      /* La decision de Tony prime ; a defaut, l'etat de l'audit. */
      var e = (etat[s.dir]||{}).etat || s.etatDef;
      if (mode==='tout') return true;
      if (mode==='fix') return e==='ok'||e==='fix';
      return e==='ok';
    });
  }
  function peindre(){
    var l = retenus();
    document.getElementById('tot').textContent = l.length;
    var n = l.filter(function(s){ return (etat[s.dir]||{}).envoye; }).length;
    document.getElementById('fait').textContent = n;
    document.getElementById('jauge').style.width = l.length ? Math.round(n/l.length*100)+'%' : '0%';
    vide.hidden = l.length > 0;
    liste.innerHTML = l.map(function(s){
      var d = etat[s.dir]||{};
      return '<li data-dir="'+s.dir+'"'+(d.envoye?' class="ok"':'')+'>'
        + '<img src="'+s.vig+'" alt="Maquette de '+s.nom.replace(/"/g,'&quot;')+'" loading="lazy">'
        + '<div><h2>'+s.nom+'</h2>'
        + '<div class="meta">'+[s.act, s.tel,
            ((d.etat||s.etatDef)==='fix')?'marquée à corriger':'',
            d.etat?'':'état de l\u2019audit — pas encore trié'].filter(Boolean).join(' · ')+'</div>'
        + (s.fait?'<div class="f">Chez eux : '+s.fait+'</div>':'')
        + (d.note?'<div class="meta">Ta note : '+d.note+'</div>':'')
        + '<details><summary>Voir le message</summary><textarea class="msg">'+s.msg.replace(/</g,'&lt;')+'</textarea></details>'
        + '<div class="btns">'
        + '<button class="cp" type="button">Copier</button>'
        + '<a href="'+s.lien+'" target="_blank" rel="noopener">La maquette</a>'
        + (s.tel?'<a href="tel:'+s.tel+'">Appeler</a><a href="sms:'+s.tel+'">SMS</a>':'')
        + '<button class="env" type="button">'+(d.envoye?'✓ envoyée':'Marquer envoyée')+'</button>'
        + '</div></div></li>';
    }).join('');
    liste.querySelectorAll('li').forEach(function(li){
      var dir = li.dataset.dir;
      li.querySelector('.cp').onclick = function(e){
        var t = li.querySelector('.msg').value;
        var ok = function(){ e.target.classList.add('fait'); e.target.textContent='Copié'; 
          setTimeout(function(){ e.target.classList.remove('fait'); e.target.textContent='Copier'; },1500); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, ok);
        else { li.querySelector('details').open = true; li.querySelector('.msg').select(); ok(); }
      };
      li.querySelector('.env').onclick = function(){
        var d = etat[dir] || { f:0, note:'' };
        if (d.envoye) delete d.envoye; else d.envoye = new Date().toISOString();
        etat[dir] = d; sauver(); peindre();
      };
    });
  }
  function filtre(m){
    mode = m;
    document.getElementById('fOk').setAttribute('aria-pressed', m==='ok');
    document.getElementById('fFix').setAttribute('aria-pressed', m==='fix');
    document.getElementById('fTout').setAttribute('aria-pressed', m==='tout');
    peindre();
  }
  document.getElementById('fOk').onclick = function(){ filtre('ok'); };
  document.getElementById('fFix').onclick = function(){ filtre('fix'); };
  document.getElementById('fTout').onclick = function(){ filtre('tout'); };

  dire('lecture…','encours');
  fetch(SERVEUR,{cache:'no-store'})
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(j){ var d={}; try{ d=JSON.parse(j.donnees||'{}'); }catch(_){}
      if (Object.keys(d).length===0 && Object.keys(etat).length>0){ dire('appareil plus récent — envoi','encours'); envoyer(); }
      else { etat=d; cache(); dire('à jour','ok'); } })
    .catch(function(){ dire('hors ligne — décisions locales','ko'); })
    .then(peindre);
})();
</script>
`;
fs.writeFileSync(OUT, html);
console.log(`${items.length} maquettes dans le catalogue · ${OUT}`);
