// Vidéo de démonstration — Crêperie Saint Georges, refonte.
//
// Principe : on filme le VRAI site, pas une reconstitution. Une capture pleine
// page en 1080 de large donne une image très haute ; on la fait défiler par
// recadrage ffmpeg. Résultat parfaitement fluide, et surtout honnête : ce qui
// est montré est ce qui est en ligne.
//
// Deux pièges déjà payés, évités ici :
//  · `zoompan`/`crop` sur une entrée bouclée multiplie les images — on donne
//    donc UNE image fixe en entrée et on borne la sortie avec `-t` ;
//  · pas de `drawtext` dans ce ffmpeg → les cartons sont peints en HTML.
import { chromium } from '/work/.agents/skills/playwright-skill/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const R = '/work/previsualisation/client-creperie-saintgeorges';
const T = `${R}/src/vw`;
const W = 1080, H = 1920, FPS = 30;
const ORANGE = '#FFB020';          // accent FoodBoost
const FF = '/home/claude/tools/ffmpeg-build/ffmpeg-7.0.2-amd64-static/ffmpeg';
const ff = (a) => execFileSync(FF, ['-hide_banner', '-v', 'error', '-y', ...a], { stdio: 'pipe' });

fs.rmSync(T, { recursive: true, force: true });
fs.mkdirSync(T, { recursive: true });

const nav = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

/* ── 1. La capture pleine page du site ────────────────────────────────── */
{
  /* Largeur MOBILE, densité 2,5 → sortie 1080 px de large. Capturer un
     viewport de 1080 CSS px déclenche la mise en page bureau : le texte
     devient illisible sur un téléphone, et la vidéo ne sert plus à rien. */
  const ctx = await nav.newContext({ viewport: { width: 432, height: 768 },
    deviceScaleFactor: 2.5, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(`file://${R}/index.html`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  /* Les apparitions au défilement ne se déclenchent pas sur une capture
     pleine page : sans ça, la moitié du site est filmée en transparence. */
  await p.evaluate(() => {
    document.querySelectorAll('.rv').forEach((e) => e.classList.add('vu'));
    const n = document.getElementById('nav'); if (n) n.style.display = 'none';
  });
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `${T}/page.png`, fullPage: true });
  const haut = await p.evaluate(() => document.body.scrollHeight);
  console.log(`  capture : ${W}x${Math.round(haut*2.5)}px (mise en page mobile)`);
  fs.writeFileSync(`${T}/haut.txt`, String(Math.round(haut*2.5)));
  await ctx.close();
}
const HAUT = +fs.readFileSync(`${T}/haut.txt`, 'utf8');

/* ── 2. Les deux cartons ──────────────────────────────────────────────── */
{
  const ctx = await nav.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const base = `<!doctype html><meta charset="utf-8">
   <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;900&family=Cormorant+Garamond:wght@300;400&display=swap" rel="stylesheet">
   <style>html,body{margin:0;width:${W}px;height:${H}px;background:#0E0D0C;color:#fff;
     font-family:Archivo,sans-serif;display:flex;align-items:center;justify-content:center;
     text-align:center;overflow:hidden}
    .w{padding:0 90px}
    .sur{font-size:26px;letter-spacing:.3em;text-transform:uppercase;color:${ORANGE};
      font-weight:700;margin:0 0 34px}
    .t{font-size:104px;font-weight:900;line-height:.98;letter-spacing:-.03em;margin:0}
    .t em{font-style:normal;color:${ORANGE}}
    .p{font-size:34px;font-weight:400;line-height:1.45;color:#B9B3AC;margin:38px 0 0}
    .cta{margin-top:56px;display:inline-block;background:${ORANGE};color:#17120A;
      font-size:34px;font-weight:900;letter-spacing:.02em;padding:24px 44px;border-radius:14px}
    .pied{position:absolute;bottom:96px;left:0;right:0;font-size:24px;letter-spacing:.26em;
      text-transform:uppercase;color:#6E6862;font-weight:700}</style>`;

  await p.setContent(`${base}<div class="w">
     <p class="sur">Site de restaurant</p>
     <h1 class="t">Le même<br>restaurant.<br><em>Refait.</em></h1>
     <p class="p">Leurs photos. Leurs horaires.<br>Rien d'inventé.</p>
   </div><div class="pied">AutomatisationBoost</div>`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.screenshot({ path: `${T}/intro.png` });

  await p.setContent(`${base}<div class="w">
     <p class="sur">Le prompt est à toi</p>
     <h1 class="t">Tu veux<br><em>le refaire</em><br>pour le tien&nbsp;?</h1>
     <div class="cta">Commente RESTO</div>
     <p class="p" style="font-size:28px;margin-top:34px">Je t'envoie le prompt exact.</p>
   </div><div class="pied">AutomatisationBoost</div>`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.screenshot({ path: `${T}/cta.png` });
  await ctx.close();
}
await nav.close();
console.log('  2 cartons rendus');

/* ── 3. Le défilement, par recadrage d'une image fixe ─────────────────── */
const DEF = 15.0;                       // durée du défilement
const course = Math.max(0, HAUT - H);   // pixels à parcourir
/* `-loop 1` donnerait N images d'entrée et multiplierait la sortie : on
   fournit UNE image et on borne avec `-t`. */
ff(['-loop', '1', '-framerate', String(FPS), '-t', String(DEF), '-i', `${T}/page.png`,
    '-vf', `crop=${W}:${H}:0:'min(${course},t/${DEF}*${course})',setsar=1`,
    '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-t', String(DEF), `${T}/defile.mp4`]);

const carton = (png, dur, out) =>
  ff(['-loop', '1', '-framerate', String(FPS), '-t', String(dur), '-i', png,
      '-vf', `scale=${W}:${H},setsar=1,fade=t=in:st=0:d=0.35,fade=t=out:st=${(dur - 0.35).toFixed(2)}:d=0.35`,
      '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
      '-r', String(FPS), '-t', String(dur), out]);
carton(`${T}/intro.png`, 2.6, `${T}/a.mp4`);
carton(`${T}/cta.png`, 3.4, `${T}/z.mp4`);

fs.writeFileSync(`${T}/l.txt`, [`${T}/a.mp4`, `${T}/defile.mp4`, `${T}/z.mp4`]
  .map((f) => `file '${f}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', `${T}/l.txt`, '-c', 'copy', `${T}/muet.mp4`]);

const TOT = 2.6 + DEF + 3.4;
const BGM = '/work/autoboost-neon-videos/_shared/bgm/food-cat-walk-128.mp3';
ff(['-i', `${T}/muet.mp4`, '-stream_loop', '-1', '-i', BGM,
    '-filter_complex',
    `[1:a]atrim=0:${TOT},afade=t=in:st=0:d=1,afade=t=out:st=${(TOT - 1.6).toFixed(2)}:d=1.6,` +
    `loudnorm=I=-16:TP=-1.5:LRA=11,volume=0.66[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', `${R}/video.mp4`]);

console.log(execFileSync('/home/claude/tools/ffmpeg-build/ffmpeg-7.0.2-amd64-static/ffprobe',
  ['-v', 'error', '-show_entries', 'format=duration,size', '-show_entries', 'stream=width,height,codec_type',
   '-of', 'default=nw=1', `${R}/video.mp4`]).toString().split('\n').filter(Boolean).map((l) => '  ' + l).join('\n'));
