// Génère /cta/ — l'état des promesses faites en vidéo.
//
// Chaque vidéo dit « commente MOT et je t'envoie ça ». Le workflow Auto-DM
// lit l'onglet « Ressources CTA » du Sheet pour savoir quoi envoyer. Si la
// cellule est vide, la promesse est faite et rien ne suit — c'est exactement
// ce qui s'est passé sur TURBO, et Tony l'a vu passer.
//
// Cette page répond à trois questions qu'on ne peut pas voir dans un tableur :
//   1. les liens déjà renseignés répondent-ils encore ? (appelés un par un)
//   2. quels mots-clés sont promis SANS rien derrière ?
//   3. parmi eux, lesquels ont déjà une ressource écrite quelque part ?
//
// La troisième est celle qui change tout : au 25/08, 18 des 22 mots-clés
// « manquants » avaient déjà leur page. Le travail était fait ; il manquait
// une cellule.
import fs from 'node:fs';
import path from 'node:path';

const R = '/work/previsualisation';
const RES = '/work/automationboost/ressources';
const BASE_RES = 'https://automatisationboost.com/ressources/';

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const audit = JSON.parse(fs.readFileSync('/tmp/audit.json', 'utf8'));

/* Propositions de rattachement. On ne les invente pas : elles viennent d'une
   correspondance entre le mot-clé et le titre réel des pages. Elles sont
   marquées « à confirmer » — c'est Tony qui tranche, parce qu'une ressource
   à côté de la plaque coûte plus cher qu'une absence assumée. */
const PROPOSE = {
  OUTILS:      { f: 'classement-outils-video-ia.html', sur: true,
                 pourquoi: "Le post dit « un fait derrière chaque verdict, pas un adjectif » et « la méthode pour refaire ce travail ». C'est mot pour mot le contenu de cette page — elle a été écrite pour ce post." },
  SITE:        { f: 'relance-clients-site-demo.html', sur: true,
                 pourquoi: "Le post promet « d'un site figé à un site qui bosse pour toi » et « je t'envoie le système ». Cette page est la méthode site-démo → contrat : script d'appel, objections, relance sur 7 jours." },
  RESTO:       { f: 'vendre-prospection-restaurants-rdv-automatique.html', sur: true, pourquoi: 'Prospection restaurants → RDV automatique.' },
  PROSPECTION: { f: 'vendre-prospection-restaurants-rdv-automatique.html', sur: true, pourquoi: 'Même méthode, angle prospection.' },
  VEILLE:      { f: 'veille-ia-quotidienne.html', sur: true, pourquoi: 'La veille IA quotidienne, exactement.' },
  SEEDANCE:    { f: '7-looks-visuels-seedance.html', sur: true, pourquoi: 'Sept prompts Seedance complets et publiés.' },
  AVATAR:      { f: 'analyser-concurrents-avatar.html', sur: true, pourquoi: 'Analyse concurrents par avatar.' },
  CREATEUR:    { f: 'face-cachee-metier-createur.html', sur: true, pourquoi: 'La face cachée du métier de créateur.' },
  NOTION:      { f: 'connecter-drive-notion.html', sur: true, pourquoi: 'Connecter Drive et Notion.' },
  BLOG:        { f: 'workflow-blog-seo-n8n.html', sur: true, pourquoi: 'Workflow blog SEO sous n8n.' },
  SEO:         { f: 'seo-trouve-sur-google-ia.html', sur: true, pourquoi: 'Être trouvé sur Google à l\'ère de l\'IA.' },
  AGENT:       { f: 'agent-ia-relances.html', sur: true, pourquoi: 'Agent IA de relances.' },
  LEADS:       { f: 'automatisations-mail-calendar-leads.html', sur: true, pourquoi: 'Mail + agenda + leads automatisés.' },
  FREELANCE:   { f: 'closing-freelance.html', sur: false, pourquoi: 'Trois pages freelance existent — reste à choisir laquelle correspond à la vidéo.' },
  IDEAS:       { f: 'tester-idee-7-jours.html', sur: false, pourquoi: 'Tester une idée en 7 jours — à confirmer selon le propos de la vidéo.' },
  LIVRE:       { f: 'lire-livre-dense-memoriser.html', sur: false, pourquoi: 'Lire un livre dense — à confirmer.' },
  VIDEO:       { f: 'automation-boost-video-pack.html', sur: false, pourquoi: 'Le pack vidéo générique — attention, c\'est exactement ce qui a été envoyé à tort sur TURBO.' },
  TERMINAL:    { f: null, sur: false, pourquoi: 'Aucune correspondance sérieuse : la recherche remonte des pages sans rapport.' },
  FABLE:       { f: null, sur: false, pourquoi: 'Aucune correspondance sérieuse.' },
  PINTEREST:   { f: null, sur: false, pourquoi: 'Rien d\'écrit sur Pinterest.' },
  WHATSAPP:    { f: null, sur: false, pourquoi: 'Rien d\'écrit sur WhatsApp.' },
  DEVIS:       { f: null, sur: false, pourquoi: 'Rien d\'écrit sur les devis.' },
  KILO:        { f: null, sur: false, pourquoi: 'Rien d\'écrit sur Kilo Code.' },
};

/* Ce qui part dans les jours qui viennent — relevé sur le calendrier Blotato
   du 25/08 au matin. C'est ce qui rend deux lignes urgentes plutôt que
   simplement en retard. */
const URGENT = {
  OUTILS: 'promis aujourd\'hui, sur 5 réseaux — plusieurs posts déjà sortis',
  SITE: 'promis demain 26/08, sur 5 réseaux',
};

const existe = (f) => f && fs.existsSync(path.join(RES, f));

/* ── Les mots réellement promis, relevés dans les scripts ──────────────────
 *
 * Jusqu'ici la liste des mots « hors tableur » venait de URGENT, écrit à la
 * main : deux entrées. Le balayage des 59 scripts en trouve dix-neuf.
 *
 * La distinction que cette page ne faisait pas, et qui est la seule qui
 * compte pour la personne qui commente :
 *   · mot ABSENT de l'onglet  → le workflow ignore le commentaire, RIEN ne part
 *   · mot présent, lien vide  → un DM part quand même, vers la bibliothèque
 * Les deux étaient comptés ensemble sous « sans ressource ». Le premier est
 * un silence, le second une réponse imparfaite. */
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
const GENERIQUES = new Set(['UN', 'TON', 'LE', 'MACHIN', 'MOT', 'MOTCLE', 'CLE', 'CE', 'CES', 'TA', 'MA']);

const scanScripts = (racine) => {
  const trouve = new Map();
  const fichiers = [];
  (function marche(d, prof = 0) {
    if (prof > 4) return;
    let e; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const x of e) {
      if (x.name === 'node_modules' || x.name.startsWith('.')) continue;
      const p = path.join(d, x.name);
      if (x.isDirectory()) marche(p, prof + 1);
      else if (/^(SCRIPT\.md|narration\.txt)$/.test(x.name)) fichiers.push(p);
    }
  })(racine);
  for (const f of fichiers) {
    /* « Commente le mot X », « Commente X, je t'envoie… ». On ne garde que le
       premier mot qui suit, et on écarte les tournures d'exemple. */
    const re = /commente\s+(?:le\s+mot\s+|le\s+)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9]{2,20})/gi;
    const txt = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(txt))) {
      const k = norm(m[1]);
      if (GENERIQUES.has(k)) continue;
      if (!trouve.has(k)) trouve.set(k, new Set());
      trouve.get(k).add(path.basename(path.dirname(f)));
    }
  }
  return { trouve, nbFichiers: fichiers.length };
};

const { trouve: promis, nbFichiers } = scanScripts('/work/autoboost-neon-videos');

/* Une page dont le nom contient le mot-clé est une PISTE, jamais une preuve.
   Elle est affichée « à confirmer » — sauf si PROPOSE la donne pour sûre. */
const pages = fs.existsSync(RES) ? fs.readdirSync(RES).filter((x) => x.endsWith('.html')) : [];
for (const [mot] of promis) {
  if (PROPOSE[mot]) continue;
  const p = pages.find((f) => f.includes(mot.toLowerCase()));
  if (p) PROPOSE[mot] = { f: p, sur: false, pourquoi: `Le nom du fichier contient « ${mot.toLowerCase()} ». Rapprochement automatique, à vérifier avant de coller le lien.` };
}

const vivants = audit.filter((x) => x.code === 200);
const morts = audit.filter((x) => x.lien && x.code !== 200);
const orphelins = audit.filter((x) => !x.lien);

/* Hors tableur = promis quelque part, absent de l'onglet. Deux sources :
   le texte des scripts, et les légendes de posts relevées dans URGENT. */
const horsTable = [...new Set([...promis.keys(), ...Object.keys(URGENT)])]
  .filter((m) => !audit.some((x) => x.mot === m))
  .sort();
const ouPromis = (m) => [...(promis.get(m) || [])].slice(0, 2).join(', ');

const ligneOrpheline = (mot) => {
  const p = PROPOSE[mot] || { f: null, sur: false, pourquoi: 'Pas encore examiné.' };
  const dispo = existe(p.f);
  const urg = URGENT[mot];
  return `      <li class="m${urg ? ' urgent' : ''}${p.f && dispo ? ' pret' : ''}">
        <div class="hd">
          <b>${esc(mot)}</b>
          ${urg ? `<span class="urg">${esc(urg)}</span>` : ''}
        </div>
        ${p.f && dispo
          ? `<div class="prop">
               <span class="et">${p.sur ? 'Correspondance sûre' : 'À confirmer'}</span>
               <a href="${BASE_RES}${esc(p.f)}" target="_blank" rel="noopener">${esc(p.f)}</a>
             </div>
             <p class="pq">${esc(p.pourquoi)}</p>
             <div class="act"><button type="button" class="cp" data-txt="${BASE_RES}${esc(p.f)}">Copier l'URL</button></div>`
          : `<p class="pq manque">${esc(p.pourquoi)} — <b>il faut l'écrire.</b></p>`}
      </li>`;
};

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Promesses en vidéo</title>
<style>
:root{--noir:#0f1115;--carte:#171a21;--ligne:#262b36;--blanc:#eef1f6;--gris:#8b93a3;
      --vert:#3BC47D;--chaud:#F5A524;--rouge:#C2444C}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--noir);color:var(--blanc);
  font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:22px 16px 70px}
.wrap{max-width:680px;margin:0 auto}
.sur{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gris)}
h1{font-size:clamp(26px,6vw,36px);line-height:1.06;font-weight:800;letter-spacing:-.03em;margin:8px 0 12px}
.intro{color:var(--gris);font-size:14.5px;line-height:1.68}
.intro b{color:var(--blanc)}
.compte{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0 8px;padding:13px 15px;background:var(--carte);
  border:1px solid var(--ligne);border-radius:11px;font-size:12.5px;color:var(--gris)}
.compte b{display:block;color:var(--blanc);font-size:21px;line-height:1.2}
.compte .v b{color:var(--vert)} .compte .o b{color:var(--chaud)} .compte .e b{color:var(--rouge)}
h2{font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;margin:30px 0 6px}
h2.a{color:var(--chaud)} h2.b{color:var(--vert)} h2.c{color:var(--gris)} h2.e2{color:var(--rouge)}
.pourquoi{color:var(--gris);font-size:13.5px;line-height:1.6;margin-bottom:12px}
ul{list-style:none}
.m{background:var(--carte);border:1px solid var(--ligne);border-left:3px solid var(--ligne);
  border-radius:10px;padding:13px 15px;margin-bottom:9px}
.m.urgent{border-left-color:var(--chaud);background:#1c1710}
.m.pret{border-left-color:var(--vert)}
.hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.hd b{font-size:16px;font-weight:700;letter-spacing:.04em}
.urg{font-size:11.5px;color:var(--chaud);font-weight:600}
.urg2{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--rouge);font-weight:700;
  border:1px solid rgba(194,68,76,.4);border-radius:99px;padding:2px 8px}
.prop{display:flex;align-items:center;gap:9px;margin-top:8px;flex-wrap:wrap;font-size:13px}
.prop .et{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--gris)}
.prop a{color:var(--vert);text-decoration:none;border-bottom:1px solid rgba(59,196,125,.35);
  font-family:ui-monospace,Menlo,monospace;font-size:12.5px;word-break:break-all}
.pq{margin-top:7px;font-size:13.5px;line-height:1.6;color:var(--gris)}
.pq.manque{color:#d8a8ac}
.pq b{color:var(--blanc)}
.act{margin-top:10px}
.act button{border:1px solid var(--ligne);background:#0f1115;color:var(--blanc);border-radius:8px;
  padding:8px 13px;font:inherit;font-size:12.5px;cursor:pointer}
.act button:hover{border-color:var(--vert)}
.act button.ok{background:var(--vert);border-color:var(--vert);color:#08130c}
.vivants{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.vivants span{font-size:11.5px;color:var(--gris);border:1px solid var(--ligne);border-radius:99px;padding:3px 9px}
.pied{margin-top:28px;color:var(--gris);font-size:13px;line-height:1.7}
.pied b{color:var(--blanc)}
code{font-family:ui-monospace,Menlo,monospace;font-size:12.5px;color:#cbd2dc;
  background:#0f1115;border:1px solid var(--ligne);border-radius:5px;padding:1px 6px}
</style></head>
<body><div class="wrap">
<p class="sur">Ce qu'on promet en vidéo</p>
<h1>Promesses en vidéo</h1>
<p class="intro">Chaque vidéo dit « commente MOT et je t'envoie ça ». Le workflow Auto-DM lit
l'onglet <b>Ressources CTA</b> du Sheet pour savoir quoi envoyer. <b>Cellule vide = promesse en
l'air</b> — c'est ce qui s'est passé sur TURBO.</p>

<div class="compte">
  <span class="v"><b>${vivants.length}</b>liens vivants</span>
  <span class="e"><b>${morts.length}</b>liens morts</span>
  <span class="e"><b>${horsTable.length}</b>n'envoient rien du tout</span>
  <span class="o"><b>${orphelins.length}</b>envoient la bibliothèque</span>
  <span><b>${orphelins.filter((o) => existe((PROPOSE[o.mot] || {}).f)).length + horsTable.filter((m) => existe((PROPOSE[m] || {}).f)).length}</b>déjà écrites, à relier</span>
</div>

<h2 class="a">Urgent — promis dans les jours qui viennent</h2>
<p class="pourquoi">Ces mots-clés partent maintenant. Dans les deux cas la ressource
<b>existe déjà</b> et répond 200 : il ne manque que la cellule.</p>
<ul>
${[...horsTable.filter((m) => URGENT[m]), ...orphelins.filter((o) => URGENT[o.mot]).map((o) => o.mot)]
  .filter((m, i, a) => a.indexOf(m) === i).map(ligneOrpheline).join('\n')}
</ul>
<p class="pourquoi"><b>OUTILS n'a même pas de ligne dans le tableur</b> — il faut l'ajouter,
pas seulement le remplir. Onglet <code>Ressources CTA</code>, colonnes
<code>Mot-cle CTA</code> et <code>Lien Ressource</code>.</p>

<h2 class="e2">Silence total — le commentaire est ignoré</h2>
<p class="pourquoi">Ces mots sont prononcés dans une vidéo mais <b>n'ont aucune ligne dans
l'onglet</b>. Ce n'est pas la même chose qu'une cellule vide : une cellule vide envoie quand
même la bibliothèque, alors qu'un mot absent fait <b>ignorer le commentaire — rien ne part,
et personne ne le voit passer</b>. Relevé en balayant les ${nbFichiers} scripts et narrations
du dossier vidéo.<br>
⚠️ Tous n'ont pas forcément été publiés : un script peut être resté en brouillon. À recouper
avec le calendrier avant d'ajouter les lignes.</p>
<ul>
${horsTable.filter((m) => !URGENT[m]).map((m) => {
  const p = PROPOSE[m] || {};
  const dispo = existe(p.f);
  return `      <li class="m${dispo ? ' pret' : ''}">
        <div class="hd"><b>${esc(m)}</b><span class="urg2">aucun DM ne part</span></div>
        <p class="pq">Promis dans : <b>${esc(ouPromis(m) || '—')}</b></p>
        ${dispo
          ? `<div class="prop"><span class="et">${p.sur ? 'Correspondance sûre' : 'À confirmer'}</span>
               <a href="${BASE_RES}${esc(p.f)}" target="_blank" rel="noopener">${esc(p.f)}</a></div>
             <div class="act"><button type="button" class="cp" data-txt="${BASE_RES}${esc(p.f)}">Copier l'URL</button></div>`
          : `<p class="pq manque">Aucune page ne correspond — <b>il faut l'écrire.</b></p>`}
      </li>`;
}).join('\n')}
</ul>

<h2 class="b">Déjà écrites — il ne manque que le lien</h2>
<p class="pourquoi">Le travail est fait. Ces pages sont en ligne, il suffit de coller leur URL
dans la cellule du mot-clé.</p>
<ul>
${orphelins.filter((o) => !URGENT[o.mot] && existe((PROPOSE[o.mot] || {}).f)).map((o) => ligneOrpheline(o.mot)).join('\n')}
</ul>

<h2 class="c">À écrire — rien n'existe</h2>
<p class="pourquoi">Là, il faut vraiment produire quelque chose. Tant que c'est vide,
<b>ne pas promettre ces mots-clés dans une vidéo</b>.</p>
<ul>
${orphelins.filter((o) => !URGENT[o.mot] && !existe((PROPOSE[o.mot] || {}).f)).map((o) => ligneOrpheline(o.mot)).join('\n')}
</ul>

<h2 class="b">Ce qui marche déjà</h2>
<p class="pourquoi">Ces ${vivants.length} liens ont été appelés un par un à la génération de cette
page. Aucun n'est mort.</p>
<div class="vivants">
${vivants.map((v) => `  <span>${esc(v.mot)}</span>`).join('\n')}
</div>

<p class="pied"><b>Je ne peux pas écrire dans le Sheet depuis ici</b> — l'accès en écriture
Google Sheets n'est pas ouvert à cette session. Les correspondances marquées « à confirmer »
sont des propositions, pas des faits : une ressource à côté de la plaque coûte plus cher
qu'une absence assumée.<br>
Généré le ${new Date().toLocaleString('fr-FR', { timeZone: 'Indian/Reunion', dateStyle: 'short', timeStyle: 'short' })}.</p>
</div>
<script>
function copier(t){ if(navigator.clipboard&&window.isSecureContext) return navigator.clipboard.writeText(t);
  return new Promise(function(res,rej){var z=document.createElement('textarea');z.value=t;
    z.setAttribute('readonly','');z.style.position='fixed';z.style.opacity='0';
    document.body.appendChild(z);z.select();
    try{document.execCommand('copy');res();}catch(e){rej(e);}document.body.removeChild(z);});}
document.querySelectorAll('.cp').forEach(function(b){
  b.addEventListener('click',function(){var t=b.textContent;
    copier(b.dataset.txt).then(function(){b.textContent='Copié ✓';b.classList.add('ok');
      setTimeout(function(){b.textContent=t;b.classList.remove('ok');},1600);})
    .catch(function(){b.textContent='Échec — copie à la main';});});
});
</script>
</body></html>`;

fs.mkdirSync(path.join(R, 'cta'), { recursive: true });
fs.writeFileSync(path.join(R, 'cta', 'index.html'), html);
/* Deux compteurs distincts : un silence n'est pas un repli. Les additionner,
   comme le faisait la version précédente, masquait le cas grave. */
console.log(`  cta/index.html · ${vivants.length} liens vivants · ${morts.length} morts`);
console.log(`  🔇 ${horsTable.length} mots promis SANS ligne dans l'onglet — rien ne part :`);
console.log(`     ${horsTable.join(', ')}`);
console.log(`  📩 ${orphelins.length} mots avec une ligne mais sans lien — la bibliothèque part quand même`);
console.log(`  ✍️  ${horsTable.filter((m) => existe((PROPOSE[m] || {}).f)).length} des silencieux ont déjà une page écrite`);
console.log(`  urgents (calendrier) : ${Object.keys(URGENT).join(', ')}`);
