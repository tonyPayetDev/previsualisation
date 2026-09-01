/* Page de génération de la banque avatar.
 *
 * Les blocs ne sont pas recopiés à la main : ils sont RELUS depuis
 * `_shared/avatar-bank/seedance-prompts.md`. Une recopie finit toujours par
 * diverger de la référence, et on se retrouve à générer des clips avec un
 * prompt périmé sans s'en apercevoir.
 *
 *   node build.mjs   ->  index.html
 */
import fs from 'node:fs';
import path from 'node:path';

const D = path.dirname(new URL(import.meta.url).pathname);
const SRC = '/work/autoboost-neon-videos/_shared/avatar-bank/seedance-prompts.md';
const src = fs.readFileSync(SRC, 'utf8');
const master = src.match(/```text\n([\s\S]*?)```/)[1].trim();

/* Ce qui existe vraiment sur le disque, pas ce qu'on croit avoir généré. */
const CLIPS = '/work/autoboost-neon-videos/_shared/avatar-bank/clips';
const surDisque = fs.existsSync(CLIPS) ? fs.readdirSync(CLIPS).filter((f) => f.endsWith('.mp4')) : [];
const existants = new Set(surDisque.map((f) => f.split('_')[0]));

const blocs = [];
for (const m of src.matchAll(/\*\*([ABC]\d{1,2})\*\*\s*—?\s*([^\n]*?)\s*\n?Say:\s*«\s*([^»]+)»/g))
  blocs.push({ id: m[1], geste: m[2].replace(/\.$/, ''), phrase: m[3].trim() });
for (const m of src.matchAll(/\*\*([BC]\d{1,2})\*\*\s*—\s*([^«]+?)\.\s*«\s*([^»]+)»/g))
  if (!blocs.find((b) => b.id === m[1])) blocs.push({ id: m[1], geste: m[2].trim(), phrase: m[3].trim() });

const rang = { A: 0, B: 1, C: 2 };
blocs.sort((a, b) => rang[a.id[0]] - rang[b.id[0]] || (+a.id.slice(1)) - (+b.id.slice(1)));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const REF = { A: 'hf-avatar-2-portrait.png', B: 'hf-avatar-1-desk.png', C: 'hf-avatar-1-desk.png' };
const FAM = { A: 'Hooks — énergie haute', B: 'Explications — énergie moyenne', C: 'CTA' };
const NOM = { A1: 'A1_hook_frontal', B1: 'B1_principe', C2: 'C2_commente_motcle' };
const SUFFIXE = { A: 'hook', B: 'explication', C: 'cta' };
const nomFichier = (id) => NOM[id] || `${id}_${SUFFIXE[id[0]]}`;

let corps = '';
let fam = '';
for (const b of blocs) {
  if (b.id[0] !== fam) {
    fam = b.id[0];
    corps += `<h2>${FAM[fam]}<small>référence à joindre : <code>refs/${REF[fam]}</code></small></h2>\n`;
  }
  const fait = existants.has(b.id);
  const prompt = `${master}\n\nPERFORMANCE (ce clip) :\n- ${b.geste}\n- Say exactly: « ${b.phrase} »`;
  corps += `<article class="p${fait ? ' fait' : ''}">
  <header><span class="id">${b.id}</span><span class="geste">${esc(b.geste)}</span>
  ${fait ? '<span class="tag">déjà généré</span>' : '<button class="copier" type="button">Copier le prompt</button>'}</header>
  <p class="dit">« ${esc(b.phrase)} »</p>
  <p class="fichier">à nommer <code>${nomFichier(b.id)}.mp4</code></p>
  <pre>${esc(prompt)}</pre>
</article>\n`;
}
const restants = blocs.filter((b) => !existants.has(b.id)).length;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Prompts Seedance — banque avatar</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--fond:#0E1013;--carte:#17191D;--trait:#282C32;--txt:#ECEEF0;--doux:#949AA2;--vif:#eab308}
html{-webkit-text-size-adjust:100%}
body{background:var(--fond);color:var(--txt);
  font:400 15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  padding:26px 16px calc(30px + env(safe-area-inset-bottom));max-width:820px;margin-inline:auto}
::selection{background:var(--vif);color:#140F00}
:where(button):focus-visible{outline:2.5px solid var(--vif);outline-offset:2px;border-radius:4px}
html{scrollbar-color:#282C32 var(--fond)}
h1{font-size:1.5rem;font-weight:700;letter-spacing:-.02em;line-height:1.2}
.sous{color:var(--doux);font-size:.92rem;margin-top:8px}
.rappel{background:#1F1806;border-left:3px solid var(--vif);border-radius:7px;padding:14px 16px;
  margin:20px 0 26px;font-size:.9rem;line-height:1.65;color:#EFE3C4}
.rappel b{color:var(--vif)}
.rappel p+p{margin-top:10px}
h2{font-size:1.05rem;margin:32px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--trait);
  display:flex;flex-wrap:wrap;align-items:baseline;gap:10px}
h2 small{font-weight:400;font-size:.78rem;color:var(--doux)}
article{background:var(--carte);border:1px solid var(--trait);border-radius:10px;padding:16px;margin-bottom:14px}
article.fait{opacity:.42}
header{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:9px}
.id{font-weight:700;color:var(--vif);font-size:.95rem;min-width:32px}
.geste{color:var(--doux);font-size:.85rem;flex:1;min-width:150px}
.tag{font-size:.72rem;color:#7F8790;border:1px solid var(--trait);border-radius:99px;padding:4px 11px}
button.copier{background:var(--vif);color:#140F00;border:0;border-radius:6px;
  font:700 .82rem/1 inherit;padding:0 14px;min-height:44px;cursor:pointer;white-space:nowrap;
  transition:transform .15s cubic-bezier(.2,.8,.3,1)}
button.copier:hover{transform:translateY(-1px)}
button.copier.ok{background:#3F7D3F;color:#fff}
.dit{font-size:1rem;line-height:1.5}
.fichier{font-size:.8rem;color:var(--doux);margin-top:8px}
code{background:#0B0D0F;border:1px solid var(--trait);border-radius:4px;padding:2px 6px;font-size:.82em}
pre{display:none;margin-top:12px;background:#0B0D0F;border:1px solid var(--trait);border-radius:7px;
  padding:12px;font-size:.72rem;line-height:1.55;color:#B9C0C7;overflow-x:auto;white-space:pre-wrap}
article.ouvert pre{display:block}
footer{margin-top:36px;padding-top:16px;border-top:1px solid var(--trait);
  color:#6A7078;font-size:.8rem;line-height:1.65}
</style>
</head>
<body>
<h1>Prompts Seedance — la banque avatar</h1>
<p class="sous"><b>${restants} clips à générer</b> sur les ${blocs.length}. Un clip = 5 secondes.</p>

<div class="rappel">
  <p><b>Génère sur le web, pas par l'API.</b> Seedance Unlimited est gratuit depuis ton navigateur.
  Par l'API c'est 32,5 crédits le clip, et l'illimité n'y est pas supporté — 21 clips coûteraient
  près de 700 crédits.</p>
  <p><b>Joins la photo de référence</b> indiquée pour chaque famille. Sans elle, le visage change
  d'un clip à l'autre et la banque devient inutilisable au montage.</p>
  <p><b>Nomme le fichier comme indiqué</b>, dépose-le dans
  <code>_shared/avatar-bank/clips/</code>, puis relance <code>build-lips-map.mjs</code>.
  Sans carte de lèvres à jour, un plan peut tomber sur une bouche immobile sous une voix qui
  parle — c'est le défaut que tu as rejeté le 18 août.</p>
</div>

${corps}
<footer>Le prompt complet contient le verrou d'identité et la seconde neutre en début et en fin de
clip. C'est cette seconde neutre qui rend les raccords invisibles au montage : ne la retire pas.</footer>

<script>
/* Le presse-papier n'est pas disponible partout (contexte non sécurisé, refus
   du navigateur). Dans ce cas on montre le texte au lieu d'échouer en silence. */
document.querySelectorAll('.copier').forEach((b) => {
  b.addEventListener('click', async () => {
    const art = b.closest('article');
    const txt = art.querySelector('pre').textContent;
    try {
      await navigator.clipboard.writeText(txt);
      b.textContent = 'Copié';
      b.classList.add('ok');
      setTimeout(() => { b.textContent = 'Copier le prompt'; b.classList.remove('ok'); }, 1600);
    } catch (e) {
      art.classList.add('ouvert');
      b.textContent = 'Sélectionne le texte';
    }
  });
});
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(D, 'index.html'), html);
console.log(`${blocs.length} blocs lus · ${blocs.length - restants} déjà générés · ${restants} à faire`);
console.log('clips trouvés sur disque :', surDisque.join(', ') || 'aucun');
