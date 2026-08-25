// Fabrique la feuille d'appel : 3 leads d'échauffement, puis les vrais.
//
// Demande de Tony, 2026-08-25 : « la liste pour que j'appelle 2-3 lead au
// hasard pour me chauffer et ensuite les vrais ».
//
// Le classement n'est pas décoratif. Un ÉCHAUFFEMENT doit être sans enjeu :
// petite structure, loin de son cœur commercial, pas de site web — s'il rate
// l'appel, il n'a rien perdu. Un VRAI lead est l'inverse : il a un téléphone
// ET un site, donc il investit déjà dans son image, et il est dans une commune
// où Tony peut se déplacer.
import fs from 'node:fs';

const SRC = '/work/prospection-formation/restaurants-reunion-osm.json';
const OUT = '/work/previsualisation/appels/index.html';

/* Les franchises n'achètent pas de vidéo à un indépendant : leur communication
   est décidée au siège. Les appeler, c'est brûler un appel pour rien. */
const CHAINES = /\b(mc ?donald|burger king|kfc|subway|domino|pizza hut|quick|starbucks|del arte|brioche dor|paul\b|o'?tacos|five guys|buffalo grill|la mie c[aâ]line|columbus caf|speed burger|g[ée]ant|carrefour|leader ?price|super ?u|casino)\b/i;

const tous = JSON.parse(fs.readFileSync(SRC, 'utf8'))
  .filter((r) => r.telephone)
  .filter((r) => !CHAINES.test(r.nom));

/* Cœur commercial : les communes où Tony a déjà des clients ou peut passer. */
const COEUR = ['Saint-Denis', 'Sainte-Marie', 'Sainte-Clotilde', 'Saint-Paul', 'Le Port', 'La Possession'];
const dansCoeur = (r) => COEUR.some((c) => (r.commune || '').toLowerCase().includes(c.toLowerCase()));

const echauffement = tous
  .filter((r) => !r.site && !dansCoeur(r) && r.type === 'fast_food')
  .slice(0, 3);

const vrais = tous
  .filter((r) => r.site && dansCoeur(r) && !echauffement.includes(r))
  .slice(0, 12);

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telBrut = (t) => String(t).replace(/[^\d+]/g, '');

const carte = (r, i, chaud) => `
      <li class="lead${chaud ? ' chaud' : ''}">
        <div class="rang">${i}</div>
        <div class="corps">
          <b>${esc(r.nom)}</b>
          <span class="meta">${esc(r.type === 'fast_food' ? 'Snack / fast-food' : r.type === 'cafe' ? 'Café' : 'Restaurant')}${r.commune ? ' · ' + esc(r.commune) : ''}${r.cuisine ? ' · ' + esc(r.cuisine.split(';')[0]) : ''}</span>
          ${r.site ? `<a class="site" href="${esc(r.site)}" target="_blank" rel="noopener">site en ligne ↗</a>` : '<span class="meta">pas de site</span>'}
        </div>
        <a class="tel" href="tel:${telBrut(r.telephone)}">${esc(r.telephone)}</a>
      </li>`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Feuille d'appel</title>
<style>
:root{--noir:#0f1115;--carte:#171a21;--ligne:#262b36;--blanc:#eef1f6;--gris:#8b93a3;
      --chaud:#F5A524;--vrai:#3BC47D}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--noir);color:var(--blanc);
  font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  padding:22px 16px 70px}
.wrap{max-width:620px;margin:0 auto}
.sur{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gris)}
h1{font-size:clamp(28px,7vw,40px);line-height:1.05;font-weight:800;letter-spacing:-.03em;margin:8px 0 0}
h2{font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;
  margin:34px 0 4px}
h2.a{color:var(--chaud)} h2.b{color:var(--vrai)}
.pourquoi{color:var(--gris);font-size:13.5px;margin-bottom:14px;max-width:56ch}
ul{list-style:none}
.lead{display:flex;align-items:center;gap:12px;background:var(--carte);
  border:1px solid var(--ligne);border-left:3px solid var(--vrai);
  border-radius:11px;padding:13px 14px;margin-bottom:9px}
.lead.chaud{border-left-color:var(--chaud)}
.rang{flex:0 0 26px;height:26px;border-radius:50%;background:#222834;color:var(--gris);
  display:grid;place-items:center;font-size:12.5px;font-weight:700}
.corps{flex:1;min-width:0}
.corps b{display:block;font-size:15.5px;font-weight:650;letter-spacing:-.01em}
.meta{display:block;color:var(--gris);font-size:12.5px;margin-top:2px}
.site{display:inline-block;color:var(--vrai);font-size:12.5px;text-decoration:none;margin-top:3px}
.tel{flex:0 0 auto;background:var(--vrai);color:#08130c;text-decoration:none;
  font-weight:700;font-size:14px;padding:10px 13px;border-radius:9px;white-space:nowrap}
.lead.chaud .tel{background:var(--chaud);color:#1a1200}
.note{margin-top:30px;border-left:2px solid var(--ligne);padding-left:15px;
  color:var(--gris);font-size:13.5px}
.note b{color:var(--blanc)}
</style></head><body><div class="wrap">
<p class="sur">Prospection restaurants · La Réunion</p>
<h1>Feuille d'appel</h1>

<h2 class="a">D'abord · s'échauffer</h2>
<p class="pourquoi">Trois appels sans enjeu : petites structures, loin de ton secteur,
sans site web. Si ça se passe mal, tu n'as rien perdu — c'est le but.</p>
<ul>${echauffement.map((r, i) => carte(r, i + 1, true)).join('')}
</ul>

<h2 class="b">Ensuite · les vrais</h2>
<p class="pourquoi">Ceux-là ont un téléphone <b>et</b> un site : ils investissent déjà
dans leur image. Et ils sont dans une commune où tu peux passer.</p>
<ul>${vrais.map((r, i) => carte(r, i + 1, false)).join('')}
</ul>

<p class="note">Les numéros viennent d'<b>OpenStreetMap</b>, relevés le 25/08 —
${tous.length} établissements réunionnais avec un téléphone publié. C'est une base
communautaire : <b>un numéro peut être périmé</b>. Si ça ne répond pas, ce n'est pas
toi, c'est la donnée. Passe au suivant.</p>
</div></body></html>`;

fs.mkdirSync('/work/previsualisation/appels', { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`  ${echauffement.length} échauffement · ${vrais.length} vrais · sur ${tous.length} joignables`);
echauffement.forEach((r) => console.log(`   échauffement : ${r.nom.slice(0, 32).padEnd(32)} ${r.telephone}  ${r.commune}`));
vrais.slice(0, 4).forEach((r) => console.log(`   vrai         : ${r.nom.slice(0, 32).padEnd(32)} ${r.telephone}  ${r.commune}`));
