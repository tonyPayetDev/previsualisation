/* Rend l'étude des pubs concurrentes en page lisible au téléphone.
 *
 * Convertisseur markdown volontairement minimal et taillé pour CE document :
 * titres, tableaux, listes, citations, gras, code, séparateurs. Pas de
 * dépendance — la page doit rester reproductible dans six mois.
 *
 *   node build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ICI = path.dirname(new URL(import.meta.url).pathname);
const SRC = '/work/ETUDE-PUBS-CONCURRENTS-2026-08.md';
const md = fs.readFileSync(SRC, 'utf8');

const ech = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* Le gras et le code sont posés APRÈS l'échappement, sinon leurs chevrons
   seraient eux-mêmes échappés. */
const enligne = (s) => ech(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

const lignes = md.split('\n');
const out = [];
let i = 0;
let dansListe = false;
const fermerListe = () => { if (dansListe) { out.push('</ul>'); dansListe = false; } };

while (i < lignes.length) {
  const l = lignes[i];

  /* Tableau : une ligne de cellules suivie d'une ligne de séparateurs. */
  if (/^\|.*\|\s*$/.test(l) && /^\|[\s:|-]+\|\s*$/.test(lignes[i + 1] || '')) {
    fermerListe();
    const cel = (x) => x.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
    const tete = cel(l);
    i += 2;
    const corps = [];
    while (i < lignes.length && /^\|.*\|\s*$/.test(lignes[i])) { corps.push(cel(lignes[i])); i++; }
    out.push('<div class="tableau"><table><thead><tr>'
      + tete.map((c) => `<th>${enligne(c)}</th>`).join('') + '</tr></thead><tbody>'
      + corps.map((r) => '<tr>' + r.map((c) => `<td>${enligne(c)}</td>`).join('') + '</tr>').join('')
      + '</tbody></table></div>');
    continue;
  }

  const h = l.match(/^(#{1,4})\s+(.*)$/);
  if (h) { fermerListe(); out.push(`<h${h[1].length}>${enligne(h[2])}</h${h[1].length}>`); i++; continue; }

  if (/^\s*[-*]\s+/.test(l)) {
    if (!dansListe) { out.push('<ul>'); dansListe = true; }
    out.push(`<li>${enligne(l.replace(/^\s*[-*]\s+/, ''))}</li>`);
    i++; continue;
  }
  if (/^>\s?/.test(l)) {
    fermerListe();
    const bloc = [];
    while (i < lignes.length && /^>\s?/.test(lignes[i])) { bloc.push(lignes[i].replace(/^>\s?/, '')); i++; }
    out.push(`<blockquote>${enligne(bloc.join(' '))}</blockquote>`);
    continue;
  }
  if (/^---+\s*$/.test(l)) { fermerListe(); out.push('<hr>'); i++; continue; }
  if (!l.trim()) { fermerListe(); i++; continue; }

  fermerListe();
  const bloc = [];
  while (i < lignes.length && lignes[i].trim() && !/^([#>|]|---|\s*[-*]\s)/.test(lignes[i])) { bloc.push(lignes[i]); i++; }
  out.push(`<p>${enligne(bloc.join(' '))}</p>`);
}

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Étude pubs concurrentes</title>
<style>
 :root{ --bg:#0a0a0f; --panel:#111117; --bord:#242430; --jaune:#f5d90a;
        --texte:#f2f2f5; --doux:#9a9aa8; --faible:#6b6b78; }
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--texte);line-height:1.65;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      -webkit-font-smoothing:antialiased}
 .wrap{max-width:840px;margin:0 auto;padding:2rem 1.1rem 5rem}
 a.back{color:var(--doux);font-size:.8rem;text-decoration:none;display:inline-block;margin-bottom:1.2rem}
 a.back:hover{color:var(--jaune)}
 h1{font-size:clamp(1.5rem,4.4vw,2rem);margin:0 0 1.2rem;letter-spacing:-.02em;text-wrap:balance}
 h2{font-size:1.15rem;margin:2.4rem 0 .7rem;padding-top:1.2rem;border-top:1px solid var(--bord);
    letter-spacing:-.01em;text-wrap:balance}
 h3{font-size:1rem;margin:1.7rem 0 .5rem;color:var(--jaune);text-wrap:balance}
 h4{font-size:.9rem;margin:1.2rem 0 .4rem;color:var(--doux)}
 p{margin:0 0 .9rem;font-size:.93rem}
 b{color:#fff}
 i{color:var(--doux);font-style:italic}
 ul{margin:0 0 1rem;padding-left:1.2rem}
 li{margin-bottom:.4rem;font-size:.92rem;color:var(--doux)}
 li b{color:var(--texte)}
 code{background:#16161d;border:1px solid var(--bord);border-radius:4px;
      padding:.05rem .3rem;font-size:.83em;color:#d7d7de;word-break:break-word}
 blockquote{margin:1rem 0;padding:.8rem 1rem;background:var(--panel);
            border-left:3px solid var(--jaune);border-radius:0 10px 10px 0;
            font-size:.92rem;color:var(--doux)}
 blockquote b{color:var(--texte)}
 hr{border:0;border-top:1px solid var(--bord);margin:2rem 0}
 /* Les tableaux défilent DANS leur conteneur : la page, elle, ne bouge jamais
    latéralement, même avec neuf colonnes sur un écran de 390 px. */
 .tableau{overflow-x:auto;margin:1rem 0;border:1px solid var(--bord);border-radius:10px;
          -webkit-overflow-scrolling:touch}
 table{border-collapse:collapse;min-width:100%;font-size:.83rem}
 th{text-align:left;padding:.55rem .7rem;background:#16161d;color:var(--jaune);
    font-weight:700;white-space:nowrap;border-bottom:1px solid var(--bord)}
 td{padding:.55rem .7rem;border-bottom:1px solid rgba(36,36,48,.7);vertical-align:top;
    color:var(--doux);min-width:9rem}
 td b{color:var(--texte)}
 tr:last-child td{border-bottom:0}
</style>
</head>
<body>
<div class="wrap">
<a class="back" href="/">← toutes les prévisualisations</a>
${out.join('\n')}
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(ICI, 'index.html'), html);
console.log(`  etude-pubs/index.html · ${(html.length / 1024).toFixed(0)} Ko · ${(md.match(/^\|/gm) || []).length} lignes de tableau`);
