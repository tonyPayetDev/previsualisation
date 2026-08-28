/* D'autres secteurs à appeler — parce qu'un restaurant ne décroche pas entre
 * 10 h et 14 h.
 *
 * C'est le vrai défaut de la feuille actuelle : elle ne contient que de la
 * restauration, donc elle n'est utilisable qu'en milieu d'après-midi. Un
 * garage, un institut de beauté ou une salle de sport répondent le matin.
 *
 * Mêmes pièges Overpass que `leads-osm.mjs`, et pour les mêmes raisons :
 *  · le cadre géographique, jamais `area["name"=...]` — « Saint-Pierre »
 *    attrape Pontarlier ;
 *  · l'en-tête `User-Agent` est obligatoire, sinon 406 ;
 *  · les miroirs rendent des 504 quand ils sont chargés : on les essaie tous.
 */
import fs from 'node:fs';

const BBOX = '-21.40,55.20,-20.85,55.85';
const MIROIRS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const UA = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'AutomatisationBoost-leads/1.0 (tony.payet.professionnel@gmail.com)',
  Accept: 'application/json',
};

/* Les secteurs retenus, et pourquoi : ils décrochent le matin, ils ont un
 * produit qui se photographie, et ils ont rarement un site correct. */
const SECTEURS = [
  { id: 'beaute', nom: 'Institut · coiffeur',   heure: 'dès 9 h, sauf samedi',
    q: `nwr["shop"~"^(hairdresser|beauty|cosmetics)$"](${BBOX});nwr["leisure"="spa"](${BBOX});` },
  { id: 'garage', nom: 'Garage · carrosserie',  heure: 'dès 8 h, très joignable',
    q: `nwr["shop"~"^(car_repair|car|tyres|motorcycle)$"](${BBOX});` },
  { id: 'sport',  nom: 'Salle de sport',        heure: 'creux entre 10 h et 16 h',
    q: `nwr["leisure"~"^(fitness_centre|sports_centre)$"](${BBOX});` },
  { id: 'heberg', nom: 'Hôtel · gîte',          heure: 'dès 9 h, après le petit-déjeuner',
    q: `nwr["tourism"~"^(hotel|guest_house|chalet|apartment)$"](${BBOX});` },
  { id: 'sante',  nom: 'Santé · bien-être',     heure: 'entre deux patients, 12 h ou 14 h',
    q: `nwr["amenity"~"^(dentist|veterinary)$"](${BBOX});nwr["healthcare"~"^(physiotherapist|psychotherapist|podiatrist)$"](${BBOX});` },
  { id: 'commerce', nom: 'Commerce',            heure: 'dès 9 h 30',
    q: `nwr["shop"~"^(florist|clothes|shoes|jewelry|furniture|optician|bicycle|sports)$"](${BBOX});` },
  { id: 'services', nom: 'Auto-école · immobilier · photo', heure: 'dès 9 h',
    q: `nwr["amenity"="driving_school"](${BBOX});nwr["office"~"^(estate_agent|insurance|travel_agent)$"](${BBOX});nwr["shop"="photo"](${BBOX});` },
];

const Q = `[out:json][timeout:180];\n(\n${SECTEURS.map((s) => '  ' + s.q).join('\n')}\n);\nout center tags;`;

const CACHE = '/work/previsualisation/taches/osm-secteurs.json';
const AGE_MAX = 24 * 3600 * 1000;

let brut = null;
for (const m of MIROIRS) {
  try {
    const r = await fetch(m, { method: 'POST', headers: UA, body: 'data=' + encodeURIComponent(Q), signal: AbortSignal.timeout(190000) });
    if (!r.ok) { console.log(`  ${m.split('/')[2]} → HTTP ${r.status}`); continue; }
    brut = await r.json();
    fs.writeFileSync(CACHE, JSON.stringify(brut));
    console.log(`  ${m.split('/')[2]} → ${brut.elements.length} éléments`);
    break;
  } catch (e) { console.log(`  ${m.split('/')[2]} → ${String(e).slice(0, 60)}`); }
}
if (!brut) {
  /* Le cache est un SECOURS, pas la source : on ne s'en sert que si les trois
     miroirs sont tombés, et on le dit. */
  try {
    const st = fs.statSync(CACHE);
    brut = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
    console.log(`  réseau indisponible — cache du ${st.mtime.toLocaleString('fr-FR')}`);
  } catch { console.error('  aucune donnée, ni réseau ni cache'); process.exit(1); }
}

/* À quel secteur appartient un élément : on rejoue les mêmes clés que la
   requête, dans le même ordre, pour qu'un commerce ne tombe pas dans deux. */
const secteurDe = (t) => {
  if (/^(hairdresser|beauty|cosmetics)$/.test(t.shop || '') || t.leisure === 'spa') return 'beaute';
  if (/^(car_repair|car|tyres|motorcycle)$/.test(t.shop || '')) return 'garage';
  if (/^(fitness_centre|sports_centre)$/.test(t.leisure || '')) return 'sport';
  if (/^(hotel|guest_house|chalet|apartment)$/.test(t.tourism || '')) return 'heberg';
  if (/^(dentist|veterinary)$/.test(t.amenity || '') || t.healthcare) return 'sante';
  if (/^(florist|clothes|shoes|jewelry|furniture|optician|bicycle|sports)$/.test(t.shop || '')) return 'commerce';
  return 'services';
};

/* Ceux qu'on a déjà appelés, et ceux à qui on a déjà livré quelque chose. */
let deja = new Set();
try {
  const r = JSON.parse(fs.readFileSync('/work/previsualisation/appels/resultats.json', 'utf8')).appels || {};
  deja = new Set(Object.keys(r));
} catch {}
const cle = (n) => String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const vus = new Set(), leads = [];
for (const e of brut.elements) {
  const t = e.tags || {};
  const tel = t.phone || t['contact:phone'] || t['contact:mobile'] || t.mobile;
  const nom = String(t.name || '').trim();
  if (!tel || !nom) continue;
  const k = cle(nom);
  if (vus.has(k) || deja.has(k)) continue;
  vus.add(k);
  leads.push({
    id: k, nom, tel: String(tel).replace(/\s+/g, ' ').trim(),
    secteur: secteurDe(t),
    commune: t['addr:city'] || t['addr:suburb'] || '',
    site: t.website || t['contact:website'] || '',
    mail: t.email || t['contact:email'] || '',
  });
}

const parSecteur = {};
for (const l of leads) (parSecteur[l.secteur] ||= []).push(l);
fs.writeFileSync('/work/previsualisation/appels/mode/leads-secteurs.json',
  JSON.stringify({ maj: new Date().toISOString(), secteurs: SECTEURS, leads }, null, 1));

console.log(`\n  ${leads.length} prospects avec un numéro, hors restauration :`);
for (const s of SECTEURS) {
  const l = parSecteur[s.id] || [];
  console.log(`    ${s.nom.padEnd(34)} ${String(l.length).padStart(3)}  (${l.filter((x) => !x.site).length} sans site)`);
}

/* ─────────────────────────────────────────────────────── La page « secteurs »
 * Même mécanique que le mode appel : un écran, un appel, deux boutons. La
 * seule chose en plus est le choix du secteur — parce que l'heure de la
 * journée décide du secteur qu'on peut appeler, et que c'est justement ce
 * qui manquait à la feuille restaurants.
 */
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Une accroche par secteur. Elle ne s'appuie que sur ce qu'on sait vraiment :
   le métier, et la présence ou non d'un site. Prétendre connaître leur
   établissement au téléphone, c'est se faire raccrocher à la deuxième phrase. */
const ACCROCHES = {
  beaute: ['vos prestations', 'Vos photos de coiffures ou de soins, aujourd’hui, elles restent sur le téléphone ou vous publiez ?'],
  garage: ['votre garage', 'Quand quelqu’un cherche un garage sur son téléphone, il tombe sur quoi, chez vous ?'],
  sport: ['votre salle', 'Vos adhérents, ils viennent par le bouche-à-oreille ou par Internet ?'],
  heberg: ['votre établissement', 'Vos réservations passent surtout par les plateformes, ou en direct ?'],
  sante: ['votre cabinet', 'Vos patients vous trouvent comment, aujourd’hui ?'],
  commerce: ['votre boutique', 'Vos nouveautés, vous les montrez où ?'],
  services: ['votre activité', 'Vos clients vous trouvent comment, aujourd’hui ?'],
};

const scriptDe = (l) => {
  const [quoi, question] = ACCROCHES[l.secteur] || ACCROCHES.services;
  const vu = l.site
    ? 'J’ai regardé votre site avant d’appeler.'
    : 'Je n’ai pas trouvé de site à votre nom, c’est pour ça que je vous appelle directement.';
  return [
    ['Ouvrir', `Bonjour, Tony PAYET, je suis basé à La Réunion. ${vu} Je fais des vidéos courtes et des sites pour ${quoi}. Vous avez deux minutes ?`],
    ['La question qui ouvre', question],
    ['Ce que tu proposes', 'Je pars de vos propres photos et j’en fais une vidéo verticale de dix secondes, prête à publier. Pas de tournage, pas de déplacement, rien à préparer de votre côté.'],
    ['S’il demande le prix', 'Ça dépend du nombre. Je préfère vous en montrer une d’abord : si elle ne vous plaît pas, la question du prix ne se pose pas.'],
    ['Fermer', 'Je vous en monte une cette semaine et je vous envoie le lien. Vous regardez, et vous me dites oui ou non. Ça vous va ?'],
    ['La sortie', 'Si ce n’est pas le moment, dites-le-moi franchement et je ne rappelle pas.'],
  ];
};

const pourPage = leads.map((l) => ({ ...l, script: scriptDe(l) }));

fs.mkdirSync('/work/previsualisation/appels/secteurs', { recursive: true });
fs.writeFileSync('/work/previsualisation/appels/secteurs/leads.json',
  JSON.stringify({ maj: new Date().toISOString(), secteurs: SECTEURS, leads: pourPage }, null, 1));

fs.writeFileSync('/work/previsualisation/appels/secteurs/index.html', `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>Appeler — autres secteurs</title>
<style>
  :root{--fond:#07080c;--carte:#101420;--ligne:#1e2637;--blanc:#f0f3f8;--gris:#8590a3;
        --vert:#34d399;--jaune:#FFE600;--bleu:#60a5fa}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{height:100%}
  body{background:var(--fond);color:var(--blanc);
    font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;
    display:flex;flex-direction:column;padding:14px 16px calc(14px + env(safe-area-inset-bottom))}
  header{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
  a.retour{color:var(--gris);text-decoration:none;font-size:12.5px}
  .cpt{font-size:12.5px;color:var(--gris);font-variant-numeric:tabular-nums}
  main{flex:1;display:flex;flex-direction:column;justify-content:center;gap:13px;min-height:0;overflow-y:auto}
  h1{font-size:clamp(26px,7vw,40px);line-height:1.06;letter-spacing:-.025em}
  .meta{color:var(--gris);font-size:14px}
  .badge{align-self:flex-start;font-size:11px;letter-spacing:.2em;text-transform:uppercase;
    border:1px solid var(--ligne);border-radius:999px;padding:4px 11px;color:var(--bleu)}
  .vu{background:var(--carte);border:1px solid var(--ligne);border-left:2px solid var(--bleu);
      border-radius:9px;padding:11px 13px;font-size:14px;color:#c2cbd9}
  .dire{background:#0d1626;border:1px solid #22354f;border-radius:12px;padding:16px 17px}
  .dire .t{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--gris);margin-bottom:8px}
  .dire p{font-size:clamp(17px,4.6vw,21px);line-height:1.42}
  details{background:var(--carte);border:1px solid var(--ligne);border-radius:9px;padding:11px 13px}
  details summary{cursor:pointer;font-size:13.5px;color:var(--gris);list-style:none}
  details summary::-webkit-details-marker{display:none}
  details p{font-size:14.5px;margin-top:9px;color:#cbd3e0}
  details p b{display:block;color:var(--gris);font-size:11.5px;letter-spacing:.14em;
    text-transform:uppercase;margin-bottom:2px;font-weight:600}
  .tel{display:block;text-align:center;background:#10281c;border:1px solid #1f6f52;color:#8ff0c4;
    border-radius:13px;padding:19px;font-size:23px;font-weight:700;text-decoration:none;
    font-variant-numeric:tabular-nums}
  .tel small{display:block;font-size:12px;font-weight:400;color:#5fae8c;letter-spacing:.1em;
    text-transform:uppercase;margin-bottom:3px}
  footer{display:flex;flex-direction:column;gap:9px;padding-top:13px}
  .rang{display:flex;gap:9px}
  button{flex:1;font:inherit;font-size:15px;font-weight:600;border:1px solid var(--ligne);
    background:#141a26;color:var(--blanc);border-radius:11px;padding:15px 10px;cursor:pointer;min-height:54px}
  button.parle{border-color:#1f6f52;background:#12271e;color:#8ff0c4}
  .choix{display:flex;flex-direction:column;gap:9px}
  .choix button{text-align:left;display:flex;justify-content:space-between;align-items:baseline;gap:10px}
  .choix .n{color:var(--gris);font-size:12.5px;font-weight:400}
  .choix .h{display:block;color:var(--gris);font-size:12px;font-weight:400;margin-top:3px}
  .note{color:var(--gris);font-size:12.5px;text-align:center}
</style></head>
<body>
<header><a class="retour" href="../">‹ feuille restaurants</a><div class="cpt" id="cpt"></div></header>
<main id="ecran"></main>
<footer id="pied"></footer>
<script>
(() => {
  const URL_ETAT='https://n7n.automatisationboost.com/webhook/appels-journal';
  let D={}, sect=null, liste=[], i=0, etat={}, duNeuf=false, enVol=false;

  const envoyer=async()=>{ if(enVol||!duNeuf) return; enVol=true; duNeuf=false;
    try{ await fetch(URL_ETAT,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(etat)});}
    catch(e){ duNeuf=true; } finally{ enVol=false; if(duNeuf) setTimeout(envoyer,1200); } };
  const jour=()=>new Date().toISOString().slice(0,10);
  const fait=(l)=>etat[l.id]&&etat[l.id].date===jour();

  const menu=()=>{
    document.getElementById('cpt').textContent='';
    document.getElementById('ecran').innerHTML=
      '<h1>Qui tu appelles ?</h1><p class="meta">Un restaurant ne d\\u00e9croche pas entre 10 h et 14 h. Ces secteurs-l\\u00e0, si.</p>'
      +'<div class="choix">'+D.secteurs.map(s=>{
        const n=D.leads.filter(l=>l.secteur===s.id&&!fait(l)).length;
        return n? '<button data-s="'+s.id+'"><span>'+s.nom+'<span class="h">'+s.heure+'</span></span><span class="n">'+n+'</span></button>':''; }).join('')
      +'</div>';
    document.getElementById('pied').innerHTML='';
    document.querySelectorAll('.choix button').forEach(b=>b.onclick=()=>{
      sect=b.dataset.s; liste=D.leads.filter(l=>l.secteur===sect&&!fait(l)); i=0; peindre(); });
  };

  const marquer=(l,q)=>{ etat[l.id]={etat:q,date:jour(),h:new Date().toISOString(),secteur:sect};
    duNeuf=true; envoyer(); i++; peindre(); };

  const peindre=()=>{
    if(!sect) return menu();
    const ec=document.getElementById('ecran'), pi=document.getElementById('pied');
    const s=D.secteurs.find(x=>x.id===sect);
    document.getElementById('cpt').textContent=s.nom+' \\u00b7 '+Math.min(i+1,liste.length)+' / '+liste.length;
    if(i>=liste.length){
      ec.innerHTML='<h1>Secteur termin\\u00e9.</h1><p class="meta">Tu peux en prendre un autre.</p>';
      pi.innerHTML='<button onclick="location.reload()">Choisir un autre secteur</button>'; return; }
    const l=liste[i], ouvre=l.script[0], reste=l.script.slice(1);
    ec.innerHTML='<span class="badge">'+s.nom+'</span><h1>'+l.nom+'</h1>'
      +'<div class="meta">'+[l.commune,l.site?'a un site':'aucun site trouv\\u00e9'].filter(Boolean).join(' \\u00b7 ')+'</div>'
      +(l.site?'<div class="vu"><a href="'+l.site+'" target="_blank" rel="noopener" style="color:#60a5fa">Ouvrir leur site \\u2197</a></div>':'')
      +'<div class="dire"><div class="t">\\u00c0 lire, mot pour mot</div><p>'+ouvre[1]+'</p></div>'
      +'<details><summary>La suite, si \\u00e7a s\\u2019ouvre</summary>'
      +reste.map(x=>'<p><b>'+x[0]+'</b>'+x[1]+'</p>').join('')+'</details>';
    pi.innerHTML='<a class="tel" href="tel:'+l.tel.replace(/[^+0-9]/g,'')+'"><small>appeler</small>'+l.tel+'</a>'
      +'<div class="rang"><button data-q="repondu">Pas d\\u00e9croch\\u00e9</button>'
      +'<button class="parle" data-q="appele">J\\u2019ai parl\\u00e9</button></div>'
      +'<div class="note">Deux boutons, et on passe au suivant.</div>';
    pi.querySelectorAll('button').forEach(b=>b.onclick=()=>marquer(l,b.dataset.q));
  };

  (async()=>{
    D=await (await fetch('leads.json?t='+Date.now())).json();
    try{ const j=await (await fetch(URL_ETAT+'?t='+Date.now())).json();
      const d=typeof j.donnees==='string'?JSON.parse(j.donnees||'{}'):(j.donnees||{});
      etat=d&&typeof d==='object'?d:{}; }catch(e){}
    menu();
  })();
})();
</script>
</body></html>`);
console.log(`  page écrite · ${pourPage.length} fiches`);
