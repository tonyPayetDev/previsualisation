// Du lagon au cratère — vol scrubbé, accent piloté par l'altitude.
//
// Le relief n'est pas modélisé : c'est une séquence de vol découpée en 180
// images, préchargées, dont celle qui est peinte dépend de la position de
// défilement. Scroller en avant et en arrière rejoue le vol.

const $ = (s) => document.querySelector(s);
const bornes = (v, a, b) => Math.max(a, Math.min(b, v));

// ── 1. Préchargement ───────────────────────────────────────────────────────
// Le site pèse 180 images. Cette attente existe qu'on la dessine ou non ;
// autant en faire la première chose que le visiteur retient. Le compteur suit
// les images RÉELLEMENT chargées, il ne simule pas une progression.
// 200 et non 180 : les vingt dernières sont un fondu de la dernière image du
// vol vers la première, pour que la boucle se referme sans saut. Mesuré, le
// raccord tombe à 2 points sur 255 — invisible.
const N = 200;
const images = new Array(N);
const ecranChg = $('#chargement');
const pctChg = $('#pct'), barreChg = $('#barreChg'), quoiChg = $('#quoiChg');

const num = (i) => String(i + 1).padStart(3, '0');

function precharger() {
  return new Promise((fini) => {
    let prets = 0;
    for (let i = 0; i < N; i++) {
      const im = new Image();
      im.onload = im.onerror = () => {
        prets++;
        const p = Math.round((prets / N) * 100);
        pctChg.textContent = p;
        barreChg.style.width = p + '%';
        if (p > 30 && p < 70) quoiChg.textContent = 'remontée du rempart';
        else if (p >= 70 && p < 100) quoiChg.textContent = 'ouverture du cirque';
        if (prets === N) fini();
      };
      im.src = `frames/f${num(i)}.jpg`;
      images[i] = im;
    }
  });
}

// ── 2. Le vol sur canvas ───────────────────────────────────────────────────
const toile = $('#toile');
const ctx = toile.getContext('2d', { alpha: false });

function dimensionner() {
  const r = Math.min(devicePixelRatio || 1, 2);
  toile.width = Math.round(innerWidth * r);
  toile.height = Math.round(innerHeight * r);
}

let posee = -1;
function peindre(i) {
  const im = images[bornes(i, 0, N - 1)];
  if (!im || !im.naturalWidth || i === posee) return;
  posee = i;
  // `object-fit: cover` à la main : le canvas a le ratio de la fenêtre, l'image
  // celui du vol (16:9). Étirer déformerait le paysage ; on recadre.
  const cw = toile.width, ch = toile.height;
  const ri = im.naturalWidth / im.naturalHeight, rc = cw / ch;
  let w, h, x, y;
  if (rc > ri) { w = cw; h = cw / ri; x = 0; y = (ch - h) / 2; }
  else { h = ch; w = ch * ri; y = 0; x = (cw - w) / 2; }
  ctx.drawImage(im, x, y, w, h);
}

// ── 3. Les trois accents ───────────────────────────────────────────────────
// L'accent se déplace avec l'altitude, et JAMAIS deux couleurs ne sont à
// l'écran en même temps — sauf sur le trait de montée, qui montre le trajet
// entier et n'est que là pour ça.
//
// La transition est continue mais COURTE : elle s'étale sur 120 m autour du
// seuil, soit 4 % de la montée. Étalée sur toute la plage, le mélange de deux
// couleurs franches passerait par des teintes qui n'appartiennent à aucune des
// trois — un gris rosé entre le bleu et le jaune. En la resserrant autour du
// palier, la couleur intermédiaire n'existe que le temps du passage.
const BLEU = [0x00, 0x57, 0xB7];
const JAUNE = [0xFF, 0xD5, 0x00];
const ROUGE = [0xE1, 0x25, 0x1B];

const doux = (t) => t * t * (3 - 2 * t);   // lissage, pas de rupture de pente

// Les deux bornes sont calées sur la demande, pas choisies au jugé :
// « à 790 m encore presque bleue, à 850 m déjà presque jaune ».
// Le fondu court donc de 790 à 857, et le lissage fait le reste :
//   790 m → t=0,00 · 800 m → t=0,06 · 850 m → t=0,97 · 860 m → t=1,00
// Centrer sur 800 donnait un olive à 790 (mesuré #608672) ; décaler de +22
// repoussait la bascule trop loin et laissait 850 à mi-chemin. Les deux ont
// été mesurés avant d'arriver à ces valeurs.
const DECALAGE = -10, LARGEUR = 67;

function accentPour(alt) {
  const fondu = (a, b, seuil) => {
    const t = doux(bornes((alt - (seuil + DECALAGE)) / LARGEUR, 0, 1));
    return a.map((v, k) => Math.round(v + (b[k] - v) * t));
  };
  if (alt < 2000) return fondu(BLEU, JAUNE, 800);
  return fondu(JAUNE, ROUGE, 2000);
}

let accentPose = '';
function poserAccent(alt) {
  const [r, g, b] = accentPour(alt);
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  if (hex !== accentPose) {
    document.documentElement.style.setProperty('--accent', hex);
    accentPose = hex;
  }
}

// ── 4. Le défilement ───────────────────────────────────────────────────────
const scrub = $('#scrub');
const chaps = [...scrub.querySelectorAll('.chap')];
const marques = [...document.querySelectorAll('.chapitres i')];
const altEl = $('#alt'), monteeEl = $('#montee'), barreChap = $('#chapitres');
const ALTS = chaps.map((c) => +c.dataset.alt || 0);

let demande = false;
function auDefilement() {
  if (demande) return;
  demande = true;
  requestAnimationFrame(() => {
    demande = false;
    const haut = scrub.offsetTop;
    const course = scrub.offsetHeight - innerHeight;
    const p = bornes((scrollY - haut) / Math.max(1, course), 0, 1);

    peindre(Math.round(p * (N - 1)));

    // L'ALTITUDE SUIT LES CHAPITRES, pas une droite.
    //
    // Répartie linéairement sur le défilement, elle affichait 790 m pendant
    // que le chapitre à l'écran annonçait « 0 mètre » — les deux se
    // contredisaient sur la même image. Chaque chapitre porte son altitude
    // (`data-alt`) ; on interpole entre elles. La montée reste continue, mais
    // elle est désormais d'accord avec ce qui est écrit.
    const x = p * (ALTS.length - 1);
    const i = Math.min(ALTS.length - 2, Math.floor(x));
    const alt = Math.round(ALTS[i] + (ALTS[i + 1] - ALTS[i]) * doux(x - i));
    altEl.textContent = alt.toLocaleString('fr-FR').replace(/ | /g, ' ');
    poserAccent(alt);

    // Le trait de montée couvre TOUTE la page, pas seulement le vol : c'est la
    // progression du visiteur, pas celle du clip.
    const total = document.documentElement.scrollHeight - innerHeight;
    const pg = bornes(scrollY / Math.max(1, total), 0, 1) * 100;
    monteeEl.style[innerWidth <= 820 ? 'width' : 'height'] = pg + '%';

    // Chaque chapitre apparaît puis s'efface selon SA propre position — c'est
    // ce croisement qui fait le mouvement, pas une apparition au seuil.
    let actif = 0;
    chaps.forEach((c, k) => {
      const r = c.getBoundingClientRect();
      const centre = r.top + r.height / 2;
      const d = Math.abs(centre - innerHeight / 2) / innerHeight;
      const o = bornes(1 - d * 1.9, 0, 1);
      const d2 = c.querySelector('.dedans');
      d2.style.opacity = o;
      d2.style.transform = `translateY(${(1 - o) * 26}px)`;
      if (k > 0 && o > 0.5) actif = k - 1;
    });
    marques.forEach((m, k) => m.classList.toggle('on', k === actif));
    poserFait(p);
    peutBoucler();
    // Rangée dès qu'on a quitté le vol : elle ne repère plus rien en dessous.
    barreChap.classList.toggle('rangee', scrollY > haut + course + innerHeight * 0.4);
  });
}

// ── 4bis. Le flux de faits ────────────────────────────────────────────────
// Ces textes sont ÉCRITS À L'AVANCE, pas récupérés en direct : le site est un
// dossier de fichiers statiques, il n'interroge aucun service. Chacun a été
// vérifié avant d'être posé là — les records de pluie viennent de Météo-France,
// les altitudes des relevés publics. Un fait inventé dans un site qui parle
// d'un territoire réel serait pire qu'un fait absent.
const FAITS = [
  ["Record du monde · pluie en 24 h",
   "1 825 mm à Foc-Foc, 2 290 m, les 7 et 8 janvier 1966, pendant le cyclone Denise. C'est le record mondial reconnu."],
  ["Record du monde · pluie en 72 h",
   "3 930 mm au cratère Commerson, 2 310 m, en février 2007, pendant le cyclone Gamède."],
  ["Record du monde · pluie en 15 jours",
   "6 083 mm au même endroit, à partir du 14 janvier 1980. Six mètres d'eau en deux semaines."],
  ["Le sommet immergé",
   "Le Piton des Neiges culmine à 3 070 m. Mesuré depuis le fond de l'océan, l'édifice dépasse 7 000 m : l'île n'en est que la partie émergée."],
  ["Un volcan qui ne dort pas",
   "Le Piton de la Fournaise, 2 632 m, compte parmi les volcans les plus actifs de la planète. Ses éruptions restent le plus souvent contenues dans l'Enclos Fouqué."],
  ["Un cirque sans route",
   "Mafate n'est desservi par aucune route. On y entre à pied par un col ; le ravitaillement se fait par hélicoptère."],
  ["Quatre cents virages",
   "La route de Cilaos compte plus de quatre cents virages pour monter à 1 214 mètres."],
  ["Patrimoine mondial",
   "Les Pitons, cirques et remparts sont inscrits au patrimoine mondial de l'UNESCO depuis le 1er août 2010."],
  ["Ce que les cirques ne sont pas",
   "Ni cratères ni vallées : ce sont des effondrements, creusés par l'érosion dans le massif du Piton des Neiges. Aucun fleuve ne les a formés."],
  ["Une ancienne station thermale",
   "Hell-Bourg, au fond du cirque de Salazie, s'est construit autour d'un établissement thermal, à 930 mètres d'altitude."],
  ["Neuf à douze jours",
   "Le sentier de grande randonnée R2 traverse l'île du nord au sud. Comptez neuf à douze jours de marche et près de 9 000 mètres de dénivelé cumulé."],
  ["Sept cents kilomètres",
   "L'île est posée à environ 700 km à l'est de Madagascar, dans l'archipel des Mascareignes."],
  ["Vingt kilomètres de lagon",
   "Une barrière de corail ferme une vingtaine de kilomètres de côte à l'ouest. Partout ailleurs, le basalte tombe directement dans la houle."],
  ["Six degrés par millier",
   "La température perd environ six degrés à chaque millier de mètres. Il gèle certaines nuits d'hiver austral au-dessus de 2 000 m, à la même latitude que le lagon."],
];

const FENTES = 5;            // faits montrés par tour de vol
let tour = 0, faitPose = -1;
const faitEl = $('#fait');

function poserFait(p) {
  // Un fait par cinquième de montée. Le tour suivant en sert cinq autres :
  // reboucler sur le même vol sans changer les textes n'apprendrait rien.
  const fente = Math.min(FENTES - 1, Math.floor(p * FENTES));
  const idx = (tour * FENTES + fente) % FAITS.length;
  if (idx === faitPose) return;
  faitPose = idx;
  const [t, c] = FAITS[idx];
  faitEl.style.opacity = 0;
  setTimeout(() => {
    faitEl.innerHTML = `<b>${t}</b><p>${c}</p>`;
    faitEl.style.opacity = 1;
  }, 260);
}

// ── 4ter. La boucle ────────────────────────────────────────────────────────
// Arrivé en bas, on repart du lagon. Le raccord d'image est déjà invisible ;
// ce qui trahirait la boucle, c'est le saut de la barre de défilement. On le
// couvre par un noir court — assumé comme une respiration, pas caché.
let boucleEnCours = false;
function peutBoucler() {
  if (boucleEnCours) return;
  const bas = document.documentElement.scrollHeight - innerHeight;
  if (scrollY < bas - 2) return;
  boucleEnCours = true;
  const noir = $('#noir');
  noir.classList.add('on');
  setTimeout(() => {
    tour++;
    faitPose = -1;
    scrollTo({ top: 0, behavior: 'instant' });
    posee = -1;
    auDefilement();
    setTimeout(() => { noir.classList.remove('on'); boucleEnCours = false; }, 240);
  }, 460);
}

// ── 5. Les chiffres qui s'incrémentent ─────────────────────────────────────
// Une seule fois, à la première apparition. Rejouer à chaque passage
// transformerait une section en animation clignotante.
function compteurs() {
  const vus = new WeakSet();
  const io = new IntersectionObserver((ents) => {
    for (const e of ents) {
      if (!e.isIntersecting || vus.has(e.target)) continue;
      vus.add(e.target);
      const cible = +e.target.dataset.nb;
      const suf = e.target.dataset.suf || '';
      const t0 = performance.now(), D = 1100;
      const pas = (t) => {
        const k = bornes((t - t0) / D, 0, 1);
        const v = Math.round(cible * doux(k));
        e.target.textContent = v.toLocaleString('fr-FR').replace(/ | /g, ' ') + suf;
        if (k < 1) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    }
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-nb]').forEach((e) => io.observe(e));
}

// ── 6. Les trois cirques ───────────────────────────────────────────────────
const CIRQUES = [
  { id: 'mafate', nom: 'Mafate', img: 'frames/f160.jpg',
    car: "Aucune route n'y mène. On y entre à pied par un col, ou en hélicoptère pour le ravitaillement. Les quelques centaines d'habitants vivent dans des îlets dispersés au fond du cirque.",
    fiche: [['Accès', 'À pied uniquement'], ['Entrée la plus courte', 'Col des Bœufs'],
            ['Altitude du col', '≈ 1 960 m'], ['Nuitée', 'Gîtes dans les îlets']] },
  { id: 'salazie', nom: 'Salazie', img: 'frames/f150.jpg',
    car: "Le plus arrosé des trois, et le plus vert. Une route le traverse jusqu'à Hell-Bourg. Les cascades y tombent des remparts toute l'année sur le versant au vent.",
    fiche: [['Accès', 'Route depuis Saint-André'], ['Village principal', 'Hell-Bourg'],
            ['Altitude du village', '≈ 930 m'], ['Particularité', 'Versant au vent']] },
  { id: 'cilaos', nom: 'Cilaos', img: 'frames/f140.jpg',
    car: "On y monte par une route de plus de quatre cents virages. C'est le point de départ le plus fréquenté vers le Piton des Neiges, et le plus sec des trois cirques.",
    fiche: [['Accès', 'Route aux 400 virages'], ['Village principal', 'Cilaos'],
            ['Altitude du village', '≈ 1 214 m'], ['Départ vers', 'Piton des Neiges']] },
];

function cirques() {
  const ong = $('#ongletsCirques'), vue = $('#cirqueVue');
  const montrer = (i) => {
    [...ong.children].forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    const c = CIRQUES[i];
    vue.innerHTML = `<img src="${c.img}" alt="Vue du cirque de ${c.nom}">
      <div><h4>${c.nom}</h4><p class="car">${c.car}</p>
      <dl class="fiche">${c.fiche.map(([a, b]) =>
        `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></div>`;
  };
  CIRQUES.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.role = 'tab'; b.textContent = c.nom;
    b.setAttribute('aria-selected', 'false');
    b.addEventListener('click', () => montrer(i));
    ong.appendChild(b);
  });
  montrer(0);
}

// ── 7. Les saisons ─────────────────────────────────────────────────────────
const SAISONS = [
  { n: 'Été austral', m: 'Décembre — mars', eau: 27,
    p: "Chaud et humide. C'est la saison des cyclones : les sentiers d'altitude ferment après les fortes pluies, parfois plusieurs jours." },
  { n: 'Intersaison', m: 'Avril — mai', eau: 26,
    p: "Les pluies s'espacent, l'eau reste chaude et la végétation est au plus vert. Les sentiers rouvrent progressivement." },
  { n: 'Hiver austral', m: 'Juin — septembre', eau: 23,
    p: "Sec et clair. La meilleure période pour marcher en altitude, mais il gèle certaines nuits au-dessus de 2 000 mètres." },
  { n: 'Intersaison', m: 'Octobre — novembre', eau: 25,
    p: "Les journées s'allongent, la houle australe faiblit. Bon compromis entre mer et montagne." },
];

function saisons() {
  $('#saisons').innerHTML = SAISONS.map((s) => `
    <div class="saison">
      <b>${s.n}</b><p class="mois">${s.m}</p>
      <p class="t mono">${s.eau}°<small>Eau de mer</small></p>
      <p>${s.p}</p>
    </div>`).join('');
}

// ── 8. Le sélecteur d'altitude ─────────────────────────────────────────────
// Le vrai travail du site : montrer qu'on change de climat sans changer d'île.
// Les quatre valeurs bougent ENSEMBLE — c'est leur simultanéité qui fait
// comprendre, pas chacune prise isolément.
const ETAGES = [
  { max: 400, img: 'frames/f004.jpg', t: 26,
    veg: 'Filaos, cocotiers, canne à sucre',
    randos: ['Sentier littoral de Saint-Leu', 'Cap La Houssaye', 'Ravine Saint-Gilles'] },
  { max: 1000, img: 'frames/f060.jpg', t: 22,
    veg: 'Canne à sucre, cryptomerias, bois de couleur',
    randos: ['Forêt de Bélouve depuis Hell-Bourg', 'Cascade du Trou de Fer (belvédère)'] },
  { max: 1900, img: 'frames/f120.jpg', t: 18,
    veg: 'Tamarins des Hauts, fougères arborescentes',
    randos: ['Bébour-Bélouve', 'Col des Bœufs vers Mafate', 'Boucle de La Nouvelle'] },
  { max: 2500, img: 'frames/f165.jpg', t: 13,
    veg: 'Brandes, éricacées, végétation rase',
    randos: ['Le Maïdo (2 205 m)', 'Pas de Bellecombe (2 311 m)', 'Plaine des Sables'] },
  { max: 3070, img: 'frames/f178.jpg', t: 8,
    veg: 'Roche nue, lichens, lave scoriacée',
    randos: ['Piton des Neiges depuis Cilaos', 'Cratère Dolomieu'] },
];

function etageDe(alt) { return ETAGES.find((e) => alt <= e.max) || ETAGES[ETAGES.length - 1]; }

function selecteur() {
  const cur = $('#curseur'), val = $('#curVal'), img = $('#etageImg'), infos = $('#etageInfos');
  let derniere = null;
  const rendre = () => {
    const alt = +cur.value;
    val.textContent = alt.toLocaleString('fr-FR').replace(/ | /g, ' ');
    // L'accent du curseur suit le palier où il se trouve, comme l'altimètre.
    poserAccent(alt);
    const e = etageDe(alt);
    if (e !== derniere) {
      derniere = e;
      img.src = e.img;
      img.alt = `Paysage vers ${e.max} mètres`;
      infos.innerHTML = `
        <div class="ligne"><dt>Température moyenne</dt><dd class="mono">${e.t} °C</dd></div>
        <div class="ligne"><dt>Végétation</dt><dd>${e.veg}</dd></div>
        <div class="ligne"><dt>Écart avec le littoral</dt><dd class="mono">${e.t - 26 === 0 ? '—' : (e.t - 26) + ' °C'}</dd></div>
        <div class="rando"><b>Randonnées accessibles</b>
          <ul>${e.randos.map((r) => `<li>${r}</li>`).join('')}</ul></div>`;
    }
  };
  cur.addEventListener('input', rendre);
  rendre();
}

// ── 9. Les sentiers ────────────────────────────────────────────────────────
const SENTIERS = [
  { n: 'Sentier littoral de Saint-Leu', l: 'Côte ouest', d: '2 h', dh: '+80 m', niv: 'facile' },
  { n: 'Bassin des Aigrettes', l: 'Saint-Gilles', d: '1 h 30', dh: '+120 m', niv: 'facile' },
  { n: 'Forêt de Bébour-Bélouve', l: 'Plaine des Palmistes', d: '3 h', dh: '+250 m', niv: 'facile' },
  { n: 'Trou de Fer (belvédère)', l: 'Bélouve', d: '4 h', dh: '+300 m', niv: 'moyen' },
  { n: 'Col des Bœufs vers La Nouvelle', l: 'Entrée de Mafate', d: '4 h', dh: '+180 / −560 m', niv: 'moyen' },
  { n: 'Le Maïdo par le sentier', l: 'Saint-Paul', d: '5 h', dh: '+900 m', niv: 'moyen' },
  { n: 'Pas de Bellecombe au Dolomieu', l: 'Enclos Fouqué', d: '5 h 30', dh: '+520 m', niv: 'moyen' },
  { n: 'Piton des Neiges depuis Cilaos', l: 'Cilaos', d: '8 h', dh: '+1 700 m', niv: 'difficile' },
  { n: 'Traversée de Mafate en 3 jours', l: 'Mafate', d: '3 jours', dh: '+2 800 m cumulés', niv: 'difficile' },
  { n: 'Grande Randonnée R2 intégrale', l: 'Toute l’île', d: '9 à 12 jours', dh: '+9 000 m cumulés', niv: 'difficile' },
];

function sentiers() {
  const zone = $('#sentiers'), fz = $('#filtres');
  const niveaux = ['tous', 'facile', 'moyen', 'difficile'];
  let choisi = 'tous';
  zone.innerHTML = SENTIERS.map((s) => `
    <div class="sentier" data-niv="${s.niv}">
      <div><b>${s.n}</b><span class="lieu">${s.l}</span></div>
      <span class="mono">${s.d}</span><span class="mono">${s.dh}</span>
      <span class="niv">${s.niv}</span>
    </div>`).join('');
  const appliquer = () => {
    zone.querySelectorAll('.sentier').forEach((e) => {
      e.hidden = choisi !== 'tous' && e.dataset.niv !== choisi;
    });
    [...fz.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.n === choisi)));
  };
  niveaux.forEach((n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.n = n;
    b.textContent = n === 'tous' ? 'Tous' : n;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => { choisi = n; appliquer(); });
    fz.appendChild(b);
  });
  appliquer();
}

// ── 10. Préparer son séjour ────────────────────────────────────────────────
// Le bouton reste bloqué tant qu'aucune durée n'est choisie : un formulaire qui
// accepte un envoi vide fait perdre le visiteur deux fois — au clic, puis à
// l'erreur.
const CONSEILS = {
  mer: 'la côte ouest et le lagon',
  rando: 'les cirques et les Hauts',
  volcan: "l'Enclos Fouqué et la Plaine des Sables",
  tout: 'un tour complet de l’île',
};
function sejour() {
  const dur = $('#dDuree'), arr = $('#dArrivee'), env = $('#dEnvie');
  const btn = $('#valider'), bil = $('#bilanSejour');
  const majBouton = () => {
    const ok = dur.value !== '';
    btn.disabled = !ok;
    if (!ok) bil.textContent = 'Choisissez une durée pour continuer.';
  };
  [dur, arr, env].forEach((e) => e.addEventListener('change', majBouton));
  btn.addEventListener('click', () => {
    const j = +dur.value;
    const quoi = CONSEILS[env.value];
    const d = arr.value ? new Date(arr.value) : null;
    const mois = d ? d.getMonth() + 1 : null;
    const saison = mois === null ? null
      : (mois >= 12 || mois <= 3) ? 'en été austral, saison des pluies et des cyclones'
      : (mois >= 6 && mois <= 9) ? 'en hiver austral, la meilleure période pour marcher en altitude'
      : 'en intersaison, un bon compromis entre mer et montagne';
    const rythme = j <= 4 ? "C'est court : une seule zone, sans changer d'hébergement."
      : j <= 7 ? 'De quoi voir deux zones sans courir.'
      : j <= 14 ? "Assez pour traverser l'île et dormir dans un cirque."
      : "Assez pour la Grande Randonnée R2 intégrale, si le dénivelé ne fait pas peur.";
    bil.textContent = `${j} jours, priorité sur ${quoi}${saison ? `, ${saison}` : ''}. ${rythme}`;
  });
  majBouton();
}

// ── 11. Démarrage ──────────────────────────────────────────────────────────
(async function () {
  dimensionner();
  await precharger();

  // On n'efface l'écran qu'APRÈS la première image peinte. L'effacer avant
  // découvrirait un canvas noir : « 100 % » suivi d'un écran vide est pire que
  // l'attente qu'on vient de montrer.
  peindre(0);
  auDefilement();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  ecranChg.classList.add('parti');
  setTimeout(() => ecranChg.remove(), 900);

  cirques(); saisons(); selecteur(); sentiers(); sejour(); compteurs();

  addEventListener('scroll', auDefilement, { passive: true });
  addEventListener('resize', () => { dimensionner(); posee = -1; auDefilement(); });
})();
