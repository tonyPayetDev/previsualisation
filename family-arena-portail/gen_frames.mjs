// Family Arena — « à chaque scroll, un autre monde ».
//
// Six plans générés chez Kie.ai (google/nano-banana, 4 cr/image) :
//   0 salle vide, elle ne porte rien   3 HADO, boule d'énergie
//   1 elle met le casque               4 simulateur, piste de nuit
//   2 pods VR, désert de zombies       5 escape game, maison → vaisseau
//
// Le passage n'est PAS un fondu : un portail circulaire s'ouvre depuis sa tête
// et le monde suivant apparaît dedans. C'est ce qui raconte « transportée »
// plutôt que « diaporama ». Aberration chromatique + anneau or sur la bascule.
//
// Or #EFB509 = accent réel de la marque (relevé sur familyarena.re).
import pw from '/work/autoboost-neon-videos/autoboost-23-design/node_modules/playwright/index.js';
const { chromium } = pw;
import fs from 'fs';

process.env.LD_LIBRARY_PATH = [
  '/home/claude/tools/chromelibs/usr/lib/x86_64-linux-gnu',
  '/home/claude/tools/chromelibs/lib/x86_64-linux-gnu',
].join(':') + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
process.env.FONTCONFIG_PATH = '/home/claude/tools/chromelibs/etc/fonts';

const S = '/tmp/claude-1000/-work/23c29362-cb5a-467e-ac5e-5a3aced20058/scratchpad/fa';
const OUT = '/work/previsualisation/family-arena-portail/frames';
const W = 1600, H = 900, N = 132, NP = 6;

const b64 = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');

const SCENE = `
const W=${W}, H=${H}, NP=${NP};
const OR='239,181,9';
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=t=>1-Math.pow(1-t,3);
let IMGS=[];

// Centre du portail par plan : la tête de la joueuse, relevée sur chaque image.
const TETES = [
  {x:0.500,y:0.440}, {x:0.500,y:0.360}, {x:0.720,y:0.420},
  {x:0.500,y:0.450}, {x:0.500,y:0.520}, {x:0.500,y:0.600},
];

function plein(x, im, k){
  const e = Math.max(W/im.width, H/im.height) * k;
  const w = im.width*e, h = im.height*e;
  x.drawImage(im, (W-w)/2, (H-h)/2, w, h);
}

window.__draw = (x, p) => {
  x.fillStyle='#05070f'; x.fillRect(0,0,W,H);

  const idx  = clamp(p,0,0.9999) * NP;
  const base = Math.floor(idx);
  const frac = idx - base;

  // Le plan courant respire : léger travelling avant sur toute sa tenue.
  const k = 1 + 0.05*frac;
  if (IMGS[base]) plein(x, IMGS[base], k);

  // Le portail s'ouvre sur le dernier quart de chaque plan.
  const SEUIL = 0.55;
  const suivant = IMGS[base+1];
  if (frac > SEUIL && suivant) {
    const t = ease((frac-SEUIL)/(1-SEUIL));
    const c = TETES[base] || {x:0.5,y:0.5};
    const cx = c.x*W, cy = c.y*H;
    // Rayon max = distance au coin le plus lointain, sinon il reste un liseré.
    const rmax = Math.max(
      Math.hypot(cx,cy), Math.hypot(W-cx,cy),
      Math.hypot(cx,H-cy), Math.hypot(W-cx,H-cy)
    );
    const r = t*rmax;

    x.save();
    x.beginPath(); x.arc(cx,cy,r,0,6.2832); x.clip();
    plein(x, suivant, 1.06 - 0.06*t);
    x.restore();

    // Anneau or sur le bord du portail + halo : c'est lui qui fait « passage ».
    x.save();
    x.globalCompositeOperation='lighter';
    const gg = x.createRadialGradient(cx,cy,Math.max(0,r-26),cx,cy,r+26);
    gg.addColorStop(0,   'rgba('+OR+',0)');
    gg.addColorStop(0.5, 'rgba('+OR+','+(0.55*(1-t*0.55)).toFixed(3)+')');
    gg.addColorStop(1,   'rgba('+OR+',0)');
    x.fillStyle=gg;
    x.beginPath(); x.arc(cx,cy,r+26,0,6.2832); x.fill();
    x.strokeStyle='rgba(255,238,190,'+(0.75*(1-t*0.6)).toFixed(3)+')';
    x.lineWidth=2.4;
    x.beginPath(); x.arc(cx,cy,r,0,6.2832); x.stroke();
    x.restore();

    // Bandes de balayage horizontales : la signature « écran de casque ».
    x.save();
    x.globalCompositeOperation='lighter';
    x.globalAlpha = 0.30*(1-t);
    for(let i=0;i<26;i++){
      const yy = ((i/26 + p*7)%1)*H;
      x.fillStyle='rgba('+OR+',0.5)';
      x.fillRect(0, yy, W, 2);
    }
    x.restore();
  }

  // Scanlines fines, constantes : donne la matière « affichage » à tout.
  x.save(); x.globalAlpha=0.075;
  x.fillStyle='#000';
  for(let y=0;y<H;y+=3) x.fillRect(0,y,W,1);
  x.restore();

  // Vignette + grain
  const vg = x.createRadialGradient(W/2,H/2,H*0.38,W/2,H/2,H*1.05);
  vg.addColorStop(0,'rgba(5,7,15,0)');
  vg.addColorStop(1,'rgba(5,7,15,0.72)');
  x.fillStyle=vg; x.fillRect(0,0,W,H);

  x.save(); x.globalAlpha=0.045;
  for(let i=0;i<2200;i++){
    const gx=(Math.sin(i*12.9898+p*3)*43758.5453)%1;
    const gy=(Math.sin(i*78.233+p*3)*43758.5453)%1;
    x.fillStyle = i%3 ? '#ffffff' : '#000000';
    x.fillRect(Math.abs(gx)*W, Math.abs(gy)*H, 1.3, 1.3);
  }
  x.restore();
};
`;

fs.mkdirSync(OUT, { recursive: true });
const srcs = [0, 1, 2, 3, 4, 5].map(i => b64(`${S}/j${i}.jpg`));

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: W, height: H } });
await pg.setContent(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>*{margin:0;padding:0}body{background:#05070f;overflow:hidden}canvas{display:block}</style>
</head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>const X=document.getElementById('c').getContext('2d');${SCENE}
const SRC=${JSON.stringify(srcs)};
let n=0;
SRC.forEach((s,i)=>{const im=new Image();im.onload=()=>{IMGS[i]=im;if(++n===SRC.length)window.__ready=1};im.src=s;});
</script></body></html>`);
await pg.waitForFunction('window.__ready===1', { timeout: 60000 });

for (let i = 0; i < N; i++) {
  await pg.evaluate((p) => window.__draw(document.getElementById('c').getContext('2d'), p), i / (N - 1));
  await pg.screenshot({ path: `${OUT}/f${String(i).padStart(3, '0')}.png` });
  if (i % 25 === 0) console.log(`  ${i}/${N}`);
}
await browser.close();
console.log(`  ${N} frames rendues`);
