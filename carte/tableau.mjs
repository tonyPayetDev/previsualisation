#!/usr/bin/env node
/*
 * tableau.mjs — fabrique carte/tableau.json, la matière de la nouvelle carte.
 *
 * Règle unique, héritée de taches/build.mjs : « un tableau de bord faux est
 * pire que pas de tableau de bord ». Donc AUCUN chiffre n'est inventé ici.
 * Chaque compteur porte sa source, et ce qui n'est mesuré nulle part sort
 * avec `mesure:false` — la page l'affiche alors « pas encore mesuré » au lieu
 * d'un zéro, parce qu'un zéro non mesuré se lit comme un zéro mesuré.
 *
 *   node carte/tableau.mjs
 *
 * Les seules données qui viennent de Tony et non d'une mesure (ses objectifs
 * de la semaine, son plan de journée) ne sont PAS ici : elles vivent dans le
 * magasin n8n partagé, écrites depuis la page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const lire = (p) => { try { return JSON.parse(fs.readFileSync(path.join(RACINE, p), 'utf8')); } catch { return null; } };

const sources = [];
const note = (f, ok, quoi) => sources.push({ fichier: f, ok: !!ok, quoi });

/* ── Les chantiers ──────────────────────────────────────────────────────── */
const t = lire('taches/taches.json');
note('taches/taches.json', t, 'les chantiers et les décisions en attente');
const taches = (t && t.taches) || [];
const parEtat = {};
taches.forEach((x) => { parEtat[x.etat] = (parEtat[x.etat] || 0) + 1; });
const livres = parEtat.livre || 0;

/* L'axe « cash » est déjà porté par chaque chantier. On le garde tel quel :
   c'est le seul classement que Tony a lui-même posé sur son travail. */
const parCash = {};
taches.forEach((x) => { const c = x.cash || 'non-classe'; parCash[c] = (parCash[c] || 0) + 1; });
const bloquesDirects = taches.filter((x) => x.cash === 'direct' && (x.etat === 'bloque' || x.etat === 'attente'));

/* ── Les appels ─────────────────────────────────────────────────────────── */
const a = lire('appels/resultats.json');
note('appels/resultats.json', a, 'les appels passés et leur suite');
const appels = (a && a.appels) || {};
const clesAppels = Object.keys(appels);
const repondu = clesAppels.filter((k) => appels[k] && appels[k].etat === 'repondu').length;
const aRappeler = clesAppels.filter((k) => appels[k] && appels[k].etat === 'rappeler').length;
const chauds = clesAppels.filter((k) => appels[k] && appels[k].chaud);

/* ── Les prospects ──────────────────────────────────────────────────────── */
const q = lire('leads-qualifies/qualifies.json');
const l = lire('leads-restaurants/leads.json');
note('leads-qualifies/qualifies.json', q, 'les prospects qualifiés');
note('leads-restaurants/leads.json', l, 'la liste large des restaurants');
const qualifies = Array.isArray(q) ? q.length : 0;
const restos = Array.isArray(l) ? l.length : 0;
const restosAvecMail = Array.isArray(l) ? l.filter((x) => x && x.mail).length : 0;

/* ── Les démos envoyées ─────────────────────────────────────────────────────
   Ces quatre chiffres sont le relevé du 10/09, lu dans la table n8n
   SuiviDemoResto le 24/09. Ils sont écrits en dur ET datés : la page n'a pas
   de clé d'API pour interroger n8n, et je préfère un chiffre daté à un
   chiffre frais que personne ne peut vérifier. */
const demos = {
  envoyees: 10, ouvertes: 1, videosVues: 0, clics: 0, reponses: 1, rdv: 0,
  releve: '2026-09-24', source: 'table n8n SuiviDemoResto',
};

/* ── Le goulot ──────────────────────────────────────────────────────────────
   Calculé, jamais écrit à la main : on cherche la PREMIÈRE marche de
   l'escalier où presque tout le monde tombe. Si on l'écrivait à la main,
   il resterait vrai une semaine puis deviendrait un mensonge affiché. */
const etapes = [
  { cle: 'liste',    nom: 'Avoir des noms',        n: qualifies + restosAvecMail, quoi: 'prospects joignables par écrit' },
  { cle: 'envoi',    nom: 'Envoyer',               n: demos.envoyees,             quoi: 'démos parties' },
  { cle: 'ouvert',   nom: 'Se faire ouvrir',       n: demos.ouvertes,             quoi: 'pages ouvertes' },
  { cle: 'clic',     nom: 'Se faire cliquer',      n: demos.clics,                quoi: 'clics sur « tester »' },
  { cle: 'rdv',      nom: 'Obtenir un rendez-vous', n: demos.rdv,                 quoi: 'rendez-vous' },
];
/* Deux garde-fous, tous deux payés sur le premier jet :
   1. PLANCHER DE VOLUME. Sans lui, « 1 page ouverte → 0 clic » sort en tête
      avec 100 % de perte et désigne le clic comme le goulot — alors que le
      vrai trou est 30 marches plus haut : 101 prospects joignables pour 10
      envois. Une marche ne se juge pas sur un effectif de 1.
   2. À PERTE ÉGALE, LA MARCHE LA PLUS BASSE GAGNE. Réparer une marche haute
      pendant qu'une marche basse fuit ne change rien au débit. */
const MINI = 5;
let goulot = null;
for (let i = 1; i < etapes.length; i++) {
  const av = etapes[i - 1].n, ap = etapes[i].n;
  if (!av || av < MINI) continue;
  const perte = 1 - ap / av;
  if (!goulot || perte > goulot.perte + 0.05) {
    goulot = { perte, etape: etapes[i].cle, nom: etapes[i].nom, avant: av, apres: ap, quoi: etapes[i].quoi };
  }
}
/* Le titre et la phrase sont déduits de l'étape qui perd le plus — pas d'un
   texte figé qui survivrait à son propre constat. */
const PHRASES = {
  envoi:  { titre: 'Envoyer',            sous: 'Tu as des noms, ils ne reçoivent rien.' },
  ouvert: { titre: 'Se faire ouvrir',    sous: "Ils reçoivent, ils n'ouvrent pas. C'est le message ou le canal, pas le produit." },
  clic:   { titre: 'Se faire cliquer',   sous: "Ils regardent, ils ne bougent pas. C'est ce qu'on leur demande de faire." },
  rdv:    { titre: 'Décrocher un rendez-vous', sous: 'Ils cliquent, ça ne va pas jusqu\'à la conversation.' },
};

/* ── Les automatisations ────────────────────────────────────────────────── */
const c = lire('carte/cerveau.json');
note('carte/cerveau.json', c, 'les automatisations et leur date de relevé');
const wf = (c && c.sujets && c.sujets.workflows && c.sujets.workflows.chiffres) || null;

const sortie = {
  genere_le: new Date().toISOString(),
  sources,

  goulot: goulot ? {
    ...goulot,
    titre: (PHRASES[goulot.etape] || {}).titre || goulot.nom,
    sous: (PHRASES[goulot.etape] || {}).sous || '',
    pourcent: Math.round((1 - goulot.apres / goulot.avant) * 100),
  } : null,

  /* Le tunnel commercial. `mesure:false` = personne ne compte ça aujourd'hui.
     Ces deux-là se saisissent à la main sur la page. */
  tunnel: [
    { nom: 'Prospects joignables', n: qualifies + restosAvecMail, mesure: true,
      detail: `${qualifies} qualifiés + ${restosAvecMail} restaurants avec email` },
    { nom: 'Appels passés',        n: clesAppels.length, mesure: true,
      detail: `${repondu} ont répondu · ${aRappeler} à rappeler` },
    { nom: 'Démos envoyées',       n: demos.envoyees, mesure: true,
      detail: `relevé du ${demos.releve}` },
    { nom: 'Pages ouvertes',       n: demos.ouvertes, mesure: true,
      detail: `sur ${demos.envoyees} envois` },
    { nom: 'Clics',                n: demos.clics, mesure: true,
      detail: 'aucun clic sur « tester »' },
    { nom: 'Rendez-vous',          n: null, mesure: false, saisie: 'rdv',
      detail: 'aucune source ne le compte — à saisir' },
    { nom: 'Ventes',               n: null, mesure: false, saisie: 'ventes',
      detail: 'aucune source ne le compte — à saisir' },
  ],

  chantiers: {
    total: taches.length, livres,
    parEtat,
    parCash,
    pourcent: taches.length ? Math.round(livres / taches.length * 100) : 0,
    bloquesDirects: bloquesDirects.slice(0, 6).map((x) => ({ t: x.t, etat: x.etat, lien: x.lien || null })),
    nbBloquesDirects: bloquesDirects.length,
  },

  decisions: (t && Array.isArray(t.aToi) ? t.aToi : []).map((x) => (typeof x === 'string' ? { t: x } : x)),

  appelsChauds: chauds.map((k) => ({ qui: k, dit: appels[k].dit || '', suite: appels[k].suite || '' })),

  automatisations: wf ? { ...wf, releve: (c && c.genere_le) || null } : null,

  demos,
};

const OUT = path.join(ICI, 'tableau.json');
fs.writeFileSync(OUT, JSON.stringify(sortie, null, 1));
console.log(`carte/tableau.json écrit · ${taches.length} chantiers · ${clesAppels.length} appels · goulot : ${sortie.goulot ? sortie.goulot.titre : 'indéterminé'}`);
for (const s of sources) if (!s.ok) console.log(`  ⚠ source absente : ${s.fichier} (${s.quoi})`);
