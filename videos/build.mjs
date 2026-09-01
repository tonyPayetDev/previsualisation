/* Le tableau de tri des vidéos.
 *
 * Pourquoi un générateur : les vidéos s'accumulent (53 aujourd'hui, une par
 * jour au minimum). Une page écrite à la main serait périmée le lendemain, et
 * une vidéo absente du tableau est une vidéo oubliée.
 *
 * Ce que la page NE fait pas : prétendre savoir ce qui est déjà publié.
 * Blotato réhéberge les fichiers, donc l'URL d'origine est perdue et le lien
 * ne peut pas être reconstitué après coup. La décision de Tony est donc la
 * source de vérité, et le lien avec Blotato se construira à partir de
 * maintenant, pas rétroactivement.
 *
 *   node build.mjs   ->  index.html + liste.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const D = path.dirname(new URL(import.meta.url).pathname);
const RACINE = path.join(D, '..');
const FF = '/home/claude/tools/ffmpeg-build/ffmpeg-7.0.2-amd64-static';

const duree = (f) => {
  try {
    return Math.round(Number(execFileSync(`${FF}/ffprobe`,
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
      { encoding: 'utf8' }).trim()));
  } catch { return 0; }
};

const titre = (r) => {
  for (const p of [`${RACINE}/${r}/index.html`, `${RACINE}/${r}/public/index.html`]) {
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').slice(0, 4000).match(/<title>([^<]{1,90})/);
    if (m) {
      const t = m[1]
        .replace(/^\s*(Prévisualisation|Aperçu)\s*[—·|-]\s*/i, '')
        .replace(/\s*[—·|]\s*(Prévisualisation|AutomatisationBoost).*$/i, '')
        .trim();
      if (t && t.toLowerCase() !== r.toLowerCase()) return t;
    }
  }
  return r.replace(/-/g, ' ');
};

const famille = (r) =>
  /^journal-ia/.test(r) ? 'Journal IA'
  : /^autoboost-/.test(r) ? 'Autoboost'
  : /^split-/.test(r) ? 'Écran scindé'
  : /^foodboost|^feed-/.test(r) ? 'FoodBoost'
  : /^client-|^pour-|^demo-|^papies|^lunisson|^avant-apres/.test(r) ? 'Client'
  : 'Autre';

const videos = [];
for (const e of fs.readdirSync(RACINE, { withFileTypes: true })) {
  if (!e.isDirectory() || e.name.startsWith('.') || e.name === 'videos') continue;
  const f = [`${RACINE}/${e.name}/video.mp4`, `${RACINE}/${e.name}/public/video.mp4`]
    .find((p) => fs.existsSync(p));
  if (!f) continue;
  const st = fs.statSync(f);
  videos.push({
    route: e.name, titre: titre(e.name), famille: famille(e.name),
    duree: duree(f), poids: Math.round(st.size / 1024 / 1024 * 10) / 10,
    date: st.mtime.toISOString().slice(0, 10),
    vignette: fs.existsSync(`${D}/vignettes/${e.name}.jpg`) ? `vignettes/${e.name}.jpg` : null,
  });
}
videos.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
fs.writeFileSync(`${D}/liste.json`, JSON.stringify(videos, null, 1) + '\n');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mmss = (s) => s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}` : `${s} s`;

const carte = (v) => `<li class="v" data-r="${esc(v.route)}" data-fam="${esc(v.famille)}">
  <a class="apercu" href="/${esc(v.route)}/" target="_blank" rel="noopener">
    ${v.vignette ? `<img src="${esc(v.vignette)}" alt="" loading="lazy" width="300">`
      : '<span class="rien">pas d’aperçu</span>'}
    <span class="dur">${mmss(v.duree)}</span>
  </a>
  <div class="info">
    <span class="fam">${esc(v.famille)}</span>
    <h3>${esc(v.titre)}</h3>
    <span class="meta">${esc(v.date)} · ${v.poids} Mo</span>
    <p class="dit"></p>
    <div class="actes">
      <button data-e="planifier" title="Envoyer dans la file de planification">À planifier</button>
      <button data-e="refaire" title="Celle-là a marché, en refaire une comme elle">À refaire</button>
      <button data-e="abandon" title="Ne plus la proposer">Abandon</button>
    </div>
  </div>
</li>`;

const familles = [...new Set(videos.map((v) => v.famille))].sort();

fs.writeFileSync(`${D}/index.html`, `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>Tri des vidéos</title>
<style>
:root{--nuit:#0d0d13;--carte:#15161f;--carte2:#1b1d29;--trait:#262838;--encre:#eceef5;
  --doux:#9599ad;--faible:#6b7089;--jaune:#eab308;--turq:#3dc4c2;--rouge:#f2606f;--violet:#8b5cf6}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-text-size-adjust:100%;background:var(--nuit)}
body{background:var(--nuit);color:var(--encre);
  font:400 15.5px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  padding:26px 16px calc(90px + env(safe-area-inset-bottom))}
.w{max-width:1180px;margin-inline:auto}
h1{font-size:clamp(26px,6vw,36px);line-height:1.06;font-weight:800;letter-spacing:-.03em}
.sous{color:var(--doux);margin-top:9px;max-width:60ch;font-size:15.5px}

.filtres{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 6px}
.filtres button{font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;
  background:var(--carte);border:1px solid var(--trait);color:var(--doux);
  border-radius:99px;padding:9px 15px;min-height:42px}
.filtres button.on{background:var(--jaune);border-color:var(--jaune);color:#140f00}
.filtres .n{opacity:.65;margin-left:6px;font-variant-numeric:tabular-nums}

ul{list-style:none;display:grid;gap:14px;margin-top:18px;
  grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
li.v{background:var(--carte);border:1px solid var(--trait);border-radius:13px;
  overflow:hidden;display:flex;flex-direction:column}
li.v[hidden]{display:none}
li.v.e-planifier{border-color:#1f7a4c}
li.v.e-refaire{border-color:#4a3d10}
li.v.e-abandon{opacity:.42}
.apercu{position:relative;display:block;background:#000;aspect-ratio:9/16;max-height:270px;
  overflow:hidden;text-decoration:none}
.apercu img{width:100%;height:100%;object-fit:cover;display:block}
.apercu .rien{position:absolute;inset:0;display:grid;place-items:center;color:var(--faible);font-size:13px}
.apercu .dur{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.72);
  color:#fff;font:600 12px/1 ui-monospace,monospace;padding:5px 8px;border-radius:5px}
.info{padding:13px 14px 14px;display:flex;flex-direction:column;gap:5px;flex:1}
.fam{font:700 10.5px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--violet)}
h3{font-size:15.5px;font-weight:650;line-height:1.3;letter-spacing:-.012em;text-wrap:balance}
.meta{font-size:12.6px;color:var(--faible);font-variant-numeric:tabular-nums}
.dit{font-size:12.8px;color:var(--turq);min-height:0}
.dit:empty{display:none}
.actes{display:flex;gap:6px;margin-top:auto;padding-top:11px;flex-wrap:wrap}
.actes button{flex:1;min-width:78px;font:inherit;font-size:12.6px;font-weight:600;cursor:pointer;
  background:var(--carte2);border:1px solid var(--trait);color:var(--doux);
  border-radius:8px;padding:10px 6px;min-height:44px}
.actes button:hover{border-color:#39406b;color:var(--encre)}
li.v.e-planifier .actes button[data-e=planifier]{background:#0e2a1c;border-color:#1f7a4c;color:#7bebb0}
li.v.e-refaire .actes button[data-e=refaire]{background:#1d1706;border-color:#4a3d10;color:#e8c98a}
li.v.e-abandon .actes button[data-e=abandon]{background:#241318;border-color:#4a222b;color:#f3b9c0}

.bandeau{position:fixed;left:0;right:0;bottom:0;background:#0a0b11;
  border-top:1px solid var(--trait);padding:13px 16px calc(13px + env(safe-area-inset-bottom));
  font-size:13.6px;color:var(--doux);display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.bandeau b{color:var(--encre)}
.vide{color:var(--faible);padding:40px 0;text-align:center;font-size:15px}
.vide[hidden]{display:none}
</style>
</head>
<body>
<div class="w">
  <h1>Tri des vidéos</h1>
  <p class="sous">${videos.length} vidéos sur previsualisation. Trois décisions par vidéo, et
  ce que tu marques « à planifier » part dans la file. Tes choix sont enregistrés sur le
  serveur — pas dans ce navigateur.</p>

  <div class="filtres" id="filtres">
    <button data-f="adecider" class="on">À décider<span class="n"></span></button>
    <button data-f="planifier">À planifier<span class="n"></span></button>
    <button data-f="refaire">À refaire<span class="n"></span></button>
    <button data-f="abandon">Abandonnées<span class="n"></span></button>
    <button data-f="tout">Tout<span class="n"></span></button>
    ${familles.map((f) => `<button data-fam="${esc(f)}">${esc(f)}</button>`).join('')}
  </div>

  <ul id="liste">${videos.map(carte).join('')}</ul>
  <p class="vide" id="vide" hidden>Rien dans cette vue.</p>
</div>

<div class="bandeau" id="bandeau">Chargement de tes décisions…</div>

<script>
(() => {
  const URL_ETAT = 'https://n7n.automatisationboost.com/webhook/videos-tri';
  let etat = {}, duNeuf = false, enVol = false, filtre = 'adecider', fam = null;

  /* On n'annule jamais un envoi en cours : on lève un drapeau et on renvoie
     après. Une minuterie annulée a déjà fait perdre une décision ailleurs. */
  const envoyer = async () => {
    if (enVol || !duNeuf) return;
    enVol = true; duNeuf = false;
    const b = document.getElementById('bandeau');
    b.textContent = 'Enregistrement…';
    try {
      await fetch(URL_ETAT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(etat) });
      b.innerHTML = '<b>Enregistré.</b> Tes décisions sont sur le serveur.';
    } catch (e) {
      duNeuf = true;
      b.textContent = 'Enregistrement impossible — je réessaie.';
    } finally { enVol = false; if (duNeuf) setTimeout(envoyer, 1200); }
  };

  const LIB = { planifier: 'à planifier', refaire: 'à refaire', abandon: 'abandonnée' };

  const peindre = () => {
    const c = { adecider: 0, planifier: 0, refaire: 0, abandon: 0, tout: 0 };
    document.querySelectorAll('li.v').forEach((li) => {
      const e = (etat[li.dataset.r] || {}).etat || '';
      li.className = 'v' + (e ? ' e-' + e : '');
      const d = li.querySelector('.dit');
      d.textContent = e ? LIB[e] : '';
      c.tout++;
      if (e) c[e]++; else c.adecider++;
      const okFiltre = filtre === 'tout' || (filtre === 'adecider' ? !e : e === filtre);
      const okFam = !fam || li.dataset.fam === fam;
      li.hidden = !(okFiltre && okFam);
    });
    document.querySelectorAll('.filtres button[data-f]').forEach((b) => {
      const n = b.querySelector('.n');
      if (n) n.textContent = c[b.dataset.f];
      b.classList.toggle('on', !fam && b.dataset.f === filtre);
    });
    document.querySelectorAll('.filtres button[data-fam]').forEach((b) =>
      b.classList.toggle('on', fam === b.dataset.fam));
    document.getElementById('vide').hidden =
      [...document.querySelectorAll('li.v')].some((li) => !li.hidden);
  };

  document.querySelectorAll('li.v .actes button').forEach((b) => {
    b.addEventListener('click', () => {
      const r = b.closest('li.v').dataset.r;
      const avant = (etat[r] || {}).etat;
      /* Ré-appuyer sur la même décision l'annule : sinon une erreur de doigt
         est irréversible sans recharger. */
      if (avant === b.dataset.e) delete etat[r];
      else etat[r] = { etat: b.dataset.e, maj: new Date().toISOString() };
      peindre(); duNeuf = true; envoyer();
    });
  });

  document.querySelectorAll('.filtres button').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.fam) fam = (fam === b.dataset.fam) ? null : b.dataset.fam;
      else { filtre = b.dataset.f; fam = null; }
      peindre();
    });
  });

  (async () => {
    try {
      const j = await (await fetch(URL_ETAT + '?t=' + Date.now())).json();
      const d = typeof j.donnees === 'string' ? JSON.parse(j.donnees || '{}') : (j.donnees || {});
      etat = d && typeof d === 'object' ? d : {};
      document.getElementById('bandeau').innerHTML =
        'Décisions enregistrées côté serveur · dernière écriture : <b>' +
        (j.maj ? new Date(j.maj).toLocaleString('fr-FR') : 'jamais') + '</b>';
    } catch (e) {
      document.getElementById('bandeau').textContent =
        'Impossible de lire tes décisions — la page part de zéro, ne clique pas encore.';
    }
    peindre();
  })();
})();
<\/script>
</body>
</html>
`);

console.log(`${videos.length} vidéos · ${videos.filter((v) => v.vignette).length} avec vignette`);
console.log('familles :', familles.join(' · '));
