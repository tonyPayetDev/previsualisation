// Survol continu « salle de contrôle » — 120 frames scrubbées au scroll.
//
// Pourquoi rendu ici et pas généré par Seedance 2.5 : le clip 26 s demandé
// coûte 169 crédits Higgsfield, il en restait 21. Le mur d'écrans photoréaliste
// EST une vraie image Higgsfield (nano_banana_pro) ; le mouvement de caméra,
// le graphe et le couloir de lumière sont projetés en perspective par-dessus.
// Un seul plan, avance constante, aucune coupe — c'est le contrat du brief.
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

const OUT = '/work/previsualisation/automatisationboost-cinematique/frames';
const MUR = fs.readFileSync('/tmp/claude-1000/-work/23c29362-cb5a-467e-ac5e-5a3aced20058/scratchpad/mur.b64', 'utf8');
const W = 1600, H = 900, N = 120;

const SCENE = `
const W=${W}, H=${H};
const ACC='234,179,8';

// --- Le graphe : des nœuds répartis dans un tube que la caméra traverse. ---
// Rayon serré au départ (on est dans le couloir), plus large à la fin (vue
// d'ensemble). Chaque nœud garde un z fixe : c'est la caméra qui avance.
let rnd = 1337;
const R = () => (rnd = (rnd*1103515245+12345) & 0x7fffffff) / 0x7fffffff;

const NODES=[];
for(let i=0;i<330;i++){
  const z = 20 + (i/330)*118;
  const a = R()*6.2832;
  const rad = 4.2 + R()*11.5;
  NODES.push({
    x: Math.cos(a)*rad,
    y: Math.sin(a)*rad*0.62 - 1.2,
    z,
    r: 1.6 + R()*2.4,
    ph: R()*6.2832
  });
}
// Liaisons : uniquement entre nœuds proches en z — on lit un flux, pas un nuage.
const LINKS=[];
for(let i=0;i<NODES.length;i++)
  for(let j=i+1;j<Math.min(i+5,NODES.length);j++){
    const a=NODES[i], b=NODES[j];
    const d=Math.hypot(a.x-b.x,a.y-b.y,(a.z-b.z)*1.5);
    if(d<10.5) LINKS.push([i,j,d]);
  }

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=t=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

let MUR_IMG=null;

function proj(x,y,z,zcam,f,ydrift){
  const dz = z - zcam;
  if(dz <= 0.35) return null;
  const s = f/dz;
  return { X: W/2 + x*s, Y: H/2 + (y+ydrift)*s, s, dz };
}

window.__draw = (x, p) => {
  // p : 0 -> 1. Avance CONSTANTE de la caméra, aucune coupe.
  const zcam = 4 + p*76;
  // La focale s'ouvre sur la fin : on recule mentalement sans reculer la caméra,
  // ce qui donne la « vue large où tout le système tourne » sans casser le plan.
  const f = 900 - ease(clamp((p-0.78)/0.22,0,1))*470;
  const ydrift = -ease(clamp((p-0.72)/0.28,0,1))*3.2;

  x.fillStyle='#07070a'; x.fillRect(0,0,W,H);

  // 1 — Le bureau vide, au ras duquel on démarre. Il sort du champ vers 22 %.
  const deskA = 1 - clamp((p-0.06)/0.16,0,1);
  if(deskA > 0.01){
    x.save(); x.globalAlpha = deskA;
    for(let k=0;k<7;k++){
      const dz = 4 + k*3.1;
      const pt = proj(0, 5.2, dz, zcam, f, ydrift);
      if(!pt) continue;
      const wdt = 13*pt.s;
      x.strokeStyle='rgba(255,255,255,'+(0.16+0.10*(1-k/7)).toFixed(3)+')';
      x.lineWidth=1.6;
      x.beginPath(); x.moveTo(pt.X-wdt, pt.Y); x.lineTo(pt.X+wdt, pt.Y); x.stroke();
    }
    // La seule lampe allumée de la pièce
    const lp = proj(2.6, 3.4, 7.5, zcam, f, ydrift);
    if(lp){
      const g = x.createRadialGradient(lp.X,lp.Y,0,lp.X,lp.Y,Math.min(190*lp.s/40,300));
      g.addColorStop(0,'rgba('+ACC+',0.38)'); g.addColorStop(1,'rgba('+ACC+',0)');
      x.fillStyle=g; x.fillRect(0,0,W,H);
    }
    x.restore();
  }

  // 2 — Le mur d'écrans (vraie image), plan à z=34. On le traverse.
  if(MUR_IMG){
    const dz = 34 - zcam;
    if(dz > 0.6){
      const s = f/dz;
      const mw = 46*s, mh = mw*(9/16);
      // Apparait vers 12 %, s'efface quand on le traverse (dz < 9).
      const app = clamp(p/0.05,0,1);
      const thru = clamp((dz-1.2)/7.8,0,1);
      const a = app*thru;
      if(a > 0.01){
        x.save(); x.globalAlpha = a;
        x.drawImage(MUR_IMG, W/2-mw/2, H/2+ydrift*s-mh/2, mw, mh);
        x.globalCompositeOperation='screen'; x.globalAlpha = a*0.35;
        x.drawImage(MUR_IMG, W/2-mw/2, H/2+ydrift*s-mh/2, mw, mh);
        x.restore();
      }
    }
  }

  // 2 bis — Les rails du couloir. Six lignes filant vers le point de fuite :
  // c'est ce qui fait ressentir l'avancée, les nœuds seuls ne suffisent pas.
  x.save(); x.globalCompositeOperation='lighter';
  for(let k=0;k<6;k++){
    const a=(k/6)*6.2832 + 0.4, rad=13.5;
    const rx=Math.cos(a)*rad, ry=Math.sin(a)*rad*0.62-1.2;
    let started=false;
    x.beginPath();
    for(let zz=Math.max(zcam+1.2, 6); zz<zcam+62; zz+=2.4){
      const pt=proj(rx,ry,zz,zcam,f,ydrift);
      if(!pt) continue;
      if(!started){ x.moveTo(pt.X,pt.Y); started=true; } else x.lineTo(pt.X,pt.Y);
    }
    if(started){
      x.strokeStyle='rgba('+ACC+',0.13)';
      x.lineWidth=1.4; x.stroke();
    }
  }
  x.restore();

  // 3 — Les liaisons. Une liaison s'allume quand la caméra l'a dépassée :
  //     le système se construit derrière nous, il ne clignote pas au hasard.
  x.save();
  x.globalCompositeOperation='lighter';
  LINKS.forEach(([i,j,d])=>{
    const a=NODES[i], b=NODES[j];
    const pa=proj(a.x,a.y,a.z,zcam,f,ydrift), pb=proj(b.x,b.y,b.z,zcam,f,ydrift);
    if(!pa||!pb) return;
    const mz = (a.z+b.z)/2;
    const on = clamp((zcam - (mz-30))/16, 0, 1);
    if(on <= 0.01) return;
    const fade = clamp((pa.dz-1.0)/12,0,1) * clamp(1-(pa.dz-46)/40,0,1);
    const al = on*fade*0.44*(1-d/10.5);
    if(al <= 0.004) return;
    x.strokeStyle='rgba('+ACC+','+al.toFixed(4)+')';
    x.lineWidth = clamp(pa.s*0.026,0.8,3.4);
    x.beginPath(); x.moveTo(pa.X,pa.Y); x.lineTo(pb.X,pb.Y); x.stroke();
  });

  // 4 — Les nœuds, du plus lointain au plus proche.
  const order = NODES.map((n,i)=>i).sort((i,j)=>NODES[j].z-NODES[i].z);
  order.forEach(i=>{
    const n=NODES[i];
    const pt=proj(n.x,n.y,n.z,zcam,f,ydrift);
    if(!pt) return;
    if(pt.X<-300||pt.X>W+300||pt.Y<-300||pt.Y>H+300) return;
    const on = clamp((zcam - (n.z-30))/14, 0, 1);
    if(on <= 0.01) return;
    const fade = clamp((pt.dz-0.8)/10,0,1) * clamp(1-(pt.dz-48)/40,0,1);
    const puls = 0.72 + 0.28*Math.sin(p*22 + n.ph);
    const al = on*fade*puls;
    if(al <= 0.008) return;
    const rr = clamp(n.r*pt.s*0.040, 1.6, 54);
    const g = x.createRadialGradient(pt.X,pt.Y,0,pt.X,pt.Y,rr*7);
    g.addColorStop(0,'rgba('+ACC+','+(al*0.95).toFixed(4)+')');
    g.addColorStop(0.26,'rgba('+ACC+','+(al*0.30).toFixed(4)+')');
    g.addColorStop(1,'rgba('+ACC+',0)');
    x.fillStyle=g;
    x.beginPath(); x.arc(pt.X,pt.Y,rr*7,0,6.2832); x.fill();
    x.fillStyle='rgba(255,244,214,'+(al*0.85).toFixed(4)+')';
    x.beginPath(); x.arc(pt.X,pt.Y,rr,0,6.2832); x.fill();
  });
  x.restore();

  // 5 — Brume volumétrique + vignette : c'est ce qui donne la profondeur.
  const vg = x.createRadialGradient(W/2,H/2,H*0.34,W/2,H/2,H*1.05);
  vg.addColorStop(0,'rgba(7,7,10,0)');
  vg.addColorStop(1,'rgba(7,7,10,0.66)');
  x.fillStyle=vg; x.fillRect(0,0,W,H);

  // 6 — Grain fin, stable image par image (pas de scintillement au scrub lent).
  x.save(); x.globalAlpha=0.055;
  for(let k=0;k<2600;k++){
    const gx=(Math.sin(k*12.9898+p*3)*43758.5453)%1;
    const gy=(Math.sin(k*78.233+p*3)*43758.5453)%1;
    x.fillStyle = k%3 ? '#ffffff' : '#000000';
    x.fillRect(Math.abs(gx)*W, Math.abs(gy)*H, 1.3, 1.3);
  }
  x.restore();
};
`;

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: W, height: H } });
await pg.setContent(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>*{margin:0;padding:0}body{background:#07070a;overflow:hidden}canvas{display:block}</style>
</head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>const X=document.getElementById('c').getContext('2d');${SCENE}
const im=new Image();im.onload=()=>{MUR_IMG=im;window.__ready=1};im.src="${MUR}";
</script></body></html>`);
await pg.waitForFunction('window.__ready===1', { timeout: 30000 });

for (let i = 0; i < N; i++) {
  await pg.evaluate((p) => window.__draw(document.getElementById('c').getContext('2d'), p), i / (N - 1));
  await pg.screenshot({ path: `${OUT}/f${String(i).padStart(3, '0')}.png` });
  if (i % 20 === 0) console.log(`  ${i}/${N}`);
}
await browser.close();
console.log(`  ${N} frames rendues`);
