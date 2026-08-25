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

const cleTot = (nom) => String(nom || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

/* Résultats d'appels dictés par Tony. Le suivi localStorage ne vit que dans un
   navigateur : invisible ailleurs, perdu au premier nettoyage. Ce fichier-là
   survit, et c'est lui qui fait foi au chargement. */
let RESU = {};
try { RESU = (JSON.parse(fs.readFileSync('/work/previsualisation/appels/resultats.json', 'utf8')).appels) || {}; } catch {}

/* Déjà appelés : on ne rappelle pas quelqu'un le lendemain sous prétexte
   qu'il n'a pas décroché — ça se remarque, et ça grille la fiche. */
const dejaVus = new Set(Object.keys(RESU));

/* Demain : un panachage assumé. On alterne les types (restaurant / snack /
   café) et on ne reste pas sur une seule commune : appeler quinze pizzerias
   de Saint-Denis d'affilée apprend moins que quinze établissements
   différents. */
const pourDemain = (() => {
  const libres = tous.filter((r) => !dejaVus.has(cleTot(r.nom)));
  const parType = { restaurant: [], fast_food: [], cafe: [] };
  for (const r of libres) (parType[r.type] || parType.restaurant).push(r);
  const ordre = ['restaurant', 'fast_food', 'cafe'];
  const out = []; const vus = new Set();
  let i = 0;
  while (out.length < 15 && i < 400) {
    const t = ordre[i % ordre.length];
    const pile = parType[t] || [];
    const r = pile.shift();
    i++;
    if (!r || vus.has(cleTot(r.nom))) continue;
    vus.add(cleTot(r.nom));
    out.push(r);
  }
  return out;
})();

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
        ${(() => { const d = RESU[cle(r.nom)]; return d && d.telDirect
          ? `<a class="tel direct" href="tel:${telBrut(d.telDirect)}">📱 ${esc(d.telDirect)} — son direct</a>` : ''; })()}
        ${(() => {
          const d = RESU[cle(r.nom)];
          if (!d || !d.etat) return '';
          const lib = { appele:'Appel abouti', repondu:'Pas de réponse', rappeler:'À rappeler' }[d.etat];
          return `<div class="journal e-${d.etat}">
            <div class="jt"><span class="pastille"></span>${esc(lib)} · ${esc(d.date)}</div>
            <p class="jd">${esc(d.dit)}</p>
            ${d.suite ? `<p class="js"><b>Suite :</b> ${esc(d.suite)}</p>` : ''}
          </div>`;
        })()}
        <div class="suivi" data-id="${esc(cle(r.nom))}"${(() => {
            const d = RESU[cle(r.nom)];
            return d && d.etat ? ` data-serveur="${d.etat}" data-note="${esc(d.dit)}"` : '';
          })()}>
          <div class="etats">
            <button type="button" data-e="appele">Appelé</button>
            <button type="button" data-e="repondu">Pas de réponse</button>
            <button type="button" data-e="rappeler">À rappeler</button>
            <button type="button" data-e="refus">Pas intéressé</button>
          </div>
          <select class="raison" hidden>
            <option value="">Pourquoi ? (si tu as l'info)</option>
            <option>A déjà une agence / un prestataire</option>
            <option>Pas le budget</option>
            <option>Pas le moment</option>
            <option>Le fait en interne</option>
            <option>Ne voit pas l'intérêt</option>
            <option>N'a pas voulu dire</option>
          </select>
          <textarea rows="2" placeholder="Ce qu’il a dit…"></textarea>
        </div>
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
h2.a{color:var(--chaud)} h2.b{color:var(--vrai)} h2.c{color:#7FB2E8}
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
/* Suivi d'appel — trois états et un commentaire, gardés sur l'appareil. */
.journal{margin-top:10px;padding:10px 12px;border-radius:8px;background:#10141b;
  border:1px solid var(--ligne)}
.journal .jt{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;
  letter-spacing:.13em;text-transform:uppercase;color:var(--gris)}
.journal .pastille{width:7px;height:7px;border-radius:50%;background:var(--gris);flex:0 0 7px}
.journal.e-appele{border-color:rgba(59,196,125,.42)}
.journal.e-appele .pastille{background:var(--vrai)} .journal.e-appele .jt{color:var(--vrai)}
.journal.e-rappeler{border-color:rgba(245,165,36,.45)}
.journal.e-rappeler .pastille{background:var(--chaud)} .journal.e-rappeler .jt{color:var(--chaud)}
.journal .jd{margin:6px 0 0;font-size:14px;line-height:1.5}
.journal .js{margin:7px 0 0;font-size:13.5px;line-height:1.5;color:var(--gris)}
.journal .js b{color:var(--blanc)}
.tel.direct{background:#10141b;border:1px solid var(--vrai);color:var(--vrai);margin-top:6px}
#c-relance{color:var(--chaud)}
.bilan{background:#10141b;border:1px solid var(--ligne);border-radius:11px;
  padding:16px 17px;margin:18px 0 6px}
.bilan h3{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--chaud);margin:0 0 4px}
.bilan .d{font-size:13px;color:var(--gris);margin:0 0 12px}
.bilan ol{margin:0;padding-left:19px}
.bilan li{margin:0 0 9px;font-size:14.5px;line-height:1.5}
.bilan li b{color:var(--blanc)}
.bilan .chiffres{display:flex;gap:16px;margin-top:13px;padding-top:12px;
  border-top:1px solid var(--ligne);font-size:13px;color:var(--gris)}
.bilan .chiffres b{color:var(--blanc);font-size:19px;display:block;line-height:1.2}
.suivi{margin-top:10px;border-top:1px solid var(--ligne);padding-top:10px}
.etats{display:flex;gap:6px}
.etats button{flex:1;background:var(--creux,#0f1115);border:1px solid var(--ligne);
  color:var(--gris);border-radius:8px;padding:9px 4px;font-size:12.5px;
  font-weight:600;cursor:pointer;line-height:1.15}
.etats button[aria-pressed=true][data-e=appele]{background:var(--vrai);border-color:var(--vrai);color:#08130c}
.etats button[aria-pressed=true][data-e=repondu]{background:#8b93a3;border-color:#8b93a3;color:#111}
.etats button[aria-pressed=true][data-e=rappeler]{background:var(--chaud);border-color:var(--chaud);color:#1a1200}
.etats button[aria-pressed=true][data-e=refus]{background:#C2444C;border-color:#C2444C;color:#fff}
.suivi .raison{width:100%;margin-top:7px;background:#0f1115;border:1px solid #C2444C;
  color:var(--blanc);border-radius:8px;padding:8px 10px;font:inherit;font-size:14px}
.journal.e-refus{border-color:rgba(194,68,76,.45)}
.journal.e-refus .pastille{background:#C2444C} .journal.e-refus .jt{color:#C2444C}
#c-refus{color:#C2444C}
.suivi textarea{width:100%;margin-top:7px;background:#0f1115;border:1px solid var(--ligne);
  color:var(--blanc);border-radius:8px;padding:9px 10px;font:14px/1.4 inherit;resize:vertical}
.suivi textarea:focus{outline:2px solid var(--vrai);outline-offset:1px}
.lead.chaud .suivi textarea:focus{outline-color:var(--chaud)}
.compteur{position:sticky;top:0;z-index:5;background:rgba(15,17,21,.94);
  backdrop-filter:blur(8px);margin:0 -16px 6px;padding:11px 16px;
  border-bottom:1px solid var(--ligne);display:flex;gap:14px;align-items:center;
  font-size:13px;color:var(--gris);flex-wrap:wrap}
.compteur b{color:var(--blanc);font-variant-numeric:tabular-nums}
.compteur button{margin-left:auto;background:transparent;border:1px solid var(--ligne);
  color:var(--gris);border-radius:7px;padding:6px 11px;font-size:11.5px;
  letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
.note{margin-top:30px;border-left:2px solid var(--ligne);padding-left:15px;
  color:var(--gris);font-size:13.5px}
.note b{color:var(--blanc)}
</style></head><body><div class="wrap">
<div class="compteur" id="compteur">
  <span><b id="c-fait">0</b> appelés</span>
  <span><b id="c-rep">0</b> sans réponse</span>
  <span class="relancer"><b id="c-relance">0</b> à relancer</span>
  <span><b id="c-refus">0</b> non</span>
  <span><b id="c-reste">15</b> restants</span>
  <button type="button" id="copier">Copier le bilan</button>
</div>
<p class="sur">Prospection restaurants · La Réunion</p>
<h1>Feuille d'appel</h1>
${(() => {
  const e = Object.entries(RESU).filter(([, d]) => d.etat);
  if (!e.length) return '';
  const relances = e.filter(([, d]) => d.etat === 'rappeler' || d.etat === 'appele');
  const nomDe = (k) => { const r = tous.find((x) => cle(x.nom) === k); return r ? r.nom : k; };
  return `<div class="bilan">
    <h3>Tes appels du 25/08</h3>
    <p class="d">Ce qui reste à faire, classé par ce qui rapporte le plus vite.</p>
    <ol>${relances.map(([k, d]) => `<li><b>${esc(nomDe(k))}</b> — ${esc(d.suite || d.dit)}</li>`).join('')}</ol>
    <div class="chiffres">
      <span><b>${e.length}</b>appelés</span>
      <span><b>${relances.length}</b>à relancer</span>
      <span><b>${e.filter(([, d]) => d.etat === 'repondu').length}</b>sans réponse</span>
    </div>
  </div>`;
})()}

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

<h2 class="c">Demain · nouvelle fournée</h2>
<p class="pourquoi">Quinze fiches jamais appelées, panachées exprès : restaurant, snack,
café, et pas toujours la même commune. C'est de l'entraînement — l'objectif est le nombre
d'appels passés, pas le taux de conversion. Un « oui » serait un bonus.</p>
<ul>${pourDemain.map((r, i) => carte(r, i + 1, false)).join('')}
</ul>

<p class="note"><b>Ton suivi reste sur cet appareil.</b> Les trois boutons et tes
notes sont enregistrés dans le navigateur du téléphone, sans aller-retour serveur —
tu peux appeler sans réseau correct. La contrepartie : ouverte sur un autre
appareil, la page repart vierge. D'où le bouton <b>Copier le bilan</b> en haut, qui
sort tout en texte. Reclique sur un bouton actif pour l'annuler.</p>

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

<script>
/* Le suivi reste sur CET appareil (localStorage). C'est voulu : Tony appelle
   depuis son téléphone, et une note d'appel n'a pas à faire un aller-retour
   serveur pour être écrite. La contrepartie est réelle et affichée sur la page :
   ouvert sur un autre appareil, le suivi repart vide. D'où le bouton « Copier
   le bilan » — il sort tout en texte, à coller où il veut. */
(function () {
  var CLE = 'appels-suivi-v1';
  var etat = {};
  try { etat = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (e) { etat = {}; }

  /* Les résultats connus du serveur amorcent le suivi. On n'écrase jamais une
     saisie déjà présente sur l'appareil : ce que Tony a tapé ici est plus
     récent que ce qui a été dicté. */
  document.querySelectorAll('.suivi[data-serveur]').forEach(function (b) {
    var id = b.dataset.id;
    if (etat[id] && etat[id].e) return;
    etat[id] = { e: b.dataset.serveur, note: b.dataset.note || '' };
  });

  function ranger() {
    try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {}
    compter();
  }

  function compter() {
    var fait = 0, rep = 0, rel = 0, ref = 0;
    Object.keys(etat).forEach(function (k) {
      if (etat[k].e === 'appele') fait++;
      if (etat[k].e === 'repondu') rep++;
      if (etat[k].e === 'rappeler') rel++;
      if (etat[k].e === 'refus') ref++;
    });
    var tot = document.querySelectorAll('.suivi').length;
    document.getElementById('c-fait').textContent = fait;
    document.getElementById('c-rep').textContent = rep;
    document.getElementById('c-relance').textContent = rel;
    document.getElementById('c-refus').textContent = ref;
    document.getElementById('c-reste').textContent = tot - fait - rep - rel - ref;
  }

  document.querySelectorAll('.suivi').forEach(function (bloc) {
    var id = bloc.dataset.id;
    var e = etat[id] || {};
    var zone = bloc.querySelector('textarea');
    if (e.note) zone.value = e.note;
    var raison = bloc.querySelector('.raison');
    if (raison) {
      if (e.raison) raison.value = e.raison;
      raison.hidden = e.e !== 'refus';
      raison.addEventListener('change', function () {
        etat[id] = etat[id] || {}; etat[id].raison = raison.value; ranger();
      });
    }

    bloc.querySelectorAll('.etats button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(e.e === b.dataset.e));
      b.addEventListener('click', function () {
        etat[id] = etat[id] || {};
        /* Recliquer sur l'état actif l'annule : on se trompe de bouton en
           marchant, il faut pouvoir revenir en arrière sans recharger. */
        etat[id].e = (etat[id].e === b.dataset.e) ? null : b.dataset.e;
        bloc.querySelectorAll('.etats button').forEach(function (x) {
          x.setAttribute('aria-pressed', String(etat[id].e === x.dataset.e));
        });
        var sel = bloc.querySelector('.raison');
        if (sel) sel.hidden = etat[id].e !== 'refus';
        ranger();
      });
    });

    zone.addEventListener('input', function () {
      etat[id] = etat[id] || {};
      etat[id].note = zone.value;
      ranger();
    });
  });

  document.getElementById('copier').addEventListener('click', function () {
    var lignes = ['Appels — ' + new Date().toLocaleDateString('fr-FR'), ''];
    document.querySelectorAll('.lead').forEach(function (li) {
      var nom = li.querySelector('.corps b').textContent;
      var s = etat[li.querySelector('.suivi').dataset.id] || {};
      var mot = { appele: 'appelé', repondu: 'pas de réponse', rappeler: 'à rappeler' }[s.e] || 'pas encore';
      lignes.push('- ' + nom + ' — ' + mot + (s.note ? ' : ' + s.note : ''));
    });
    var txt = lignes.join('\\n');
    var bouton = this;
    function fini() { bouton.textContent = 'Copié ✓'; setTimeout(function () { bouton.textContent = 'Copier le bilan'; }, 1600); }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(fini, fini);
    else { window.prompt('Copie ce bilan :', txt); }
  });

  compter();
})();
</script>
</div></body></html>`;

fs.mkdirSync('/work/previsualisation/appels', { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`  ${echauffement.length} échauffement · ${vrais.length} vrais · sur ${tous.length} joignables`);
echauffement.forEach((r) => console.log(`   échauffement : ${r.nom.slice(0, 32).padEnd(32)} ${r.telephone}  ${r.commune}`));
vrais.slice(0, 4).forEach((r) => console.log(`   vrai         : ${r.nom.slice(0, 32).padEnd(32)} ${r.telephone}  ${r.commune}`));
