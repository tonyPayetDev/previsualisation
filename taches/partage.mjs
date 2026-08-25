// Génère /partage/ — la liste des liens de démonstration à envoyer, et un
// lecteur vidéo par maquette qui en possède une.
//
// Pourquoi cette page existe : le sommaire du site liste TOUTES les maquettes
// clientes. Envoyer son adresse à un prospect, c'est lui montrer le travail
// fait pour ses concurrents. Le sommaire passe donc derrière mot de passe, et
// cette page — protégée elle aussi — sert à copier le lien PUBLIC d'une seule
// maquette.
//
// ⚠️ Sur le lecteur vidéo : `controlsList="nodownload"` et le clic droit
// désactivé retirent le bouton « Enregistrer la vidéo ». Ils n'empêchent PAS
// quelqu'un de déterminé de récupérer le fichier — le navigateur doit bien le
// télécharger pour le lire. C'est une barrière contre le geste ordinaire, pas
// une protection. Le dire plutôt que de le laisser croire.
import fs from 'node:fs';
import path from 'node:path';

const R = '/work/previsualisation';
const BASE = 'https://previsualisation.automatisationboost.com';

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* On ne liste que ce qui est réellement envoyable : un dossier avec un
   index.html. Une entrée qui mène à un 404 dans une main de prospect coûte
   plus cher que son absence. */
const dossiers = fs.readdirSync(R, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^(client-|koytcha-)/.test(d.name))
  .map((d) => d.name)
  .filter((n) => fs.existsSync(path.join(R, n, 'index.html')))
  .sort();

const VIDEOS = ['video.mp4', 'video-offerte.mp4', 'final.mp4'];

const fiches = dossiers.map((nom) => {
  const html = fs.readFileSync(path.join(R, nom, 'index.html'), 'utf8').slice(0, 4000);
  const t = html.match(/<title>([^<]*)<\/title>/i);
  const titre = t ? t[1].trim() : nom;
  const video = VIDEOS.find((v) => fs.existsSync(path.join(R, nom, v))) || null;
  const poids = (() => {
    try { return fs.statSync(path.join(R, nom, video)).size; } catch { return 0; }
  })();
  return { nom, titre, video, poids };
});

/* ── Un lecteur par maquette qui a une vidéo ──────────────────────────── */
let lecteurs = 0;
for (const f of fiches.filter((x) => x.video)) {
  const page = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(f.titre)} — vidéo</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;background:#0d0c0b;color:#EDE7E0;
  font:400 15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:22px;padding:28px 18px}
h1{margin:0;font-size:clamp(19px,3.4vw,26px);font-weight:600;text-align:center;
  letter-spacing:-.01em;max-width:22ch;text-wrap:balance}
.cadre{position:relative;width:min(430px,92vw);border-radius:14px;overflow:hidden;
  background:#000;box-shadow:0 24px 70px rgba(0,0,0,.6)}
video{display:block;width:100%;height:auto;background:#000}
.lien{font-size:13.5px;color:#9a938c;text-decoration:none;border-bottom:1px solid #34302c;
  padding-bottom:2px}
.lien:hover{color:#EDE7E0}
</style></head>
<body>
  <h1>${esc(f.titre)}</h1>
  <div class="cadre">
    <video controls playsinline preload="metadata"
           controlsList="nodownload noplaybackrate"
           disablePictureInPicture
           oncontextmenu="return false">
      <source src="${esc(f.video)}" type="video/mp4">
      Votre navigateur ne sait pas lire cette vidéo.
    </video>
  </div>
  <a class="lien" href="./">Voir le site</a>
<script>
/* Le glisser-déposer d'une vidéo hors du navigateur est l'autre geste
   ordinaire de récupération. On le bloque aussi. */
document.querySelectorAll('video').forEach(function (v) {
  v.addEventListener('dragstart', function (e) { e.preventDefault(); });
});
</script>
</body></html>`;
  fs.writeFileSync(path.join(R, f.nom, 'video.html'), page);
  lecteurs++;
}

/* ── La page de partage ───────────────────────────────────────────────── */
const carte = (f) => `      <li class="m" data-cle="${esc((f.nom + ' ' + f.titre).toLowerCase())}">
        <div class="hd">
          <b>${esc(f.titre)}</b>
          <span class="slug">/${esc(f.nom)}/</span>
        </div>
        <div class="act">
          <button type="button" class="cp" data-url="${BASE}/${esc(f.nom)}/">Copier le lien</button>
          <a class="ouv" href="${BASE}/${esc(f.nom)}/" target="_blank" rel="noopener">Ouvrir</a>
          ${f.video ? `<button type="button" class="cp vid" data-url="${BASE}/${esc(f.nom)}/video.html">Copier la vidéo</button>` : ''}
        </div>
      </li>`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Liens de démonstration</title>
<style>
:root{--noir:#0f1115;--carte:#171a21;--ligne:#262b36;--blanc:#eef1f6;--gris:#8b93a3;
      --vert:#3BC47D;--chaud:#F5A524}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--noir);color:var(--blanc);
  font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:22px 16px 70px}
.wrap{max-width:680px;margin:0 auto}
.sur{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gris)}
h1{font-size:clamp(26px,6vw,36px);line-height:1.06;font-weight:800;letter-spacing:-.03em;margin:8px 0 12px}
.intro{color:var(--gris);font-size:14.5px;line-height:1.65;margin-bottom:6px}
.intro b{color:var(--blanc)}
.avert{margin:16px 0 20px;padding:12px 14px;border-radius:9px;background:#1a1512;
  border:1px solid #3a2c1d;color:#d8c6a8;font-size:13.5px;line-height:1.6}
input[type=search]{width:100%;margin:14px 0 18px;background:var(--carte);
  border:1px solid var(--ligne);border-radius:10px;color:var(--blanc);
  padding:13px 15px;font:inherit;font-size:15px}
input[type=search]:focus{outline:2px solid var(--vert);outline-offset:1px}
ul{list-style:none}
.m{background:var(--carte);border:1px solid var(--ligne);border-radius:11px;
  padding:13px 15px;margin-bottom:9px}
.hd b{display:block;font-size:15.5px;font-weight:600;line-height:1.35}
.slug{display:block;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;
  color:var(--gris);margin-top:3px}
.act{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap}
.act button,.act a{flex:1 1 auto;text-align:center;border:1px solid var(--ligne);
  background:#0f1115;color:var(--blanc);border-radius:8px;padding:9px 12px;
  font:inherit;font-size:13px;cursor:pointer;text-decoration:none}
.act button:hover,.act a:hover{border-color:var(--vert)}
.act button.ok{background:var(--vert);border-color:var(--vert);color:#08130c}
.act .vid{border-color:#3a2c1d;color:var(--chaud)}
.vide{color:var(--gris);font-size:14px;padding:14px 2px}
.pied{margin-top:26px;color:var(--gris);font-size:13px;line-height:1.65}
</style></head>
<body><div class="wrap">
<p class="sur">Prévisualisation · à envoyer</p>
<h1>Liens de démonstration</h1>
<p class="intro">Cette page est <b>protégée</b>. Les liens qu'elle contient ne le sont pas :
un prospect les ouvre sans mot de passe, et il ne voit que sa maquette — pas le sommaire,
pas les autres clients, pas le tableau de bord.</p>

<div class="avert"><b>Sur la vidéo :</b> le bouton « enregistrer » est retiré et le clic droit
désactivé. Ça arrête le geste ordinaire. Ça n'arrête pas quelqu'un de déterminé — un
navigateur doit télécharger une vidéo pour la lire. Il n'existe pas de moyen de l'empêcher.</div>

<input type="search" id="q" placeholder="Chercher un client…" autocomplete="off">
<ul id="liste">
${fiches.map(carte).join('\n')}
</ul>
<p class="vide" id="vide" hidden>Aucune maquette ne correspond.</p>

<p class="pied">${fiches.length} maquettes en ligne · ${fiches.filter((f) => f.video).length} avec vidéo.
Généré le ${new Date().toLocaleDateString('fr-FR', { timeZone: 'Indian/Reunion' })}.</p>
</div>
<script>
var q = document.getElementById('q');
var items = [].slice.call(document.querySelectorAll('.m'));
var vide = document.getElementById('vide');
q.addEventListener('input', function () {
  var v = q.value.trim().toLowerCase();
  var n = 0;
  items.forEach(function (li) {
    var ok = !v || li.dataset.cle.indexOf(v) !== -1;
    li.hidden = !ok; if (ok) n++;
  });
  vide.hidden = n > 0;
});

/* Copie : on tente l'API moderne, et on retombe sur une zone de texte
   temporaire — sur un téléphone en http, navigator.clipboard n'existe pas
   toujours, et un bouton « copier » qui ne copie rien est pire que pas de
   bouton du tout. */
function copier(txt) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
  return new Promise(function (res, rej) {
    var z = document.createElement('textarea');
    z.value = txt; z.setAttribute('readonly', '');
    z.style.position = 'fixed'; z.style.opacity = '0';
    document.body.appendChild(z); z.select();
    try { document.execCommand('copy'); res(); } catch (e) { rej(e); }
    document.body.removeChild(z);
  });
}
document.querySelectorAll('.cp').forEach(function (b) {
  b.addEventListener('click', function () {
    var t = b.textContent;
    copier(b.dataset.url).then(function () {
      b.textContent = 'Copié ✓'; b.classList.add('ok');
      setTimeout(function () { b.textContent = t; b.classList.remove('ok'); }, 1600);
    }).catch(function () { b.textContent = 'Échec — copie à la main'; });
  });
});
</script>
</body></html>`;

fs.mkdirSync(path.join(R, 'partage'), { recursive: true });
fs.writeFileSync(path.join(R, 'partage', 'index.html'), html);
console.log(`  partage/index.html · ${fiches.length} maquettes · ${lecteurs} lecteurs vidéo générés`);
fiches.filter((f) => f.video).forEach((f) => console.log(`    vidéo : ${f.nom}/${f.video} (${Math.round(f.poids / 1024)} ko)`));
