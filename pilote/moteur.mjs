// Moteur de planification du Task Pilot — déterministe, sans IA, testable seul (moteur.test.mjs).
//
// Règles du cahier des charges (§3 et §11), dans cet ordre :
//  1. les tâches terminées / annulées ne bougent jamais ;
//  2. les placements manuels (verrou) sont conservés et comptent dans la charge du jour ;
//  3. les échéances sont respectées : une tâche ne va jamais après son échéance ;
//  4. les dépendances : une tâche passe après celles dont elle dépend ;
//  5. les tâches prioritaires prennent les premières places dans le temps disponible ;
//  6. on ne dépasse JAMAIS la capacité en silence : ce qui ne rentre pas reste au parking, avec la raison.
// La réserve (20 à 30 %) est retirée de chaque journée avant de placer quoi que ce soit.

export const STATUTS = ['a_faire', 'en_cours', 'bloquee', 'terminee', 'reportee', 'annulee'];
const FIGEES = new Set(['terminee', 'annulee']);

export const jour = (d) => d.toISOString().slice(0, 10);
export const ajoute = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return jour(d); };
export const lundiDe = (iso) => { const d = new Date(iso + 'T12:00:00Z'); return ajoute(iso, -((d.getUTCDay() + 6) % 7)); };
export const semaine = (lundi) => Array.from({ length: 7 }, (_, i) => ajoute(lundi, i));
const jsem = (iso) => (new Date(iso + 'T12:00:00Z').getUTCDay() + 6) % 7; // 0 = lundi

export const CONFIG_DEFAUT = {
  tid: 'config', kind: 'config',
  jours: [true, true, true, true, true, false, false], // lundi → dimanche
  heures: [6, 6, 6, 6, 6, 0, 0],
  reserve: 0.25,
};

/** Minutes réellement planifiables pour une date (réserve retirée ; 0 si jour non travaillé). */
export function capacite(config, iso) {
  const i = jsem(iso);
  if (!config.jours[i]) return 0;
  return Math.floor((config.heures[i] || 0) * 60 * (1 - (config.reserve ?? 0.25)));
}

/** Charge d'un jour : somme des durées des tâches non figées placées ce jour-là (terminées comprises : le temps est passé). */
export function charge(taches, iso) {
  return taches.filter((t) => t.jour === iso && t.statut !== 'annulee').reduce((a, t) => a + (t.duree || 0), 0);
}

/**
 * Planifie la semaine qui commence à `lundi`, à partir d'`aujourdhui` (les jours passés ne reçoivent rien).
 * Retourne { placement: { tid: date|null }, raisons: { tid: texte }, jours: [{ date, capacite, charge, surcharge }] }.
 * Ne modifie pas les objets reçus.
 */
export function planifier(taches, config, lundi, aujourdhui) {
  const dates = semaine(lundi);
  const libre = Object.fromEntries(dates.map((d) => [d, d < aujourdhui ? 0 : capacite(config, d)]));
  const placement = {}, raisons = {};

  // 1 & 2 : ce qui ne bouge pas occupe déjà sa place.
  // Une tâche déjà posée sur une semaine future n'est pas ramenée ici : elle y reste.
  const fixes = taches.filter((t) => FIGEES.has(t.statut) || (t.verrou && t.jour) || (t.jour && t.jour > dates[6]));
  for (const t of fixes) {
    placement[t.tid] = t.jour || null;
    if (t.jour in libre && t.statut !== 'annulee') libre[t.jour] -= t.duree || 0;
  }

  // Les candidates : tout le reste, sauf les bloquées (on ne planifie pas ce qu'on ne peut pas faire).
  const autres = taches.filter((t) => !fixes.includes(t));
  for (const t of autres.filter((x) => x.statut === 'bloquee')) {
    placement[t.tid] = null; raisons[t.tid] = 'Bloquée : à débloquer avant de la planifier.';
  }
  let file = autres.filter((x) => x.statut !== 'bloquee');

  // 3 & 5 : échéance la plus proche d'abord, puis priorité (1 = haute), puis la plus ancienne.
  const cle = (t) => [t.echeance || '9999-12-31', t.priorite || 2, t.cree || '', t.tid];
  file.sort((a, b) => { const x = cle(a), y = cle(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; return 0; });

  // 4 : dépendances — une tâche attend que celles dont elle dépend soient placées (ou terminées).
  const parTid = Object.fromEntries(taches.map((t) => [t.tid, t]));
  const datePlacee = (tid) => { const t = parTid[tid]; if (!t) return lundi; if (t.statut === 'terminee') return lundi; return placement[tid]; };
  let progres = true;
  while (file.length && progres) {
    progres = false;
    for (const t of [...file]) {
      const deps = (t.depend || []).filter((d) => parTid[d]);
      if (deps.some((d) => placement[d] === undefined && parTid[d].statut !== 'terminee')) continue; // dépendance pas encore traitée
      file = file.filter((x) => x !== t); progres = true;
      const bloquante = deps.find((d) => datePlacee(d) === null);
      if (bloquante) { placement[t.tid] = null; raisons[t.tid] = `Attend « ${parTid[bloquante].titre} », qui n'a pas de place cette semaine.`; continue; }
      const apres = deps.map(datePlacee).filter(Boolean).sort().pop() || lundi;
      const duree = t.duree || 30;
      const fin = t.echeance && t.echeance < dates[6] ? t.echeance : dates[6];
      const possibles = dates.filter((d) => d >= aujourdhui && d >= apres && d <= fin);
      const jourOk = possibles.find((d) => libre[d] >= duree);
      if (jourOk) { placement[t.tid] = jourOk; libre[jourOk] -= duree; continue; }
      placement[t.tid] = null;
      const maxJour = Math.max(0, ...dates.map((d) => (d < aujourdhui ? 0 : capacite(config, d))));
      if (t.echeance && t.echeance < aujourdhui) raisons[t.tid] = `Échéance dépassée (${t.echeance}) : à replanifier ou à reporter.`;
      else if (!possibles.some((d) => capacite(config, d) > 0)) raisons[t.tid] = t.echeance && t.echeance < dates[6] ? 'Aucun jour travaillé avant l\'échéance.' : 'Aucun jour travaillé restant cette semaine.';
      else if (duree > maxJour) raisons[t.tid] = `Trop longue pour une journée (${duree} min pour ${maxJour} disponibles) : à découper.`;
      else raisons[t.tid] = t.echeance && t.echeance <= dates[6] ? 'Pas assez de temps libre avant l\'échéance.' : 'Plus de temps libre cette semaine.';
    }
  }
  for (const t of file) { placement[t.tid] = null; raisons[t.tid] = 'Dépendances circulaires : à vérifier.'; }

  const apresPlan = taches.map((t) => ({ ...t, jour: placement[t.tid] }));
  const jours = dates.map((d) => {
    const cap = capacite(config, d), ch = charge(apresPlan, d);
    return { date: d, capacite: cap, charge: ch, surcharge: ch > cap };
  });
  return { placement, raisons, jours };
}
