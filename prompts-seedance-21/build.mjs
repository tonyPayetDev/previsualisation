/* Génère la page des 21 nouveaux looks Seedance à partir du fichier de données,
 * pour que la page et les prompts ne puissent pas diverger.
 *
 *   node build.mjs
 *
 * Les prompts sont écrits en anglais (le modèle y obéit nettement mieux sur la
 * caméra et la lumière), les explications en français. Aucun ne reprend les 7
 * looks déjà publiés, et aucun ne décrit une œuvre, une marque ou un personnage
 * existants : ce sont des concepts de plan, pas des reproductions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { LOOKS, FAMILLES } from './looks.mjs';

const ICI = path.dirname(new URL(import.meta.url).pathname);
const ech = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const parFamille = {};
for (const l of LOOKS) (parFamille[l.f] ||= []).push(l);

const carte = (l) => `
<article class="look" id="look-${l.n}">
  <header>
    <span class="num">${String(l.n).padStart(2, '0')}</span>
    <div>
      <h3>${ech(l.nom)}</h3>
      <p class="meta">${ech(l.format)} · 32,5 crédits · ${ech(l.usage)}</p>
    </div>
  </header>
  <div class="prompt">
    <div class="prompt-tete">
      <span>prompt</span>
      <button class="copier" data-cible="p${l.n}">copier</button>
    </div>
    <pre id="p${l.n}">${ech(l.prompt)}</pre>
  </div>
  <p class="regarder"><b>Ce qu’il faut regarder —</b> ${ech(l.regarder)}</p>
</article>`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>21 looks Seedance</title>
<style>
  :root{ --bg:#0a0a0f; --panel:#111117; --panel2:#16161d; --bord:#242430;
         --jaune:#f5d90a; --violet:#a855f7; --texte:#f2f2f5; --doux:#9a9aa8; --faible:#6b6b78; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--texte);line-height:1.6;
       font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  .wrap{max-width:820px;margin:0 auto;padding:2rem 1.1rem 5rem}
  a.back{color:var(--doux);font-size:.8rem;text-decoration:none;display:inline-block;margin-bottom:1.2rem}
  a.back:hover{color:var(--jaune)}
  h1{font-size:clamp(1.5rem,4.4vw,2.1rem);margin:0 0 .5rem;letter-spacing:-.02em;text-wrap:balance}
  .chapeau{color:var(--doux);font-size:.95rem;margin:0 0 1rem;max-width:62ch}
  .avert{background:var(--panel);border:1px solid var(--bord);border-left:3px solid var(--jaune);
         border-radius:11px;padding:.85rem 1rem;font-size:.85rem;color:var(--doux);margin:0 0 2rem}
  .avert b{color:var(--texte)}

  .famille{margin-top:2.6rem}
  .famille-tete{display:flex;align-items:baseline;gap:.6rem;padding-bottom:.5rem;border-bottom:1px solid var(--bord)}
  .famille-tete h2{font-size:1.05rem;margin:0;letter-spacing:-.01em}
  .famille-tete span{font-size:.82rem;color:var(--faible)}

  .look{background:var(--panel);border:1px solid var(--bord);border-radius:13px;padding:1.1rem 1.2rem;margin-top:1rem}
  .look header{display:flex;gap:.85rem;align-items:flex-start}
  .num{flex:none;width:2.1rem;height:2.1rem;border-radius:8px;display:grid;place-items:center;
       font-size:.82rem;font-weight:800;color:var(--jaune);
       background:rgba(245,217,10,.1);border:1px solid rgba(245,217,10,.28)}
  .look h3{margin:0;font-size:1rem;letter-spacing:-.01em}
  .meta{margin:.15rem 0 0;font-size:.78rem;color:var(--faible)}

  .prompt{margin-top:.9rem;border:1px solid var(--bord);border-radius:9px;overflow:hidden;background:#08080b}
  .prompt-tete{display:flex;justify-content:space-between;align-items:center;padding:.4rem .7rem;
               background:var(--panel2);border-bottom:1px solid var(--bord);
               font-size:.68rem;letter-spacing:.09em;text-transform:uppercase;color:var(--faible)}
  .copier{font:inherit;font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;
          background:transparent;border:1px solid var(--bord);color:var(--doux);border-radius:6px;padding:.2rem .55rem}
  .copier:hover{border-color:var(--jaune);color:var(--jaune)}
  .copier.ok{border-color:var(--jaune);color:var(--jaune)}
  pre{margin:0;padding:.85rem .9rem;white-space:pre-wrap;word-break:break-word;
      font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.79rem;line-height:1.62;color:#d7d7de}

  .regarder{margin:.85rem 0 0;font-size:.85rem;color:var(--doux)}
  .regarder b{color:var(--jaune);font-weight:700}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="/">← toutes les prévisualisations</a>
  <h1>21 looks Seedance</h1>
  <p class="chapeau">
    La suite des sept déjà publiés. Trois familles selon ce que le plan doit faire :
    montrer une preuve, incarner une présence, ou rendre visible une idée qui ne se filme pas.
  </p>
  <p class="avert">
    <b>Rien n’est publié.</b> Ces prompts sont écrits mais aucun n’a encore été tourné, donc
    aucun n’est illustré — contrairement à la page des sept looks, dont chaque prompt vient
    d’une vidéo réellement produite. À relire avant d’en faire une ressource publique, qui
    demanderait en plus un mot-clé et une porte qui fonctionne.
  </p>

  ${Object.entries(parFamille).map(([f, looks]) => `
  <section class="famille">
    <div class="famille-tete">
      <h2>${ech(FAMILLES[f].nom)}</h2>
      <span>${ech(FAMILLES[f].dit)} · ${looks.length} looks</span>
    </div>
    ${looks.map(carte).join('')}
  </section>`).join('')}
</div>
<script>
document.querySelectorAll('.copier').forEach((b) => {
  b.addEventListener('click', async () => {
    const t = document.getElementById(b.dataset.cible).textContent;
    try { await navigator.clipboard.writeText(t); }
    catch (e) {
      // clipboard refusé (contexte non sécurisé) : on sélectionne, l'utilisateur copie
      const r = document.createRange(); r.selectNodeContents(document.getElementById(b.dataset.cible));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      b.textContent = 'sélectionné'; setTimeout(() => { b.textContent = 'copier'; }, 1800); return;
    }
    b.textContent = 'copié'; b.classList.add('ok');
    setTimeout(() => { b.textContent = 'copier'; b.classList.remove('ok'); }, 1600);
  });
});
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ICI, 'index.html'), html);
console.log(`index.html écrit · ${LOOKS.length} looks · ${Object.keys(parFamille).length} familles`);
