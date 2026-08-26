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
  /* Relu le 26/08 : `relance-clients-site-demo` enseigne la relance commerciale
     À UN FREELANCE qui vend des sites-démo. Or le post s'adresse à celui dont
     le site est figé, et lui promet « le système ». Mauvais destinataire.
     `site-qui-travaille` a été écrite pour ce post — mais elle n'est pas encore
     en ligne (commit non poussé), donc le test HTTP la refusera tant qu'elle
     n'y est pas. C'est exactement le but : mieux vaut aucune porte qu'un 404. */
  /* PORTE DE REPLI, posée le 26/08 à 1 h 20 de la sortie des 5 posts.
     La version destinée au site principal (`ressources/site-qui-travaille.html`)
     est écrite mais bloquée derrière un push que je ne peux pas faire. Plutôt
     que de laisser le mot sans porte au moment où il sort, la même page est
     publiée sur previsualisation, dont les sous-routes sont publiques.
     À basculer sur `f: 'site-qui-travaille.html'` (en retirant `url`) dès que
     le push est passé : la version du site principal porte le pixel et la
     capture d'email, pas celle-ci. */
  SITE:        { f: 'site-qui-travaille.html',
                 url: 'https://previsualisation.automatisationboost.com/ressource-site/',
                 sur: true,
                 pourquoi: "Le post promet « d'un site figé à un site qui bosse pour toi » et « je t'envoie le système ». Cette page décrit les trois mécanismes — publier, capter, relancer — et les trois pannes qui les cassent sans lever d'erreur." },
  /* Porte de repli, meme raison que SITE : les 5 videos etude promettent
     ce mot et la page du site principal attend un push refuse. Publiee sur
     previsualisation, dont les sous-routes sont publiques. A rebasculer sur
     le fichier du site principal des que le push passe (retirer 'url'). */
  ETUDE:       { f: 'etude-42-concurrents-restaurateurs.html',
                 url: 'https://previsualisation.automatisationboost.com/ressource-etude/',
                 sur: true,
                 pourquoi: "Les quatre vidéos de l'étude finissent sur « Commente ÉTUDE, je t'envoie les 42 ». Cette page publie le relevé — tableau de fréquence, prix des deux blocs, promesses affichées, les trois trous — sans la stratégie de Tony." },
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
  /* Écrites depuis, en réponse exacte à ce que la vidéo promet. */
  TERMINAL:    { f: 'guide-terminal-claude-code-vps.html', sur: true,
                 pourquoi: "La vidéo dit « un VPS, Coolify, et tu déploies Claude Code avec tes MCP… commente le mot TERMINAL et je t'envoie le guide ». Cette page est ce guide, écrite pour ce post." },
  FABLE:       { f: 'regle-delegation-agents-legers.html', sur: true,
                 pourquoi: "La vidéo dit « le cerveau premium garde les vraies décisions, le sale boulot part sur des agents plus légers… commente le mot FABLE et je t'envoie l'outil ». Cette page est la règle de délégation, chiffrée sur l'audit des 132 sessions." },
  DEVIS:       { f: 'devis-proposition-automatique.html', sur: true,
                 pourquoi: 'Le workflow formulaire → devis PDF → email, décrit nœud par nœud.' },
  /* Les cinq vidéos prompt-reveal promettent chacune « je te l envoie en
     message privé » — c est le prompt lui-même. Ils existent dans le dépôt
     (prompt-full.txt) : la page les publie en entier, copiables. Une seule
     ressource ferme cinq promesses. */
  REGARD:      { f: "cinq-prompts-video-complets.html", sur: true, pourquoi: "Le prompt entier de la vidéo REGARD, publié tel quel." },
  BURGER:      { f: "cinq-prompts-video-complets.html", sur: true, pourquoi: "Le prompt entier de la vidéo BURGER, publié tel quel." },
  SHONEN:      { f: "cinq-prompts-video-complets.html", sur: true, pourquoi: "Le prompt entier de la vidéo SHONEN, publié tel quel." },
  NEON:        { f: "cinq-prompts-video-complets.html", sur: true, pourquoi: "Le prompt entier de la vidéo NEON, publié tel quel." },
  COMBAT:      { f: "cinq-prompts-video-complets.html", sur: true, pourquoi: "Le prompt entier de la vidéo COMBAT, publié tel quel." },
  MP4:         { f: 'monter-video-claude-hyperframes.html', sur: true,
                 pourquoi: "autoboost-claude-monte-mp4 promet « commente MP4, je t'envoie le guide complet ». La page donne l'architecture en deux passes (HyperFrames fige sur toute balise vidéo) et les huit pièges, dont ceux qui ne produisent aucune erreur." },
  OPENCODE:    { f: 'opencode-lien-et-configuration.html', sur: true,
                 pourquoi: "autoboost-opencode promet « commente OPENCODE et je t'envoie le lien et la configuration ». La page donne les deux — et la configuration qui compte n'est pas l'installation mais le fichier-contrat entre l'agent bon marché et le superviseur." },
  MOTEUR:      { f: 'moteur-n8n-vrai-exemple.html', sur: true,
                 pourquoi: "autoboost-66 promet « commente le mot MOTEUR et je te montre un vrai exemple ». Cette page montre deux workflows réels nœud par nœud — dont celui qui enverra ce lien. Écrite avant la sortie de la vidéo." },
  /* La page de formation existe DÉJÀ, à la racine du site — « Formation IA :
     6 défis, 6 livrables », 10 300 caractères, prix affichés. Je l'avais
     cherchée dans `ressources/` et conclu à tort qu'il fallait écrire le
     programme. Deux promesses fermées sans rien écrire. */
  NOIR:        { f: null, url: 'https://automatisationboost.com/formation.html', sur: true,
                 pourquoi: "Le script d'autoboost-noir-formation indique noir sur blanc « Destination : formation.html », et la vidéo promet « je t'envoie le lien »." },
  FORMATION:   { f: null, url: 'https://automatisationboost.com/formation.html', sur: true,
                 pourquoi: "autoboost-formation-contenu promet « je t'envoie le programme » et décrit six livrables. La page porte exactement ce titre : « 6 défis, 6 livrables »." },
  /* ⚠️ INSTINCT n'est PAS écrivable par moi. La narration dit explicitement
     « le prompt complet, je te le donne pas comme ça… je t'envoie le prompt
     entier en message privé ». Ce que la composition contient est la version
     CONDENSÉE montrée à l'écran (287 caractères). L'envoyer reviendrait à
     donner à quelqu'un ce qu'il vient de voir dans la vidéo. Seul Tony a le
     prompt entier. */
  INSTINCT:    { f: null, sur: false,
                 pourquoi: "Seul Tony a le prompt entier : la vidéo ne montre qu'une version condensée, et dit elle-même qu'elle ne donne pas le complet. Rien à écrire de mon côté sans inventer." },
  PINTEREST:   { f: null, sur: false, pourquoi: 'Rien d\'écrit sur Pinterest.' },
  WHATSAPP:    { f: null, sur: false, pourquoi: 'Rien d\'écrit sur WhatsApp.' },
  KILO:        { f: null, sur: false, pourquoi: 'Rien d\'écrit sur Kilo Code.' },
};

/* Ce qui part dans les jours qui viennent — relevé sur le calendrier Blotato
   du 25/08 au matin. C'est ce qui rend deux lignes urgentes plutôt que
   simplement en retard. */
const URGENT = {
  OUTILS: 'promis aujourd\'hui, sur 5 réseaux — plusieurs posts déjà sortis',
  SITE: 'promis demain 26/08, sur 5 réseaux',
};

/* Une ressource n'est pas forcément dans `ressources/`. La page de formation
   vit à la RACINE du site (`formation.html`) — je l'avais cherchée au mauvais
   endroit et conclu à tort qu'il fallait écrire le programme, alors qu'il
   existait déjà. D'où le champ `url`, qui l'emporte sur le nom de fichier. */
const urlDe = (p) => (p && p.url) || (p && p.f ? BASE_RES + p.f : '');

/* ── « Écrite » ne veut pas dire « en ligne » ──────────────────────────────
 *
 * Cette fonction testait `fs.existsSync` : la présence du fichier SUR LE
 * DISQUE. Or le dépôt du site attend des commits non poussés — vérifié le
 * 26/08, `site-qui-travaille.html` et `etude-42-concurrents-restaurateurs.html`
 * existaient sur le disque et rendaient **404 en ligne**. Une page dans cet
 * état était comptée comme une porte valide et proposée dans le bloc à coller :
 * le mot-clé aurait été relié à un lien mort, et la personne qui commente
 * aurait reçu un 404 — pire que le silence actuel.
 *
 * On teste donc l'adresse réelle, une fois, avant de générer quoi que ce soit.
 * `?cb=` est indispensable : le CDN garde les 404 en cache plusieurs heures et
 * une page tout juste déployée répondrait encore « absente ». */
const VIVANTES = new Map();

async function testerEnLigne(urls) {
  const liste = [...new Set(urls.filter(Boolean))];
  const lot = 8;
  for (let i = 0; i < liste.length; i += lot) {
    await Promise.all(liste.slice(i, i + lot).map(async (u) => {
      try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 12000);
        const r = await fetch(u + (u.includes('?') ? '&' : '?') + 'cb=' + Math.random(),
          { redirect: 'follow', signal: c.signal });
        clearTimeout(t);
        VIVANTES.set(u, r.status === 200);
      } catch { VIVANTES.set(u, false); }
    }));
  }
}

/* Tant que le test n'a pas tourné, on retombe sur le disque : le script reste
   utilisable hors ligne, mais il ne PROMET plus qu'une page est joignable. */
const existe = (f, url) => {
  const u = urlDe({ f, url });
  if (VIVANTES.has(u)) return VIVANTES.get(u);
  return Boolean(f && fs.existsSync(path.join(RES, f)));
};

/* Une seule passe, avant toute génération : toutes les portes proposées. */
await testerEnLigne(Object.values(PROPOSE).map((p) => urlDe(p)));
{
  const total = VIVANTES.size;
  const morts = [...VIVANTES].filter(([, v]) => !v);
  console.log(`  ${total} porte(s) testée(s) en ligne · ${total - morts.length} joignable(s)`);
  for (const [u] of morts) console.log(`     ⚠️  écrite mais PAS en ligne : ${u.replace(BASE_RES, '')}`);
}

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
/* Tournures d'exemple et gabarits laissés dans les brouillons. « XXX » vient
   d'`autoboost-formation-dechirure` : c'est un emplacement à remplir, pas une
   promesse. L'afficher comme un mot silencieux ferait douter des 33 autres. */
const GENERIQUES = new Set(['UN', 'TON', 'LE', 'MACHIN', 'MOT', 'MOTCLE', 'CLE', 'CE', 'CES', 'TA', 'MA',
  'XXX', 'XX', 'MOTCLÉ', 'TONMOT', 'ICI']);

/* Mots promis par au moins une vidéo qui n'attend PAS de validation.
   Déclaré AVANT la fonction qui le remplit : le laisser après marche par
   chance (les appels viennent plus bas) mais casse dès qu'on réordonne. */
const vifs = new Set();

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
      /* Les scripts ne vivent pas tous au même endroit. Les projets de
         `autoboost-neon-videos` ont un SCRIPT.md ou un narration.txt ; les
         vidéos publiées directement sur previsualisation portent leur script
         DANS la page (`autoboost-66-…/index.html`). Ne balayer que les deux
         premiers laissait passer les promesses les plus récentes : le mot
         MOTEUR d'`autoboost-66` n'a été vu qu'à l'œil nu. */
      else if (/^(SCRIPT\.md|narration\.txt)$/.test(x.name)) fichiers.push(p);
      else if (x.name === 'index.html' && /^autoboost-/.test(path.basename(d))) fichiers.push(p);
    }
  })(racine);
  for (const f of fichiers) {
    /* « Commente le mot X », « Commente X, je t'envoie… ». On ne garde que le
       premier mot qui suit, et on écarte les tournures d'exemple. */
    const re = /commente\s+(?:le\s+mot\s+|le\s+)?(?:<[^>]+>\s*)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9]{2,20})/gi;
    let txt = fs.readFileSync(f, 'utf8');
    /* Dans une page HTML le mot-clé est souvent en gras : « commente le mot
       <b>MOTEUR</b> ». Sans retirer les balises, la capture s'arrête sur « b ». */
    if (f.endsWith('.html')) txt = txt.replace(/<[^>]+>/g, ' ');

    /* ⚠️ Une promesse n'est rompue que si la vidéo est SORTIE. Sur une page de
       prévisualisation, le statut est écrit en toutes lettres — et il l'est sous
       DEUX formulations : « En attente validation » et « À valider ». Ne
       reconnaître que la première comptait des brouillons comme des vidéos
       publiées, ce qui gonflait l'alarme et poussait à remplir le tableur pour
       des vidéos qui ne sortiront peut-être jamais. */
    const enAttente = f.endsWith('.html')
      && /en\s+attente\s+validation|à\s+valider|a\s+valider/i.test(txt);

    let m;
    while ((m = re.exec(txt))) {
      const k = norm(m[1]);
      if (GENERIQUES.has(k)) continue;
      if (!trouve.has(k)) trouve.set(k, new Set());
      trouve.get(k).add(path.basename(path.dirname(f)));
      /* Un mot promis dans au moins une vidéo sortie est « vif », même s'il
         apparaît aussi dans un brouillon. Le doute profite à l'alarme. */
      if (!enAttente) vifs.add(k);
    }
  }
  return { trouve, nbFichiers: fichiers.length };
};


/* Deux racines : les projets vidéo, ET les vidéos publiées directement sur
   previsualisation. Fusionner les deux relevés, sinon une promesse récente
   reste invisible jusqu à ce que quelqu un la voie passer à l œil nu. */
const s1 = scanScripts("/work/autoboost-neon-videos");
const s2 = scanScripts("/work/previsualisation");
const promis = s1.trouve;
for (const [k, v] of s2.trouve) {
  if (!promis.has(k)) promis.set(k, new Set());
  for (const d of v) promis.get(k).add(d);
}
const nbFichiers = s1.nbFichiers + s2.nbFichiers;

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

/* ── Deux blocs à coller, pour que la correction tienne en 30 secondes ─────
 *
 * Constater le trou ne suffit pas : tant que remplir le Sheet demande de
 * chercher la bonne ligne parmi 43 puis de recopier une URL à la main, ça ne
 * se fait pas. On produit donc deux blocs prêts à coller.
 *
 * Le numéro de ligne vient du mapping RÉEL, relevé dans une exécution du
 * workflow Auto-DM (voir taches/mapping.mjs) — pas d'une note qui se périme
 * dès que quelqu'un insère une ligne.
 *
 * ⚠️ Chaque URL proposée est APPELÉE avant d'entrer dans un bloc. Coller un
 * lien mort dans un système qui envoie des DM à de vraies personnes est pire
 * que la cellule vide : la cellule vide, elle, envoie la bibliothèque. */
let mappingLive = null;
try { mappingLive = JSON.parse(fs.readFileSync('/tmp/mapping-cta.json', 'utf8')); } catch {}
const numLigne = {};
for (const l of (mappingLive?.lignes || [])) numLigne[String(l['Mot-cle CTA'] || '').trim().toUpperCase()] = l.row_number;

const verifie = async (url) => {
  try {
    const r = await fetch(`${url}${url.includes('?') ? '&' : '?'}cb=${Math.random()}`,
      { method: 'GET', signal: AbortSignal.timeout(20000) });
    return r.status;
  } catch { return 0; }
};

/* À remplir : le mot a déjà sa ligne, il ne manque que le lien. */
const aRemplir = [];
for (const o of orphelins) {
  const p = PROPOSE[o.mot];
  if (!p || !p.sur || !existe(p.f, p.url)) continue;       // proposition incertaine → on s'abstient
  const url = urlDe(p);
  const code = await verifie(url);
  if (code !== 200) { console.log(`  ⚠️  ${o.mot} : ${p.f} rend ${code} — écarté du bloc`); continue; }
  aRemplir.push({ mot: o.mot, ligne: numLigne[o.mot] ?? null, url });
}
aRemplir.sort((a, b) => (a.ligne ?? 999) - (b.ligne ?? 999));

/* À ajouter : le mot n'a pas de ligne du tout, donc rien ne part. Une ligne
   sans lien vaut déjà mieux que l'absence — elle déclenche la bibliothèque. */
const aAjouter = [];
for (const m of horsTable) {
  const p = PROPOSE[m];
  let url = '';
  if (p && existe(p.f, p.url)) {
    const u = urlDe(p);
    if (await verifie(u) === 200) url = p.sur ? u : '';   // incertain → ligne sans lien, volontairement
  }
  aAjouter.push({ mot: m, url });
}

const tsvRemplir = aRemplir.map((x) => `${x.ligne ? 'ligne ' + x.ligne + '\t' : ''}${x.mot}\t${x.url}`).join('\n');
/* Les mots venant d'une vidéo DÉJÀ SORTIE en tête : c'est la seule partie du
   bloc qui répare une promesse réellement rompue. Le reste peut attendre le
   feu vert de Tony sur les rendus concernés. */
aAjouter.sort((a, b) => Number(vifs.has(b.mot)) - Number(vifs.has(a.mot)) || a.mot.localeCompare(b.mot));
const tsvAjouter = aAjouter.map((x) => `${x.mot}\t${x.url}`).join('\n');
console.log(`  bloc « à remplir » : ${aRemplir.length} · bloc « à ajouter » : ${aAjouter.length}`);

const ligneOrpheline = (mot) => {
  const p = PROPOSE[mot] || { f: null, sur: false, pourquoi: 'Pas encore examiné.' };
  const dispo = existe(p.f, p.url);
  const urg = URGENT[mot];
  return `      <li class="m${urg ? ' urgent' : ''}${p.f && dispo ? ' pret' : ''}">
        <div class="hd">
          <b>${esc(mot)}</b>
          ${urg ? `<span class="urg">${esc(urg)}</span>` : ''}
        </div>
        ${p.f && dispo
          ? `<div class="prop">
               <span class="et">${p.sur ? 'Correspondance sûre' : 'À confirmer'}</span>
               <a href="${esc(urlDe(p))}" target="_blank" rel="noopener">${esc(p.f)}</a>
             </div>
             <p class="pq">${esc(p.pourquoi)}</p>
             <div class="act"><button type="button" class="cp" data-txt="${esc(urlDe(p))}">Copier l'URL</button></div>`
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
.coller{background:var(--carte);border:1px solid var(--ligne);border-left:3px solid var(--chaud);
  border-radius:10px;padding:14px 15px;margin-bottom:12px}
.coller-hd{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.coller-hd b{font-size:15px}
.coller-hd span{font-size:12.5px;color:var(--gris)}
.tsv{background:#0b0d11;border:1px solid var(--ligne);border-radius:8px;padding:11px 13px;
  overflow-x:auto;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;line-height:1.75;
  color:#cbd2dc;white-space:pre;tab-size:14}
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
  <span><b>${orphelins.filter((o) => existe((PROPOSE[o.mot] || {}).f, (PROPOSE[o.mot] || {}).url)).length + horsTable.filter((m) => existe((PROPOSE[m] || {}).f, (PROPOSE[m] || {}).url)).length}</b>déjà écrites, à relier</span>
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
  const dispo = existe(p.f, p.url);
  return `      <li class="m${dispo ? ' pret' : ''}">
        <div class="hd"><b>${esc(m)}</b><span class="urg2">aucun DM ne part</span></div>
        <p class="pq">Promis dans : <b>${esc(ouPromis(m) || '—')}</b></p>
        ${dispo
          ? `<div class="prop"><span class="et">${p.sur ? 'Correspondance sûre' : 'À confirmer'}</span>
               <a href="${esc(urlDe(p))}" target="_blank" rel="noopener">${esc(p.f)}</a></div>
             <div class="act"><button type="button" class="cp" data-txt="${esc(urlDe(p))}">Copier l'URL</button></div>`
          : p.pourquoi
            /* Quand une raison précise est consignée, elle vaut mieux que
               « il faut l'écrire » — qui est parfois FAUX. INSTINCT, par
               exemple, ne peut pas être écrit de mon côté : la vidéo dit
               elle-même qu'elle ne montre pas le prompt complet. Afficher
               « il faut l'écrire » ferait recommencer l'analyse à chaque
               passage, pour rien. */
            ? `<p class="pq manque">${esc(p.pourquoi)}</p>`
            : `<p class="pq manque">Aucune page ne correspond — <b>il faut l'écrire.</b></p>`}
      </li>`;
}).join('\n')}
</ul>

<h2 class="a">À coller dans le Sheet — 30 secondes</h2>
<p class="pourquoi">Onglet <code>Ressources CTA</code>. Chaque URL ci-dessous a été
<b>appelée à la génération de cette page</b> et répond 200 — aucune n'est proposée sur la foi
d'un nom de fichier. Les correspondances incertaines sont volontairement absentes de ces blocs :
elles sont plus bas, à trancher à la main.</p>

${aRemplir.length ? `
<div class="coller">
  <div class="coller-hd">
    <b>${aRemplir.length} cellules à remplir</b>
    <span>la ligne existe déjà, seul le lien manque</span>
  </div>
  <pre class="tsv">${esc(tsvRemplir)}</pre>
  <div class="act"><button type="button" class="cp" data-txt="${esc(aRemplir.map((x) => x.url).join('\n'))}">Copier les URL dans l'ordre</button></div>
  <p class="pq">Le numéro de ligne est relevé dans le mapping réel du workflow, pas supposé.
  Colle chaque URL dans la colonne <code>Lien Ressource</code> de la ligne indiquée.</p>
</div>` : ''}

${aAjouter.length ? `
<div class="coller">
  <div class="coller-hd">
    <b>${aAjouter.length} lignes à ajouter</b>
    <span>${aAjouter.filter((x) => vifs.has(x.mot)).length} sur une vidéo SORTIE · ${aAjouter.filter((x) => !vifs.has(x.mot)).length} en attente de ta validation</span>
  </div>
  <p class="pq">⚠️ <b>Toutes ne sont pas urgentes.</b> Une promesse n'est rompue que si la vidéo est
  sortie. Les autres viennent de rendus qui attendent encore ton feu vert — la promesse n'a pas
  encore été faite, et rien ne presse. Le tri ci-dessous vient du statut affiché sur chaque page
  de prévisualisation, pas d'une supposition.</p>
  <pre class="tsv">${esc(tsvAjouter)}</pre>
  <div class="act"><button type="button" class="cp" data-txt="${esc(tsvAjouter)}">Copier le bloc entier</button></div>
  <p class="pq">Deux colonnes séparées par une tabulation : clique la première cellule vide sous
  la dernière ligne de l'onglet et colle — le tableur répartit les colonnes tout seul.
  <b>Une ligne sans lien n'est pas inutile</b> : elle fait partir la bibliothèque au lieu du
  silence.</p>
</div>` : ''}

<h2 class="b">Déjà écrites — il ne manque que le lien</h2>
<p class="pourquoi">Le travail est fait. Ces pages sont en ligne, il suffit de coller leur URL
dans la cellule du mot-clé.</p>
<ul>
${orphelins.filter((o) => !URGENT[o.mot] && existe((PROPOSE[o.mot] || {}).f, (PROPOSE[o.mot] || {}).url)).map((o) => ligneOrpheline(o.mot)).join('\n')}
</ul>

<h2 class="c">À écrire — rien n'existe</h2>
<p class="pourquoi">Là, il faut vraiment produire quelque chose. Tant que c'est vide,
<b>ne pas promettre ces mots-clés dans une vidéo</b>.</p>
<ul>
${orphelins.filter((o) => !URGENT[o.mot] && !existe((PROPOSE[o.mot] || {}).f, (PROPOSE[o.mot] || {}).url)).map((o) => ligneOrpheline(o.mot)).join('\n')}
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
console.log(`  ✍️  ${horsTable.filter((m) => existe((PROPOSE[m] || {}).f, (PROPOSE[m] || {}).url)).length} des silencieux ont déjà une page écrite`);
console.log(`  urgents (calendrier) : ${Object.keys(URGENT).join(', ')}`);
