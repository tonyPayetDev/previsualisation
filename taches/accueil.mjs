/* Génère la RACINE de previsualisation — le point d'entrée unique.
 *
 * Demande de Tony (31/08) : « il faudra vraiment faire un point d'entrée
 * principal qui va sur le reste, parce que là c'est un peu désordonné. Tout
 * rassembler en un endroit pour que je m'y retrouve. »
 *
 * Ce que la racine était avant : 184 Ko, 338 liens, la liste brute des 410
 * routes de rendus, sans hiérarchie. On y trouvait une vidéo de démo aussi
 * facilement qu'un tableau de pilotage — c'est-à-dire pas du tout.
 *
 * TROIS CONTRAINTES qui ont dicté la construction, et qu'il ne faut pas perdre :
 *
 * 1. LE MARQUEUR `  <ul>`. Le script du journal quotidien
 *    (veille-journal-ia/render-publish.sh, l.288) insère son entrée en
 *    remplaçant la PREMIÈRE occurrence de deux espaces suivis de `<ul>` dans ce
 *    fichier — et il le fait avec `|| true`. Si le marqueur disparaît, le
 *    journal cesse d'apparaître ici SANS AUCUNE ERREUR, chaque matin. Le bloc
 *    « derniers rendus » porte donc ce marqueur, en première position.
 *
 * 2. CETTE PAGE EST PUBLIQUE. `/carte/`, `/appels/`, `/sprint/` et `/taches/`
 *    sont derrière mot de passe, pas la racine. Donc AUCUN nom de client, aucun
 *    chiffre de prospection, aucun montant. Les compteurs affichés ici ne
 *    parlent que de production interne.
 *
 * 3. La galerie complète n'est pas supprimée, elle DÉMÉNAGE dans /galerie/.
 *    Tony a des liens vers des routes précises un peu partout ; les casser
 *    pour faire propre serait un mauvais échange.
 *
 *   node taches/accueil.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ICI = path.dirname(new URL(import.meta.url).pathname);
const R = path.join(ICI, '..');

const ech = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── ce qu'on sait dire sans rien divulguer ─────────────────────────────── */
const lire = (p, def) => { try { return JSON.parse(fs.readFileSync(path.join(R, p), 'utf8')); } catch { return def; } };

const tj = lire('taches/valider/taches.json', {});
const taches = Array.isArray(tj) ? tj : (tj.taches || []);

/* L'état d'une tâche ne se lit PAS dans le fichier : il se lit dans le webhook,
   là où Tony appuie réellement. Le fichier porte l'état au moment où je l'ai
   écrit, le webhook porte sa décision depuis. Compter le fichier donnait 13
   « en attente de ton avis » là où son tableau en affiche 11 — deux tâches sur
   lesquelles il s'était déjà prononcé. Même source que valider.mjs, donc. */
let decisions = {};
try {
  const r = await fetch('https://n7n.automatisationboost.com/webhook/taches-validation?t=' + Date.now());
  const j = await r.json();
  decisions = typeof j.donnees === 'string' ? JSON.parse(j.donnees || '{}') : (j.donnees || {});
} catch { /* webhook injoignable : on retombe sur le fichier, en le disant */ }
const etatDe = (t) => (decisions[t.id] && decisions[t.id].etat) || t.etat;
const parEtat = {};
for (const t of taches) { const e = etatDe(t); parEtat[e] = (parEtat[e] || 0) + 1; }

const sem = lire('taches/semaine.json', { semaines: [] });
const dernSem = sem.semaines[sem.semaines.length - 1] || null;

/* Les pages de PILOTAGE ne sont pas des rendus : elles ont déjà leur carte
   au-dessus, et elles remontaient en tête des « derniers rendus » simplement
   parce qu'on venait de les régénérer. */
const OUTILLAGE = new Set(['galerie', 'carte', 'sprint', 'appels', 'taches', 'cta', 'cta-portes', 'recap', 'cockpit']);
const routes = fs.readdirSync(R, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'journal-ia')
  .map((d) => d.name);
const rendus = routes.filter((n) => !OUTILLAGE.has(n));

/* Les rendus récents : on trie sur la date de modification du index.html, pas
   sur le nom — les noms ne portent pas tous une date, et ceux qui en portent
   une mentent quand une route est reprise. */
const recents = rendus.map((n) => {
  try { return { n, t: fs.statSync(path.join(R, n, 'index.html')).mtimeMs }; } catch { return null; }
}).filter(Boolean).sort((a, b) => b.t - a.t).slice(0, 14);

const jour = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/* ── les portes du pilotage ─────────────────────────────────────────────── */
const OUTILS = [
  { href: '/taches/valider/', titre: 'Décider', quoi: 'Ce que je te propose, ce que tu valides, ce que tu renvoies.',
    chiffre: parEtat.fait || 0, unite: 'attendent ton avis', cle: true },
  { href: '/sprint/', titre: 'Faire', quoi: 'Une tâche, sept minutes, on enchaîne. Et le bilan de ta semaine.',
    chiffre: dernSem ? dernSem.seances : null, unite: 'séances cette semaine' },
  { href: '/appels/', titre: 'Appeler', quoi: 'La feuille d’appel : qui, quoi dire, et où ça en est.',
    chiffre: null, unite: '' },
  { href: '/carte/', titre: 'Voir où j’en suis', quoi: 'Les chantiers, ce qu’ils produisent, et ce qui a bougé.',
    chiffre: null, unite: '' },
  { href: '/cta-portes/', titre: 'Les portes CTA', quoi: 'Chaque mot-clé promis en vidéo et la ressource derrière.',
    chiffre: null, unite: '' },
  { href: '/galerie/', titre: 'Tous les rendus', quoi: 'Les vidéos, démos et maquettes, du plus récent au plus ancien.',
    chiffre: rendus.length, unite: 'rendus publiés' },
];

const FABRIQUER = [
  { href: '/studio-video/', titre: 'Studio vidéo', quoi: 'Choisis un modèle, un avatar, une durée : la page te sort la commande à me coller.', chiffre: null, unite: '', cle: true },
  { href: '/creer/', titre: 'Créer une vidéo', quoi: 'Le brief guidé : style, durée, sujet, hashtags, mot-clé.', chiffre: null, unite: '' },
  { href: '/generateur/', titre: 'Générateur de brief', quoi: 'Un template, un format, une durée → le JSON exact à me transmettre.', chiffre: null, unite: '' },
  { href: '/templates/', titre: 'Catalogue des templates', quoi: 'Chaque style, sa commande pour le relancer, et les vidéos qui en sont sorties.', chiffre: null, unite: '' },
  { href: '/banque-higgsfield/', titre: 'Banque Higgsfield', quoi: '624 clips triés, cherchables, pour arrêter de choisir les hooks à l\'aveugle.', chiffre: null, unite: '' },
  { href: '/tournage/', titre: 'Tournage / prompteur', quoi: 'Ton script défile, les mouvements s\'affichent, la vidéo part avec ses repères.', chiffre: null, unite: '' },
  { href: '/studio/', titre: 'Atelier assets & styles', quoi: 'Musiques, bruitages, clips avatar, palette, polices.', chiffre: null, unite: '' },
  { href: '/foodboost-editeur/', titre: 'Éditeur de feed FoodBoost', quoi: 'Monter le feed vitrine d\'un restaurant, plat par plat.', chiffre: null, unite: '' },
];

const carte = (o) => `      <a class="outil${o.cle ? ' cle' : ''}" href="${o.href}">
        <span class="t">${ech(o.titre)}</span>
        <span class="q">${ech(o.quoi)}</span>
        ${o.chiffre !== null ? `<span class="n">${o.chiffre}<i>${ech(o.unite)}</i></span>` : '<span class="n vide"></span>'}
      </a>`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Prévisualisation — Autoboost</title>
<style>
:root{
  --nuit:#0a0a0d; --carte:#121218; --carte2:#17171f; --ligne:#24242e;
  --texte:#f2f0ec; --doux:#a3a0ad; --faible:#6f6c78;
  --or:#eab308; --violet:#8b5cf6; --vert:#4ade80;
  --dsp:'Arial Narrow','Helvetica Neue',system-ui,sans-serif;
  --mno:ui-monospace,SFMono-Regular,Menlo,monospace;
}
*{margin:0;padding:0;box-sizing:border-box}
html{background:var(--nuit)}
body{background:var(--nuit);color:var(--texte);line-height:1.55;
  font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  -webkit-font-smoothing:antialiased}
.w{max-width:1000px;margin:0 auto;padding:clamp(30px,6vw,64px) clamp(18px,4vw,32px) 100px}
.mono{font-family:var(--mno);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--or)}
h1{font-family:var(--dsp);text-transform:uppercase;font-weight:700;letter-spacing:.01em;
  font-size:clamp(34px,7vw,62px);line-height:1.02;margin:16px 0 14px;text-wrap:balance}
h1 em{font-style:normal;color:var(--or)}
.chapo{color:var(--doux);max-width:56ch;font-size:clamp(15px,1.6vw,17px)}

h2{font-family:var(--dsp);text-transform:uppercase;font-size:20px;letter-spacing:.02em;
  margin:46px 0 4px;padding-top:26px;border-top:1px solid var(--ligne)}
h2 + p{color:var(--faible);font-size:13.5px;margin-bottom:20px}

.outils{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.outil{display:flex;flex-direction:column;gap:7px;background:var(--carte);border:1px solid var(--ligne);
  border-radius:14px;padding:20px 20px 18px;text-decoration:none;color:inherit;transition:.16s}
.outil:hover{border-color:#3a3a48;background:var(--carte2);transform:translateY(-2px)}
.outil .t{font-family:var(--dsp);text-transform:uppercase;font-size:21px;letter-spacing:.02em}
.outil .q{color:var(--doux);font-size:13.5px;line-height:1.5}
.outil .n{margin-top:auto;padding-top:10px;font-family:var(--dsp);font-size:30px;line-height:1;
  color:var(--or);font-variant-numeric:tabular-nums}
.outil .n i{display:block;font-family:inherit;font-style:normal;font-size:11.5px;
  letter-spacing:.09em;text-transform:uppercase;color:var(--faible);margin-top:5px}
.outil .n.vide{min-height:0;padding-top:0}
.outil.cle{border-color:rgba(234,179,8,.42);background:rgba(234,179,8,.06)}
.outil.cle:hover{border-color:var(--or)}
.outil:focus-visible{outline:2px solid var(--or);outline-offset:3px}

ul{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
ul a{display:flex;justify-content:space-between;align-items:baseline;gap:10px;
  background:var(--carte);border:1px solid var(--ligne);border-radius:10px;
  padding:12px 14px;text-decoration:none;color:var(--texte);font-size:13.5px;transition:.14s}
ul a:hover{border-color:#3a3a48;color:var(--or)}
ul .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
ul .badge{font-family:var(--mno);font-size:10.5px;color:var(--faible);white-space:nowrap}

.pied{margin-top:56px;padding-top:22px;border-top:1px solid var(--ligne);
  color:var(--faible);font-size:12.5px;line-height:1.6}
.pied b{color:var(--doux);font-weight:600}
@media (prefers-reduced-motion:reduce){.outil{transition:none}.outil:hover{transform:none}}
</style>
</head>
<body>
<div class="w">

  <span class="mono">Automatisation Boost</span>
  <h1>Tout part <em>d’ici</em>.</h1>
  <p class="chapo">Les quatre premières cartes sont les seules dont tu as besoin au quotidien.
  Le reste est rangé dessous, et n’en bouge plus.</p>

  <h2>Piloter</h2>
  <p>Décider, faire, appeler, situer — dans cet ordre.</p>
  <div class="outils">
${OUTILS.map(carte).join('\n')}
  </div>

  <h2>Fabriquer</h2>
  <p>Tout ce qui sert à sortir une vidéo — du modèle au brief que tu me colles.</p>
  <div class="outils">
${FABRIQUER.map(carte).join('\n')}
  </div>

  <h2>Derniers rendus</h2>
  <p>Les quatorze plus récents. Le journal du matin vient s’ajouter ici tout seul.</p>
  <ul>
${recents.map((r) => `    <li><a href="/${ech(r.n)}/">
      <span class="name">${ech(r.n)}</span>
      <span class="badge">${jour(r.t)}</span>
    </a></li>`).join('\n')}
  </ul>

  <div class="pied">
    <b>Pourquoi cette page existe.</b> La racine affichait les ${rendus.length} routes d’un bloc,
    sans hiérarchie : on y trouvait une maquette client aussi facilement qu’un tableau de bord,
    c’est-à-dire pas du tout. La liste complète n’a pas disparu, elle est dans
    <a href="/galerie/" style="color:var(--or)">la galerie</a> — aucun lien existant n’est cassé.
    <br><br>
    <b>Ce qui est protégé.</b> Décider, Faire, Appeler et Voir où j’en suis demandent ton mot de
    passe. Cette page-ci est publique : elle ne porte donc aucun nom de client et aucun chiffre
    de prospection.
  </div>

</div>
</body>
</html>
`;

fs.writeFileSync(path.join(R, 'index.html'), html);
const okMarqueur = html.includes('\n  <ul>');
console.log(`accueil écrit · ${OUTILS.length} portes · ${recents.length} rendus récents · ${routes.length} routes`);
console.log(okMarqueur
  ? '  ✅ marqueur "  <ul>" présent — le journal continuera de s’insérer'
  : '  ❌ MARQUEUR ABSENT : le journal cessera d’apparaître, en silence');
if (!okMarqueur) process.exit(1);
