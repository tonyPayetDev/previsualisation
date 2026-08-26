/* Génère /banque/ — l'inventaire de tout ce qui est réutilisable.
 *
 * Pourquoi : Tony regénère des images, des musiques et du code qui existent
 * déjà, parce que rien ne dit ce qu'il possède. Une page figée aurait périmé
 * en deux jours — celle-ci LIT le disque à chaque passage, donc elle ne peut
 * pas mentir sur ce qui existe.
 *
 * Elle porte aussi les recettes et les pièges : c'est ce qui évite de réécrire
 * le même montage et de retomber dans la même panne.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const S = '/work/autoboost-neon-videos/_shared';
const OUT = '/work/previsualisation/banque';
const FP = '/home/claude/tools/ffmpeg-build/ffmpeg-7.0.2-amd64-static/ffprobe';

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const duree = (f) => {
  try { return parseFloat(execFileSync(FP, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim()); }
  catch { return 0; }
};
const lister = (d, ext) => {
  try { return fs.readdirSync(d).filter((f) => ext.some((e) => f.endsWith(e))).sort(); }
  catch { return []; }
};

/* ── 1. b-roll abstrait : le README dit ce que chaque motif signifie ── */
const motifs = [];
try {
  const md = fs.readFileSync(path.join(S, 'broll-abstrait/README.md'), 'utf8');
  for (const l of md.split('\n')) {
    const m = l.match(/^\|\s*\d+\s*\|\s*\*\*(\w+)\*\*\s*\|([^|]+)\|([^|]+)\|/);
    if (m) motifs.push({ nom: m[1].trim(), dit: m[2].trim(), pour: m[3].trim() });
  }
} catch { /* pas de README */ }

/* ── 2. musiques ── */
const bgm = lister(path.join(S, 'bgm'), ['.mp3']).map((f) => ({
  f, s: duree(path.join(S, 'bgm', f)),
  /* Le préfixe du nom dit à quel format il sert — convention en place. */
  usage: /^journal/.test(f) ? 'Journal IA' : /^food/.test(f) ? 'FoodBoost'
    : /^horror|flowers_horror/.test(f) ? 'Horror / beat-sync' : /^mindset|hook/.test(f) ? 'Mindset / hook'
      : /valse/.test(f) ? 'Essai contemplatif' : 'Autoboost',
}));

/* ── 3. SFX ── */
const sfx = [...new Set(lister(path.join(S, 'sfx-palette/v1'), ['.mp3', '.wav']))];

/* ── 4. avatar : les plages de lèvres sont l'info critique ── */
let avatar = [];
try {
  const lm = JSON.parse(fs.readFileSync(path.join(S, 'avatar-bank/lips-map.json'), 'utf8'));
  avatar = Object.entries(lm.clips).map(([f, v]) => ({
    f, total: v.duration, actif: v.activeTotal,
    zones: v.active.map((z) => `${z.start.toFixed(2)} → ${z.end.toFixed(2)}`).join(' · '),
  }));
} catch { /* carte absente */ }

/* ── 5. clips Higgsfield déjà utilisés ── */
const hf = [];
for (const d of ['etude-4', 'serie-2']) {
  for (const f of lister(path.join(S, 'hf-clips', d), ['.mp4'])) {
    hf.push({ serie: d, f, s: duree(path.join(S, 'hf-clips', d, f)) });
  }
}

const bloc = (titre, sous, corps) => `
<section>
  <h2>${titre}</h2>
  ${sous ? `<p class="sous">${sous}</p>` : ''}
  ${corps}
</section>`;

const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ma banque — tout ce qui est réutilisable</title>
<style>
 :root{--bg:#0a0a0f;--p:#111117;--b:#242430;--or:#f5d90a;--t:#f2f2f5;--m:#9a9aa8}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--t);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:2rem 1rem 5rem;line-height:1.6}
 .w{max-width:760px;margin:0 auto}
 a.back{color:var(--m);font-size:.8rem;text-decoration:none}
 h1{font-size:1.5rem;margin:1rem 0 .3rem;background:linear-gradient(90deg,var(--or),#ff7a1a);-webkit-background-clip:text;background-clip:text;color:transparent}
 .intro{color:var(--m);font-size:.86rem;margin:0 0 1.8rem}
 section{background:var(--p);border:1px solid var(--b);border-radius:14px;padding:1.1rem 1.2rem;margin-bottom:1.1rem}
 h2{font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:var(--or);margin:0 0 .3rem}
 .sous{color:var(--m);font-size:.82rem;margin:0 0 .8rem}
 table{width:100%;border-collapse:collapse;font-size:.84rem;display:block;overflow-x:auto}
 th,td{text-align:left;padding:.4rem .5rem;border-bottom:1px solid rgba(128,128,128,.18);white-space:nowrap}
 th{color:var(--or);font-weight:600}
 td.w{white-space:normal}
 code{background:#1b1b24;padding:.08rem .35rem;border-radius:4px;color:var(--or);font-size:.85em}
 .puces{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.3rem}
 .puce{background:#1b1b24;border:1px solid var(--b);border-radius:999px;padding:.25rem .7rem;font-size:.8rem}
 .piege{border-left:3px solid #ff7a1a;padding-left:.8rem;margin:.7rem 0;font-size:.85rem}
 .piege b{color:#ff7a1a}
</style></head><body><div class="w">
<a class="back" href="/">← toutes les prévisualisations</a>
<h1>Ma banque</h1>
<p class="intro">Tout ce qui existe déjà et se réutilise — pour ne pas regénérer une image,
une musique ou un montage qui est là. Cette page lit le disque à chaque génération :
ce qu'elle affiche existe vraiment.</p>

${bloc('Fonds animés · b-roll abstrait', `${motifs.length} motifs, en 9:16 et 16:9 — <code>_shared/broll-abstrait/&lt;nom&gt;-9x16.mp4</code>`,
  `<table><tr><th>Motif</th><th>Ce qu'il dit</th><th>À utiliser sur</th></tr>${
    motifs.map((m) => `<tr><td><b>${esc(m.nom)}</b></td><td class="w">${esc(m.dit)}</td><td class="w">${esc(m.pour)}</td></tr>`).join('')
  }</table>`)}

${bloc('Musiques', `${bgm.length} pistes — <code>_shared/bgm/</code>. Le préfixe dit le format auquel elle sert.`,
  `<table><tr><th>Fichier</th><th>Durée</th><th>Format</th></tr>${
    bgm.map((b) => `<tr><td>${esc(b.f)}</td><td>${Math.round(b.s)} s</td><td>${esc(b.usage)}</td></tr>`).join('')
  }</table>`)}

${bloc('Bruitages · palette v1', `${sfx.length} sons — <code>_shared/sfx-palette/v1/</code>. Palette figée : toute évolution est une v2, on n'écrase jamais.`,
  `<div class="puces">${sfx.map((s) => `<span class="puce">${esc(s.replace(/^sfx-|\.(mp3|wav)$/g, ''))}</span>`).join('')}</div>`)}

${bloc('Avatar — banque bureau', 'Les clips ne parlent PAS de bout en bout. Un plan posé sous une voix active doit tenir <b>entièrement</b> dans une plage active, sinon la bouche est figée pendant que la voix parle.',
  `<table><tr><th>Clip</th><th>Durée</th><th>Parlé</th><th>Plage utile</th></tr>${
    avatar.map((a) => `<tr><td>${esc(a.f)}</td><td>${a.total.toFixed(2)} s</td><td>${a.actif.toFixed(2)} s</td><td>${esc(a.zones)}</td></tr>`).join('')
  }</table><p class="sous" style="margin-top:.6rem">Total exploitable sous voix : <b>${avatar.reduce((s, a) => s + a.actif, 0).toFixed(2)} s</b>. Au-delà, il faut rejouer des segments différents du même clip.</p>`)}

${bloc('Clips Higgsfield déjà utilisés', 'Pour ne pas resservir le même plan deux fois.',
  `<table><tr><th>Série</th><th>Clip</th><th>Durée</th></tr>${
    hf.map((h) => `<tr><td>${esc(h.serie)}</td><td>${esc(h.f)}</td><td>${h.s.toFixed(1)} s</td></tr>`).join('')
  }</table>`)}

${bloc('Mots-clés et leurs portes', 'La banque de CTA réutilisables, avec le lien qui répond.',
  `<p style="font-size:.86rem;margin:0"><a href="/cta/" style="color:var(--or)">Ouvrir la page CTA</a> — chaque mot promis en vidéo, sa ressource, et si elle répond en HTTP. Les portes sont testées en ligne à chaque génération.</p>`)}

${bloc('Recettes — ce qui évite de réécrire le code', 'Les montages qui marchent, à rejouer tels quels.',
  `<table><tr><th>Besoin</th><th>Où est la recette</th></tr>
  <tr><td class="w">Vidéo avatar + cartons + b-roll</td><td class="w"><code>autoboost-etude-restaurateurs/work/</code> — source.mjs, tts, cartons, montage</td></tr>
  <tr><td class="w">Série clip Higgsfield en hook</td><td class="w"><code>autoboost-serie-2/work/</code></td></tr>
  <tr><td class="w">Voix clonée (gratuite)</td><td class="w">webhook <code>tts-gen</code> — <b>voixUrl obligatoire</b></td></tr>
  <tr><td class="w">Chanson en voix clonée</td><td class="w">skill <code>chanson-ma-voix</code> · sunoapi.org</td></tr>
  <tr><td class="w">Cartons texte</td><td class="w">PNG transparents via Chrome — ffmpeg ici n'a <b>pas</b> drawtext</td></tr>
  </table>`)}

${bloc('Pièges déjà payés', 'Chacun a coûté au moins une production.',
  `<div class="piege"><b>ffmpeg sans drawtext</b> — les textes passent par des PNG transparents faits au navigateur.</div>
   <div class="piege"><b>Overlays empilés</b> — se font tuer sans message utile. Une passe par overlay.</div>
   <div class="piege"><b>voixUrl manquant</b> — le TTS bascule sur une branche morte et rend un fichier vide, sans erreur.</div>
   <div class="piege"><b>Lèvres figées</b> — respecter les plages actives ci-dessus, sinon la bouche ne bouge pas sous la voix.</div>
   <div class="piege"><b>volumedetect sous <code>-v error</code></b> — n'imprime rien : on croit à tort que la piste est muette.</div>
   <div class="piege"><b>Pousser ≠ déployer</b> — Coolify ne redéploie pas sur push, et le CDN garde les 404 des heures. Vérifier avec <code>?cb=</code>.</div>
   <div class="piege"><b>Écrit ≠ en ligne</b> — un fichier sur le disque peut rendre 404. Toujours tester l'adresse réelle.</div>`)}

<p class="intro" style="margin-top:1.4rem">Généré le ${new Date().toLocaleDateString('fr-FR')} en lisant le disque.</p>
</div></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`  banque/index.html · ${(html.length / 1024).toFixed(1)} Ko`);
console.log(`  ${motifs.length} motifs · ${bgm.length} musiques · ${sfx.length} sfx · ${avatar.length} clips avatar · ${hf.length} clips Higgsfield`);
