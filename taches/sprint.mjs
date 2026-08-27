/* Génère /sprint/ — la salle de sprint : une tâche, sept minutes, on enchaîne.
 *
 * Demande de Tony (2026-08-27) : « une interface avec les tâches où je peux
 * commencer. Dès que je lance, ça part sur 7 min, et le son me dit que ça va
 * bientôt finir pour enchaîner. La tâche que je ne fais pas, je dis pourquoi et
 * j'enchaîne. Je vois combien j'ai fait. À la fin, celles que j'ai pas faites,
 * reportées au lendemain. »
 *
 * La liste est figée à la génération, comme les autres tableaux de bord : la
 * page n'a alors aucune dépendance réseau et s'ouvre au téléphone même en
 * connexion pourrie.
 *
 *   node sprint.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ICI = path.dirname(new URL(import.meta.url).pathname);
const R = path.join(ICI, '..');
const SORTIE = path.join(R, 'sprint');
fs.mkdirSync(SORTIE, { recursive: true });

const src = JSON.parse(fs.readFileSync(path.join(ICI, 'taches.json'), 'utf8'));
const brutes = src.taches || [];

/* L'ordre est celui du tableau de bord : la proximité du cash d'abord, puis ce
   qui est bloqué en dernier — inutile de lancer un chrono sur une tâche qui
   attend quelqu'un d'autre. */
const RANG_CASH = { direct: 0, proche: 1, loin: 2 };
const RANG_ETAT = { attente: 0, bloque: 1 };

const ouvertes = brutes
  .filter((t) => t.etat !== 'livre')
  .map((t, i) => ({
    id: `t${i}`,
    t: String(t.t || '').trim(),
    note: String(t.note || '').trim(),
    cash: t.cash || 'loin',
    cashNote: String(t.cashNote || '').trim(),
    etat: t.etat,
    echeance: t.echeance || '',
    lien: t.lien || '',
  }))
  .sort((a, b) => (RANG_ETAT[a.etat] ?? 9) - (RANG_ETAT[b.etat] ?? 9)
    || (RANG_CASH[a.cash] ?? 9) - (RANG_CASH[b.cash] ?? 9));

/* Ce que seul Tony peut débloquer : ça n'entre pas dans le sprint (un chrono
   n'y change rien) mais ça doit rester sous les yeux. */
const aToi = (src.aToi || []).map((x) => String(x.t || x).trim()).filter(Boolean);

const ech = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Sprint</title>
<style>
:root{
  --fond:#08080b; --carte:#101015; --carte2:#16161d; --bord:#24242e;
  --texte:#f4f4f5; --doux:#a1a1aa; --faible:#71717a;
  --or:#eab308; --vert:#22c55e; --rouge:#ef4444; --orange:#f97316; --violet:#8b5cf6;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--fond);color:var(--texte);line-height:1.55;
  font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  -webkit-font-smoothing:antialiased}
h1,h2,h3{margin:0;font-weight:800;letter-spacing:-.02em;text-wrap:balance}
button{font:inherit;cursor:pointer;border-radius:11px;border:1px solid var(--bord);
  background:var(--carte2);color:var(--texte);padding:11px 17px;font-weight:600;transition:.15s}
button:hover:not(:disabled){border-color:var(--faible)}
button:disabled{opacity:.4;cursor:not-allowed}
button:focus-visible{outline:2px solid var(--or);outline-offset:2px}
.principal{background:var(--or);color:#000;border-color:var(--or)}
.principal:hover:not(:disabled){background:#fbbf24}
.ok{background:var(--vert);border-color:var(--vert);color:#04150a}
.ok:hover:not(:disabled){background:#4ade80}
.non{border-color:#7f1d1d;color:#fca5a5}

header{position:sticky;top:0;z-index:20;background:rgba(8,8,11,.94);
  backdrop-filter:blur(10px);border-bottom:1px solid var(--bord)}
.bandeau{max-width:900px;margin:0 auto;padding:13px 18px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.marque{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--or)}
.grandir{flex:1}
.score{display:flex;gap:14px;font-size:13px;color:var(--doux);font-variant-numeric:tabular-nums}
.score b{color:var(--texte)}
.score .v{color:var(--vert)}
.score .p{color:var(--orange)}
a.retour{color:var(--faible);font-size:12px;text-decoration:none}
a.retour:hover{color:var(--or)}

main{max-width:900px;margin:0 auto;padding:20px 18px 80px}
.panneau{background:var(--carte);border:1px solid var(--bord);border-radius:16px;padding:18px}

/* ── la scène de sprint ── */
.scene{text-align:center;padding:26px 18px 22px}
.scene .quoi{font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--or);margin-bottom:12px}
.scene .tache{font-size:clamp(19px,4.6vw,27px);font-weight:800;line-height:1.28;max-width:22ch;margin:0 auto 6px}
.scene .note{font-size:13.5px;color:var(--doux);max-width:44ch;margin:0 auto}

.cadran{margin:22px auto 6px;width:min(230px,58vw);aspect-ratio:1;position:relative;display:grid;place-items:center}
.cadran svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.cadran .piste{fill:none;stroke:var(--carte2);stroke-width:9}
.cadran .part{fill:none;stroke:var(--or);stroke-width:9;stroke-linecap:round;
  transition:stroke .4s}
.cadran.bientot .part{stroke:var(--orange)}
.cadran.fini .part{stroke:var(--vert)}
.chrono{font-size:clamp(38px,10vw,54px);font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.03em}
.sous-chrono{font-size:12px;color:var(--faible);margin-top:-4px}

.actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px}
.durees{display:flex;gap:7px;justify-content:center;margin-top:14px}
.durees button{padding:6px 13px;font-size:12.5px;border-radius:999px}
.durees button[aria-pressed="true"]{border-color:var(--or);color:var(--or)}

/* ── le verdict ── */
.verdict{margin-top:16px;border-top:1px solid var(--bord);padding-top:16px}
.verdict p{margin:0 0 12px;font-size:14.5px;color:var(--doux)}
.raisons{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;margin-bottom:11px}
.raisons button{padding:7px 13px;font-size:12.5px;border-radius:999px}
.raisons button[aria-pressed="true"]{border-color:var(--or);color:var(--or);background:rgba(234,179,8,.1)}
.verdict input{width:100%;max-width:420px;background:var(--carte2);border:1px solid var(--bord);
  color:var(--texte);border-radius:10px;padding:10px 13px;font:inherit;font-size:14px}
.verdict input:focus{outline:2px solid var(--or);outline-offset:1px}

/* ── la liste ── */
.groupe{margin-top:26px}
.groupe-tete{display:flex;align-items:baseline;gap:9px;margin-bottom:10px;padding:0 3px}
.groupe-tete h2{font-size:14px}
.groupe-tete span{font-size:12px;color:var(--faible)}
.liste{display:flex;flex-direction:column;gap:6px}
.item{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:11px;
  border:1px solid transparent;background:var(--carte2);text-align:left;width:100%;color:inherit;font:inherit}
.item:hover{border-color:var(--bord)}
.item[data-etat="fait"]{opacity:.45}
.item[data-etat="fait"] .txt{text-decoration:line-through}
.item[data-etat="passe"]{opacity:.6}
.pastille{width:9px;height:9px;border-radius:50%;flex:none}
.pastille.direct{background:var(--vert)}
.pastille.proche{background:var(--orange)}
.pastille.loin{background:var(--rouge)}
.txt{flex:1;min-width:0;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jeton{flex:none;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
  padding:3px 8px;border-radius:999px;border:1px solid var(--bord);color:var(--faible)}
.jeton.fait{background:rgba(34,197,94,.13);border-color:rgba(34,197,94,.35);color:var(--vert)}
.jeton.passe{background:rgba(249,115,22,.12);border-color:rgba(249,115,22,.32);color:var(--orange)}
.jeton.bloque{border-color:rgba(239,68,68,.35);color:#fca5a5}

.atoi{margin-top:26px;background:var(--carte);border:1px solid var(--bord);
  border-left:3px solid var(--rouge);border-radius:14px;padding:15px 17px}
.atoi h2{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#fca5a5;margin-bottom:9px}
.atoi ul{margin:0;padding-left:19px;font-size:13.5px;color:var(--doux)}
.atoi li{margin-bottom:5px}

.bilan{margin-top:26px}
.bilan h2{font-size:14px;margin-bottom:10px}
.bilan .ligne{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:var(--doux);
  padding:9px 0;border-top:1px solid var(--bord)}
.bilan .ligne b{color:var(--texte);font-weight:600}
.bilan .pourquoi{color:var(--orange)}
.pied{margin-top:22px;display:flex;gap:10px;flex-wrap:wrap}
.note-bas{margin-top:18px;font-size:12px;color:var(--faible);line-height:1.65}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>

<header>
  <div class="bandeau">
    <div>
      <div class="marque">Automatisation Boost</div>
      <h1 style="font-size:18px">Sprint</h1>
    </div>
    <div class="grandir"></div>
    <div class="score">
      <span class="v"><b id="nFait">0</b> faites</span>
      <span class="p"><b id="nPasse">0</b> passées</span>
      <span><b id="nReste">0</b> restantes</span>
    </div>
    <a class="retour" href="/onboarding/">← cockpit</a>
  </div>
</header>

<main>
  <section class="panneau scene" id="scene">
    <div class="quoi" id="sceneQuoi">Prêt</div>
    <div class="tache" id="sceneTache">Choisis une tâche pour lancer le chrono.</div>
    <div class="note" id="sceneNote"></div>

    <div class="cadran" id="cadran" hidden>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle class="piste" cx="60" cy="60" r="52"></circle>
        <circle class="part" id="arc" cx="60" cy="60" r="52"
                stroke-dasharray="326.7" stroke-dashoffset="0"></circle>
      </svg>
      <div>
        <div class="chrono" id="chrono">7:00</div>
        <div class="sous-chrono" id="sousChrono"></div>
      </div>
    </div>

    <div class="durees" id="durees">
      <button data-min="5" aria-pressed="false">5 min</button>
      <button data-min="7" aria-pressed="true">7 min</button>
      <button data-min="10" aria-pressed="false">10 min</button>
    </div>

    <div class="actions" id="actions">
      <button id="btnStart" class="principal" disabled>Démarrer</button>
      <button id="btnStop" hidden>Arrêter</button>
    </div>

    <div class="verdict" id="verdict" hidden>
      <p id="verdictQ">Sept minutes passées. Tu l'as faite ?</p>
      <div class="actions">
        <button id="btnFait" class="ok">Faite</button>
        <button id="btnPasFaite" class="non">Pas faite</button>
      </div>
      <div id="zonePourquoi" hidden style="margin-top:14px">
        <div class="raisons" id="raisons">
          <button data-r="pas le bon moment">pas le bon moment</button>
          <button data-r="il me manque un élément">il me manque un élément</button>
          <button data-r="plus gros que prévu">plus gros que prévu</button>
          <button data-r="plus prioritaire ailleurs">plus prioritaire ailleurs</button>
          <button data-r="ça dépend de quelqu'un">ça dépend de quelqu'un</button>
        </div>
        <input id="pourquoi" placeholder="ou écris pourquoi…" autocomplete="off" />
        <div class="actions" style="margin-top:12px">
          <button id="btnValiderNon" class="principal">Enregistrer et enchaîner</button>
        </div>
      </div>
    </div>
  </section>

  <div id="listes"></div>

  ${aToi.length ? `<div class="atoi">
    <h2>Ce que personne d’autre ne peut débloquer</h2>
    <ul>${aToi.map((x) => `<li>${ech(x)}</li>`).join('')}</ul>
  </div>` : ''}

  <section class="panneau bilan" id="bilan" hidden>
    <h2>Bilan de la session</h2>
    <div id="bilanCorps"></div>
    <div class="pied">
      <button id="btnReporter" class="principal">Reporter les non faites à demain</button>
      <button id="btnReset" class="non">Repartir de zéro</button>
    </div>
  </section>

  <p class="note-bas">
    Le chrono est calé sur l’horloge, pas sur un compteur : il reste juste même si tu changes
    d’onglet ou si tu recharges la page. Les sons sont synthétisés, il n’y a aucun fichier à
    charger. Tout reste dans ce navigateur.
  </p>
</main>

<script>
const TACHES = ${JSON.stringify(ouvertes)};
const JOUR = new Date().toISOString().slice(0, 10);
const CLE = 'sprint-' + JOUR;
const CLE_REPORT = 'sprint-reportees';

const $ = (s) => document.querySelector(s);
const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

/* ── état, gardé par jour ───────────────────────────────────────────── */
const vide = { etats: {}, raisons: {}, courante: null, debut: null, duree: 420 };
let S = { ...vide };
try { Object.assign(S, JSON.parse(localStorage.getItem(CLE) || '{}')); } catch (e) {}
const sauver = () => localStorage.setItem(CLE, JSON.stringify(S));

/* Les tâches reportées la veille remontent en tête : c'est tout l'intérêt du
   report, sinon elles se rediluent dans la liste. */
let reportees = [];
try { reportees = JSON.parse(localStorage.getItem(CLE_REPORT) || '[]'); } catch (e) {}
const ordre = [...TACHES].sort((a, b) => {
  const ra = reportees.includes(a.t) ? 0 : 1, rb = reportees.includes(b.t) ? 0 : 1;
  return ra - rb;
});

/* ── le son : synthétisé, aucun fichier ─────────────────────────────── */
let ctx = null;
const programmes = [];
function reveiller() {
  if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (A) ctx = new A(); }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}
/* On programme les sons sur l'horloge AUDIO, pas avec setTimeout : un onglet en
   arrière-plan fait dériver les minuteurs de plusieurs secondes, jamais l'horloge
   audio. Le son tombe donc juste même si Tony a changé d'application. */
function bip(dans, notes, vol) {
  if (!ctx) return;
  notes.forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    const t = ctx.currentTime + dans + i * 0.17;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.45);
    programmes.push(o);
  });
}
const couperSons = () => { while (programmes.length) { try { programmes.pop().stop(); } catch (e) {} } };

/* ── la liste ───────────────────────────────────────────────────────── */
const LIB_CASH = { direct: 'rapporte directement', proche: 'y mène', loin: 'plus loin du cash' };
function bâtir() {
  const par = { attente: [], bloque: [] };
  for (const t of ordre) (par[t.etat] || par.attente).push(t);
  $('#listes').innerHTML = Object.entries(par).filter(([, v]) => v.length).map(([etat, v]) => \`
    <div class="groupe">
      <div class="groupe-tete">
        <h2>\${etat === 'bloque' ? 'Bloquées' : 'À faire'}</h2>
        <span>\${v.length} \${etat === 'bloque' ? '· un chrono n’y changera rien' : '· les plus proches du cash d’abord'}</span>
      </div>
      <div class="liste">\${v.map((t) => \`
        <button class="item" data-id="\${t.id}" data-etat="">
          <span class="pastille \${t.cash}"></span>
          <span class="txt">\${t.t.replace(/</g, '&lt;')}</span>
          \${reportees.includes(t.t) ? '<span class="jeton">reportée</span>' : ''}
          \${etat === 'bloque' ? '<span class="jeton bloque">bloquée</span>' : ''}
          <span class="jeton" data-st="\${t.id}"></span>
        </button>\`).join('')}</div>
    </div>\`).join('');
  document.querySelectorAll('.item').forEach((b) => b.onclick = () => choisir(b.dataset.id));
}

function rafraichir() {
  let fait = 0, passe = 0;
  for (const t of TACHES) {
    const e = S.etats[t.id];
    if (e === 'fait') fait++; else if (e === 'passe') passe++;
    const j = document.querySelector(\`[data-st="\${t.id}"]\`);
    if (j) { j.textContent = e === 'fait' ? 'faite' : e === 'passe' ? 'passée' : ''; j.className = 'jeton ' + (e || ''); }
    const it = document.querySelector(\`.item[data-id="\${t.id}"]\`);
    if (it) it.dataset.etat = e || '';
  }
  $('#nFait').textContent = fait;
  $('#nPasse').textContent = passe;
  $('#nReste').textContent = TACHES.length - fait - passe;
  $('#bilan').hidden = (fait + passe) === 0;
  bilan();
}

/* ── le chrono ──────────────────────────────────────────────────────── */
const CIRC = 2 * Math.PI * 52;
let boucle = null;

function choisir(id) {
  if (S.debut) return;                       // un sprint en cours : on ne change pas de tâche
  const t = TACHES.find((x) => x.id === id);
  if (!t) return;
  S.courante = id; sauver();
  $('#sceneQuoi').textContent = 'La tâche';
  $('#sceneTache').textContent = t.t;
  $('#sceneNote').textContent = t.cashNote || t.note || LIB_CASH[t.cash];
  $('#btnStart').disabled = false;
  $('#verdict').hidden = true;
  $('#cadran').hidden = true;
  document.querySelectorAll('.item').forEach((b) => b.style.borderColor = b.dataset.id === id ? 'var(--or)' : '');
  $('#scene').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function demarrer() {
  if (!S.courante) return;
  reveiller();
  S.debut = Date.now(); sauver();
  couperSons();
  const reste = S.duree;
  if (reste > 62) bip(reste - 60, [880, 1046], 0.16);   // « il te reste une minute »
  bip(reste, [660, 880, 1174], 0.22);                    // fin
  $('#btnStart').hidden = true; $('#btnStop').hidden = false;
  $('#cadran').hidden = false; $('#verdict').hidden = true;
  $('#sceneQuoi').textContent = 'En cours';
  tic();
  boucle = setInterval(tic, 250);
}

function tic() {
  if (!S.debut) return;
  const ecoule = (Date.now() - S.debut) / 1000;
  const reste = Math.max(0, S.duree - ecoule);
  $('#chrono').textContent = fmt(reste);
  document.title = fmt(reste) + ' · Sprint';
  $('#arc').setAttribute('stroke-dashoffset', String(CIRC * (1 - reste / S.duree)));
  const c = $('#cadran');
  c.classList.toggle('bientot', reste <= 60 && reste > 0);
  c.classList.toggle('fini', reste === 0);
  $('#sousChrono').textContent = reste === 0 ? 'temps écoulé' : reste <= 60 ? 'bientôt fini' : '';
  if (reste === 0) finir();
}

function finir() {
  clearInterval(boucle); boucle = null;
  S.debut = null; sauver();
  $('#btnStop').hidden = true;
  $('#sceneQuoi').textContent = 'Verdict';
  $('#verdict').hidden = false;
  $('#zonePourquoi').hidden = true;
  $('#pourquoi').value = '';
  document.querySelectorAll('#raisons button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  document.title = 'Sprint';
}

function arreter() {
  couperSons();
  clearInterval(boucle); boucle = null;
  S.debut = null; sauver();
  $('#btnStop').hidden = true; $('#btnStart').hidden = false;
  $('#cadran').hidden = true;
  $('#sceneQuoi').textContent = 'La tâche';
  document.title = 'Sprint';
}

/* ── verdict et enchaînement ────────────────────────────────────────── */
function conclure(etat, raison) {
  couperSons();
  S.etats[S.courante] = etat;
  if (raison) S.raisons[S.courante] = raison;
  const finie = S.courante;
  S.courante = null; sauver();
  rafraichir();
  $('#verdict').hidden = true;
  $('#cadran').hidden = true;
  $('#btnStart').hidden = false; $('#btnStop').hidden = true;

  /* Enchaînement : on présélectionne la suivante non traitée. Un clic pour
     partir, pas deux — c'est la demande (« il n'y a pas trop d'arrêts »). */
  const i = ordre.findIndex((x) => x.id === finie);
  const suite = ordre.slice(i + 1).concat(ordre.slice(0, i + 1))
    .find((x) => !S.etats[x.id] && x.etat !== 'bloque');
  if (suite) { choisir(suite.id); $('#sceneQuoi').textContent = 'Suivante'; }
  else {
    $('#sceneQuoi').textContent = 'Fini';
    $('#sceneTache').textContent = 'Plus rien à lancer aujourd’hui.';
    $('#sceneNote').textContent = '';
    $('#btnStart').disabled = true;
  }
}

/* ── bilan ──────────────────────────────────────────────────────────── */
function bilan() {
  const lignes = [];
  for (const t of TACHES) {
    const e = S.etats[t.id];
    if (!e) continue;
    lignes.push(\`<div class="ligne">
      <span>\${e === 'fait' ? '✅' : '⏭️'}</span>
      <span><b>\${t.t.replace(/</g, '&lt;')}</b>\${S.raisons[t.id] ? \` — <span class="pourquoi">\${String(S.raisons[t.id]).replace(/</g, '&lt;')}</span>\` : ''}</span>
    </div>\`);
  }
  $('#bilanCorps').innerHTML = lignes.join('') || '<p style="color:var(--faible);font-size:13px">Rien encore.</p>';
}

/* ── branchements ───────────────────────────────────────────────────── */
$('#btnStart').onclick = demarrer;
$('#btnStop').onclick = arreter;
$('#btnFait').onclick = () => conclure('fait');
$('#btnPasFaite').onclick = () => { $('#zonePourquoi').hidden = false; $('#pourquoi').focus(); };
document.querySelectorAll('#raisons button').forEach((b) => b.onclick = () => {
  document.querySelectorAll('#raisons button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $('#pourquoi').value = b.dataset.r;
});
$('#btnValiderNon').onclick = () => conclure('passe', $('#pourquoi').value.trim() || 'sans raison donnée');
$('#pourquoi').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btnValiderNon').click(); });

document.querySelectorAll('#durees button').forEach((b) => b.onclick = () => {
  if (S.debut) return;
  S.duree = +b.dataset.min * 60; sauver();
  document.querySelectorAll('#durees button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $('#chrono').textContent = fmt(S.duree);
});

$('#btnReporter').onclick = () => {
  const nf = TACHES.filter((t) => S.etats[t.id] !== 'fait').map((t) => t.t);
  localStorage.setItem(CLE_REPORT, JSON.stringify(nf));
  $('#btnReporter').textContent = nf.length + ' reportée(s) — elles remonteront demain';
  $('#btnReporter').disabled = true;
};
$('#btnReset').onclick = () => {
  if (!confirm('Effacer la session du jour ?')) return;
  S = { ...vide }; localStorage.removeItem(CLE); location.reload();
};

/* ── démarrage ──────────────────────────────────────────────────────── */
bâtir();
document.querySelectorAll('#durees button').forEach((b) =>
  b.setAttribute('aria-pressed', String(+b.dataset.min * 60 === S.duree)));
$('#chrono').textContent = fmt(S.duree);
rafraichir();
if (S.courante) {
  choisir(S.courante);
  /* Sprint interrompu par un rechargement : on le reprend là où il en était.
     Le son ne peut pas être reprogrammé sans geste de l'utilisateur — on le dit
     plutôt que de laisser croire qu'il sonnera. */
  if (S.debut) {
    const reste = S.duree - (Date.now() - S.debut) / 1000;
    if (reste > 0) {
      $('#btnStart').hidden = true; $('#btnStop').hidden = false;
      $('#cadran').hidden = false; $('#sceneQuoi').textContent = 'En cours';
      tic(); boucle = setInterval(tic, 250);
      $('#sousChrono').textContent = 'repris — touche l’écran pour réactiver le son';
      const rearmer = () => { reveiller(); couperSons();
        const r = S.duree - (Date.now() - S.debut) / 1000;
        if (r > 62) bip(r - 60, [880, 1046], 0.16);
        if (r > 0) bip(r, [660, 880, 1174], 0.22);
        document.removeEventListener('pointerdown', rearmer); };
      document.addEventListener('pointerdown', rearmer, { once: true });
    } else { S.debut = null; sauver(); finir(); }
  }
}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(SORTIE, 'index.html'), html);
console.log(`  sprint/index.html · ${ouvertes.length} tâches ouvertes (${ouvertes.filter((t) => t.etat === 'bloque').length} bloquées) · ${aToi.length} points « à toi »`);
