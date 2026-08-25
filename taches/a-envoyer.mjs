// Génère /a-envoyer/ — le travail fini qui n'est jamais parti.
//
// Pourquoi cette page : dix tâches sont marquées « livré » ET « cash direct »
// dans le tableau de bord. Le travail est fait, il dort. Ce n'est pas un
// problème de production, c'est un problème d'envoi — et un envoi bute
// toujours sur les trois mêmes frictions : retrouver le bon lien, vérifier
// qu'il répond, et écrire le message. Cette page fait les trois d'avance.
//
// Règles tenues :
//  · aucun lien n'apparaît sans avoir répondu 200 au moment de la génération ;
//  · aucun contact n'est inventé — seuls ceux relevés dans une source réelle
//    (jeu OSM, résultats d'appels) sont affichés ;
//  · aucun prix, aucune promesse qui ne soit pas déjà dans le livrable.
import fs from 'node:fs';
import path from 'node:path';

const R = '/work/previsualisation';
const BASE = 'https://previsualisation.automatisationboost.com';

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const taches = JSON.parse(fs.readFileSync(path.join(R, 'taches/taches.json'), 'utf8')).taches || [];

/* Contacts RELEVÉS, jamais devinés. Le jeu OSM et la feuille d'appel sont les
   deux seules sources ; quand il n'y a rien, on écrit « à retrouver » plutôt
   que d'inventer un numéro qui ferait sonner chez quelqu'un d'autre. */
const CONTACTS = {
  'the-grill': { nom: 'The Grill', tel: '+262 692 77 34 80', site: 'https://thegrill.re', source: 'OpenStreetMap' },
  'giulietta': { nom: 'Pizzeria Giulietta', tel: '+262 262 12 20 19', site: 'https://www.giulietta.re/', source: 'OpenStreetMap' },
};

/* Ce que chaque livrable dit de lui-même. Le message reprend UNIQUEMENT ce
   qui a réellement été fait — pas une promesse commerciale ajoutée après. */
const FICHES = [
  {
    cle: 'the-grill',
    titre: 'Vidéo The Grill',
    quoi: 'Une vidéo à partir de vos plats — burgers, tacos, wraps, assiettes.',
    msg: (l) => `Bonjour, Tony PAYET (AutomatisationBoost, Saint-Denis).\n\nJ'ai monté une courte vidéo à partir de vos plats — burgers, tacos, wraps, assiettes. Elle est là, rien à installer :\n${l}\n\nSi elle vous plaît, elle est à vous. Si elle ne vous plaît pas, dites-le-moi et on n'en parle plus.\n\nTony — 0692 41 77 49`,
  },
  {
    cle: 'koytcha',
    titre: 'Koytcha — refonte v4',
    quoi: "L'image se révèle à travers le logo, bords de pinceau.",
    msg: (l) => `Bonjour, Tony PAYET (AutomatisationBoost).\n\nVoici la maquette dont on avait parlé — l'image se révèle à travers votre logo :\n${l}\n\nÇa se regarde sur téléphone. Dites-moi ce que vous en pensez.\n\nTony — 0692 41 77 49`,
  },
  {
    cle: 'giulietta',
    titre: 'Giulietta — boutons à la charte',
    quoi: 'Les boutons repassés dans votre vert, sur tout le site.',
    msg: (l) => `Bonjour, Tony PAYET (AutomatisationBoost, Saint-Denis).\n\nJ'ai repris les boutons de votre site pour qu'ils soient dans votre vert, partout. C'est visible ici :\n${l}\n\nÇa ne coûte rien à regarder. Si ça vous convient, on en parle.\n\nTony — 0692 41 77 49`,
  },
  {
    cle: 'mamzelle',
    titre: 'Mamzelle Pizza — traitement d\'image',
    quoi: 'Le traitement photo aligné sur une charte cohérente.',
    msg: (l) => `Bonjour, Tony PAYET (AutomatisationBoost).\n\nJ'ai retravaillé le traitement des photos de votre site — même lumière, même grain, sur toutes les pages :\n${l}\n\nDites-moi si ça vous parle.\n\nTony — 0692 41 77 49`,
  },
  {
    cle: 'kmila',
    titre: 'Kmila Pizza — corrections',
    quoi: 'Zéro débordement, zéro erreur, zéro image cassée.',
    msg: (l) => `Bonjour, Tony PAYET (AutomatisationBoost).\n\nJ'ai corrigé les défauts d'affichage de votre site — débordements, images cassées. Le résultat est ici :\n${l}\n\nTony — 0692 41 77 49`,
  },
  {
    cle: 'family-arena',
    titre: 'Family Arena — portail',
    quoi: 'Site au style cinématique, animé au défilement.',
    msg: (l) => `Bonjour, Tony PAYET (AutomatisationBoost, Saint-Denis).\n\nJ'ai construit une maquette de site pour Family Arena, animée au défilement :\n${l}\n\nÀ regarder sur téléphone de préférence. Si ça vous intéresse, on en discute.\n\nTony — 0692 41 77 49`,
  },
];

/* On ne garde que ce qui est marqué livré ET cash direct, et dont le lien
   répond. Le reste ne doit pas figurer sur une page dont le seul rôle est
   « copier-coller et envoyer ». */
const dispo = [];
for (const f of FICHES) {
  const t = taches.find((x) => x.cash === 'direct' && x.etat === 'livre'
    && new RegExp(f.cle.replace(/-/g, '.?'), 'i').test((x.lien || '') + ' ' + (x.t || '')));
  if (!t || !t.lien) { console.log(`  ⏭  ${f.titre} — pas de tâche livrée correspondante`); continue; }
  const url = t.lien.startsWith('http') ? t.lien : BASE + t.lien;
  dispo.push({ ...f, url, note: t.note || '' });
}

/* Vérification en direct : un lien mort dans la main d'un prospect coûte plus
   cher que pas de message du tout. */
const verifies = [];
for (const d of dispo) {
  let code = 0;
  try {
    const r = await fetch(d.url + (d.url.includes('?') ? '&' : '?') + 'cb=' + Math.random(),
      { method: 'GET', signal: AbortSignal.timeout(20000) });
    code = r.status;
  } catch { code = 0; }
  console.log(`  ${code === 200 ? '✅' : '❌'} ${String(code).padEnd(4)} ${d.titre}`);
  if (code === 200) verifies.push(d);
}

const carte = (d) => {
  const c = CONTACTS[d.cle];
  const msg = d.msg(d.url);
  return `      <li class="m">
        <div class="hd">
          <b>${esc(d.titre)}</b>
          <span class="quoi">${esc(d.quoi)}</span>
        </div>
        <div class="qui">
          ${c
            ? `<span class="ok">${esc(c.nom)}</span>
               <a class="tel" href="tel:${esc(c.tel.replace(/[^\d+]/g, ''))}">${esc(c.tel)}</a>
               <span class="src">relevé sur ${esc(c.source)}</span>`
            : `<span class="manque">contact à retrouver — je n'en invente pas</span>`}
        </div>
        <pre class="msg">${esc(msg)}</pre>
        <div class="act">
          <button type="button" class="cp" data-txt="${esc(msg)}">Copier le message</button>
          <a class="ouv" href="${esc(d.url)}" target="_blank" rel="noopener">Ouvrir la maquette</a>
          ${c ? `<a class="wa" href="https://wa.me/${esc(c.tel.replace(/[^\d]/g, ''))}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        </div>
      </li>`;
};

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>À envoyer</title>
<style>
:root{--noir:#0f1115;--carte:#171a21;--ligne:#262b36;--blanc:#eef1f6;--gris:#8b93a3;
      --vert:#3BC47D;--chaud:#F5A524;--wa:#25D366}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--noir);color:var(--blanc);
  font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:22px 16px 70px}
.wrap{max-width:660px;margin:0 auto}
.sur{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gris)}
h1{font-size:clamp(26px,6vw,36px);line-height:1.06;font-weight:800;letter-spacing:-.03em;margin:8px 0 12px}
.intro{color:var(--gris);font-size:14.5px;line-height:1.65}
.intro b{color:var(--blanc)}
.compte{display:flex;gap:18px;margin:16px 0 22px;padding:13px 15px;background:var(--carte);
  border:1px solid var(--ligne);border-radius:11px;font-size:13px;color:var(--gris)}
.compte b{display:block;color:var(--blanc);font-size:21px;line-height:1.2}
ul{list-style:none}
.m{background:var(--carte);border:1px solid var(--ligne);border-radius:12px;
  padding:15px 16px;margin-bottom:12px}
.hd b{display:block;font-size:16px;font-weight:600}
.quoi{display:block;font-size:13.5px;color:var(--gris);margin-top:3px}
.qui{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin:11px 0 0;font-size:13px}
.qui .ok{color:var(--blanc);font-weight:600}
.qui .tel{color:var(--vert);text-decoration:none;border-bottom:1px solid rgba(59,196,125,.4)}
.qui .src{color:#6b7280;font-size:11.5px}
.qui .manque{color:var(--chaud);font-size:12.5px}
.msg{margin-top:11px;padding:11px 13px;background:#0f1115;border:1px solid var(--ligne);
  border-radius:8px;font:13px/1.62 ui-monospace,Menlo,monospace;color:#cbd2dc;
  white-space:pre-wrap;word-break:break-word;max-height:190px;overflow-y:auto}
.act{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap}
.act button,.act a{flex:1 1 auto;text-align:center;border:1px solid var(--ligne);
  background:#0f1115;color:var(--blanc);border-radius:8px;padding:10px 12px;
  font:inherit;font-size:13px;cursor:pointer;text-decoration:none}
.act button:hover,.act a:hover{border-color:var(--vert)}
.act button.ok{background:var(--vert);border-color:var(--vert);color:#08130c}
.act .wa{color:var(--wa);border-color:rgba(37,211,102,.35)}
.pied{margin-top:26px;color:var(--gris);font-size:13px;line-height:1.7}
.pied b{color:var(--blanc)}
</style></head>
<body><div class="wrap">
<p class="sur">Travail fini · jamais parti</p>
<h1>À envoyer</h1>
<p class="intro">Ces livrables sont marqués <b>livré</b> et <b>cash direct</b> dans le tableau de
bord. Le travail est fait ; il dort. Le lien de chacun a répondu <b>200 à la génération de cette
page</b> — pas « il devrait marcher », il a été appelé.</p>

<div class="compte">
  <span><b>${verifies.length}</b>prêts à partir</span>
  <span><b>${verifies.filter((d) => CONTACTS[d.cle]).length}</b>avec un contact vérifié</span>
  <span><b>${verifies.filter((d) => !CONTACTS[d.cle]).length}</b>contact à retrouver</span>
</div>

<ul>
${verifies.map(carte).join('\n')}
</ul>

<p class="pied"><b>Aucun message n'est parti.</b> Cette page prépare, elle n'envoie pas —
c'est toi qui décides, prospect par prospect.<br>
Les numéros affichés viennent d'OpenStreetMap, relevés tels quels. Là où il n'y en a pas,
c'est écrit : je préfère un blanc à un numéro inventé qui ferait sonner chez quelqu'un d'autre.<br>
Généré le ${new Date().toLocaleString('fr-FR', { timeZone: 'Indian/Reunion', dateStyle: 'short', timeStyle: 'short' })}.</p>
</div>
<script>
function copier(txt) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
  return new Promise(function (res, rej) {
    var z = document.createElement('textarea');
    z.value = txt; z.setAttribute('readonly', '');
    z.style.position = 'fixed'; z.style.opacity = '0';
    document.body.appendChild(z); z.select();
    try { document.execCommand('copy'); res(); } catch (e) { rej(e); }
    document.body.removeChild(z);
  });
}
document.querySelectorAll('.cp').forEach(function (b) {
  b.addEventListener('click', function () {
    var t = b.textContent;
    copier(b.dataset.txt).then(function () {
      b.textContent = 'Copié ✓'; b.classList.add('ok');
      setTimeout(function () { b.textContent = t; b.classList.remove('ok'); }, 1700);
    }).catch(function () { b.textContent = 'Échec — copie à la main'; });
  });
});
</script>
</body></html>`;

fs.mkdirSync(path.join(R, 'a-envoyer'), { recursive: true });
fs.writeFileSync(path.join(R, 'a-envoyer', 'index.html'), html);
console.log(`\n  a-envoyer/index.html · ${verifies.length} livrables prêts · ${verifies.filter((d) => CONTACTS[d.cle]).length} avec contact vérifié`);
