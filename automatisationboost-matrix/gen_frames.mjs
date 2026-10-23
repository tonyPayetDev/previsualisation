// AutomatisationBoost — séquence « boule d'énergie → casque VR → matrice ».
//
// Quatre photos d'ancrage générées chez Higgsfield (nano_banana_pro, identité
// verrouillée sur la réf de la banque d'avatar). Les MAINS SONT VIDES dans les
// quatre : la boule est dessinée ici, image par image, parce qu'elle doit
// grossir en continu avec le scroll — une boule incrustée dans la photo ne
// peut pas grandir.
//
// Positions de main relevées à la grille sur chaque photo (fractions du cadre) :
//   paume face        (0.53, 0.53)
//   index pointé      (0.66, 0.47)
//   paume de dos      (0.79, 0.39)
//
// Charte : accent unique #eab308 sur fond #07070a.
import pw from '/work/autoboost-neon-videos/autoboost-23-design/node_modules/playwright/index.js';
const { chromium } = pw;
import fs from 'fs';

process.env.LD_LIBRARY_PATH = [
  '/home/claude/tools/chromelibs/usr/lib/x86_64-linux-gnu',
  '/home/claude/tools/chromelibs/lib/x86_64-linux-gnu',
].join(':') + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
process.env.FONTCONFIG_PATH = '/home/claude/tools/chromelibs/etc/fonts';

const S = '/tmp/claude-1000/-work/23c29362-cb5a-467e-ac5e-5a3aced20058/scratchpad';
const OUT = '/work/previsualisation/automatisationboost-matrix/frames';
const W = 1600, H = 900, N = 140;

const b64 = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');

const SCENE = `
const W=${W}, H=${H};
const ACC='234,179,8';
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=t=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const lerp=(a,b,t)=>a+(b-a)*t;

// Les 6 temps de la séquence. Chaque photo tient une plage, les plages se
// recouvrent : c'est le recouvrement qui fait le fondu.
// [photo, debut, fin, mainX, mainY, rayonBoule(fraction de H)]
const TEMPS = [
  { im:0, a:0.00, b:0.26, hx:0.53, hy:0.53, r0:0.016, r1:0.055 },
  { im:1, a:0.22, b:0.48, hx:0.66, hy:0.47, r0:0.055, r1:0.115 },
  { im:3, a:0.44, b:0.70, hx:0.79, hy:0.39, r0:0.115, r1:0.215 },
  { im:2, a:0.66, b:0.90, hx:0.50, hy:0.335, r0:0.215, r1:0.135 },
];

let IMGS=[];

// --- La boule ---------------------------------------------------------------
// Noyau blanc chaud, halo ambré, arcs qui tournent, étincelles en orbite.
// Tout est piloté par r (rayon) : un seul paramètre fait grandir l'ensemble.
function boule(x, cx, cy, r, p, intensite){
  x.save();
  x.globalCompositeOperation='lighter';

  // Halo large
  const g = x.createRadialGradient(cx,cy,0,cx,cy,r*4.2);
  g.addColorStop(0,   'rgba(255,240,200,'+(0.95*intensite).toFixed(3)+')');
  g.addColorStop(0.13,'rgba('+ACC+','+(0.75*intensite).toFixed(3)+')');
  g.addColorStop(0.42,'rgba('+ACC+','+(0.16*intensite).toFixed(3)+')');
  g.addColorStop(1,   'rgba('+ACC+',0)');
  x.fillStyle=g;
  x.beginPath(); x.arc(cx,cy,r*4.2,0,6.2832); x.fill();

  // Noyau
  const g2 = x.createRadialGradient(cx,cy,0,cx,cy,r);
  g2.addColorStop(0,  'rgba(255,255,246,'+intensite.toFixed(3)+')');
  g2.addColorStop(0.6,'rgba(255,228,150,'+(0.85*intensite).toFixed(3)+')');
  g2.addColorStop(1,  'rgba(234,179,8,'+(0.30*intensite).toFixed(3)+')');
  x.fillStyle=g2;
  x.beginPath(); x.arc(cx,cy,r,0,6.2832); x.fill();

  // Arcs — trois anneaux inclinés qui tournent : c'est ce qui donne le volume
  const T = p*34;
  for(let k=0;k<3;k++){
    const inc = 0.5 + k*0.75, rot = T*(0.7+k*0.35);
    x.strokeStyle='rgba(255,236,180,'+(0.42*intensite).toFixed(3)+')';
    x.lineWidth = Math.max(1, r*0.055);
    x.beginPath();
    for(let i=0;i<=64;i++){
      const th = i/64*6.2832;
      const px = Math.cos(th)*r*1.42;
      const py = Math.sin(th)*r*1.42*Math.cos(inc);
      const rx = px*Math.cos(rot) - py*Math.sin(rot);
      const ry = px*Math.sin(rot) + py*Math.cos(rot);
      i ? x.lineTo(cx+rx, cy+ry*0.55) : x.moveTo(cx+rx, cy+ry*0.55);
    }
    x.stroke();
  }

  // Étincelles en orbite
  for(let i=0;i<26;i++){
    const a = i*2.399963 + T*0.9;
    const rr = r*(1.6 + (i%5)*0.42);
    const sx = cx + Math.cos(a)*rr;
    const sy = cy + Math.sin(a)*rr*0.62;
    const s = Math.max(0.9, r*0.038);
    x.fillStyle='rgba(255,244,214,'+(0.55*intensite).toFixed(3)+')';
    x.beginPath(); x.arc(sx,sy,s,0,6.2832); x.fill();
  }
  x.restore();
}

// --- La matrice -------------------------------------------------------------
// Pluie de caractères + couloir en perspective. C'est la dernière plage :
// la boule a fini par remplir le cadre, on est passé de l'autre côté.
const COLS = 96;
const GLYPHES = '01ABCDEF{}[]()<>/\\\\|=+-*#$%&@n8n';
function matrice(x, p, force){
  x.save();
  x.globalAlpha = force;
  x.fillStyle='#050508'; x.fillRect(0,0,W,H);

  // Couloir : lignes fuyantes vers le centre
  x.globalCompositeOperation='lighter';
  for(let k=0;k<26;k++){
    const a=(k/26)*6.2832;
    const t=((p*2.4 + k*0.13)%1);
    const rr = Math.pow(t,2.2)*W*0.95;
    x.strokeStyle='rgba('+ACC+','+(0.10*(1-t)).toFixed(3)+')';
    x.lineWidth=1.4;
    x.beginPath();
    x.moveTo(W/2+Math.cos(a)*rr*0.2, H/2+Math.sin(a)*rr*0.2);
    x.lineTo(W/2+Math.cos(a)*rr,     H/2+Math.sin(a)*rr);
    x.stroke();
  }

  // Pluie de code
  x.globalCompositeOperation='source-over';
  const cw = W/COLS, fs = cw*1.5;
  x.font = fs.toFixed(1)+'px monospace';
  x.textAlign='center';
  for(let c=0;c<COLS;c++){
    const vitesse = 0.5 + ((c*37)%23)/23*1.4;
    const tete = ((p*vitesse*2.2 + (c*13%29)/29) % 1.35) * (H+320) - 160;
    for(let j=0;j<17;j++){
      const y = tete - j*fs*1.15;
      if(y < -fs || y > H+fs) continue;
      const al = (1 - j/17) * 0.72;
      const ch = GLYPHES[(c*7 + j*3 + Math.floor(p*40)) % GLYPHES.length];
      x.fillStyle = j===0 ? 'rgba(255,248,224,'+al.toFixed(3)+')'
                          : 'rgba('+ACC+','+(al*0.75).toFixed(3)+')';
      x.fillText(ch, c*cw+cw/2, y);
    }
  }
  x.restore();
}

window.__draw = (x, p) => {
  x.fillStyle='#07070a'; x.fillRect(0,0,W,H);

  // 1 — Les photos, en fondu enchaîné sur leurs plages qui se recouvrent.
  TEMPS.forEach((t, i) => {
    let al;
    const fondu = 0.055;
    if (p < t.a - fondu || p > t.b + fondu) return;
    if (p < t.a)      al = (p-(t.a-fondu))/fondu;
    else if (p > t.b) al = 1-(p-t.b)/fondu;
    else              al = 1;
    // La dernière photo (casque) s'efface quand la matrice prend le dessus.
    if (i===3) al *= 1 - clamp((p-0.795)/0.095, 0, 1);
    if (al <= 0.01) return;
    const im = IMGS[t.im];
    if (!im) return;
    x.save(); x.globalAlpha = clamp(al,0,1);
    const e = Math.max(W/im.width, H/im.height);
    // Léger travelling avant sur chaque plan : rien n'est jamais figé.
    const k = 1 + 0.055*clamp((p-t.a)/(t.b-t.a),0,1);
    const w = im.width*e*k, h = im.height*e*k;
    x.drawImage(im, (W-w)/2, (H-h)/2, w, h);
    x.restore();
  });

  // 2 — La boule, accrochée à la main du plan courant, interpolée entre plans.
  let cur = TEMPS[0], nxt = null, mix = 0;
  for (let i=0;i<TEMPS.length;i++){
    const t = TEMPS[i];
    if (p >= t.a && p <= t.b) {
      cur = t;
      const local = (p-t.a)/(t.b-t.a);
      if (i < TEMPS.length-1 && p >= TEMPS[i+1].a) {
        nxt = TEMPS[i+1];
        mix = (p-nxt.a)/(t.b-nxt.a);
      }
      cur._l = local;
      break;
    }
  }
  const lo = clamp(cur._l ?? clamp((p-cur.a)/(cur.b-cur.a),0,1), 0, 1);
  let hx = cur.hx, hy = cur.hy;
  let r = lerp(cur.r0, cur.r1, ease(lo));
  if (nxt) {
    const m = ease(clamp(mix,0,1));
    hx = lerp(cur.hx, nxt.hx, m);
    hy = lerp(cur.hy, nxt.hy, m);
  }
  const inten = clamp(p/0.03, 0, 1) * (1 - clamp((p-0.755)/0.075, 0, 1));
  if (inten > 0.01 && p < 0.94) boule(x, hx*W, hy*H, Math.max(1.2, r*H), p, inten);

  // 3 — La matrice sur la fin.
  const mForce = clamp((p-0.775)/0.115, 0, 1);
  if (mForce > 0.01) matrice(x, p, mForce);

  // 4 — Vignette + grain, communs à toute la séquence.
  const vg = x.createRadialGradient(W/2,H/2,H*0.36,W/2,H/2,H*1.05);
  vg.addColorStop(0,'rgba(7,7,10,0)');
  vg.addColorStop(1,'rgba(7,7,10,0.62)');
  x.fillStyle=vg; x.fillRect(0,0,W,H);

  x.save(); x.globalAlpha=0.05;
  for(let k=0;k<2400;k++){
    const gx=(Math.sin(k*12.9898+p*3)*43758.5453)%1;
    const gy=(Math.sin(k*78.233+p*3)*43758.5453)%1;
    x.fillStyle = k%3 ? '#ffffff' : '#000000';
    x.fillRect(Math.abs(gx)*W, Math.abs(gy)*H, 1.3, 1.3);
  }
  x.restore();
};
`;

fs.mkdirSync(OUT, { recursive: true });
const srcs = [0, 1, 2, 3].map(i => b64(`${S}/p${i}.jpg`));

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: W, height: H } });
await pg.setContent(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>*{margin:0;padding:0}body{background:#07070a;overflow:hidden}canvas{display:block}</style>
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
