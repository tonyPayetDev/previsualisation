/* Génère la vue « au pouce » des sites clients — l'équivalent de /tri/ pour les
 * vidéos, mais sur les maquettes de sites.
 *
 * Pourquoi une page à part et pas un quatrième onglet dans /tri/ : cette page
 * décide d'un AUTRE objet (un site, pas un clip) et écrit dans un AUTRE magasin
 * (`sites-etat`, celui de vue.html). Les mélanger aurait fait deux sources de
 * vérité sur la même décision — exactement ce qui a fait perdre des choix quand
 * les décisions ne vivaient qu'en localStorage.
 *
 * Le magasin fait autorité : `POST /webhook/sites-etat` avec l'objet COMPLET,
 * en `text/plain` (avec application/json le navigateur envoie un préflight
 * OPTIONS que le webhook ne traite pas, et rien ne part).
 */
import fs from 'fs';
import path from 'path';

const BASE = '/work/previsualisation';
const DOSSIER = path.join(BASE, 'sites-clients');
const OUT = path.join(BASE, 'tri-sites', 'index.html');

const sites = JSON.parse(fs.readFileSync('/tmp/sites.json', 'utf8'));
const ETATS = fs.existsSync(path.join(DOSSIER, 'avant-etats.json'))
  ? JSON.parse(fs.readFileSync(path.join(DOSSIER, 'avant-etats.json'), 'utf8'))
  : { morts: [], doutes: [] };
const journal = fs.existsSync('/tmp/capture-journal.json')
  ? JSON.parse(fs.readFileSync('/tmp/capture-journal.json', 'utf8')) : [];
const routeDe = Object.fromEntries(journal.map((j) => [j.dir, j.route]));
const urlDe = Object.fromEntries(journal.filter((j) => !j.err).map((j) => [j.dir, j.url]));

/* Les mesures du site DU CLIENT : le seul chiffre qu'on ait le droit de citer.
   Un site qui n'a pas répondu n'a pas de mesure — on n'invente pas de défaut. */
const LEUR = Object.fromEntries(
  (fs.existsSync(path.join(DOSSIER, 'audit-avant.json'))
    ? JSON.parse(fs.readFileSync(path.join(DOSSIER, 'audit-avant.json'), 'utf8'))
    : []).filter((x) => x && x.dir).map((x) => [x.dir, x]));

function fait(dir) {
  const x = LEUR[dir]; if (!x) return '';
  const t = x.tel || x.mesure; if (!t) return '';
  if (t.viewportMeta === false) return 'pas de balise viewport';
  if (t.debordement > 8) return `déborde de ${t.debordement} px sur mobile`;
  const b = t.boutons || [];
  const gros = b.filter((z) => z.partVw >= 90).length;
  if (gros) return `${gros} bouton${gros > 1 ? 's' : ''} pleine largeur`;
  const petit = b.filter((z) => z.police && z.police < 12).length;
  if (petit) return `${petit} bouton${petit > 1 ? 's' : ''} sous 12 px`;
  return 'rien de mesurable à leur reprocher';
}

const items = sites.map((s) => {
  const vig = fs.existsSync(path.join(DOSSIER, 'vignettes', s.dir + '.jpg')) ? `/sites-clients/vignettes/${s.dir}.jpg` : '';
  const avant = fs.existsSync(path.join(DOSSIER, 'avant', s.dir + '.jpg')) ? `/sites-clients/avant/${s.dir}.jpg` : '';
  return {
    dir: s.dir, nom: s.nom, act: s.act || '', tel: s.tel || '',
    route: routeDe[s.dir] || ('client-' + s.dir),
    leur: urlDe[s.dir] || '', vig, avant,
    mort: !!ETATS.morts.find((m) => m.dir === s.dir),
    fait: fait(s.dir),
  };
}).filter((i) => i.vig)                                  // sans maquette, rien à juger
  .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Trier les sites — au pouce</title>
<style>
:root{--bg:#0a0a0f;--carte:#15151c;--bord:#26262e;--or:#eab308;--vert:#4ade80;--rouge:#ef6461;--mut:#8b8b96;--txt:#f2f2f5}
*{margin:0;padding:0;box-sizing:border-box}
/* height, et pas seulement min-height : avec min-height seul, le flex:1 de la
   zone image n'a aucune hauteur a distribuer et la carte s'ecrase a zero.
   Le repli 100vh sert aux navigateurs sans dvh. */
body{background:var(--bg);color:var(--txt);font:400 15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  height:100vh;height:100dvh;display:flex;flex-direction:column;padding:10px 12px calc(12px + env(safe-area-inset-bottom))}
header{display:flex;align-items:center;gap:10px;margin-bottom:8px}
h1{font-size:15px;font-weight:800;letter-spacing:-.01em}
.tm{margin-left:auto;font-size:11.5px;color:var(--mut)}
.tm.ok{color:var(--vert)} .tm.ko{color:var(--rouge)} .tm.encours{color:var(--or)}
.jauge{height:3px;background:#1e1e26;border-radius:2px;overflow:hidden;margin-bottom:10px}
.jauge i{display:block;height:100%;background:var(--or);width:0;transition:width .25s}
.zone{position:relative;flex:1 1 auto;min-height:34vh;border-radius:16px;overflow:hidden;background:#000;border:1px solid var(--bord)}
#ecran{display:flex;flex-direction:column;flex:1;min-height:0}
.zone img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center}
.zone img.av{opacity:0;transition:opacity .18s}
.zone.avant img.av{opacity:1}
.et{position:absolute;top:10px;left:10px;font-size:10.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
  background:#0a0a0fd9;padding:5px 10px;border-radius:6px;color:var(--or)}
.zone.avant .et{color:var(--mut)}
.bascule{position:absolute;top:8px;right:8px;background:#0a0a0fd9;border:1px solid var(--bord);color:var(--txt);
  border-radius:8px;padding:7px 11px;font:700 12px/1 inherit;letter-spacing:.05em}
.zone .rien{position:absolute;inset:0;display:grid;place-items:center;color:var(--mut);font-size:13px;text-align:center;padding:0 24px}
.info{padding:11px 2px 9px}
.info h2{font-size:17px;letter-spacing:-.01em}
.info p{font-size:12.5px;color:var(--mut);margin-top:2px}
.info .f{color:var(--or)}
.liens{display:flex;gap:7px;margin-top:8px;flex-wrap:wrap}
.liens a{font-size:11.5px;font-weight:700;text-decoration:none;color:var(--txt);background:#1c1c25;
  border:1px solid var(--bord);border-radius:7px;padding:6px 10px}
.actes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:9px}
.actes button{font:800 13px/1 inherit;letter-spacing:.03em;padding:15px 6px;border-radius:11px;
  background:#16161d;border:1px solid var(--bord);color:var(--txt)}
.actes .fix{border-color:#3c3826;color:var(--or)}
.actes .ab{border-color:#3c2b2a;color:var(--rouge)}
.actes .ok{border-color:#2a3d33;color:var(--vert)}
.actes button small{display:block;font-weight:600;font-size:10px;color:var(--mut);margin-top:3px;letter-spacing:0}
textarea{width:100%;margin-top:8px;background:#12121a;border:1px solid var(--bord);color:var(--txt);
  border-radius:9px;padding:9px 11px;font:inherit;font-size:13.5px;resize:vertical}
.pied{display:flex;gap:8px;align-items:center;margin-top:9px;font-size:11.5px;color:var(--mut)}
.pied button{background:none;border:1px solid var(--bord);color:var(--mut);border-radius:7px;padding:6px 9px;font:600 11.5px/1 inherit}
.fin{text-align:center;padding:38px 16px}
.fin h2{font-size:20px;margin-bottom:8px}
.fin p{color:var(--mut);font-size:14px;max-width:44ch;margin:0 auto 14px}
</style>
<header>
  <h1>Trier les sites</h1>
  <span class="tm" id="tm">lecture…</span>
</header>
<div class="jauge"><i id="jauge"></i></div>

<div id="ecran">
  <div class="zone" id="zone">
    <img id="ap" alt="">
    <img id="av" class="av" alt="">
    <span class="et" id="etiq">Ma maquette</span>
    <button class="bascule" id="bBasc" type="button">Voir avant</button>
    <div class="rien" id="rien" hidden></div>
  </div>
  <div class="info">
    <h2 id="nom"></h2>
    <p id="meta"></p>
    <p class="f" id="fait"></p>
    <div class="liens" id="liens"></div>
  </div>
  <div class="actes">
    <button class="fix" id="bFix" type="button">À corriger<small>flèche gauche</small></button>
    <button class="ab" id="bAb" type="button">Abandonner<small>flèche bas</small></button>
    <button class="ok" id="bOk" type="button">Envoyable<small>flèche droite</small></button>
  </div>
  <textarea id="note" rows="2" placeholder="Ce qu'il faut corriger — obligatoire pour abandonner…"></textarea>
  <div class="pied">
    <button id="bPasser" type="button">Passer</button>
    <button id="bRevoir" type="button">Tout revoir</button>
    <span id="cpt"></span>
  </div>
</div>

<div class="fin" id="fin" hidden>
  <h2>Fini.</h2>
  <p id="finTxt"></p>
  <button id="bRevoir2" type="button" style="background:var(--or);border:0;color:#1a1200;font:800 14px/1 inherit;padding:13px 18px;border-radius:10px">Tout revoir</button>
</div>

<script>
var SITES = ${JSON.stringify(items)};
(function(){
  var SERVEUR = 'https://n7n.automatisationboost.com/webhook/sites-etat';
  var CLE = 'etat_sites_clients';           /* MÊME clé que vue.html : un seul cache */
  var etat = {};
  try { etat = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (_) { etat = {}; }

  var tm = document.getElementById('tm');
  function dire(t, c){ tm.textContent = t; tm.className = 'tm ' + (c || ''); }
  function cache(){ try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (_) {} }

  /* Un envoi à la fois, et un drapeau « sale » plutôt qu'une minuterie annulable :
     si un envoi est en vol quand le suivant part, l'annuler perdrait la décision. */
  var enVol = false, sale = false, minuterie = null;
  function envoyer(){
    if (enVol) { sale = true; return; }
    enVol = true; sale = false; dire('enregistrement…', 'encours');
    fetch(SERVEUR, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(etat) })
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(){ dire('enregistré', 'ok'); })
      .catch(function(){ dire('hors ligne — gardé sur cet appareil', 'ko'); })
      .then(function(){ enVol = false; if (sale) envoyer(); });
  }
  function sauver(){ cache(); if (minuterie) clearTimeout(minuterie);
    minuterie = setTimeout(function(){ minuterie = null; envoyer(); }, 700); dire('modifié…', 'encours'); }

  var file = [], k = 0, tousRevoir = false;
  var zone = document.getElementById('zone'), ap = document.getElementById('ap'), av = document.getElementById('av');
  var rien = document.getElementById('rien'), bBasc = document.getElementById('bBasc'), etiq = document.getElementById('etiq');
  var nom = document.getElementById('nom'), meta = document.getElementById('meta'), fa = document.getElementById('fait');
  var liens = document.getElementById('liens'), note = document.getElementById('note');
  var jauge = document.getElementById('jauge'), cpt = document.getElementById('cpt');
  var ecran = document.getElementById('ecran'), fin = document.getElementById('fin'), finTxt = document.getElementById('finTxt');

  function construire(){
    file = SITES.filter(function(s){ return tousRevoir || !(etat[s.dir] && etat[s.dir].etat); });
    k = 0;
  }
  function peindre(){
    var n = SITES.length, decides = SITES.filter(function(s){ return etat[s.dir] && etat[s.dir].etat; }).length;
    jauge.style.width = Math.round(decides / n * 100) + '%';
    cpt.textContent = decides + ' / ' + n + ' décidés';
    if (k >= file.length){
      ecran.hidden = true; fin.hidden = false;
      finTxt.textContent = decides + ' sites sur ' + n + ' ont une décision. ' +
        SITES.filter(function(s){ return etat[s.dir] && etat[s.dir].etat === 'fix'; }).length + ' à corriger.';
      return;
    }
    ecran.hidden = false; fin.hidden = true;
    var s = file[k];
    zone.classList.remove('avant'); etiq.textContent = 'Ma maquette';
    ap.src = s.vig; ap.alt = 'Maquette de ' + s.nom;
    if (s.avant){ av.src = s.avant; av.alt = 'Site actuel de ' + s.nom; bBasc.hidden = false; rien.hidden = true; }
    else { av.removeAttribute('src'); bBasc.hidden = true; }
    nom.textContent = s.nom;
    meta.textContent = [s.act, s.tel, s.mort ? 'leur site est hors ligne' : (s.avant ? '' : 'aucune capture de leur site')]
      .filter(Boolean).join(' · ');
    fa.textContent = s.fait ? 'Chez eux : ' + s.fait : '';
    liens.innerHTML = '<a href="/' + s.route + '/" target="_blank" rel="noopener">Ma maquette en grand</a>'
      + (s.leur && !s.mort ? '<a href="' + s.leur + '" target="_blank" rel="noopener">Leur site</a>' : '')
      + (s.tel ? '<a href="tel:' + s.tel + '">Appeler</a>' : '');
    note.value = (etat[s.dir] && etat[s.dir].note) || '';
  }
  function decider(e){
    var s = file[k];
    if (e === 'abandon' && !note.value.trim()){
      note.placeholder = 'Dis pourquoi tu abandonnes — sinon dans trois semaines la raison est perdue.';
      note.focus(); return;
    }
    var d = etat[s.dir] || { f: 0, note: '' };
    d.etat = e; d.note = note.value;
    etat[s.dir] = d; sauver();
    k++; peindre();
  }
  document.getElementById('bFix').onclick = function(){ decider('fix'); };
  document.getElementById('bAb').onclick  = function(){ decider('abandon'); };
  document.getElementById('bOk').onclick  = function(){ decider('ok'); };
  document.getElementById('bPasser').onclick = function(){ k++; peindre(); };
  bBasc.onclick = function(){
    zone.classList.toggle('avant');
    var a = zone.classList.contains('avant');
    etiq.textContent = a ? 'Leur site aujourd’hui' : 'Ma maquette';
    bBasc.textContent = a ? 'Voir après' : 'Voir avant';
  };
  document.getElementById('bRevoir').onclick = document.getElementById('bRevoir2').onclick = function(){
    tousRevoir = true; construire(); peindre();
  };
  document.addEventListener('keydown', function(ev){
    if (ev.target === note) return;
    if (ev.key === 'ArrowRight') decider('ok');
    else if (ev.key === 'ArrowLeft') decider('fix');
    else if (ev.key === 'ArrowDown') decider('abandon');
    else if (ev.key === ' ') { ev.preventDefault(); bBasc.click(); }
  });
  /* Glissé horizontal : le geste du pouce, celui de /tri/. Le seuil est à 60 px
     pour qu'un défilement vertical ne déclenche jamais une décision. */
  var x0 = null, y0 = null;
  zone.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  zone.addEventListener('touchend', function(e){
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) decider(dx > 0 ? 'ok' : 'fix');
    else if (dy > 70 && Math.abs(dy) > Math.abs(dx)) decider('abandon');
  }, { passive: true });

  /* Au chargement le serveur écrase le cache — c'est ce qui permet de trier sur
     le téléphone et de retrouver les mêmes décisions sur l'ordinateur. Filet :
     un serveur vide face à un appareil qui a des décisions ne les efface pas. */
  dire('lecture…', 'encours');
  fetch(SERVEUR, { cache: 'no-store' })
    .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(j){
      var d = {}; try { d = JSON.parse(j.donnees || '{}'); } catch (_) { d = {}; }
      if (Object.keys(d).length === 0 && Object.keys(etat).length > 0){ dire('appareil plus récent — envoi', 'encours'); envoyer(); }
      else { etat = d; cache(); dire('à jour', 'ok'); }
    })
    .catch(function(){ dire('hors ligne — décisions locales', 'ko'); })
    .then(function(){ construire(); peindre(); });
})();
</script>
`;
fs.writeFileSync(OUT, html);
console.log(`${items.length} sites avec maquette · ${OUT}`);
