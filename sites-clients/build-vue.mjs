// Génère la vue en vignettes des sites clients.
//
// L'inventaire en tableau dit ce qui manque ; il ne dit pas à quoi ça ressemble.
// Ici on voit, on marque « à corriger », on écrit la correction, et on ressort
// un ordre de travail collable tel quel dans Claude Code.
import fs from 'fs';
import path from 'path';

const BASE = '/work/previsualisation';
const DOSSIER = path.join(BASE, 'sites-clients');
const VIG = path.join(DOSSIER, 'vignettes');
const OUT = path.join(DOSSIER, 'vue.html');

const sites = JSON.parse(fs.readFileSync('/tmp/sites.json', 'utf8'));
// Écrit par la passe de capture des « avant ». Absent au premier lancement.
const ETATS_AV = fs.existsSync(path.join(DOSSIER, 'avant-etats.json'))
  ? JSON.parse(fs.readFileSync(path.join(DOSSIER, 'avant-etats.json'), 'utf8'))
  : { morts: [], casses: [], doutes: [] };
const journal = fs.existsSync('/tmp/capture-journal.json')
  ? JSON.parse(fs.readFileSync('/tmp/capture-journal.json', 'utf8')) : [];
const routeDe = Object.fromEntries(journal.map(j => [j.dir, j.route]));

const ETIQ = { ok: ['Envoyable', '#4ade80'], fix: ['À corriger', '#eab308'], abandon: ['À abandonner', '#ef6461'] };

const items = sites.map(s => {
  const vig = fs.existsSync(path.join(VIG, s.dir + '.jpg')) ? 'vignettes/' + s.dir + '.jpg' : '';
  // L'« avant » a quatre cas, et ils ne disent pas la même chose au client :
  //   une capture sûre · une capture à vérifier · un domaine mort · rien.
  // Déposer une capture dans sites-clients/avant/<dossier>.jpg et régénérer.
  const AV = path.join(DOSSIER, 'avant');
  const avant = fs.existsSync(path.join(AV, s.dir + '.jpg')) ? 'avant/' + s.dir + '.jpg' : '';
  const mort = ETATS_AV.morts.find(m => m.dir === s.dir);
  const doute = ETATS_AV.doutes.includes(s.dir);
  return { ...s, vig, avant, mort, doute, route: routeDe[s.dir] || ('client-' + s.dir) };
}).sort((a, b) => (b.vig ? 1 : 0) - (a.vig ? 1 : 0) || a.nom.localeCompare(b.nom, 'fr'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nVig = items.filter(i => i.vig).length;

// Loupe « vérifier moi-même ».
// « Aucun site » est une conclusion de machine : la capture automatique n'a
// trouvé aucun domaine plausible. Ça ne prouve pas qu'il n'existe pas — une
// page Facebook, un domaine sans rapport avec le nom, un site trop récent
// passent tous à travers. La loupe rend la vérification à Tony en un clic
// au lieu de le laisser croire une machine sur parole.
//
// Le nom est mis entre guillemets pour que Google ne parte pas sur un
// homonyme, et « La Réunion » cadre géographiquement — sans ça, une
// pizzeria « Giulietta » renvoie l'Italie entière.
const rechercheUrl = i => 'https://www.google.com/search?q=' + encodeURIComponent(
  `"${i.nom}" ${i.act || ''} La Réunion`.replace(/\s+/g, ' ').trim());

const loupe = i => `<a class="loupe" href="${esc(rechercheUrl(i))}" target="_blank" rel="noopener"
  title="Chercher ${esc(i.nom)} sur Google" aria-label="Chercher ${esc(i.nom)} sur Google">
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"
    fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M15.5 15.5 L21 21" stroke="currentColor"
    stroke-width="2.1" stroke-linecap="round"/></svg></a>`;
const nSansSite = items.filter(i => !i.avant).length;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sites clients — vue en vignettes</title>
<style>
:root{--bg:#0a0a0f;--pan:#111117;--pan2:#16161e;--bord:#242430;
  --txt:#f2f2f5;--mut:#8f8f9e;--or:#eab308;--vert:#4ade80;--rouge:#ef6461}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font-size:15px;line-height:1.5;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:1rem .9rem 5rem}
.wrap{max-width:1320px;margin:0 auto}
header{display:flex;align-items:baseline;justify-content:space-between;gap:.8rem;flex-wrap:wrap;margin-bottom:.9rem}
h1{font-size:1rem;margin:0;font-weight:700}
h1 i{font-style:normal;color:var(--or)}
.cpt{font-size:.75rem;color:var(--mut);font-variant-numeric:tabular-nums}
a.retour{color:var(--mut);font-size:.78rem;text-decoration:none}
a.retour:hover{color:var(--or)}

.barre{position:sticky;top:0;z-index:30;background:var(--bg);padding:.55rem 0 .7rem;
  border-bottom:1px solid var(--bord);margin-bottom:1rem}
#q{width:100%;background:var(--pan);border:1px solid var(--bord);color:var(--txt);
  padding:.55rem .8rem;border-radius:9px;font-size:.9rem;font-family:inherit}
#q:focus{outline:none;border-color:var(--or)}
.chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.5rem;align-items:center}
.ch{background:var(--pan);border:1px solid var(--bord);color:var(--mut);padding:.3rem .65rem;
  border-radius:999px;font-size:.73rem;cursor:pointer;font-family:inherit}
.ch:hover{color:var(--txt)}
.ch[aria-pressed=true]{border-color:var(--or);color:var(--or);background:rgba(234,179,8,.09)}
.ch b{font-weight:600;opacity:.55;margin-left:.28rem;font-variant-numeric:tabular-nums}
.ch.fin{margin-left:auto;border-color:#33323f;color:var(--txt)}
.ch.pri{background:var(--or);color:#1a1400;border-color:var(--or);font-weight:700}

.grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.carte{background:var(--pan);border:1px solid var(--bord);border-radius:10px;overflow:hidden;
  display:flex;flex-direction:column;transition:border-color .15s}
.carte:hover{border-color:#3a3a4a}
.carte[data-flag="1"]{border-color:var(--or);box-shadow:0 0 0 1px rgba(234,179,8,.25)}
.vue{position:relative;display:block;aspect-ratio:1280/900;background:#08080c;overflow:hidden}
.vue img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
/* Comparateur avant/après — la couche « avant » est rognée par la gauche,
   la poignée se déplace au doigt ou à la souris. --left est la seule
   variable pilotée : tout le reste en découle. */
.vue{--left:50%;touch-action:pan-y;cursor:ew-resize;user-select:none}
.vue .avant{position:absolute;inset:0;width:var(--left);overflow:hidden;z-index:2}
.vue .avant img{width:calc(100% / (var(--left) / 100%));max-width:none;height:100%}
.vue .avant .neant{position:absolute;inset:0;background:#0e0e14;display:flex;
  flex-direction:column;align-items:center;justify-content:center;gap:.2rem;text-align:center;padding:.5rem}
.vue .avant .doute{position:absolute;top:8px;left:8px;font-size:.58rem;font-weight:700;
  padding:.12rem .38rem;border-radius:999px;background:rgba(239,100,97,.92);color:#140505;z-index:2}
.vue .avant .neant.mort span{color:var(--rouge)}
.vue .avant .neant em{font-style:normal;font-size:.6rem;color:var(--mut);margin-top:.15rem;
  overflow-wrap:anywhere;padding:0 .4rem}
/* La loupe est posée DANS le comparateur, donc dans la zone qui capture le
   pointeur pour le glissement. Elle est au-dessus (z-index) et le gestionnaire
   de glissement l'ignore explicitement — sans quoi le preventDefault()
   avalerait le clic et le lien ne s'ouvrirait jamais. */
.vue .loupe{position:absolute;right:7px;bottom:7px;z-index:4;
  width:27px;height:27px;border-radius:50%;display:grid;place-items:center;
  background:rgba(12,12,18,.82);border:1px solid rgba(255,255,255,.22);
  color:#cfd6e2;text-decoration:none;backdrop-filter:blur(2px)}
.vue .loupe:hover{background:#1b2534;border-color:#4d7fd6;color:#8fb6ff}
.vue .avant .neant b{font-size:.7rem;color:var(--mut);font-weight:600}
.vue .avant .neant span{font-size:.78rem;color:var(--rouge);font-weight:700}
.vue .poignee{position:absolute;top:0;bottom:0;left:var(--left);width:2px;
  background:var(--or);z-index:3;pointer-events:none}
.vue .poignee i{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:26px;height:26px;border-radius:50%;background:var(--or);
  box-shadow:0 2px 10px rgba(0,0,0,.55)}
.vue .poignee i::before{content:'';position:absolute;inset:0;
  background:linear-gradient(90deg,transparent 34%,#141000 34%,#141000 42%,transparent 42%,
    transparent 58%,#141000 58%,#141000 66%,transparent 66%)}
/* pointer-events:none : ces étiquettes sont purement décoratives. Sans ça,
   « Après » occupe le coin bas-droit et intercepte le clic sur la loupe. */
.vue .etiq{position:absolute;bottom:8px;font-size:.6rem;font-weight:700;z-index:4;
  padding:.14rem .4rem;border-radius:999px;background:rgba(10,10,15,.8);letter-spacing:.06em;
  pointer-events:none}
.vue .etiq.g{left:8px;color:var(--rouge)}
/* Décalée vers la gauche là où la loupe est présente, pour ne pas se superposer. */
.vue .etiq.d{right:8px;color:var(--vert)}
.vue:has(a.loupe) .etiq.d{right:41px}

/* Choix d'état, y compris « abandonner » */
.etats{display:flex;gap:.25rem;flex-wrap:wrap}
.etats .et{flex:1;min-width:0;background:none;border:1px solid var(--bord);color:var(--mut);
  border-radius:6px;padding:.24rem .3rem;font-size:.68rem;cursor:pointer;font-family:inherit;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:border-color .15s,color .15s}
.etats .et:hover{color:var(--txt)}
.etats .et[aria-pressed=true][data-e=ok]{border-color:var(--vert);color:var(--vert);background:rgba(74,222,128,.1)}
.etats .et[aria-pressed=true][data-e=fix]{border-color:var(--or);color:var(--or);background:rgba(234,179,8,.1)}
.etats .et[aria-pressed=true][data-e=abandon]{border-color:var(--rouge);color:var(--rouge);background:rgba(239,100,97,.1)}
.carte[data-etat=abandon]{opacity:.55}
.carte[data-etat=abandon]:hover{opacity:1}

.vue .rien{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  color:#4a4a58;font-size:.75rem;text-align:center;padding:1rem}
.pastille{position:absolute;top:8px;left:8px;font-size:.64rem;font-weight:700;padding:.16rem .45rem;
  border-radius:999px;background:rgba(10,10,15,.82);backdrop-filter:blur(3px)}
.corps{padding:.65rem .75rem .75rem;display:flex;flex-direction:column;gap:.4rem;flex:1}
.nom{font-size:.87rem;font-weight:600;line-height:1.25}
.meta{font-size:.72rem;color:var(--mut)}
.actions{display:flex;gap:.3rem;flex-wrap:wrap;margin-top:auto;padding-top:.35rem}
.bt{background:none;border:1px solid var(--bord);color:var(--mut);border-radius:6px;
  padding:.24rem .52rem;font-size:.71rem;cursor:pointer;font-family:inherit;text-decoration:none;
  display:inline-flex;align-items:center;gap:.25rem}
.bt:hover{color:var(--txt);border-color:#3a3a4a}
.bt.on{border-color:var(--or);color:var(--or);background:rgba(234,179,8,.1)}
.note{width:100%;background:var(--pan2);border:1px solid var(--bord);color:var(--txt);
  border-radius:7px;padding:.45rem .55rem;font-size:.76rem;font-family:inherit;resize:vertical;
  min-height:2.2rem;display:none}
.note:focus{outline:none;border-color:var(--or)}
.carte[data-flag="1"] .note{display:block}

#sortie{position:fixed;inset:0;background:rgba(6,6,10,.82);backdrop-filter:blur(4px);
  z-index:60;display:none;align-items:center;justify-content:center;padding:1.2rem}
#sortie.on{display:flex}
.boite{background:var(--pan);border:1px solid var(--bord);border-radius:12px;max-width:820px;
  width:100%;max-height:86vh;display:flex;flex-direction:column;overflow:hidden}
.boite h2{font-size:.95rem;margin:0;padding:.9rem 1.1rem;border-bottom:1px solid var(--bord)}
.boite textarea{flex:1;min-height:340px;background:#0c0c11;border:0;color:var(--txt);
  padding:1rem 1.1rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78rem;
  line-height:1.55;resize:none}
.boite textarea:focus{outline:none}
.pied{display:flex;gap:.5rem;padding:.8rem 1.1rem;border-top:1px solid var(--bord);align-items:center}
.pied .info{color:var(--mut);font-size:.73rem;margin-right:auto}
#vide{display:none;text-align:center;color:var(--mut);padding:3rem 1rem;font-size:.88rem}
</style>
</head>
<body>
<div class="wrap">

<header>
  <div>
    <h1>Sites clients — <i>vue en vignettes</i></h1>
    <a class="retour" href="/sites-clients/">← revenir à l'inventaire détaillé</a>
  </div>
  <span class="cpt"><b id="n">${items.length}</b> / ${items.length} sites · ${nVig} capturés · ${nSansSite} à vérifier <span class="lp" aria-hidden="true">🔍</span></span>
</header>

<div class="barre">
  <input id="q" type="search" placeholder="Chercher un client, une activité…" autocomplete="off">
  <div class="chips">
    <button class="ch" data-f="" aria-pressed="true">Tous <b>${items.length}</b></button>
    <button class="ch" data-f="ok" aria-pressed="false">Envoyable <b>${items.filter(i => i.etat === 'ok').length}</b></button>
    <button class="ch" data-f="fix" aria-pressed="false">À corriger <b>${items.filter(i => i.etat === 'fix').length}</b></button>
    <button class="ch" data-f="abandon" aria-pressed="false">À abandonner <b>${items.filter(i => i.etat === 'abandon').length}</b></button>
    <button class="ch" data-f="__flag" aria-pressed="false">★ Marqués <b id="n-flag">0</b></button>
    <button class="ch fin" id="b-reset" type="button">Tout démarquer</button>
    <button class="ch pri" id="b-brief" type="button">Générer l'ordre de correction</button>
  </div>
</div>

<div class="grille" id="grille">
${items.map(i => `  <article class="carte" data-dir="${esc(i.dir)}" data-etat="${esc(i.etat)}" data-flag="0"
    data-k="${esc((i.nom + ' ' + i.act + ' ' + i.dir).toLowerCase())}">
    <div class="vue">
      ${i.vig ? `<img class="apres" src="${esc(i.vig)}" alt="Aperçu de ${esc(i.nom)}" loading="lazy">`
              : `<span class="rien">pas de capture<br>— site non rendu</span>`}
      <!-- L'« avant » : leur situation actuelle. Pour la plupart, il n'y a pas
           de vieux site à montrer — il n'y a rien du tout, et c'est justement
           l'argument. Une capture réelle prendra sa place dès qu'on l'aura. -->
      <div class="avant"${i.avant ? '' : ' data-vide="1"'}>
        ${i.avant
            ? `<img src="${esc(i.avant)}" alt="Site actuel de ${esc(i.nom)}" loading="lazy">${
                i.doute ? '<span class="doute">à vérifier</span>' : ''}`
            : i.mort
              ? `<div class="neant mort"><b>Aujourd'hui</b><span>domaine injoignable</span><em>${
                  esc(i.mort.url.replace(/^https?:\/\//, ''))}</em></div>`
              : `<div class="neant"><b>Aujourd'hui</b><span>aucun site</span></div>`}
      </div>
      <!-- La loupe vit au niveau du cadre, pas dans la couche « avant » :
           celle-ci est rognée par le curseur, la loupe disparaîtrait dès que
           Tony tire la poignée à fond vers « Après ». -->
      ${(!i.avant || i.doute) ? loupe(i) : ''}
      <div class="poignee"><i></i></div>
      <span class="etiq g">Avant</span>
      <span class="etiq d">Après</span>
      <span class="pastille" data-p>${ETIQ[i.etat] ? ETIQ[i.etat][0] : i.etat}</span>
    </div>
    <div class="corps">
      <div class="nom">${esc(i.nom)}</div>
      <div class="meta">${esc(i.act || '—')}${i.tel ? ' · ' + esc(i.tel) : ''}</div>
      <div class="etats">
        <button class="et" data-e="ok" type="button">Envoyable</button>
        <button class="et" data-e="fix" type="button">À corriger</button>
        <button class="et" data-e="abandon" type="button">Abandonner</button>
      </div>
      <div class="actions">
        <button class="bt f" type="button" title="Marquer pour l'ordre de correction">★ marquer</button>
        <a class="bt" href="/${esc(i.route)}/" target="_blank" rel="noopener">ouvrir</a>
        ${i.tel ? `<a class="bt" href="tel:${esc(i.tel)}">appeler</a>` : ''}
      </div>
      <textarea class="note" rows="2" placeholder="Ce qu'il faut corriger — ou pourquoi abandonner…"></textarea>
    </div>
  </article>`).join('\n')}
</div>

<p id="vide">Aucun site ne correspond.</p>
</div>

<div id="sortie">
  <div class="boite">
    <h2>Ordre de correction — à coller dans Claude Code</h2>
    <textarea id="brief" spellcheck="false"></textarea>
    <div class="pied">
      <span class="info" id="info-brief"></span>
      <button class="ch" id="b-copier" type="button">Copier</button>
      <button class="ch" id="b-fermer" type="button">Fermer</button>
    </div>
  </div>
</div>

<script>
(function(){
  var CLE = 'sites-corrections-v1';
  var cartes = [].slice.call(document.querySelectorAll('.carte'));
  var q = document.getElementById('q');
  var n = document.getElementById('n');
  var vide = document.getElementById('vide');
  var filtre = '';

  var etat = {};
  try { etat = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (_) { etat = {}; }
  function sauver(){ try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (_) {} }

  var ETIQ = { ok: ['Envoyable', '#4ade80'], fix: ['À corriger', '#eab308'], abandon: ['À abandonner', '#ef6461'] };

  cartes.forEach(function(c){
    var dir = c.dataset.dir;
    var origine = c.dataset.etat;                  // l'état venu de l'inventaire
    var s = etat[dir] || { f: 0, note: '' };
    var bt = c.querySelector('.bt.f');
    var note = c.querySelector('.note');
    var vue = c.querySelector('.vue');
    var pastille = c.querySelector('[data-p]');
    var boutons = [].slice.call(c.querySelectorAll('.etats .et'));

    function courant(){ return s.etat || origine; }

    function peindre(){
      c.dataset.flag = s.f ? '1' : '0';
      bt.classList.toggle('on', !!s.f);
      if (document.activeElement !== note) note.value = s.note || '';
      var e = courant();
      c.dataset.etat = e;
      if (pastille && ETIQ[e]) {
        pastille.textContent = ETIQ[e][0];
        pastille.style.color = ETIQ[e][1];
      }
      boutons.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.e === e)); });
    }

    bt.addEventListener('click', function(){
      s.f = s.f ? 0 : 1;
      etat[dir] = s; sauver(); peindre(); compter(); appliquer();
      if (s.f) note.focus();
    });

    boutons.forEach(function(b){
      b.addEventListener('click', function(){
        // Cliquer un état le POSE, toujours. Le basculer sur un second clic
        // était un piège : confirmer « à abandonner » sur une fiche déjà
        // marquée ainsi l'annulait silencieusement.
        s.etat = b.dataset.e;
        // Abandonner sans dire pourquoi ne sert à rien dans six mois.
        if (s.etat === 'abandon' && !(s.note || '').trim()) {
          note.placeholder = 'Pourquoi abandonner ce site ?';
          setTimeout(function(){ note.focus(); }, 0);
        }
        etat[dir] = s; sauver(); peindre(); compter(); appliquer();
      });
    });

    // On enregistre à la frappe : une note perdue est une note qu'il faut réécrire.
    note.addEventListener('input', function(){
      s.note = note.value; etat[dir] = s; sauver();
    });

    /* --- Comparateur avant / après ---------------------------------------
       Une seule variable CSS pilote tout. On écoute pointerdown/move plutôt
       que mouse+touch séparément : un seul chemin de code pour le doigt et
       la souris, et pas de double déclenchement sur les écrans tactiles. */
    if (vue) {
      var glisse = false;
      function place(ev){
        var r = vue.getBoundingClientRect();
        var x = Math.min(Math.max(ev.clientX - r.left, 0), r.width);
        vue.style.setProperty('--left', (x / r.width * 100).toFixed(2) + '%');
      }
      vue.addEventListener('pointerdown', function(ev){
        // La loupe est un vrai lien posé dans la zone de glissement : sans
        // cette sortie, le preventDefault() ci-dessous mange le clic.
        if (ev.target.closest && ev.target.closest('a.loupe')) return;
        glisse = true; vue.setPointerCapture(ev.pointerId); place(ev); ev.preventDefault();
      });
      vue.addEventListener('pointermove', function(ev){ if (glisse) place(ev); });
      ['pointerup','pointercancel'].forEach(function(t){
        vue.addEventListener(t, function(){ glisse = false; });
      });
      // Un double-tap ouvre le site : le glissement a pris la place du clic.
      vue.addEventListener('dblclick', function(ev){
        if (ev.target.closest && ev.target.closest('a.loupe')) return;
        window.open('/' + c.dataset.dir + '/', '_blank', 'noopener');
      });
    }

    peindre();
  });

  function compter(){
    var f = cartes.filter(function(c){ return c.dataset.flag === '1'; }).length;
    document.getElementById('n-flag').textContent = f;
    // Les compteurs des pastilles étaient figés à la génération : dès qu'on
    // change un état à la main, ils mentaient. On les recalcule à chaque fois.
    ['ok', 'fix', 'abandon'].forEach(function(e){
      var b = document.querySelector('.ch[data-f="' + e + '"] b');
      if (b) b.textContent = cartes.filter(function(c){ return c.dataset.etat === e; }).length;
    });
  }

  function appliquer(){
    var t = q.value.trim().toLowerCase();
    var mots = t ? t.split(/\\s+/) : [];
    var vus = 0;
    cartes.forEach(function(c){
      var okF = !filtre || (filtre === '__flag' ? c.dataset.flag === '1' : c.dataset.etat === filtre);
      var okT = mots.every(function(w){ return c.dataset.k.indexOf(w) !== -1; });
      var ok = okF && okT;
      c.style.display = ok ? '' : 'none';
      if (ok) vus++;
    });
    n.textContent = vus;
    vide.style.display = vus ? 'none' : 'block';
  }

  q.addEventListener('input', appliquer);
  [].forEach.call(document.querySelectorAll('.ch[data-f]'), function(b){
    b.addEventListener('click', function(){
      filtre = b.dataset.f;
      [].forEach.call(document.querySelectorAll('.ch[data-f]'), function(x){
        x.setAttribute('aria-pressed', String(x === b));
      });
      appliquer();
    });
  });

  document.getElementById('b-reset').addEventListener('click', function(){
    if (!confirm('Démarquer tous les sites et effacer les corrections écrites ?')) return;
    etat = {}; sauver(); location.reload();
  });

  /* --- L'ordre de correction ------------------------------------------------
     Le but : que ça se colle tel quel dans Claude Code et que l'agent qui le
     reçoit sache où sont les fichiers sans avoir à chercher. */
  function brief(){
    var marques = cartes.filter(function(c){ return c.dataset.flag === '1'; });
    var lignes = [];
    lignes.push('Corrections demandées sur les sites clients — ' + new Date().toLocaleDateString('fr-FR'));
    lignes.push('');
    lignes.push('Les sites sont dans /work/previsualisation/. Chaque dossier contient son index.html.');
    lignes.push('Après modification : commit + push, puis déclencher le déploiement Coolify en POST');
    lignes.push('(uuid in9lww2r6zmrxdgubz4w09iq) et vérifier en HTTP 200 — Coolify ne redéploie pas sur push.');
    lignes.push('Ne jamais inventer de contenu client : ni prix, ni horaires, ni adresse, ni plat.');
    lignes.push('');
    lignes.push(marques.length + ' site(s) à corriger :');
    lignes.push('');
    marques.forEach(function(c, i){
      var s = etat[c.dataset.dir] || {};
      lignes.push((i + 1) + '. ' + c.querySelector('.nom').textContent.trim());
      lignes.push('   dossier : /work/previsualisation/' + c.dataset.dir);
      lignes.push('   en ligne : https://previsualisation.automatisationboost.com/' + c.dataset.dir + '/');
      // On distingue l'état d'origine de celui que Tony a posé lui-même :
      // « à abandonner » décidé après avoir REGARDÉ le site ne vaut pas la
      // même chose qu'un état hérité de l'inventaire automatique.
      var LIB = { ok: 'envoyable', fix: 'à corriger', abandon: 'à abandonner' };
      var e = c.dataset.etat;
      lignes.push('   état : ' + (LIB[e] || e) + (s.etat ? '  (décidé à la revue)' : '  (issu de l’inventaire)'));
      lignes.push('   ' + (e === 'abandon' ? 'motif d’abandon' : 'correction') + ' : '
        + ((s.note || '').trim() || '(à préciser)'));
      lignes.push('');
    });
    return lignes.join('\\n');
  }

  var sortie = document.getElementById('sortie');
  document.getElementById('b-brief').addEventListener('click', function(){
    var marques = cartes.filter(function(c){ return c.dataset.flag === '1'; });
    if (!marques.length) { alert('Marque d\\'abord au moins un site avec « ★ à corriger ».'); return; }
    var sans = marques.filter(function(c){ return !((etat[c.dataset.dir] || {}).note || '').trim(); }).length;
    document.getElementById('brief').value = brief();
    document.getElementById('info-brief').textContent =
      marques.length + ' site(s)' + (sans ? ' · ' + sans + ' sans correction écrite' : '');
    sortie.classList.add('on');
  });
  document.getElementById('b-fermer').addEventListener('click', function(){ sortie.classList.remove('on'); });
  sortie.addEventListener('click', function(e){ if (e.target === sortie) sortie.classList.remove('on'); });
  document.getElementById('b-copier').addEventListener('click', function(){
    var ta = document.getElementById('brief');
    ta.select();
    try { navigator.clipboard.writeText(ta.value); } catch (_) { document.execCommand('copy'); }
    this.textContent = 'Copié';
    var b = this; setTimeout(function(){ b.textContent = 'Copier'; }, 1400);
  });

  compter(); appliquer();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`  ${items.length} sites · ${nVig} vignettes · ${OUT.replace(BASE, '')}`);
