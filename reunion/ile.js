// La Réunion en relief — terrain réel, survol au scroll, guidé par un oiseau.
//
// Le terrain n'est pas modelé à la main ni généré par bruit : c'est un maillage
// déplacé par une carte d'altitudes décodée depuis des tuiles d'élévation
// ouvertes. Les trois cirques, les remparts et l'Enclos Fouqué sont donc au bon
// endroit, à la bonne profondeur — c'est ce qui fait la différence entre une
// île et une forme.
import * as THREE from 'three';

const T = await (await fetch('assets/terrain.json')).json();

// ── Repères géographiques réels ────────────────────────────────────────────
// Coordonnées publiques. Elles servent à poser la caméra ET à calculer les
// distances de l'itinéraire : le même jeu de données pour l'image et pour
// le calcul, sinon les deux divergent.
//
// `alt` = altitude PUBLIÉE, quand elle existe et qu'elle est vérifiable.
//
// La carte d'altitudes est excellente pour la forme du relief, mais elle lit un
// pixel : sur une pointe étroite comme un sommet, ce pixel moyenne les pentes
// voisines et sous-estime. Elle donnait 2 954 m au Piton des Neiges — pendant
// que l'en-tête du site affichait 3 070 m. Deux chiffres contradictoires pour
// le même sommet sur la même page.
//
// Les cirques n'ont volontairement PAS d'`alt` : un cirque n'a pas une altitude
// unique, et les valeurs publiées appartiennent à leurs villages (Hell-Bourg
// 930 m, Cilaos 1 214 m) qui ne sont pas au point de passage. Pour eux la
// lecture du relief est honnête — elle est affichée avec « ≈ ».
const LIEUX = {
  stDenis:   { nom: 'Saint-Denis',            lat: -20.8789, lon: 55.4481 },
  salazie:   { nom: 'Cirque de Salazie',      lat: -21.0653, lon: 55.5203 },
  neiges:    { nom: 'Piton des Neiges',       lat: -21.0958, lon: 55.4783, alt: 3070 },
  mafate:    { nom: 'Cirque de Mafate',       lat: -21.0292, lon: 55.4136 },
  cilaos:    { nom: 'Cirque de Cilaos',       lat: -21.1350, lon: 55.4714 },
  fournaise: { nom: 'Piton de la Fournaise',  lat: -21.2444, lon: 55.7089, alt: 2632 },
  lagon:     { nom: "Lagon de l'Ermitage",    lat: -21.0783, lon: 55.2222 },
  stPierre:  { nom: 'Saint-Pierre',           lat: -21.3393, lon: 55.4781 },
};

// ── Le terrain ─────────────────────────────────────────────────────────────
const TAILLE = 200;                       // largeur du monde, en unités de scène
const RATIO = T.hauteur / T.largeur;
const RELIEF = 26;                        // exagération verticale
// Sans exagération, l'île serait presque plate : 3 km de relief pour 60 km de
// large, soit 5 % de pente moyenne. Vue de haut, ça ne se lit pas. Le facteur
// est assumé et constant — c'est une carte en relief, pas un fac-similé.

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050a14, 0.0045);

const cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.5, 900);
const rendu = new THREE.WebGLRenderer({ antialias: true, alpha: false });
rendu.setSize(innerWidth, innerHeight);
rendu.setPixelRatio(Math.min(devicePixelRatio, 2));
rendu.shadowMap.enabled = false;
document.getElementById('scene').appendChild(rendu.domElement);

// Conversion coordonnées → position dans la scène, via les bornes du terrain.
const versScene = (lat, lon) => {
  const u = (lon - T.ouest) / (T.est - T.ouest);
  const v = (lat - T.nord) / (T.sud - T.nord);
  return { x: (u - 0.5) * TAILLE, z: (v - 0.5) * TAILLE * RATIO, u, v };
};

// Lecture de l'altitude dans la carte de hauteurs, pour poser l'oiseau et
// calculer les dénivelés.
let hauteurs = null, hW = 0, hH = 0;
const altitudeA = (u, v) => {
  if (!hauteurs) return 0;
  const x = Math.max(0, Math.min(hW - 1, Math.round(u * hW)));
  const y = Math.max(0, Math.min(hH - 1, Math.round(v * hH)));
  return (hauteurs[(y * hW + x) * 4] / 255) * T.altitudeMax;
};

const img = new Image();
img.src = 'assets/hauteurs.png';
await img.decode();
hW = img.width; hH = img.height;
{
  const c = document.createElement('canvas');
  c.width = hW; c.height = hH;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  hauteurs = cx.getImageData(0, 0, hW, hH).data;
}

// Maillage : une résolution par axe proportionnelle à l'image, plafonnée.
// 512 segments = 263 000 sommets, c'est le point où le détail des ravines
// apparaît sans que le mobile ne décroche.
const SEG = 512;
const geo = new THREE.PlaneGeometry(TAILLE, TAILLE * RATIO, SEG, Math.round(SEG * RATIO));
geo.rotateX(-Math.PI / 2);
const pos = geo.attributes.position;
const couleurs = new Float32Array(pos.count * 3);

const OCEAN = new THREE.Color(0x0d2137);
const SABLE = new THREE.Color(0xcbb894);
const VERT = new THREE.Color(0x2f4a35);
const HAUT = new THREE.Color(0x6b6355);
const ROCHE = new THREE.Color(0xa89c8c);

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), z = pos.getZ(i);
  const u = x / TAILLE + 0.5;
  const v = z / (TAILLE * RATIO) + 0.5;
  const a = altitudeA(u, v);
  pos.setY(i, (a / T.altitudeMax) * RELIEF);

  // La couleur suit l'altitude, comme une carte physique. Le littoral garde
  // une frange sableuse : sans elle, la terre touche l'eau sans transition et
  // l'île paraît découpée aux ciseaux.
  const c = new THREE.Color();
  if (a < 1) c.copy(OCEAN);
  else if (a < 60) c.copy(OCEAN).lerp(SABLE, a / 60);
  else if (a < 900) c.copy(SABLE).lerp(VERT, (a - 60) / 840);
  else if (a < 2100) c.copy(VERT).lerp(HAUT, (a - 900) / 1200);
  else c.copy(HAUT).lerp(ROCHE, Math.min(1, (a - 2100) / 900));
  couleurs[i * 3] = c.r; couleurs[i * 3 + 1] = c.g; couleurs[i * 3 + 2] = c.b;
}
geo.setAttribute('color', new THREE.BufferAttribute(couleurs, 3));
geo.computeVertexNormals();

const ile = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.94, metalness: 0.02, flatShading: false,
}));
scene.add(ile);

// L'océan : un plan simple, à peine sous le zéro pour éviter le z-fighting
// avec le littoral du maillage.
const mer = new THREE.Mesh(
  new THREE.PlaneGeometry(TAILLE * 3, TAILLE * 3),
  new THREE.MeshStandardMaterial({ color: 0x08182c, roughness: 0.28, metalness: 0.5 }),
);
mer.rotation.x = -Math.PI / 2;
mer.position.y = -0.06;
scene.add(mer);

// ── Lumière ────────────────────────────────────────────────────────────────
// Rasante, venue de l'est : c'est elle qui creuse les remparts. Une lumière
// zénithale aplatirait les cirques et l'île perdrait tout son relief.
const soleil = new THREE.DirectionalLight(0xffd9a8, 2.5);
soleil.position.set(90, 48, -34);
scene.add(soleil);
scene.add(new THREE.HemisphereLight(0x9fc4e8, 0x1a1614, 0.85));
scene.add(new THREE.AmbientLight(0x223449, 0.5));

// ── Le paille-en-queue ─────────────────────────────────────────────────────
// L'oiseau emblème de l'île. Ce qui le rend reconnaissable n'est ni sa taille
// ni sa couleur — c'est la paire de longues rectrices qui traîne derrière lui,
// presque aussi longue que son corps. Un oiseau blanc sans elles ne serait
// qu'une mouette.
const blanc = new THREE.MeshStandardMaterial({
  color: 0xf7f9fb, roughness: 0.5, emissive: 0x223142, emissiveIntensity: 0.35,
});
const noir = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.6 });
const bec = new THREE.MeshStandardMaterial({ color: 0xf0a83c, roughness: 0.45 });

function faireOiseau() {
  const g = new THREE.Group();

  const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.30, 0.85, 4, 12), blanc);
  corps.rotation.z = Math.PI / 2;
  g.add(corps);

  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), blanc);
  tete.position.x = 0.72;
  g.add(tete);

  const b = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 8), bec);
  b.rotation.z = -Math.PI / 2;
  b.position.x = 1.06;
  g.add(b);

  // Le trait noir autour de l'œil, marque de l'espèce.
  [-1, 1].forEach((s) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.055, 0.04), noir);
    t.position.set(0.78, 0.06, s * 0.19);
    g.add(t);
  });

  // Les ailes. Longues, étroites, portées loin en arrière — le paille-en-queue
  // plane plus qu'il ne bat.
  //
  // Chaque aile vit dans un PIVOT placé à l'épaule. Sans ce pivot, faire
  // battre l'aile revient à la faire tourner sur son propre centre, ce qui la
  // fait disparaître par la tranche au lieu de la lever. Le battement est une
  // rotation autour de l'axe du corps (X), pas autour de la verticale.
  const ailes = [];
  [-1, 1].forEach((s) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.05, 0.10, s * 0.20);
    // Diedre : les ailes sont portees legerement relevees, jamais dans le plan
    // horizontal. Une aile plate vue par la tranche disparait — c est ce que
    // montraient les trois premiers rendus, ou l oiseau n avait pas d ailes.
    pivot.userData.diedre = s * 0.30;
    pivot.rotation.x = pivot.userData.diedre;

    const forme = new THREE.Shape();
    forme.moveTo(0, 0);
    forme.quadraticCurveTo(0.35, 0.28, 1.15, 0.30);   // bord d'attaque
    forme.quadraticCurveTo(2.15, 0.24, 2.55, 0.02);   // vers la pointe
    forme.quadraticCurveTo(1.70, -0.30, 0.80, -0.34); // bord de fuite
    forme.quadraticCurveTo(0.30, -0.30, 0, 0);

    // ExtrudeGeometry et non ShapeGeometry : quatre cadrages successifs ont
    // montre qu une surface plate se reduit a un trait des que la camera
    // passe dans son plan. Quatre centiemes d epaisseur suffisent a lui
    // rendre un volume, et donc une ombre.
    const a = new THREE.Mesh(new THREE.ExtrudeGeometry(forme,
      { depth: 0.045, bevelEnabled: true, bevelThickness: 0.012,
        bevelSize: 0.018, bevelSegments: 2, curveSegments: 14 }), blanc.clone());
    a.material.side = THREE.DoubleSide;
    a.rotation.x = -Math.PI / 2;      // à plat, vue de dessus
    a.scale.y = s;                    // miroir pour l'aile opposée
    pivot.add(a);

    // La pointe noire, marque de l'espèce, posée au bout du bord d'attaque.
    const p = new THREE.Mesh(new THREE.ExtrudeGeometry((() => {
      const f = new THREE.Shape();
      f.moveTo(1.95, 0.26); f.quadraticCurveTo(2.4, 0.16, 2.55, 0.02);
      f.quadraticCurveTo(2.2, -0.08, 1.90, 0.02); f.lineTo(1.95, 0.26);
      return f;
    })(), { depth: 0.05, bevelEnabled: false, curveSegments: 8 }), noir.clone());
    p.material.side = THREE.DoubleSide;
    p.rotation.x = -Math.PI / 2;
    p.scale.y = s;
    p.position.y = 0.006;
    pivot.add(p);

    g.add(pivot);
    ailes.push(pivot);
  });

  // LES DEUX RECTRICES. C'est elles qui font l'oiseau : deux filets blancs
  // qui traînent derrière, presque aussi longs que le corps. Sans elles, ce
  // n'est plus un paille-en-queue, c'est une mouette.
  const queues = [];
  [-1, 1].forEach((s) => {
    const q = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 2.6, 3, 6), blanc);
    q.rotation.z = Math.PI / 2;
    q.position.set(-1.85, 0, s * 0.045);
    g.add(q);
    queues.push(q);
  });

  g.userData = { ailes, queues };
  return g;
}

const oiseau = faireOiseau();
// Reduit : a l echelle 1 il occupait un tiers du cadre et volait la vedette
// au paysage, qui est le sujet.
oiseau.scale.setScalar(0.58);
scene.add(oiseau);

// ── La trajectoire ─────────────────────────────────────────────────────────
// Elle passe par des lieux RÉELS, dans l'ordre du récit : on arrive par le
// nord, on remonte les cirques, on touche le sommet, on bascule sur le volcan,
// on redescend au lagon. L'altitude de vol suit le terrain sous l'oiseau.
const ETAPES = [
  { l: LIEUX.stDenis,   h: 34, r: 3.2 },
  { l: LIEUX.salazie,   h: 20, r: 2.0 },
  { l: LIEUX.mafate,    h: 17, r: 1.7 },
  { l: LIEUX.neiges,    h: 15, r: 1.3 },
  { l: LIEUX.cilaos,    h: 17, r: 1.7 },
  { l: LIEUX.fournaise, h: 19, r: 1.9 },
  { l: LIEUX.lagon,     h: 26, r: 2.6 },
];

const points = ETAPES.map((e) => {
  const p = versScene(e.l.lat, e.l.lon);
  const solM = altitudeA(p.u, p.v);
  return new THREE.Vector3(p.x, (solM / T.altitudeMax) * RELIEF + e.h, p.z);
});
const route = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35);

// ── Où poser l'oiseau dans le cadre ────────────────────────────────────────
// Renvoie une position en fraction d'écran depuis le centre : fx = 1 au bord
// droit, fy = 1 en haut. On la déduit du panneau visible, parce qu'un décalage
// fixe finit toujours par tomber sur un panneau qu'on n'avait pas prévu.
const DIST_OISEAU = 17;

function posteVoulu() {
  const W = innerWidth, H = innerHeight;
  let bord = 0, haut = H;
  document.querySelectorAll('.bloc, .outil').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < H * 0.12 || r.top > H * 0.88) return;   // hors du champ
    bord = Math.max(bord, r.right);
    haut = Math.min(haut, r.top);
  });
  if (!bord) return { fx: 0.44, fy: 0.24 };

  // S'il reste une vraie marge à droite du panneau, l'oiseau y vole.
  if ((W - bord) / W > 0.17) {
    const f = (bord - W / 2) / (W / 2);
    return { fx: Math.min(0.80, f + 0.22), fy: 0.24 };
  }
  // Sinon — panneau pleine largeur, cas du mobile — il passe AU-DESSUS.
  return { fx: 0.14, fy: Math.min(0.72, (H / 2 - haut) / (H / 2) + 0.14) };
}

// Lissage : la place disponible change d'un coup au passage d'une section à
// l'autre. Sans interpolation l'oiseau se téléporterait d'un bord à l'autre.
let poste = { fx: 0.44, fy: 0.24 };
function posteLisse() {
  const v = posteVoulu();
  poste.fx += (v.fx - poste.fx) * 0.06;
  poste.fy += (v.fy - poste.fy) * 0.06;
  return poste;
}

// La caméra suit l'oiseau de biais et légèrement au-dessus, jamais dans son
// axe : de face on ne verrait pas les rectrices, qui sont tout le sujet.
let tCourant = 0;
function placer(t) {
  tCourant = t;
  const p = route.getPointAt(Math.max(0, Math.min(1, t)));
  const suivant = route.getPointAt(Math.max(0, Math.min(1, t + 0.008)));

  // L'OISEAU SE PLACE PAR RAPPORT À LA CAMÉRA, et non l'inverse.
  //
  // Trois cadrages successifs ont échoué en plaçant la caméra derrière
  // l'oiseau : selon la direction du vol il remplissait l'écran, passait de
  // face, ou sortait par le bas. Ici la caméra suit la trajectoire et l'oiseau
  // se pose à une position fixe dans son champ — il occupe donc toujours le
  // même coin de l'image, quelle que soit la direction.
  oiseau.position.copy(p);
  oiseau.lookAt(suivant);
  // Roulis dans les virages, comme un oiseau qui s'incline pour tourner.
  const avant = route.getPointAt(Math.max(0, Math.min(1, t - 0.008)));
  const virage = new THREE.Vector3().subVectors(suivant, p).normalize()
    .cross(new THREE.Vector3().subVectors(p, avant).normalize()).y;
  oiseau.rotateZ(-virage * 9);

  // La caméra se place DANS LE REPÈRE DE L'OISEAU : en arrière le long de sa
  // trajectoire, décalée sur son flanc, et au-dessus. Un décalage exprimé en
  // coordonnées du monde — ce que faisait la première version — change de sens
  // selon la direction du vol : au nord la caméra suivait, au sud elle passait
  // devant et on regardait l'oiseau de face, sans voir ni ailes ni rectrices.
  const avantV = new THREE.Vector3().subVectors(suivant, p).normalize();
  const cote = new THREE.Vector3().crossVectors(avantV, new THREE.Vector3(0, 1, 0)).normalize();
  const HAUT_V = new THREE.Vector3(0, 1, 0);

  // 1. La camera suit la trajectoire, en retrait et en hauteur.
  cam.position.copy(p).addScaledVector(avantV, -20)
     .addScaledVector(cote, 7).addScaledVector(HAUT_V, 8);
  const vise = new THREE.Vector3().copy(p).addScaledVector(avantV, 10);
  cam.lookAt(vise);

  // 2. L oiseau se pose ENSUITE dans le champ de la camera, a la place que lui
  //    laisse le panneau REELLEMENT affiche — mesuree, pas supposee.
  //
  //    La version precedente le posait a un decalage fixe, en partant du
  //    principe que les blocs alternent gauche/droite sans jamais occuper le
  //    centre. Vrai pour les blocs narratifs (520 px, alignes sur un bord),
  //    faux pour le panneau d itineraire : centre et large, il recevait
  //    l oiseau en plein sur son titre.
  const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
  const droite = new THREE.Vector3().crossVectors(dir, HAUT_V).normalize();
  const { fx, fy } = posteLisse();
  // Conversion fraction d ecran → unites de scene, a la distance de vol.
  const demiH = DIST_OISEAU * Math.tan((cam.fov * Math.PI / 180) / 2);
  const demiL = demiH * cam.aspect;
  oiseau.position.copy(cam.position)
    .addScaledVector(dir, DIST_OISEAU)
    .addScaledVector(droite, fx * demiL)
    .addScaledVector(HAUT_V, fy * demiH);
  oiseau.lookAt(new THREE.Vector3().copy(oiseau.position).add(avantV));
}
placer(0);

// ── Le battement ───────────────────────────────────────────────────────────
let t0 = performance.now();
function animer() {
  const t = (performance.now() - t0) / 1000;
  const { ailes, queues } = oiseau.userData;
  // Plané, avec un battement lent et irrégulier. Un battement régulier et
  // rapide ferait mécanique — cet oiseau-là plane.
  const bat = Math.sin(t * 2.1) * 0.30 + Math.sin(t * 0.7) * 0.08;
  // Rotation autour de X : l'aile se LÈVE. Autour de Y, elle balayait vers
  // l'avant et disparaissait par la tranche — c'est ce que montrait le
  // premier rendu, où l'oiseau ressemblait à une fléchette.
  ailes.forEach((a) => { a.rotation.x = a.userData.diedre + Math.sign(a.userData.diedre) * bat; });
  // Les rectrices ondulent avec un retard : c'est ce décalage qui donne
  // l'impression qu'elles traînent au lieu d'être rigides.
  queues.forEach((q, i) => {
    q.rotation.y = Math.sin(t * 1.7 - 0.9) * 0.10 * (i === 0 ? 1 : -1);
    q.rotation.x = Math.sin(t * 1.3 - 0.5) * 0.05;
  });
  // Replacer à chaque image, et non au seul défilement : c'est le lissage de
  // `posteLisse` qui l'exige. Rattaché au scroll, il se figerait en cours de
  // trajet dès qu'on arrête de défiler — l'oiseau resterait à mi-chemin entre
  // deux postes, c'est-à-dire pile sur le panneau qu'il doit éviter.
  placer(tCourant);
  rendu.render(scene, cam);
  requestAnimationFrame(animer);
}
animer();

// ── Le scroll pilote le vol ────────────────────────────────────────────────
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const jauge = document.getElementById('jauge');
const survol = { t: 0 };

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.to(survol, {
    t: 1, ease: 'none',
    scrollTrigger: {
      trigger: '.fil', start: 'top top', end: 'bottom bottom',
      scrub: reduit ? true : 1.1,
      onUpdate: (s) => { jauge.style.width = (s.progress * 100).toFixed(1) + '%'; },
    },
    onUpdate: () => placer(survol.t),
  });
  gsap.utils.toArray('.bloc').forEach((b) => {
    gsap.from(b, {
      opacity: 0, y: 34, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: b, start: 'top 82%' },
    });
  });
} else {
  // Sans GSAP, le survol reste piloté au scroll — dégradé, mais pas cassé.
  addEventListener('scroll', () => {
    const p = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
    placer(p); jauge.style.width = (p * 100).toFixed(1) + '%';
  }, { passive: true });
}

addEventListener('resize', () => {
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
  rendu.setSize(innerWidth, innerHeight);
});

// ── L'outil : composer sa traversée ────────────────────────────────────────
// Le relief cesse d'être un décor : les distances et les dénivelés sortent de
// la MÊME carte d'altitudes que le terrain survolé.
const ENVIES = [
  { id: 'volcan',  nom: 'Le volcan',      etapes: ['stDenis', 'fournaise', 'stPierre'] },
  { id: 'cirques', nom: 'Les cirques',    etapes: ['stDenis', 'salazie', 'mafate', 'cilaos'] },
  { id: 'sommet',  nom: 'Le sommet',      etapes: ['cilaos', 'neiges'] },
  { id: 'lagon',   nom: 'Le lagon',       etapes: ['stPierre', 'lagon'] },
  { id: 'traverse',nom: "Traverser l'île", etapes: ['stDenis', 'salazie', 'neiges', 'cilaos', 'stPierre'] },
];

// Distance à vol d'oiseau, formule de haversine. Rayon terrestre 6 371 km.
function distanceKm(a, b) {
  const R = 6371, r = (d) => d * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// L'altitude publiée l'emporte sur la lecture du relief quand elle existe.
const altitudeDe = (l) => {
  if (l.alt != null) return l.alt;
  const p = versScene(l.lat, l.lon);
  return Math.round(altitudeA(p.u, p.v));
};

const choisies = new Set();
const zoneEnvies = document.getElementById('envies');
const zoneResultat = document.getElementById('resultat');

ENVIES.forEach((e) => {
  const b = document.createElement('button');
  b.className = 'envie'; b.textContent = e.nom;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => {
    choisies.has(e.id) ? choisies.delete(e.id) : choisies.add(e.id);
    b.setAttribute('aria-pressed', String(choisies.has(e.id)));
    dessiner();
  });
  zoneEnvies.appendChild(b);
});

function dessiner() {
  if (!choisies.size) {
    zoneResultat.innerHTML = '<p class="vide">Choisissez au moins une envie ci-dessus.</p>';
    return;
  }
  // On assemble les étapes sans doublon, dans l'ordre où elles apparaissent.
  const suite = [];
  ENVIES.filter((e) => choisies.has(e.id)).forEach((e) => {
    e.etapes.forEach((k) => { if (!suite.includes(k)) suite.push(k); });
  });

  let km = 0, montee = 0;
  const lignes = suite.map((k, i) => {
    const l = LIEUX[k];
    const a = altitudeDe(l);
    let ecart = '';
    if (i > 0) {
      const p = LIEUX[suite[i - 1]];
      const d = distanceKm(p, l);
      km += d;
      const dh = a - altitudeDe(p);
      if (dh > 0) montee += dh;
      ecart = `${d.toFixed(0)} km · ${dh >= 0 ? '+' : ''}${dh} m`;
    }
    return `<div class="etape"><i>${String(i + 1).padStart(2, '0')}</i>`
      + `<div><b>${l.nom}</b><em>${l.alt != null ? '' : '≈ '}${a} m d'altitude</em></div>`
      + `<span>${ecart}</span></div>`;
  }).join('');

  zoneResultat.innerHTML = lignes
    + `<div class="bilan">
         <div><b>${km.toFixed(0)} km</b><span>à vol d'oiseau</span></div>
         <div><b>+${montee} m</b><span>de dénivelé cumulé</span></div>
         <div><b>${suite.length}</b><span>étapes</span></div>
       </div>
       <p class="vide">Distances à vol d'oiseau. Altitudes publiées pour les sommets,
       lues sur le relief (≈) ailleurs. Par la route, comptez nettement plus :
       ici, rien ne va jamais tout droit.</p>`;
}
dessiner();

// ── La réserve de bas de page ──────────────────────────────────────────────
// La mention légale est en position fixe : elle recouvre le contenu si les
// sections ne lui gardent pas de place. Sa hauteur dépend de la largeur (le
// texte passe sur une à trois lignes), donc on la mesure au lieu de la fixer.
function mesurerBarre() {
  const n = document.querySelector('.note');
  if (n) document.documentElement.style.setProperty('--barre', n.offsetHeight + 'px');
}
mesurerBarre();
addEventListener('resize', mesurerBarre);

