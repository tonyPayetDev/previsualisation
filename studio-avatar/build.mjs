/* Génère /work/previsualisation/studio-avatar/index.html à partir de la VRAIE
 * banque d'avatars, pour que la page ne puisse pas se désynchroniser du manifeste.
 *
 * Lancer :  node build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const RACINE = '/work/autoboost-neon-videos/_shared/avatar-bank';
const ICI = path.dirname(new URL(import.meta.url).pathname);

const manifeste = JSON.parse(fs.readFileSync(path.join(RACINE, 'manifest.json'), 'utf8'));

/* Les clips réellement tournés, constatés sur le disque — jamais déduits d'une
 * liste écrite à la main : le manifeste annonce 24 clips, il n'en existe que 3
 * dans le set bureau (voir MANIFESTE.md). */
const dossierExemples = path.join(ICI, 'exemples');
const presents = fs.existsSync(dossierExemples) ? fs.readdirSync(dossierExemples).filter((f) => f.endsWith('.mp4')) : [];
/* On rapproche par IDENTIFIANT de pose, pas par nom de fichier : le manifeste
 * appelle B1 « B1_neutre_mains_basses.mp4 » alors que le fichier réel s'appelle
 * « B1_principe.mp4 ». Un rapprochement strict faisait disparaître cet exemple
 * sans rien signaler. */
const exemplePour = (clip) => {
  const f = presents.find((x) => x === clip.file) || presents.find((x) => x.startsWith(`${clip.id}_`));
  if (f && f !== clip.file) console.warn(`  ⚠️  ${clip.id} : manifeste « ${clip.file} » ≠ disque « ${f} »`);
  return f ? `exemples/${f}` : null;
};

const POSES = manifeste.clips.map((c) => ({
  id: c.id,
  role: c.role,
  energie: c.energy,
  geste: c.gesture,
  texte: c.spoken,
  min: c.targetDuration?.[0] ?? 3,
  max: c.targetDuration?.[1] ?? 5,
  exemple: exemplePour(c),
}));

const ROLES = {
  hook: { titre: 'Accroche', sous: 'ouverture, énergie haute', lettre: 'A' },
  explain: { titre: 'Explication', sous: 'corps du propos, énergie moyenne', lettre: 'B' },
  cta: { titre: 'Appel à l’action', sous: 'conclusion', lettre: 'C' },
};

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="robots" content="noindex, nofollow" />
<title>Studio de pose</title>
<style>
:root{
  --fond:#08080b; --carte:#101015; --carte2:#16161d; --bord:#24242e;
  --texte:#f4f4f5; --doux:#a1a1aa; --faible:#71717a;
  --or:#eab308; --violet:#8b5cf6; --vert:#22c55e; --rouge:#ef4444;
  --rayon:14px;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--fond); color:var(--texte);
  font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  line-height:1.55; -webkit-font-smoothing:antialiased;
}
h1,h2,h3{margin:0;font-weight:800;letter-spacing:-.02em;text-wrap:balance}

/* ── en-tête ─────────────────────────────────────────────── */
header{
  position:sticky; top:0; z-index:30; background:rgba(8,8,11,.92);
  backdrop-filter:blur(10px); border-bottom:1px solid var(--bord);
}
.bandeau{max-width:1240px;margin:0 auto;padding:14px 20px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.marque{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--or)}
.titre{font-size:19px}
.grandir{flex:1}
.nom-avatar{
  background:var(--carte2);border:1px solid var(--bord);color:var(--texte);
  border-radius:9px;padding:9px 13px;font:inherit;font-size:14px;min-width:190px;
}
.nom-avatar:focus{outline:2px solid var(--or);outline-offset:1px}
.jauge{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--doux);font-variant-numeric:tabular-nums}
.jauge-piste{width:130px;height:6px;border-radius:99px;background:var(--carte2);overflow:hidden}
.jauge-part{height:100%;width:0;background:linear-gradient(90deg,var(--or),var(--violet));transition:width .35s}

button{font:inherit;cursor:pointer;border-radius:10px;border:1px solid var(--bord);
  background:var(--carte2);color:var(--texte);padding:9px 15px;font-weight:600;transition:.15s}
button:hover:not(:disabled){border-color:var(--faible)}
button:disabled{opacity:.4;cursor:not-allowed}
button:focus-visible{outline:2px solid var(--or);outline-offset:2px}
.principal{background:var(--or);color:#000;border-color:var(--or)}
.principal:hover:not(:disabled){background:#fbbf24}
.danger{border-color:#7f1d1d;color:#fca5a5}

/* ── mise en page ────────────────────────────────────────── */
main{max-width:1240px;margin:0 auto;padding:22px 20px 90px;display:grid;grid-template-columns:1fr;gap:22px}
@media(min-width:1000px){
  main{grid-template-columns:minmax(0,1fr) 380px;align-items:start}
  /* la liste des 24 poses défile pour elle-même, sinon elle impose sa hauteur
     à toute la page et le studio se retrouve loin au-dessus du pli */
  aside.panneau{position:sticky;top:84px;max-height:calc(100vh - 160px);display:flex;flex-direction:column}
  aside.panneau .panneau-corps{overflow:auto}
}

.panneau{background:var(--carte);border:1px solid var(--bord);border-radius:var(--rayon);overflow:hidden}
.panneau-tete{padding:13px 17px;border-bottom:1px solid var(--bord);display:flex;align-items:center;gap:10px}
.panneau-corps{padding:17px}

/* ── studio ──────────────────────────────────────────────── */
.duo{display:grid;grid-template-columns:1fr;gap:14px}
@media(min-width:660px){.duo{grid-template-columns:1fr 1fr}}
/* Le 9:16 est le cadrage de tournage, pas la taille d'affichage : sans plafond
   les deux cadres remplissent l'écran et il faut faire défiler pour atteindre
   le bouton d'enregistrement. */
.cadre{position:relative;aspect-ratio:9/16;max-height:min(54vh,520px);margin:0 auto;width:100%;
  background:#000;border-radius:11px;overflow:hidden;border:1px solid var(--bord)}
.cadre video{width:100%;height:100%;object-fit:cover;display:block}
/* L'attribut hidden ne suffit PAS quand une règle pose un display : la valeur
   de la feuille l'emporte sur le display:none implicite de l'attribut. Sans ces
   deux lignes, le message « pas encore d'exemple » reste visible par-dessus la
   vidéo et la relecture se superpose à la caméra. */
.cadre video[hidden]{display:none}
.vide[hidden]{display:none}
#cam{transform:scaleX(-1)}
.etiquette{position:absolute;top:9px;left:9px;z-index:2;font-size:10px;font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;padding:4px 9px;border-radius:99px;background:rgba(0,0,0,.72);color:var(--doux)}
.etiquette.live{color:#fff;background:var(--rouge)}
.vide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:9px;text-align:center;padding:22px;color:var(--faible);font-size:13px}
.vide strong{color:var(--doux);font-size:14px;display:block}

.compte{position:absolute;inset:0;display:none;align-items:center;justify-content:center;
  background:rgba(0,0,0,.7);font-size:96px;font-weight:900;color:var(--or);z-index:5}
.compte.on{display:flex}
.barre-temps{position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(255,255,255,.12);z-index:4}
.barre-temps span{display:block;height:100%;width:0;background:var(--rouge)}

.consigne{margin-top:16px;background:var(--carte2);border:1px solid var(--bord);border-left:3px solid var(--or);
  border-radius:11px;padding:15px 17px}
.consigne .quoi{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--or);margin-bottom:7px}
.consigne .geste{font-size:14px;color:var(--doux);margin-bottom:11px}
.consigne .replique{font-size:19px;font-weight:700;line-height:1.35;text-wrap:balance}
.meta{margin-top:11px;font-size:12px;color:var(--faible);display:flex;gap:14px;flex-wrap:wrap;font-variant-numeric:tabular-nums}

.commandes{margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}

/* ── liste des poses ─────────────────────────────────────── */
.groupe+.groupe{margin-top:20px}
.groupe-tete{display:flex;align-items:baseline;gap:9px;margin-bottom:9px;padding:0 2px}
.puce-role{width:21px;height:21px;border-radius:6px;display:grid;place-items:center;font-size:11px;font-weight:800;
  background:rgba(234,179,8,.14);color:var(--or);border:1px solid rgba(234,179,8,.3)}
.groupe-tete h3{font-size:14px}
.groupe-tete span{font-size:12px;color:var(--faible)}

.poses{display:flex;flex-direction:column;gap:5px}
.pose{display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:9px;border:1px solid transparent;
  background:var(--carte2);cursor:pointer;text-align:left;width:100%;color:inherit;font:inherit}
.pose:hover{border-color:var(--bord)}
.pose[aria-current="true"]{border-color:var(--or);background:rgba(234,179,8,.09)}
.pose-id{font-size:11px;font-weight:800;color:var(--faible);width:26px;flex:none;font-variant-numeric:tabular-nums}
.pose-txt{flex:1;min-width:0;font-size:13px;color:var(--doux);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pose[aria-current="true"] .pose-txt{color:var(--texte)}
.jeton{flex:none;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;padding:3px 7px;border-radius:99px;
  border:1px solid var(--bord);color:var(--faible)}
.jeton.fait{background:rgba(34,197,94,.13);border-color:rgba(34,197,94,.35);color:var(--vert)}
.jeton.modele{background:rgba(139,92,246,.13);border-color:rgba(139,92,246,.35);color:var(--violet)}

/* ── pied ────────────────────────────────────────────────── */
.pied{position:fixed;left:0;right:0;bottom:0;z-index:25;background:rgba(8,8,11,.94);
  backdrop-filter:blur(10px);border-top:1px solid var(--bord)}
.pied-in{max-width:1240px;margin:0 auto;padding:11px 20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.etat{font-size:13px;color:var(--doux);flex:1;min-width:200px}
.etat b{color:var(--texte)}

.note{margin-top:14px;font-size:12px;color:var(--faible);line-height:1.65}
.note code{background:var(--carte2);padding:1px 5px;border-radius:4px;color:var(--doux);font-size:11px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>

<header>
  <div class="bandeau">
    <div>
      <div class="marque">Automatisation Boost</div>
      <h1 class="titre">Studio de pose</h1>
    </div>
    <div class="grandir"></div>
    <input id="nomAvatar" class="nom-avatar" placeholder="Nom du nouvel avatar" autocomplete="off" />
    <div class="jauge">
      <div class="jauge-piste"><div class="jauge-part" id="jauge"></div></div>
      <span id="compteur">0 / ${POSES.length}</span>
    </div>
  </div>
</header>

<main>
  <section class="panneau">
    <div class="panneau-tete">
      <strong id="poseTitre" style="font-size:15px">—</strong>
      <span id="poseRole" class="jeton"></span>
    </div>
    <div class="panneau-corps">
      <div class="duo">
        <div class="cadre">
          <span class="etiquette">Le modèle</span>
          <video id="modele" playsinline muted loop></video>
          <div class="vide" id="modeleVide" hidden>
            <strong>Pas encore d’exemple filmé</strong>
            Rejoue le geste décrit ci-dessous.
          </div>
        </div>
        <div class="cadre">
          <span class="etiquette" id="etiqCam">Toi</span>
          <video id="cam" playsinline muted></video>
          <video id="relecture" playsinline controls hidden></video>
          <div class="vide" id="camVide">
            <strong>Caméra éteinte</strong>
            Autorise la caméra pour commencer.
          </div>
          <div class="compte" id="compte">3</div>
          <div class="barre-temps"><span id="barreTemps"></span></div>
        </div>
      </div>

      <div class="consigne">
        <div class="quoi">Le geste à reproduire</div>
        <div class="geste" id="geste">—</div>
        <div class="quoi">La phrase à dire</div>
        <div class="replique" id="replique">—</div>
        <div class="meta" id="meta"></div>
      </div>

      <div class="commandes">
        <button id="btnCam" class="principal">Allumer la caméra</button>
        <button id="btnRec" disabled>Enregistrer la prise</button>
        <button id="btnGarder" hidden class="principal">Garder</button>
        <button id="btnRefaire" hidden>Refaire</button>
        <button id="btnSuivant">Pose suivante</button>
        <button id="btnSuppr" class="danger" hidden>Supprimer la prise</button>
      </div>

      <p class="note">
        Les prises restent dans ce navigateur (elles survivent à un rechargement) et ne partent nulle part
        tant que tu n’exportes pas. Cadrage attendu&nbsp;: <code>9:16</code>, buste, tête dans le tiers
        supérieur, tiers inférieur dégagé pour les sous-titres.
      </p>
    </div>
  </section>

  <aside class="panneau">
    <div class="panneau-tete"><strong style="font-size:15px">Les ${POSES.length} poses</strong></div>
    <div class="panneau-corps" id="liste"></div>
  </aside>
</main>

<div class="pied">
  <div class="pied-in">
    <div class="etat" id="etat">Choisis une pose pour commencer.</div>
    <button id="btnExport" class="principal" disabled>Enregistrer comme nouvel avatar</button>
    <button id="btnVider" class="danger">Tout effacer</button>
  </div>
</div>

<script>
const POSES = ${JSON.stringify(POSES)};
const ROLES = ${JSON.stringify(ROLES)};

/* ── stockage : IndexedDB, pour qu'une session de 24 prises survive à un
      rechargement accidentel. localStorage ne tiendrait pas des vidéos. ── */
const DB_NOM = 'studio-avatar', DB_MAG = 'prises';
let db;
const ouvrirDB = () => new Promise((ok, ko) => {
  const r = indexedDB.open(DB_NOM, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(DB_MAG);
  r.onsuccess = () => ok(r.result);
  r.onerror = () => ko(r.error);
});
const tx = (mode) => db.transaction(DB_MAG, mode).objectStore(DB_MAG);
const dbMettre = (cle, val) => new Promise((ok, ko) => { const q = tx('readwrite').put(val, cle); q.onsuccess = ok; q.onerror = () => ko(q.error); });
const dbLire = (cle) => new Promise((ok) => { const q = tx('readonly').get(cle); q.onsuccess = () => ok(q.result); q.onerror = () => ok(undefined); });
const dbOter = (cle) => new Promise((ok) => { const q = tx('readwrite').delete(cle); q.onsuccess = ok; q.onerror = ok; });
const dbCles = () => new Promise((ok) => { const q = tx('readonly').getAllKeys(); q.onsuccess = () => ok(q.result || []); q.onerror = () => ok([]); });

/* ── état ── */
let index = 0, flux = null, enregistreur = null, morceaux = [], prisePro = null, faites = new Set();
const $ = (s) => document.querySelector(s);
const pose = () => POSES[index];

/* ── liste des poses ── */
function bâtirListe() {
  const parRole = {};
  POSES.forEach((p, i) => { (parRole[p.role] ||= []).push({ p, i }); });
  $('#liste').innerHTML = Object.entries(parRole).map(([role, items]) => {
    const r = ROLES[role] || { titre: role, sous: '', lettre: '?' };
    return \`<div class="groupe">
      <div class="groupe-tete"><span class="puce-role">\${r.lettre}</span><h3>\${r.titre}</h3><span>\${r.sous}</span></div>
      <div class="poses">\${items.map(({ p, i }) => \`
        <button class="pose" data-i="\${i}" aria-current="false">
          <span class="pose-id">\${p.id}</span>
          <span class="pose-txt">\${p.geste}</span>
          \${p.exemple ? '<span class="jeton modele">modèle</span>' : ''}
          <span class="jeton" data-etat="\${p.id}">à faire</span>
        </button>\`).join('')}</div>
    </div>\`;
  }).join('');
  $('#liste').querySelectorAll('.pose').forEach((b) => b.onclick = () => aller(+b.dataset.i));
}

function rafraichirEtats() {
  POSES.forEach((p) => {
    const j = document.querySelector(\`[data-etat="\${p.id}"]\`);
    if (!j) return;
    const ok = faites.has(p.id);
    j.textContent = ok ? 'gardée' : 'à faire';
    j.classList.toggle('fait', ok);
  });
  document.querySelectorAll('.pose').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.i === index)));
  const n = faites.size;
  $('#compteur').textContent = \`\${n} / \${POSES.length}\`;
  $('#jauge').style.width = (n / POSES.length * 100) + '%';
  $('#btnExport').disabled = n === 0;
}

/* ── afficher une pose ── */
async function aller(i) {
  index = (i + POSES.length) % POSES.length;
  const p = pose();
  $('#poseTitre').textContent = p.id + ' · ' + (ROLES[p.role]?.titre || p.role);
  $('#poseRole').textContent = 'énergie ' + p.energie;
  $('#geste').textContent = p.geste;
  $('#replique').textContent = '« ' + p.texte + ' »';
  $('#meta').innerHTML = \`<span>durée visée \${p.min}–\${p.max} s</span><span>9:16</span>\` +
    (p.exemple ? '' : '<span>aucun exemple filmé</span>');

  const m = $('#modele');
  if (p.exemple) { m.src = p.exemple; m.hidden = false; $('#modeleVide').hidden = true; m.play().catch(() => {}); }
  else { m.removeAttribute('src'); m.load(); m.hidden = true; $('#modeleVide').hidden = false; }

  await montrerPrise();
  rafraichirEtats();
  majEtat();
}

async function montrerPrise() {
  const enr = await dbLire(pose().id);
  const rel = $('#relecture');
  if (enr) {
    rel.src = URL.createObjectURL(enr.blob); rel.hidden = false;
    $('#cam').hidden = true; $('#camVide').hidden = true;
    $('#etiqCam').textContent = 'Prise gardée';
    $('#btnSuppr').hidden = false; $('#btnGarder').hidden = true; $('#btnRefaire').hidden = true;
    $('#btnRec').textContent = 'Refaire la prise';
  } else {
    rel.hidden = true; rel.removeAttribute('src');
    $('#cam').hidden = !flux; $('#camVide').hidden = !!flux;
    $('#etiqCam').textContent = 'Toi';
    $('#btnSuppr').hidden = true; $('#btnGarder').hidden = true; $('#btnRefaire').hidden = true;
    $('#btnRec').textContent = 'Enregistrer la prise';
  }
  $('#btnRec').disabled = !flux;
}

function majEtat() {
  const reste = POSES.length - faites.size;
  $('#etat').innerHTML = faites.size === 0
    ? 'Choisis une pose, allume la caméra, puis rejoue le geste du modèle.'
    : \`<b>\${faites.size}</b> prise\${faites.size > 1 ? 's' : ''} gardée\${faites.size > 1 ? 's' : ''}, <b>\${reste}</b> restante\${reste > 1 ? 's' : ''}.\`;
}

/* ── caméra ── */
$('#btnCam').onclick = async () => {
  if (flux) { flux.getTracks().forEach((t) => t.stop()); flux = null; $('#btnCam').textContent = 'Allumer la caméra'; return montrerPrise(); }
  try {
    flux = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 }, frameRate: { ideal: 30 } },
      audio: true,
    });
    $('#cam').srcObject = flux; $('#cam').play();
    $('#btnCam').textContent = 'Éteindre la caméra';
    await montrerPrise();
  } catch (e) {
    $('#etat').innerHTML = '<b>Caméra refusée</b> — ' + e.name + '. Sur mobile, la page doit être en HTTPS.';
  }
};

/* ── enregistrement ── */
function typeSupporte() {
  for (const t of ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

$('#btnRec').onclick = async () => {
  if (!flux) return;
  const p = pose();
  await dbOter(p.id); faites.delete(p.id);
  $('#relecture').hidden = true; $('#cam').hidden = false; $('#etiqCam').textContent = 'Toi';
  $('#btnSuppr').hidden = true; $('#btnRec').disabled = true; $('#btnSuivant').disabled = true;

  /* décompte, puis le modèle repart de zéro EN MÊME TEMPS que l'enregistrement :
     c'est ce synchronisme qui permet de calquer le mouvement. */
  const c = $('#compte'); c.classList.add('on');
  for (const n of [3, 2, 1]) { c.textContent = n; await new Promise((r) => setTimeout(r, 800)); }
  c.classList.remove('on');

  const m = $('#modele');
  if (p.exemple) { try { m.currentTime = 0; await m.play(); } catch (e) {} }

  morceaux = [];
  enregistreur = new MediaRecorder(flux, { mimeType: typeSupporte(), videoBitsPerSecond: 6_000_000 });
  enregistreur.ondataavailable = (e) => { if (e.data.size) morceaux.push(e.data); };
  enregistreur.onstop = () => {
    prisePro = new Blob(morceaux, { type: morceaux[0]?.type || 'video/webm' });
    const rel = $('#relecture');
    rel.src = URL.createObjectURL(prisePro); rel.hidden = false;
    $('#cam').hidden = true; $('#etiqCam').textContent = 'À revoir';
    $('#btnGarder').hidden = false; $('#btnRefaire').hidden = false;
    $('#btnRec').disabled = false; $('#btnSuivant').disabled = false;
    $('#barreTemps').style.width = '0%';
    $('#etiqCam').className = 'etiquette';
  };

  enregistreur.start(100);
  $('#etiqCam').textContent = 'Enregistrement'; $('#etiqCam').className = 'etiquette live';

  const duree = p.max * 1000, debut = performance.now();
  const tic = () => {
    if (!enregistreur || enregistreur.state !== 'recording') return;
    const t = performance.now() - debut;
    $('#barreTemps').style.width = Math.min(100, t / duree * 100) + '%';
    if (t >= duree) enregistreur.stop(); else requestAnimationFrame(tic);
  };
  requestAnimationFrame(tic);
};

$('#btnGarder').onclick = async () => {
  if (!prisePro) return;
  const p = pose();
  await dbMettre(p.id, { blob: prisePro, type: prisePro.type, taille: prisePro.size, le: new Date().toISOString() });
  faites.add(p.id); prisePro = null;
  await montrerPrise(); rafraichirEtats(); majEtat();
  if (faites.size < POSES.length) $('#btnSuivant').click();
};

$('#btnRefaire').onclick = () => { prisePro = null; montrerPrise(); };
$('#btnSuppr').onclick = async () => { await dbOter(pose().id); faites.delete(pose().id); await montrerPrise(); rafraichirEtats(); majEtat(); };
$('#btnSuivant').onclick = () => aller(index + 1);

$('#btnVider').onclick = async () => {
  if (!confirm('Effacer les ' + faites.size + ' prise(s) enregistrées ? C’est définitif.')) return;
  for (const c of await dbCles()) await dbOter(c);
  faites.clear(); await montrerPrise(); rafraichirEtats(); majEtat();
};

/* ── export : un seul fichier .zip, écrit à la main en « stored » (aucune
      compression : la vidéo l'est déjà, et ça évite une dépendance externe
      que la page ne pourrait pas charger). ── */
const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = TABLE_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

function zip(entrees) {
  const enc = new TextEncoder();
  const morceaux = [], central = [];
  let offset = 0;
  for (const { nom, donnees } of entrees) {
    const n = enc.encode(nom), crc = crc32(donnees), taille = donnees.length;
    const loc = new DataView(new ArrayBuffer(30));
    loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0, true);
    loc.setUint16(8, 0, true); loc.setUint16(10, 0, true); loc.setUint16(12, 0, true);
    loc.setUint32(14, crc, true); loc.setUint32(18, taille, true); loc.setUint32(22, taille, true);
    loc.setUint16(26, n.length, true); loc.setUint16(28, 0, true);
    morceaux.push(new Uint8Array(loc.buffer), n, donnees);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true);
    cen.setUint16(8, 0, true); cen.setUint16(10, 0, true); cen.setUint16(12, 0, true); cen.setUint16(14, 0, true);
    cen.setUint32(16, crc, true); cen.setUint32(20, taille, true); cen.setUint32(24, taille, true);
    cen.setUint16(28, n.length, true); cen.setUint16(30, 0, true); cen.setUint16(32, 0, true);
    cen.setUint16(34, 0, true); cen.setUint16(36, 0, true); cen.setUint32(38, 0, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), n);
    offset += 30 + n.length + taille;
  }
  const tailleCentral = central.reduce((s, x) => s + x.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, entrees.length, true); fin.setUint16(10, entrees.length, true);
  fin.setUint32(12, tailleCentral, true); fin.setUint32(16, offset, true);
  return new Blob([...morceaux, ...central, new Uint8Array(fin.buffer)], { type: 'application/zip' });
}

$('#btnExport').onclick = async () => {
  const brut = $('#nomAvatar').value.trim();
  if (!brut) { $('#nomAvatar').focus(); $('#etat').innerHTML = '<b>Donne un nom à l’avatar</b> avant d’exporter.'; return; }
  const nom = brut.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  $('#btnExport').disabled = true; $('#etat').textContent = 'Assemblage du fichier…';

  const entrees = [], fiches = [];
  for (const p of POSES) {
    const enr = await dbLire(p.id);
    if (!enr) continue;
    const ext = (enr.type || '').includes('mp4') ? 'mp4' : 'webm';
    const fichier = \`\${p.id}_\${p.role}.\${ext}\`;
    entrees.push({ nom: \`\${nom}/prises/\${fichier}\`, donnees: new Uint8Array(await enr.blob.arrayBuffer()) });
    fiches.push({ id: p.id, role: p.role, energy: p.energie, gesture: p.geste, spoken: p.texte,
      targetDuration: [p.min, p.max], file: fichier, recordedAt: enr.le, bytes: enr.taille });
  }
  const manifeste = {
    avatar: nom, label: brut, createdAt: new Date().toISOString(),
    source: 'studio-avatar (prise réelle caméra)',
    format: { aspect: '9:16', fps: 30, framing: 'buste, tête dans le tiers supérieur' },
    clips: fiches,
  };
  entrees.push({ nom: \`\${nom}/manifest.json\`, donnees: new TextEncoder().encode(JSON.stringify(manifeste, null, 2)) });

  const blob = zip(entrees);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = \`avatar-\${nom}.zip\`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  $('#btnExport').disabled = false;
  $('#etat').innerHTML = \`<b>avatar-\${nom}.zip</b> exporté — \${fiches.length} prise(s). Envoie-le pour l’installer dans la banque.\`;
};

/* ── démarrage ── */
(async () => {
  db = await ouvrirDB();
  faites = new Set(await dbCles());
  bâtirListe();
  await aller(0);
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ICI, 'index.html'), html);
console.log(`index.html écrit · ${POSES.length} poses · ${POSES.filter((p) => p.exemple).length} avec exemple filmé`);
