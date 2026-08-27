// Ajoute l'axe « proximité du cash » à taches.json.
//
// Le classement suit la règle que Tony a écrite lui-même dans son backlog :
// FACTURER > VENDRE > CONSTRUIRE.
//
//   direct  — un client ou un prospect nommé est au bout. Agir dessus peut
//             produire une facture cette semaine.
//   proche  — ça sert la vente sans être facturable tel quel : vitrine,
//             client test, capture de leads, canal d'acquisition.
//   loin    — outillage interne. Utile, mais personne ne paie pour ça
//             aujourd'hui — d'où « convertible » plutôt que « inutile ».
//
// Le critère n'est PAS l'effort fourni ni la fierté du rendu. Une landing
// magnifique qui ne va vers aucun prospect nommé reste en orange.
import { readFileSync, writeFileSync } from 'node:fs';

const F = '/work/previsualisation/taches/taches.json';
const j = JSON.parse(readFileSync(F, 'utf8'));

// Motifs → niveau. Le premier motif qui matche gagne, l'ordre compte donc.
const REGLES = [
  // ── DIRECT : un prospect ou un client nommé, joignable ────────────────────
  [/quota apify/i,                'direct', 'Zéro nouveau prospect restaurant depuis 14 jours. C’est le robinet de leads qui est fermé.'],
  [/crédits openai|credits openai/i, 'direct', 'La démo que tu réclames ne peut pas aboutir tant que le compte est à zéro.'],
  [/koytcha/i,                    'direct', 'Prospect immobilier nommé. C’est la v4 qui s’envoie — la v2 avait été refusée, ne jamais repointer dessus.'],
  [/the grill/i,                  'direct', 'Prospect resto. La vidéo est prête, la relance n’est jamais partie.'],
  [/family arena/i,               'direct', 'Dossier complet, concurrents VR fermés. Site + vidéo prêts à montrer.'],
  [/8 sites clients|villa fleurie|boutons remis/i, 'direct', 'Huit commerces déjà destinataires d’un site. Chacun a maintenant une raison concrète d’être rappelé.'],
  [/sites clients — galerie|suivi d.appels/i, 'direct', 'C’est l’outil de relance lui-même : qui a été appelé, qui ne l’a pas été.'],
  [/kripia/i,                     'direct', 'Tu as écrit toi-même « vendre le clip ou la méthode ». C’est une offre, pas un rendu.'],
  [/gite-matilona/i,              'direct', 'Site remis en ligne le 25/08. Le rappeler maintenant a une raison concrète.'],
  [/landing automatisationboost|landing avec ton visage/i, 'direct', 'Ta vitrine de vente. C’est la page où atterrissent les prospects.'],

  // ── PROCHE : ça sert la vente, sans facture au bout ───────────────────────
  [/befresh/i,                    'proche', 'Client test — c’est ta vitrine pour vendre aux autres restaurants.'],
  [/formation/i,                  'proche', 'Produit à vendre. Il lui manque encore son chemin d’achat.'],
  [/ressource|calculateur|mot-clé et porte/i, 'proche', 'Capture de leads. Ça alimente la liste, ça ne facture pas.'],
  [/linkedin/i,                   'proche', 'Canal d’acquisition. LinkedIn est le seul des cinq où rien ne part.'],
  [/prompt-reveal|journal ia|carrousel|split-screen|top 3|clip roule kiki|chanson|essai ego|time-lapse|hado/i,
                                  'proche', 'Contenu social : ça construit l’audience qui fournit les prospects.'],
  [/voix befresh|feed instagram/i,'proche', 'Client test, même logique que le reste de BeFresh.'],

  // ── LOIN : outillage. Convertible, mais personne ne paie pour ça aujourd’hui.
  [/agenttube|videoboost 100|dépôt public|cron-watchdog|routines cloud|reel-tempo-match/i,
                                  'loin',   'Outillage interne. Convertible en offre, mais rien à facturer en l’état.'],
  [/échantillon vocal|wavespeed|lip-sync/i, 'loin', 'Prérequis technique. Ça débloque de la production, pas une vente.'],
];

const classer = (t) => {
  for (const [re, niveau, pourquoi] of REGLES) if (re.test(t)) return { niveau, pourquoi };
  return { niveau: 'loin', pourquoi: 'Non rattaché à un prospect ni à un canal d’acquisition.' };
};

const compte = { direct: 0, proche: 0, loin: 0 };
j.taches.forEach((t) => {
  const { niveau, pourquoi } = classer(t.t);
  t.cash = niveau;
  t.cashNote = pourquoi;
  compte[niveau]++;
});

/* La date etait ECRITE EN DUR : le fichier se declarait a jour au 24 aout quel que
   soit le jour ou on le regenerait, alors que sa propre note promet « mis a jour
   chaque jour ». Trois jours de travail etaient invisibles. */
j.maj = new Date().toISOString().slice(0, 10);
writeFileSync(F, JSON.stringify(j, null, 2) + '\n');

console.log(`  ${j.taches.length} tâches classées`);
console.log(`  direct ${compte.direct} · proche ${compte.proche} · loin ${compte.loin}`);
console.log('\n  === les tâches cash (rouge) ===');
j.taches.filter((t) => t.cash === 'direct').forEach((t) => console.log(`   [${t.etat.padEnd(7)}] ${t.t}`));
