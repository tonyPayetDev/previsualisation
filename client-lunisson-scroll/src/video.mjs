// Vidéo offerte pour L'Unisson — 9:16, à partir de LEURS photos.
//
// Contenu : rien d'autre que ce que leur site publie déjà. Aucun plat nommé,
// aucun prix, aucun horaire inventé.
//
// Deux pièges déjà payés, évités ici :
//  · ce ffmpeg n'a pas `drawtext` → le texte est peint en HTML par Chromium
//    puis composité ;
//  · empiler les overlays dans un seul graphe finit en SIGKILL sans message →
//    un seul overlay par segment, composité AVANT le raccord.
import { chromium } from '/work/.agents/skills/playwright-skill/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const R = '/work/previsualisation/client-lunisson-scroll';
const T = `${R}/src/vwork`;
const W = 1080, H = 1920, FPS = 30, DUR = 3.2;
const AMBRE = '#E3A33C';
const FF = '/home/claude/tools/ffmpeg-build/ffmpeg-7.0.2-amd64-static/ffmpeg';
const ff = (a) => execFileSync(FF, ['-hide_banner', '-v', 'error', '-y', ...a], { stdio: 'pipe' });

fs.rmSync(T, { recursive: true, force: true });
fs.mkdirSync(T, { recursive: true });

/* Chaque plan : une photo, un texte, et le sens du mouvement. Alterner le
   sens évite l'impression de diaporama mécanique. */
const PLANS = [
  { img: 'p01.webp', sur: 'L’UNISSON',    sous: 'Restaurant à Saint-Denis',   zoom: 'in'  },
  { img: 'p09.webp', sur: 'Cuisine',      sous: 'créole',                     zoom: 'out' },
  { img: 'p03.webp', sur: 'Cuisine',      sous: 'métropolitaine',             zoom: 'in'  },
  { img: 'p04.webp', sur: 'Soirée',       sous: 'karaoké',                    zoom: 'out' },
  { img: 'p05.webp', sur: 'Privatisation',sous: 'de salle',                   zoom: 'in'  },
  { img: 'p06.jpg',  sur: '09 70 35 41 41', sous: '14 Rue Charles Gounod · Saint-Denis', zoom: 'out', fin: true },
];

/* ── 1. Les cartons de texte, en PNG transparents ────────────────────── */
const nav = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const pg = await (await nav.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();

for (let i = 0; i < PLANS.length; i++) {
  const p = PLANS[i];
  await pg.setContent(`<!doctype html><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;900&family=Karla:wght@400;500&display=swap" rel="stylesheet">
  <style>
   html,body{margin:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden}
   .bas{position:absolute;left:0;right:0;bottom:0;height:900px;
     background:linear-gradient(180deg,rgba(20,17,16,0),rgba(20,17,16,.78) 52%,rgba(20,17,16,.95))}
   .haut{position:absolute;left:0;right:0;top:0;height:420px;
     background:linear-gradient(180deg,rgba(20,17,16,.62),rgba(20,17,16,0))}
   .txt{position:absolute;left:70px;right:70px;bottom:250px;
     font-family:Archivo,sans-serif;color:#EDE7E0}
   .sur{font-weight:900;font-size:${p.fin ? 104 : 96}px;line-height:.94;
     text-transform:uppercase;letter-spacing:-.03em;margin:0;
     text-shadow:0 6px 40px rgba(0,0,0,.75)}
   .sous{font-weight:900;font-size:${p.fin ? 33 : 96}px;line-height:1.06;
     text-transform:uppercase;letter-spacing:${p.fin ? '.02em' : '-.03em'};margin:${p.fin ? '18px' : '0'} 0 0;
     color:${p.fin ? '#B9AFA6' : AMBRE};text-shadow:0 6px 40px rgba(0,0,0,.75)}
   .trait{width:78px;height:5px;background:${AMBRE};border-radius:3px;margin-bottom:30px}
   .marque{position:absolute;left:82px;top:74px;font-family:Archivo,sans-serif;
     font-weight:900;font-size:34px;letter-spacing:.03em;color:#EDE7E0;
     text-shadow:0 4px 24px rgba(0,0,0,.8)}
   .marque i{color:${AMBRE};font-style:normal}
  </style>
  <div class="haut"></div><div class="bas"></div>
  ${i === 0 ? '' : '<div class="marque">L<i>’</i>UNISSON</div>'}
  <div class="txt"><div class="trait"></div>
    <p class="sur">${p.sur}</p><p class="sous">${p.sous}</p></div>`);
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(320);
  await pg.screenshot({ path: `${T}/t${i}.png`, omitBackground: true });
}
await nav.close();
console.log(`  ${PLANS.length} cartons de texte rendus`);

/* ── 2. Un segment par plan : Ken Burns + son carton, en UNE passe ───── */
const n = Math.round(DUR * FPS);
for (let i = 0; i < PLANS.length; i++) {
  const p = PLANS[i];
  /* Le zoompan travaille sur une image sur-échantillonnée : appliqué
     directement sur la source, il fait trembler l'image ligne à ligne. */
  const z = p.zoom === 'in'
    ? `zoompan=z='min(1.0001+0.0016*on,1.14)':d=${n}:s=${W}x${H}:fps=${FPS}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`
    : `zoompan=z='max(1.14-0.0016*on,1.0001)':d=${n}:s=${W}x${H}:fps=${FPS}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
  /* PIÈGE PAYÉ : `-loop 1` donne à zoompan DUR*FPS images d entrée, et
     zoompan sort `d` images pour CHACUNE — soit 96×96 images, un segment de
     256 s au lieu de 3,2 s. Le `-shortest` du mux final tronquait à la bonne
     durée, donc le défaut ne se voyait NI dans la durée NI dans une erreur :
     seulement à l image, en noir. Une image fixe sans `-loop` = 1 image
     d entrée, donc exactement `d` images en sortie. */
  ff(['-i', `${R}/img/${p.img}`,
      '-i', `${T}/t${i}.png`,
      '-filter_complex',
      `[0:v]scale=${Math.round(W*1.5)}:${Math.round(H*1.5)}:force_original_aspect_ratio=increase,` +
      `crop=${Math.round(W*1.5)}:${Math.round(H*1.5)},${z},setsar=1[k];` +
      `[k][1:v]overlay=0:0,fade=t=in:st=0:d=0.45,fade=t=out:st=${(DUR - 0.45).toFixed(2)}:d=0.45[v]`,
      '-map', '[v]', '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      `${T}/s${i}.mp4`]);
  process.stdout.write(`  segment ${i + 1}/${PLANS.length}\r`);
}
console.log(`\n  ${PLANS.length} segments montés`);

/* ── 3. Raccord + musique ─────────────────────────────────────────────── */
fs.writeFileSync(`${T}/liste.txt`, PLANS.map((_, i) => `file '${T}/s${i}.mp4'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', `${T}/liste.txt`, '-c', 'copy', `${T}/muet.mp4`]);

const total = (PLANS.length * DUR).toFixed(2);
const BGM = '/work/autoboost-neon-videos/_shared/bgm/food-deep-urban-122.mp3';
ff(['-i', `${T}/muet.mp4`, '-stream_loop', '-1', '-i', BGM,
    '-filter_complex',
    `[1:a]atrim=0:${total},afade=t=in:st=0:d=1.1,afade=t=out:st=${(total - 1.6)}:d=1.6,` +
    `loudnorm=I=-16:TP=-1.5:LRA=11,volume=0.62[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', `${R}/video-offerte.mp4`]);

const info = execFileSync('/home/claude/tools/ffmpeg-build/ffmpeg-7.0.2-amd64-static/ffprobe',
  ['-v', 'error', '-show_entries', 'format=duration,size', '-show_entries', 'stream=width,height,codec_type',
   '-of', 'default=nw=1', `${R}/video-offerte.mp4`]).toString();
console.log(info.split('\n').filter(Boolean).map((l) => '  ' + l).join('\n'));
