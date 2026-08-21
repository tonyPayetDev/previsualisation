// Sort les vidéos du dépôt previsualisation et les remet sur R2.
//
// Pourquoi : les 194 MP4 pèsent 2,68 Go sur les 2,8 Go de l'arborescence — 96 %.
// Le VPS clone ce dépôt à CHAQUE déploiement, et c'est ce qui a fini par
// remplir son disque et bloquer la file de déploiement (voir le 2026-08-21).
// Une fois les vidéos sur R2, le dépôt tombe à ~120 Mo.
//
// Trois garde-fous, parce qu'un script qui supprime des fichiers doit être
// prudent avant d'être rapide :
//
//   1. Rien n'est supprimé tant que l'objet distant n'a pas été VÉRIFIÉ —
//      HTTP 200 ET content-length identique à l'octet près. Un upload qui
//      répond 200 ne prouve pas que l'objet est servi.
//   2. Le script est reprenable : un fichier déjà présent sur R2 à la bonne
//      taille est sauté. On peut l'interrompre et le relancer.
//   3. `--essai` fait tout sauf téléverser, réécrire et supprimer. C'est le
//      mode par défaut : il faut demander explicitement à agir.
//
//   node outils/migrer-videos-r2.mjs --essai            # analyse seule
//   node outils/migrer-videos-r2.mjs --agir --min-mo 8  # les gros d'abord
import { execSync, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const RACINE = '/work/previsualisation';
const WEBHOOK = 'https://n7n.automatisationboost.com/webhook/upload-r2-asset';
const BASE = 'https://assets.automatisationboost.com';
const PREFIXE = 'previsualisation';

const args = process.argv.slice(2);
const AGIR = args.includes('--agir');
const LIMITE = +(args[args.indexOf('--limite') + 1] || 0) || Infinity;
const MIN = (+(args[args.indexOf('--min-mo') + 1] || 0) || 0) * 1e6;

const sh = (c) => execSync(c, { cwd: RACINE, encoding: 'utf8', maxBuffer: 2e8 });

// ------------------------------------------------------------------ inventaire
const videos = sh('git ls-files').trim().split('\n')
  .filter((f) => /\.(mp4|webm|mov)$/i.test(f))
  .map((f) => ({ f, taille: existsSync(path.join(RACINE, f)) ? statSync(path.join(RACINE, f)).size : 0 }))
  .filter((v) => v.taille >= MIN)
  .sort((a, b) => b.taille - a.taille)
  .slice(0, LIMITE);

// Les références ne vivent pas que dans le HTML : un fond de page se pose
// souvent en CSS et une galerie en JS. Chercher uniquement dans le HTML
// laisserait des liens morts — dix vidéos ne sont référencées nulle part en
// HTML alors qu'elles servent bien quelque part.
const sources = sh('git ls-files').trim().split('\n')
  .filter((f) => /\.(html|htm|css|js|mjs|json)$/i.test(f));

const url = (f) => `${BASE}/${PREFIXE}/${f}`;

// ------------------------------------------------------------------ références
// On cherche par NOM DE FICHIER puis on résout le chemin, plutôt que de
// deviner la forme du lien : le dépôt mélange relatif simple (209 cas),
// racine absolue (17) et http (3).
function referencesDe(cible) {
  const base = path.posix.basename(cible);
  const trouvees = [];
  for (const s of sources) {
    let t;
    try { t = readFileSync(path.join(RACINE, s), 'utf8'); } catch { continue; }
    if (!t.includes(base)) continue;
    const re = new RegExp(`[^\\s"'()<>\`]*${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    for (const brut of t.match(re) || []) {
      if (brut.startsWith('http')) continue;
      const resolu = brut.startsWith('/')
        ? brut.slice(1)
        : path.posix.normalize(path.posix.join(path.posix.dirname(s), brut));
      if (resolu === cible) trouvees.push({ fichier: s, brut });
    }
  }
  return trouvees;
}

// ------------------------------------------------------------------ R2
// Le paramètre anti-cache n'est pas de la superstition : sans lui, la première
// vérification (celle qui demande « est-ce déjà là ? ») reçoit un 404, et ce
// 404 peut être resservi juste après l'upload. Dix-huit fichiers ont ainsi été
// déclarés en échec alors qu'ils étaient bien écrits — le workflow avait
// pourtant répondu {"status":"ok"} pour chacun.
function dejaLa(f, taille) {
  try {
    const h = execFileSync('curl', ['-sI', '--max-time', '30',
      `${url(f)}?v=${Date.now()}${Math.random().toString(36).slice(2)}`], { encoding: 'utf8' });
    if (!/^HTTP\/[\d.]+ 200/m.test(h)) return false;
    const m = h.match(/content-length:\s*(\d+)/i);
    return m && +m[1] === taille;
  } catch { return false; }
}

// R2 met parfois une poignée de secondes à servir un objet tout juste écrit.
const souffler = (s) => { try { execFileSync('sleep', [String(s)]); } catch {} };

// Le type MIME doit être posé À L'ENVOI. curl étiquette une pièce multipart
// en `application/octet-stream` par défaut, n8n propage cette valeur jusqu'à
// R2, et Safari iOS refuse alors de lire la vidéo — donc précisément le
// navigateur sur lequel Tony valide. Mesuré : sans `;type=`, l'objet ressort
// en `application/octet-stream` ; avec, en `video/webm`.
const MIME = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };

function televerser(f) {
  const ext = f.split('.').pop().toLowerCase();
  return execFileSync('curl', ['-s', '--max-time', '900', '-X', 'POST',
    '-F', `data=@${path.join(RACINE, f)};type=${MIME[ext] || 'application/octet-stream'}`,
    `${WEBHOOK}?cle=${encodeURIComponent(`${PREFIXE}/${f}`)}`], { encoding: 'utf8' });
}

// ------------------------------------------------------------------ marche
console.log(`${videos.length} vidéos · ${(videos.reduce((n, v) => n + v.taille, 0) / 1e9).toFixed(2)} Go`);
console.log(AGIR ? 'MODE RÉEL — téléversement, réécriture et suppression\n'
                 : 'MODE ESSAI — rien ne sera modifié (ajouter --agir pour agir)\n');

const journal = [];
let migrees = 0, octets = 0, sansRef = 0;
const vides = [], echecs = [];

for (const [i, v] of videos.entries()) {
  const refs = referencesDe(v.f);
  const etiq = `[${String(i + 1).padStart(3)}/${videos.length}] ${(v.taille / 1e6).toFixed(1).padStart(6)} Mo  ${v.f}`;
  if (!refs.length) sansRef++;

  // Un fichier vide fait échouer le workflow (constaté : le nœud S3 rend
  // « There was a problem executing the workflow »). On le laisse en place
  // et on le signale — c'est un fichier cassé, pas un fichier à migrer.
  if (v.taille === 0) { console.log(`${etiq}  ⚠ 0 octet — ignoré, fichier cassé`); vides.push(v.f); continue; }

  if (!AGIR) {
    console.log(`${etiq}\n        ${refs.length} référence(s)${refs.length ? ' → ' + [...new Set(refs.map((r) => r.fichier))].join(', ') : '  ⚠ aucune'}`);
    journal.push({ ...v, refs });
    continue;
  }

  if (!dejaLa(v.f, v.taille)) {
    process.stdout.write(`${etiq}  téléversement…`);
    // Cloudflare coupe une requête à 100 s : au-delà d'environ 75 Mo, l'envoi
    // rend « error code: 524 » alors que l'objet est parfois déjà écrit. On
    // réessaie, et surtout on RE-VÉRIFIE entre deux tentatives — un 524 ne
    // veut pas dire que l'upload a échoué, seulement que la réponse n'est pas
    // revenue à temps.
    let rep, ok = false;
    for (let essai = 1; essai <= 3 && !ok; essai++) {
      try { rep = televerser(v.f); } catch (e) { rep = e.message; }
      souffler(4);                   // laisser R2 servir l'objet avant de le juger
      ok = dejaLa(v.f, v.taille);
      if (!ok) { souffler(8); ok = dejaLa(v.f, v.taille); }
      if (!ok && essai < 3) process.stdout.write(` (essai ${essai + 1})`);
    }
    if (!ok) {
      console.log(`  ✗ objet absent ou tronqué après 3 essais — ${String(rep).slice(0, 90)}`);
      echecs.push(v.f);
      continue;                      // on ne supprime RIEN si la vérif échoue
    }
    process.stdout.write('  ✓ vérifié');
  } else {
    process.stdout.write(`${etiq}  déjà sur R2`);
  }

  for (const r of refs) {
    const p = path.join(RACINE, r.fichier);
    writeFileSync(p, readFileSync(p, 'utf8').split(r.brut).join(url(v.f)));
  }
  sh(`git rm -q --cached "${v.f}"`);
  execSync(`rm -f "${path.join(RACINE, v.f)}"`);
  console.log(`  ·  ${refs.length} lien(s) réécrit(s)  ·  sorti du dépôt`);
  migrees++; octets += v.taille;
  journal.push({ ...v, refs, url: url(v.f) });
}

writeFileSync(path.join(RACINE, 'outils/migration-r2.json'), JSON.stringify(journal, null, 1));
console.log(`\n${AGIR ? migrees + ' vidéos migrées · ' + (octets / 1e9).toFixed(2) + ' Go sortis du dépôt' : 'analyse terminée'}`);
if (vides.length) console.log(`\u26a0 ${vides.length} fichier(s) a 0 octet laisses en place : ${vides.join(", ")}`);
if (echecs.length) console.log(`\u2717 ${echecs.length} echec(s) : ${echecs.join(", ")}`);
if (sansRef) console.log(`⚠ ${sansRef} vidéo(s) sans référence trouvée — migrées quand même, mais à vérifier`);
console.log('→ outils/migration-r2.json');
