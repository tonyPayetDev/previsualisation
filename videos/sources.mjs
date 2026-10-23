/* Rend VISIBLES dans le tri les vidéos qui n'ont pas de route previsualisation.
 *
 * Cause du trou : build.mjs ne liste que les routes portant un video.mp4 LOCAL.
 * Depuis 09/2026 les rendus vivent sur R2 et la route n'est qu'un 302 — donc
 * la quasi-totalité des vidéos finies était invisible. 17 listées sur 46 rendues
 * cette semaine, et les 5 seules décisions jamais prises datent du 1er septembre.
 *
 * Ce script scanne les VRAIS projets, envoie sur R2 ce qui manque, crée une
 * route minimale, et écrit sources.json que build.mjs fusionne avec son scan.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const FF = '/home/claude/tools/ffmpeg-build/ffmpeg-7.0.2-amd64-static';
const PROJETS = '/work/autoboost-neon-videos';
const PREVIS = '/work/previsualisation';
const D = path.dirname(new URL(import.meta.url).pathname);
const JOURS = Number(process.argv[2] || 14);
const limite = Date.now() - JOURS * 86400e3;

const duree = (f) => { try {
  return Math.round(Number(execFileSync(`${FF}/ffprobe`,
    ['-v','error','-show_entries','format=duration','-of','csv=p=0',f],{encoding:'utf8'}).trim()));
} catch { return 0; } };

// Un rendu FINAL, jamais un intermédiaire de work/ ou de tmp/.
// Piège payé : chercher uniquement `video.mp4` rate tous les projets qui
// nomment autrement (autoboost-voxoff-pro rend `video-pro.mp4`, et il existe
// des `final.mp4`, `montage.mp4`…). On prend donc le mp4 le plus récent à la
// racine ou dans public/, en excluant public/media/ qui ne contient que des
// fonds animés de quelques centaines de kilo-octets.
const candidat = (dir) => {
  for (const p of [`${dir}/public/video.mp4`, `${dir}/video.mp4`]) if (fs.existsSync(p)) return p;
  const vus = [];
  // 'rendus'/'renders' : dix projets y rangent leur version finale (astra-gpt6,
  // navier-stokes, reaction-outils, rush-presentation…). Sans eux ils restent
  // invisibles au tri alors qu'ils sont finis.
  for (const sous of ['', '/public', '/rendus', '/renders']) {
    const d = dir + sous;
    let noms = [];
    try { noms = fs.readdirSync(d); } catch { continue; }
    for (const n of noms) {
      if (!n.endsWith('.mp4')) continue;
      const f = `${d}/${n}`;
      let st; try { st = fs.statSync(f); } catch { continue; }
      if (!st.isFile() || st.size < 1_500_000) continue;   // sous 1,5 Mo ce n'est pas un rendu
      vus.push([st.mtimeMs, f]);
    }
  }
  if (!vus.length) return null;
  vus.sort((a, b) => b[0] - a[0]);
  return vus[0][1];
};

const out = [];
for (const e of fs.readdirSync(PROJETS, { withFileTypes: true })) {
  if (!e.isDirectory() || e.name.startsWith('_') || e.name.startsWith('.')) continue;
  const f = candidat(`${PROJETS}/${e.name}`);
  if (!f) continue;
  const st = fs.statSync(f);
  if (st.mtimeMs < limite) continue;
  out.push({ route: e.name, fichier: f, poids: Math.round(st.size/1048576*10)/10,
             duree: duree(f), date: new Date(st.mtimeMs).toISOString().slice(0,10) });
}
out.sort((a,b) => a.date < b.date ? 1 : -1);
console.log(`${out.length} projets avec un rendu final de moins de ${JOURS} jours`);

let envoyes = 0;
for (const v of out) {
  const routeDir = `${PREVIS}/${v.route}`;
  v.url = `https://assets.automatisationboost.com/previsualisation/${v.route}/video.mp4`;
  if (fs.existsSync(`${routeDir}/index.html`)) { v.routeExiste = true; continue; }
  // envoi R2 — seul chemin depuis ici, le webhook n8n
  try {
    execFileSync('curl', ['-s','--max-time','600','-X','POST',
      `https://n7n.automatisationboost.com/webhook/upload-r2-asset?cle=previsualisation/${v.route}/video.mp4`,
      '-F', `data=@${v.fichier}`], { encoding: 'utf8', maxBuffer: 1<<24 });
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(`${routeDir}/index.html`,
`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${v.route}</title>
<style>body{margin:0;background:#0a0a0f;color:#e9e9f2;font:400 15px/1.6 system-ui,sans-serif;
display:grid;place-items:center;min-height:100vh;padding:24px}.b{width:min(420px,92vw)}
video{width:100%;border-radius:12px;display:block;background:#000}
h1{font-size:18px;margin:0 0 6px}p{color:#8b8b99;font-size:13px;margin:6px 0 16px}</style></head>
<body><div class="b"><h1>${v.route.replace(/-/g,' ')}</h1>
<p>${v.duree} s · ${v.poids} Mo · rendu le ${v.date}</p>
<video src="${v.url}?v=1" controls playsinline></video></div></body></html>`);
    v.routeExiste = true; envoyes++;
    console.log(`  + ${v.route}  (${v.poids} Mo)`);
  } catch (err) {
    v.routeExiste = false;
    console.log(`  ! ${v.route} : envoi échoué`);
  }
}
fs.writeFileSync(`${D}/sources.json`, JSON.stringify(out.map(({fichier, ...r}) => r), null, 1) + '\n');
console.log(`SOURCES_DONE ${out.length} entrées · ${envoyes} nouvelles routes`);
