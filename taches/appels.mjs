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
const CHAINES = /\b(mc ?donald|burger king|kfc|subway|domino|pizza hut|quick|starbucks|del arte|brioche dor|paul\b|o'?tacos|five guys|buffalo grill|la mie c[aâ]line|columbus caf|speed burger|g[ée]ant|carrefour|leader ?price|super ?u|casino|vapiano)\b/i;

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
const cle = (n) => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* État de la vitrine, relevé en visitant réellement chaque site (captures.mjs).
   Ce sont ces trois signaux qui changent ce qu'on dit au téléphone. */
let ETAT = {};
try { ETAT = JSON.parse(fs.readFileSync('/work/previsualisation/appels/vignettes/etat.json', 'utf8')); } catch {}

function vitrine(r) {
  const e = ETAT[cle(r.nom)] || {};
  if (!r.site) return { sorte: 'aucun', dit: 'aucun site trouvé' };
  if (e.ok === false) return { sorte: 'mort', dit: 'leur site ne répond plus' };
  if (/facebook\.com/i.test(r.site)) return { sorte: 'facebook', dit: 'leur seule vitrine est une page Facebook' };
  if (e.texte != null && e.texte < 600) return { sorte: 'maigre', dit: 'site très pauvre en contenu' };
  return { sorte: 'ok', dit: 'site en ligne' };
}

/* Le script est adapté à chaque lead — mais uniquement avec ce qu'on SAIT
   vraiment de lui : son type, sa cuisine quand elle est renseignée, et surtout
   s'il a un site ou non. Rien d'autre. Prétendre connaître son établissement au
   téléphone, c'est se faire raccrocher au nez à la deuxième phrase. */
function script(r, chaud) {
  const quoi = r.type === 'fast_food' ? 'votre snack'
    : r.type === 'cafe' ? 'votre établissement' : 'votre restaurant';
  /* Les étiquettes OSM sont en anglais et brutes. Les lire telles quelles au
     téléphone sonne faux — « vos photos de malagasy » ne veut rien dire pour un
     restaurateur. On ne traduit que ce qu'on sait traduire ; le reste retombe
     sur « vos plats », qui marche toujours. */
  const CUISINE = {
    regional: 'cuisine locale', creole: 'cuisine créole', local: 'cuisine locale',
    pizza: 'pizzas', french: 'cuisine française', burger: 'burgers',
    sandwich: 'sandwichs', chinese: 'cuisine chinoise', italian: 'cuisine italienne',
    indian: 'cuisine indienne', asian: 'cuisine asiatique', japanese: 'cuisine japonaise',
    malagasy: 'cuisine malgache', salad: 'salades', pasta: 'pâtes',
    kebab: 'kebabs', crepe: 'crêpes', fine_dining: 'assiettes', snack: 'plats',
    seafood: 'poissons', chicken: 'poulet', ice_cream: 'glaces',
  };
  const brut = r.cuisine ? r.cuisine.split(';')[0].toLowerCase() : null;
  const plat = brut && CUISINE[brut] ? CUISINE[brut] : null;

  if (chaud) {
    return [
      ['Ouvrir', "Bonjour, Tony PAYET, je suis à La Réunion. Je fais des petites vidéos pour les restaurants. Vous avez deux minutes ?"],
      ['S’il dit non', "Pas de souci, bonne journée — et tu raccroches. C’est un échauffement : le but est de parler, pas de vendre."],
      ['S’il écoute', "Je monte des vidéos courtes à partir des photos que vous avez déjà, pour Instagram et TikTok. Vous publiez en ce moment ?"],
      ['Fermer', "Je peux vous en faire une pour voir, sans engagement. Je vous l’envoie et vous me dites."],
    ];
  }

  /* L accroche part de ce qu on a VU sur leur vitrine. C est ce qui fait la
     différence entre un appel de démarcheur et un appel de quelqu un qui a
     regardé. */
  const v = vitrine(r);
  const accroche = {
    mort:     "J’ai voulu regarder votre site avant d’appeler — il ne répond plus.",
    facebook: "J’ai regardé : votre seule vitrine en ligne, c’est votre page Facebook.",
    maigre:   "J’ai jeté un œil à votre site, il est encore très léger.",
    aucun:    "Je n’ai pas trouvé de site à votre nom, c’est pour ça que je vous appelle directement.",
    ok:       "J’ai regardé votre site avant d’appeler.",
  }[v.sorte];

  return [
    ['Ouvrir', `Bonjour, Tony PAYET, je suis basé à La Réunion. ${accroche} Je fais des vidéos courtes pour ${quoi}. Vous avez deux minutes ?`],
    ['La question qui ouvre', `Vos photos ${plat ? 'de ' + plat : 'de plats'}, aujourd’hui vous en faites quoi ? Elles restent sur le téléphone, ou vous publiez ?`],
    ['Ce que tu proposes', "Je pars de vos propres photos et j’en fais une vidéo verticale de dix secondes, prête à publier. Pas de tournage, pas de déplacement, rien à préparer de votre côté."],
    ['S’il demande le prix', "Ça dépend du nombre de vidéos. Je préfère vous en montrer une d’abord : si elle ne vous plaît pas, la question du prix ne se pose pas."],
    ['Fermer', "Je vous en monte une cette semaine et je vous envoie le lien. Vous regardez, et vous me dites oui ou non. Ça vous va ?"],
    ['La sortie', "Si ce n’est pas le moment, dites-le-moi franchement et je ne rappelle pas."],
  ];
}

/* Le bouton d'appel occupe sa propre ligne, pleine largeur. Côte à côte avec le
   nom, il écrasait celui-ci sur trois lignes et poussait la page à 421 px dans
   un écran de 390 — mesuré. Et c'est la cible qu'on vise au pouce : autant
   qu'elle soit large. */
const carte = (r, i, chaud) => `
      <li class="lead${chaud ? ' chaud' : ''}">
        <div class="tete">
          <div class="rang">${i}</div>
          <div class="corps">
            <b>${esc(r.nom)}</b>
            <span class="meta">${esc(r.type === 'fast_food' ? 'Snack / fast-food' : r.type === 'cafe' ? 'Café' : 'Restaurant')}${r.commune ? ' · ' + esc(r.commune) : ''}${r.cuisine ? ' · ' + esc(r.cuisine.split(';')[0]) : ''}</span>
            ${(() => { const v = vitrine(r); return r.site
              ? `<a class="site v-${v.sorte}" href="${esc(r.site)}" target="_blank" rel="noopener">${esc(v.dit)} ↗</a>`
              : `<span class="site v-aucun">${esc(v.dit)}</span>`; })()}
          </div>
        </div>
        ${(() => {
          const k = cle(r.nom); const e = ETAT[k] || {};
          return e.ok ? `<a class="vign" href="${esc(r.site)}" target="_blank" rel="noopener"><img loading="lazy" src="vignettes/${k}.jpg" alt="Aperçu du site de ${esc(r.nom)}"></a>` : '';
        })()}
        <a class="tel" href="tel:${telBrut(r.telephone)}">📞 ${esc(r.telephone)}</a>
        <details class="scr">
          <summary>Le script pour cet appel</summary>
          ${script(r, chaud).map(([t, l]) => `<div class="et"><span>${esc(t)}</span><p>${esc(l)}</p></div>`).join('')}
        </details>
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
.lead{background:var(--carte);border:1px solid var(--ligne);
  border-left:3px solid var(--vrai);border-radius:11px;
  padding:13px 14px 12px;margin-bottom:10px}
.tete{display:flex;align-items:flex-start;gap:11px}
.lead.chaud{border-left-color:var(--chaud)}
.rang{flex:0 0 26px;height:26px;border-radius:50%;background:#222834;color:var(--gris);
  display:grid;place-items:center;font-size:12.5px;font-weight:700}
.corps{flex:1;min-width:0}
.corps b{display:block;font-size:16px;font-weight:650;letter-spacing:-.01em;text-wrap:balance}
.meta{display:block;color:var(--gris);font-size:12.5px;margin-top:2px}
.site{display:inline-block;font-size:12.5px;text-decoration:none;margin-top:3px;color:var(--vrai)}
/* L'état de la vitrine se lit à la couleur : rouge = argument de vente. */
.site.v-mort,.site.v-aucun{color:#FF6B6B}
.site.v-facebook,.site.v-maigre{color:var(--chaud)}
.vign{display:block;margin-top:10px;border:1px solid var(--ligne);border-radius:8px;
  overflow:hidden;background:#0b0d11}
.vign img{display:block;width:100%;height:132px;object-fit:cover;object-position:top center}
.tel{display:block;margin-top:11px;background:var(--vrai);color:#08130c;
  text-decoration:none;font-weight:700;font-size:16px;letter-spacing:.01em;
  padding:13px 10px;border-radius:9px;text-align:center}
.lead.chaud .tel{background:var(--chaud);color:#1a1200}
.scr{margin-top:10px;border-top:1px solid var(--ligne);padding-top:9px}
.scr summary{cursor:pointer;list-style:none;font-size:12px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--gris);font-weight:600}
.scr summary::-webkit-details-marker{display:none}
.scr summary::after{content:" ▾";color:var(--vrai)}
.scr[open] summary::after{content:" ▴"}
.lead.chaud .scr summary::after{color:var(--chaud)}
.et{margin-top:12px}
.et span{display:block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--vrai);font-weight:700;margin-bottom:3px}
.lead.chaud .et span{color:var(--chaud)}
.et p{font-size:14.5px;line-height:1.5;color:#c9cfda}
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

<p class="note"><b>Ce que la vignette montre, et ce qu'elle ne montre pas.</b>
C'est leur page d'accueil, visitée en anonyme le 25/08. Ça suffit pour juger si
la vitrine est vivante — et c'est justement l'argument d'ouverture.
<br><br>
<b>Leur feed Instagram, en revanche, je ne peux pas te le montrer ici.</b>
Instagram ne laisse plus consulter un profil sans être connecté : il faut soit
des cookies de session, soit un service de scraping payant plafonné à quelques
profils par jour. Je préfère te le dire plutôt que d'afficher une image vide.
Le raccourci qui marche : ouvre leur Instagram sur ton téléphone pendant que ça
sonne — deux secondes, et tu sais s'ils publient.</p>

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
