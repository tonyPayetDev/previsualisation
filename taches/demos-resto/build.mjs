/* La page de gestion des démos restaurant — AVANT l'envoi.
 *
 * Elle vit sous /taches/, donc derrière le mot de passe : elle porte des emails
 * et des téléphones de tiers, et la règle du dépôt public s'applique.
 *
 * Ce qu'elle fait et que rien d'autre ne faisait : mettre côte à côte, pour
 * chaque restaurant, ce qu'il a (une démo, un email, un téléphone) et ce qui
 * lui manque. On envoie à ceux qui sont complets, on appelle les autres. Sans
 * ça, on découvre au moment d'envoyer qu'il n'y a pas d'adresse.
 */
import fs from 'node:fs';
import path from 'node:path';

const DEMO = '/work/resto-automatisationboost/demo';
const OUT = '/work/previsualisation/taches/demos-resto/index.html';
const R = 'https://resto.automatisationboost.com';

const infos = JSON.parse(fs.readFileSync('/tmp/claude-1000/demos/urls-tous.json', 'utf8'));
const leads = JSON.parse(fs.readFileSync('/work/previsualisation/taches/leads-qualifies-sheet.json', 'utf8')).leads;
const plat = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const parNom = Object.fromEntries(leads.map((l) => [plat(l.nom), l]));

const fiches = fs.readdirSync(DEMO).filter((d) => fs.existsSync(path.join(DEMO, d, 'index.html'))).map((slug) => {
  const ph = fs.readdirSync(path.join(DEMO, slug, 'photos')).filter((x) => x.endsWith('.jpg')).sort();
  const i = infos[slug] || {};
  const l = parNom[plat(i.nom || slug)] || {};
  const nom = i.nom || slug;
  const email = (i.email || l.email || '').trim();
  const tel = (i.tel || l.telephone || '').trim();
  const note = l.note || '', avis = l.avis || '';
  /* Le message cite la note Google quand on l'a : c'est le seul chiffre qui
     appartient au restaurateur et qu'il ne conteste pas. */
  const accroche = note
    ? `Vous êtes notés ${String(note).replace('.', ',')} sur Google, sur ${avis} avis. Votre compte Instagram, lui, n'en dit rien.`
    : `J'ai regardé votre compte Instagram, et il ne raconte pas ce que vous faites en cuisine.`;
  const msg = `Bonjour,\n\nTony PAYET, je m'occupe de la présence réseaux de restaurants ici, à La Réunion.\n\n`
    + `${accroche}\n\n`
    + `J'ai monté une page qui montre à quoi ressemblerait votre feed, avec vos propres photos. `
    + `Elle n'est visible que par vous, rien n'a été publié :\n${R}/demo/${slug}/\n\n`
    + `Si ça vous parle, vous pouvez le monter vous-même et choisir quand publier :\n`
    + `${R}/foodboost-editeur/?client=${slug}\n\n`
    + `Trois publications offertes, vous validez avant que quoi que ce soit ne parte, et vous décidez `
    + `ensuite. Sinon dites-le-moi, ça se jette.\n\nTony PAYET — AutomatisationBoost\n06 92 41 77 49`;
  return { slug, nom, email, tel, note, avis, photos: ph.length,
           vignette: `${R}/demo/${slug}/photos/${ph[0]}`,
           objet: `${nom} — à quoi ressemblerait votre compte Instagram`, msg };
}).sort((a, b) => (b.email ? 1 : 0) - (a.email ? 1 : 0) || a.nom.localeCompare(b.nom, 'fr'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const avecMail = fiches.filter((f) => f.email).length;

const cartes = fiches.map((f) => `  <li data-id="${f.slug}"${f.email ? '' : ' class="sans"'}>
    <button class="case" aria-label="Marquer envoyé à ${esc(f.nom)}"><b></b></button>
    <img src="${esc(f.vignette)}" alt="" loading="lazy">
    <div class="c">
      <div class="tt">${esc(f.nom)}</div>
      <div class="ss">${f.note ? `Google ${String(f.note).replace('.', ',')} · ${f.avis} avis · ` : ''}${f.photos} photos${f.email ? '' : ' · <b>pas d’email</b>'}</div>
      ${f.email ? `<div class="mail">${esc(f.email)}</div>` : `<div class="mail vide">${f.tel ? 'À appeler : ' + esc(f.tel) : 'ni email ni téléphone'}</div>`}
      <details><summary>Voir le message</summary><textarea class="msg">${esc(f.msg)}</textarea></details>
      <div class="btns">
        <a class="bt" href="${R}/demo/${f.slug}/" target="_blank" rel="noopener">Voir la démo</a>
        <button class="bt cp" type="button">Copier</button>
        ${f.email
          ? `<a class="bt or" href="mailto:${esc(f.email)}?subject=${encodeURIComponent(f.objet)}">Écrire</a>`
          : (f.tel ? `<a class="bt or" href="tel:${esc(f.tel)}">Appeler</a>` : '')}
      </div>
    </div>
  </li>`).join('\n');

fs.writeFileSync(OUT, `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Démos restaurant — avant envoi</title>
<style>
:root{--bg:#0a0a0f;--carte:#15151c;--trait:#26262e;--or:#eab308;--vert:#4ade80;--mut:#8b8b96;--txt:#f2f2f5}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--txt);font:400 15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:26px 16px 70px}
.w{max-width:820px;margin:0 auto}
h1{font-size:clamp(23px,4.4vw,31px);letter-spacing:-.02em}
.s{color:var(--mut);max-width:62ch;margin:9px 0 4px}
.n{color:var(--mut);font-size:13px;max-width:62ch;margin-bottom:18px}
.total{display:flex;align-items:baseline;gap:9px;margin:14px 0 6px}
.total b{font-size:34px;line-height:1}.total span{color:var(--mut);font-size:13.5px}
.jauge{height:5px;background:#1c1c24;border-radius:3px;overflow:hidden;margin-bottom:20px}
.jauge i{display:block;height:100%;background:var(--or);width:0;transition:width .3s}
ul{list-style:none;display:grid;gap:13px}
li{background:var(--carte);border:1px solid var(--trait);border-radius:13px;padding:13px;
  display:grid;grid-template-columns:26px 92px 1fr;gap:12px;align-items:start}
li.sans{opacity:.72}
li.ok{opacity:.5}
li img{width:92px;height:120px;object-fit:cover;object-position:center;border-radius:8px;background:#000}
.case{width:24px;height:24px;border-radius:7px;border:1.5px solid var(--trait);background:none;cursor:pointer;padding:0}
li.ok .case{border-color:var(--vert);background:rgba(74,222,128,.14)}
li.ok .case b{display:block;width:100%;height:100%;position:relative}
li.ok .case b::after{content:"";position:absolute;left:7px;top:3px;width:6px;height:11px;
  border:solid var(--vert);border-width:0 2px 2px 0;transform:rotate(45deg)}
.tt{font-size:16.5px;font-weight:700;letter-spacing:-.01em}
li.ok .tt{text-decoration:line-through}
.ss{color:var(--mut);font-size:12.5px;margin-top:2px}
.ss b{color:#ef8f8c;font-weight:600}
.mail{font-size:13px;color:var(--or);margin-top:4px;word-break:break-all}
.mail.vide{color:var(--mut)}
details{margin-top:8px}summary{cursor:pointer;color:var(--mut);font-size:13px}
textarea{width:100%;margin-top:7px;background:#101018;border:1px solid var(--trait);color:var(--txt);
  border-radius:9px;padding:9px 11px;font:inherit;font-size:13px;min-height:170px;resize:vertical}
.btns{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}
.bt{font:700 12.5px/1 inherit;text-decoration:none;border-radius:8px;padding:9px 12px;
  background:#1c1c25;border:1px solid var(--trait);color:var(--txt);cursor:pointer}
.bt.or{background:var(--or);border-color:var(--or);color:#1a1200}
.bt.cp.fait{border-color:var(--vert);color:var(--vert)}
@media (max-width:560px){li{grid-template-columns:26px 1fr}li img{display:none}}
</style>
<div class="w">
<h1>Démos restaurant — avant envoi</h1>
<p class="s">Chaque démo est faite avec les photos du restaurant, relevées sur son propre site.
Tu la regardes, tu ajustes le message si tu veux, tu envoies, tu coches.</p>
<p class="n"><b>${avecMail} sur ${fiches.length}</b> ont un email : ce sont les seuls qu'on peut toucher
par écrit. Les autres se jouent au téléphone ou en DM — leur ligne le dit.
Sur les 1 519 restaurants de l'île recensés dans OpenStreetMap, 44 ont un email et 14 ont
un email <em>et</em> un site : c'est le plafond, pas un manque de recherche.</p>
<div class="total"><b id="fait">0</b><span>envoyées sur ${fiches.length}</span></div>
<div class="jauge"><i id="jauge"></i></div>
<ul id="liste">
${cartes}
</ul>
</div>
<script>
(function(){
  /* Les envois sont notes dans le magasin n8n partage — le meme que le tableau
     de validation. Relire AVANT d'ecrire : le magasin porte aussi les decisions
     de Tony et les idees, un POST premature les remplacerait par cet objet-ci. */
  var URL_ETAT='https://n7n.automatisationboost.com/webhook/taches-validation';
  var CLE='demos_resto_envoyees', etat={}, envoyes={}, charge=false;
  try { envoyes=JSON.parse(localStorage.getItem(CLE)||'{}'); } catch(e){}
  var lis=[].slice.call(document.querySelectorAll('li[data-id]'));
  function compter(){
    var n=lis.filter(function(l){return envoyes[l.dataset.id];}).length;
    document.getElementById('fait').textContent=n;
    document.getElementById('jauge').style.width=Math.round(n/lis.length*100)+'%';
  }
  var enVol=false,duNeuf=false;
  function pousser(){
    duNeuf=true; if(enVol) return; enVol=true;
    (function boucle(){
      if(!duNeuf){ enVol=false; return; }
      duNeuf=false;
      if(!charge){ enVol=false; return; }
      etat['demos-resto']={etat:'envois',ids:Object.keys(envoyes),nb:Object.keys(envoyes).length,
        maj:new Date().toISOString()};
      fetch(URL_ETAT,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(etat)})
        .then(function(){ boucle(); })
        .catch(function(){ duNeuf=true; setTimeout(boucle,1500); });
    })();
  }
  lis.forEach(function(l){
    if(envoyes[l.dataset.id]) l.classList.add('ok');
    l.querySelector('.case').onclick=function(){
      if(envoyes[l.dataset.id]) delete envoyes[l.dataset.id];
      else envoyes[l.dataset.id]={t:Date.now()};
      l.classList.toggle('ok');
      try{ localStorage.setItem(CLE,JSON.stringify(envoyes)); }catch(e){}
      compter(); pousser();
    };
    l.querySelector('.cp').onclick=function(e){
      var t=l.querySelector('.msg').value;
      var ok=function(){ e.target.classList.add('fait'); e.target.textContent='Copié';
        setTimeout(function(){ e.target.classList.remove('fait'); e.target.textContent='Copier'; },1500); };
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok,ok);
      else { l.querySelector('details').open=true; l.querySelector('.msg').select(); ok(); }
    };
  });
  fetch(URL_ETAT+'?t='+Date.now()).then(function(r){return r.json();}).then(function(j){
    var d={}; try{ d=typeof j.donnees==='string'?JSON.parse(j.donnees||'{}'):(j.donnees||{}); }catch(e){}
    etat=(d&&typeof d==='object')?d:{}; charge=true;
    if(Object.keys(envoyes).length) pousser();
  }).catch(function(){});
  compter();
})();
</script>
`);
console.log(`${fiches.length} démos · ${avecMail} avec email · ${OUT}`);
