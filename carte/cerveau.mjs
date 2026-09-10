#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   cerveau.mjs — builds carte/cerveau.json, the answer bank the voice assistant
   reads out loud on /carte/.

   WHY THIS IS NOT AN LLM.
   The Anthropic pay-as-you-go credits behind the n8n "Claude" nodes are
   exhausted (that is what "Génération à réparer" means in this repo). Any brain
   that called a model would die on its first request. So this file is plain,
   deterministic counting: it opens the files that already hold the truth,
   counts, and writes finished French sentences. Less impressive, always works,
   and every number can be traced back to a file on disk.

   RULE OBEYED THROUGHOUT: never invent a figure. When a source cannot be read,
   the topic says so out loud rather than producing a plausible number.

   Run:  /home/claude/tools/node/bin/node /work/previsualisation/carte/cerveau.mjs
--------------------------------------------------------------------------- */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const RACINE = '/work';
const PREV = '/work/previsualisation';
const SORTIE = `${PREV}/carte/cerveau.json`;

const sources = [];
const avertissements = [];

/** Reads a JSON file. Returns null and records a warning instead of throwing:
 *  a missing source must degrade one topic, never kill the whole build. */
function lireJson(chemin, etiquette) {
  try {
    const v = JSON.parse(readFileSync(chemin, 'utf8'));
    sources.push(etiquette);
    return v;
  } catch (e) {
    avertissements.push(`${etiquette} illisible (${e.code || e.message})`);
    return null;
  }
}
function lireTexte(chemin, etiquette) {
  try {
    const v = readFileSync(chemin, 'utf8');
    sources.push(etiquette);
    return v;
  } catch (e) {
    avertissements.push(`${etiquette} illisible (${e.code || e.message})`);
    return null;
  }
}

const pluriel = (n, sing, plur) => `${n} ${n > 1 ? (plur || sing + 's') : sing}`;
/** For words already invariable in the plural ("fois", "prix"). */
const fixe = (n, mot) => `${n} ${mot}`;

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];
/** "2026-09-08" -> "8 septembre" — speech synthesis reads ISO dates as digits. */
function enClair(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  return `${j === 1 ? '1er' : j} ${MOIS[m - 1]}${a !== new Date().getFullYear() ? ' ' + a : ''}`;
}

/* ═══════════════════════ 1. LES TÂCHES ═══════════════════════════════════ */
const taches = lireJson(`${PREV}/taches/taches.json`, 'taches/taches.json');

let sujetTaches = null, sujetDecisions = null, sujetRelances = null;

if (taches?.taches) {
  const T = taches.taches;
  const parEtat = (e) => T.filter((t) => t.etat === e);
  const attente = parEtat('attente'), bloque = parEtat('bloque'), livre = parEtat('livre');
  // "direct" = a named client or prospect is at the end of it. Tony's own rule:
  // facturer > vendre > construire. Those are the ones worth saying first.
  const directOuvert = T.filter((t) => t.cash === 'direct' && t.etat !== 'livre');

  sujetTaches = {
    titre: 'Les chantiers',
    phrases: [
      `Ton tableau compte ${T.length} chantiers, relevés le ${enClair(taches.maj)}.`,
      `${pluriel(livre.length, 'est livré et vérifié en ligne', 'sont livrés et vérifiés en ligne')}, ${fixe(attente.length, attente.length > 1 ? 'attendent' : 'attend')} ton retour, et ${bloque.length > 1 ? bloque.length + ' sont bloqués' : bloque.length + ' est bloqué'}.`,
      bloque.length
        ? `Ce qui est bloqué : ${bloque.map((t) => t.t.split(/[—:(]/)[0].trim()).slice(0, 4).join(' ; ')}.`
        : `Rien n'est bloqué aujourd'hui.`,
    ],
    details: T.filter((t) => t.etat !== 'livre').slice(0, 20)
      .map((t) => ({ texte: t.t, etat: t.etat, cash: t.cash, lien: t.lien || null })),
  };

  // Several rows can share one prospect (Koytcha alone holds four). Grouping by
  // the reason avoids reading the same sentence four times in a row — the
  // failure mode of the first build.
  const parProspect = new Map();
  for (const t of directOuvert) {
    const cle = (t.cashNote || t.t).slice(0, 60);
    const o = parProspect.get(cle) || { nom: t.t.split(/[—:(]/)[0].trim(), pourquoi: t.cashNote, n: 0, lien: t.lien || null };
    o.n++;
    parProspect.set(cle, o);
  }
  const groupes = [...parProspect.values()].sort((a, b) => b.n - a.n);

  sujetRelances = {
    titre: 'Les relances à faire',
    phrases: [
      `${pluriel(directOuvert.length, 'chantier a', 'chantiers ont')} un client ou un prospect nommé au bout, et ${directOuvert.length > 1 ? "ne sont pas finis" : "n'est pas fini"}. Ce sont ceux qui peuvent produire une facture cette semaine. Ils se ramènent à ${pluriel(groupes.length, 'dossier')}.`,
      ...groupes.slice(0, 5).map((g) =>
        `${g.nom}${g.n > 1 ? `, ${fixe(g.n, 'lignes')} du tableau` : ''} : ${g.pourquoi || 'prospect nommé'}`),
    ],
    details: directOuvert.map((t) => ({ texte: t.t, etat: t.etat, pourquoi: t.cashNote, lien: t.lien || null })),
  };
}

if (taches?.aToi?.length) {
  sujetDecisions = {
    titre: 'Ce qui attend une décision de toi',
    phrases: [
      `${pluriel(taches.aToi.length, 'décision attend', 'décisions attendent')} que tu tranches. Personne ne peut les prendre à ta place.`,
      ...taches.aToi,
    ],
    details: taches.aToi.map((x) => ({ texte: x })),
  };
}

/* ═══════════════════════ 2. CE QUI S'EST MAL PASSÉ ═══════════════════════ */
/* TASKLOG.md marks each line with a state in brackets:
     [x] done   [ ] open/in progress   [!] something went wrong   [i] note
   The [!] lines ARE the "choses qui se sont mal passées" Tony asked for, and
   they were written at the moment the problem was found. */
const tasklog = lireTexte(`${RACINE}/TASKLOG.md`, 'TASKLOG.md');
let sujetRates = null;

if (tasklog) {
  const lignes = tasklog.split('\n');
  /* Only lines tagged with a DAY/MONTH stamp are real work items. A SessionStart
     hook also appends every raw prompt Tony types as "- [ ] `HH:MM` …" — there
     are 2402 of those, and counting them as open tasks produced a spectacularly
     wrong "2402 points restés ouverts" on the first build. The `\d{2}/\d{2}`
     shape is what separates the two. */
  const ramasse = (marque) => lignes
    .filter((l) => l.startsWith(`- [${marque}]`))
    .map((l) => l.match(/^- \[.\]\s*`(\d{2}\/\d{2})`\s*(.*)$/))
    .filter(Boolean)
    // Strip markdown emphasis and code ticks — TTS reads them out as noise.
    .map((m) => ({ date: m[1], texte: m[2].replace(/\*\*/g, '').replace(/`/g, '').trim() }));

  const toutesAlertes = ramasse('!');
  const ouverts = ramasse(' ');
  // An alert marker is also used for notable news. A decrocked appointment is
  // not "something that went wrong" — it is filed separately rather than read
  // out under that heading.
  const bonneNouvelle = /RDV DECROCHE|rendez-vous (décroché|obtenu)/i;
  const alertes = toutesAlertes.filter((a) => !bonneNouvelle.test(a.texte));
  const bonnes = toutesAlertes.filter((a) => bonneNouvelle.test(a.texte));
  // Newest first: TASKLOG grows by appending.
  const dernieresAlertes = alertes.slice(-6).reverse();
  const derniersOuverts = ouverts.slice(-8).reverse();

  // Only the first sentence is spoken; the rest stays readable on screen.
  const phrase = (o) => {
    const p = o.texte.split(/(?<=[.!?])\s+/)[0];
    const [j, m] = o.date.split('/');
    return `Le ${Number(j)} ${MOIS[Number(m) - 1]} : ${p.length > 240 ? p.slice(0, 240) + '…' : p}`;
  };

  sujetRates = {
    titre: "Ce qui s'est mal passé",
    phrases: [
      `Le journal de bord porte ${pluriel(alertes.length, 'alerte')} et ${pluriel(ouverts.length, 'point resté ouvert', 'points restés ouverts')}.`,
      ...dernieresAlertes.slice(0, 4).map(phrase),
      ...(derniersOuverts.length
        ? [`Et ${derniersOuverts.length > 1 ? 'ce sont ces points' : "c'est ce point"} qui ${derniersOuverts.length > 1 ? 'restent' : 'reste'} ouverts : ${derniersOuverts.slice(0, 3).map((o) => o.texte.split(/(?<=[.!?])\s+/)[0].slice(0, 120)).join(' ; ')}.`]
        : []),
    ],
    details: [
      ...dernieresAlertes.map((o) => ({ genre: 'alerte', ...o })),
      ...derniersOuverts.map((o) => ({ genre: 'ouvert', ...o })),
    ],
    bonnes: bonnes.map((o) => ({ genre: 'bonne', ...o })),
  };

  if (sujetTaches) {
    sujetTaches.enCours = derniersOuverts.slice(0, 5).map(phrase);
  }
}

/* ═══════════════════════ 3. LES PROSPECTS ════════════════════════════════ */
const leads = lireJson(`${PREV}/taches/leads-qualifies-sheet.json`, 'taches/leads-qualifies-sheet.json');
const appels = lireJson(`${PREV}/appels/resultats.json`, 'appels/resultats.json');
const fiches = lireJson(`${PREV}/sites-clients/data/sites.json`, 'sites-clients/data/sites.json');

let sujetProspects = null;
{
  const phrases = [];
  const details = [];

  if (leads?.leads) {
    const avecTel = leads.leads.filter((l) => l.telephone).length;
    const sansEmail = leads.leads.filter((l) => !l.email).length;
    phrases.push(
      `${pluriel(leads.leads.length, 'prospect qualifié', 'prospects qualifiés')} n'ont jamais été contactés, ni par téléphone, ni par email. ${avecTel} ont un numéro, ${sansEmail} n'ont aucune adresse.`
    );
    // The staleness is the real finding, and it is written in the file itself.
    const m = (leads._note || '').match(/(\d{4}-\d{2}-\d{2})/);
    if (m) phrases.push(`Le dernier relevé de ce fichier date du ${enClair(m[1])}. Depuis, le robinet de nouveaux prospects est fermé.`);
    details.push(...leads.leads.slice(0, 25).map((l) => ({
      nom: l.nom, commune: l.commune, telephone: l.telephone || '', score: l.score,
    })));
  }

  if (appels?.appels) {
    const n = Object.keys(appels.appels).length;
    const dates = Object.values(appels.appels).map((a) => a.date).filter(Boolean).sort();
    const aRappeler = Object.entries(appels.appels)
      .filter(([, a]) => a.suite && !/^rien|^aucune/i.test(a.suite));
    phrases.push(
      `Le suivi d'appels contient ${pluriel(n, 'fiche remplie', 'fiches remplies')}, la dernière le ${enClair(dates[dates.length - 1])}.`
    );
    if (aRappeler.length) {
      phrases.push(
        (aRappeler.length === n
          ? `Toutes portent une suite à donner`
          : `${aRappeler.length} d'entre elles portent une suite à donner`) +
        `. Par exemple : ${aRappeler.slice(0, 3).map(([k, a]) => `${k}, ${a.suite.replace(/\.$/, '')}`).join(' ; ')}.`
      );
      details.push(...aRappeler.map(([k, a]) => ({ nom: k, dit: a.dit, suite: a.suite, date: a.date })));
    }
  }

  if (Array.isArray(fiches)) {
    const tel = fiches.filter((f) => f.tel).length;
    phrases.push(`Ton inventaire de sites clients compte ${fiches.length} fiches, dont ${tel} avec un numéro de téléphone. C'est ta liste de rappel la plus courte.`);
  }

  if (phrases.length) sujetProspects = { titre: 'Les prospects', phrases, details };
}

/* ═══════════════════════ 4. LES WORKFLOWS n8n ════════════════════════════ */
/* Read live. The instance is the only source of truth for what failed, and a
   stale copy of it would be worse than no answer at all. */
async function n8n() {
  const base = (process.env.N8N_API_URL || '').replace(/\/+$/, '') || null;
  const cle = process.env.N8N_API_KEY || null;
  if (!base || !cle) {
    avertissements.push('n8n : N8N_API_URL ou N8N_API_KEY absent de l’environnement');
    return null;
  }
  const get = async (chemin) => {
    const r = await fetch(`${base}${chemin}`, {
      headers: { 'X-N8N-API-KEY': cle, accept: 'application/json' },
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };
  try {
    // The executions endpoint returns only workflowId, never the name. Without
    // this map the assistant reads out "workflow soNcMKsz1ce7yDhA", which is
    // unusable out loud. All workflows are fetched, active or not: a failing
    // workflow may well have been switched off since.
    // The instance holds ~529 workflows and the API caps a page at 250, so the
    // cursor must be followed. Without it a third of the names come back
    // missing and the assistant reads out raw IDs.
    const tousWf = [];
    let curseur = '';
    for (let page = 0; page < 10; page++) {
      const r = await get(`/api/v1/workflows?limit=250${curseur ? `&cursor=${encodeURIComponent(curseur)}` : ''}`);
      tousWf.push(...(r.data || []));
      if (!r.nextCursor) break;
      curseur = r.nextCursor;
    }
    const tous = { data: tousWf };
    const noms = new Map(tousWf.map((w) => [w.id, w.name]));
    const actifs = tousWf.filter((w) => w.active);

    const erreurs = await get('/api/v1/executions?status=error&limit=250&includeData=false');
    const items = erreurs.data || [];
    const depuis = Date.now() - 14 * 864e5;
    const recentes = items.filter((e) => new Date(e.startedAt || e.createdAt).getTime() >= depuis);

    const parWorkflow = new Map();
    for (const e of recentes) {
      const id = e.workflowId;
      const o = parWorkflow.get(id) || { nom: noms.get(id) || `workflow ${id}`, id, n: 0, dernier: '' };
      o.n++;
      const d = (e.startedAt || e.createdAt || '').slice(0, 10);
      if (d > o.dernier) o.dernier = d;
      parWorkflow.set(id, o);
    }
    const top = [...parWorkflow.values()].sort((a, b) => b.n - a.n).slice(0, 6);

    /* A count alone ("il a échoué 60 fois") tells Tony nothing he can act on.
       The cause does. So the most recent failure of each top workflow is opened
       to read which node broke and what it said. One extra call per workflow,
       five in all — worth it. */
    for (const w of top) {
      const derniere = recentes
        .filter((e) => e.workflowId === w.id)
        .sort((a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt))[0];
      if (!derniere) continue;
      try {
        const det = await get(`/api/v1/executions/${derniere.id}?includeData=true`);
        const rd = det?.data?.resultData;
        w.noeud = rd?.lastNodeExecuted || null;
        const msg = rd?.error?.message || rd?.error?.description || null;
        if (msg) {
          // One line, trimmed: stack traces are unreadable out loud.
          w.erreur = String(msg).split('\n')[0].slice(0, 180);
          // n8n appends its own advice ("consider setting this node to retry
          // automatically…"). Useful on screen, thirty wasted syllables when a
          // French voice reads it out. The cause is kept, the advice dropped.
          w.erreurCourte = w.erreur
            .replace(/\s*[-–—]\s*(try again|please check|consider).*$/i, '')
            .replace(/\s*\(in the node settings\)\.?$/i, '')
            .trim();
        }
      } catch (e) {
        avertissements.push(`n8n : détail de l'exécution ${derniere.id} illisible (${e.message})`);
      }
    }
    sources.push('n8n (API REST, en direct)');

    const phrases = [
      `${actifs.length} workflows sont actifs sur ton instance n8n, sur ${(tous.data || []).length} au total.`,
      recentes.length
        ? `${pluriel(recentes.length, 'exécution a échoué', 'exécutions ont échoué')} sur les quatorze derniers jours, réparties sur ${pluriel(parWorkflow.size, 'workflow')}.`
        : `Aucune exécution en échec sur les quatorze derniers jours.`,
      ...top.slice(0, 5).map((w) =>
        `${w.nom} a échoué ${fixe(w.n, 'fois')}, la dernière le ${enClair(w.dernier)}` +
        (w.noeud ? `, sur le nœud ${w.noeud}` : '') +
        (w.erreurCourte ? ` : ${w.erreurCourte}` : '') + '.'),
    ];
    return {
      titre: 'Les automatisations',
      phrases,
      details: top.map((w) => ({ nom: w.nom, id: w.id, echecs: w.n, dernier: w.dernier, noeud: w.noeud || null, erreur: w.erreur || null })),
      chiffres: { actifs: actifs.length, echecs14j: recentes.length, workflowsEnEchec: parWorkflow.size },
    };
  } catch (e) {
    avertissements.push(`n8n injoignable au moment du relevé (${e.message})`);
    return {
      titre: 'Les automatisations',
      // Honest fallback: say the source failed rather than read out a stale count.
      phrases: [`Je n'ai pas pu interroger n8n au moment où cette page a été construite : ${e.message}. Je préfère te le dire plutôt que de te lire un chiffre périmé.`],
      details: [],
      indisponible: true,
    };
  }
}

/* ═══════════════════════ 5. ASSEMBLAGE ═══════════════════════════════════ */
const sujetWorkflows = await n8n();

const sujets = {};
const ajoute = (cle, s) => { if (s) sujets[cle] = s; };
ajoute('relances', sujetRelances);
ajoute('rates', sujetRates);
ajoute('decisions', sujetDecisions);
ajoute('taches', sujetTaches);
ajoute('prospects', sujetProspects);
ajoute('workflows', sujetWorkflows);

// The opening summary. Built from the topics above, so it can never drift
// away from what the detailed answers say.
const resume = { titre: 'Le point complet', phrases: [], details: [] };
if (sujetRelances) resume.phrases.push(sujetRelances.phrases[0]);
if (sujetDecisions) resume.phrases.push(sujetDecisions.phrases[0]);
if (sujetRates) resume.phrases.push(sujetRates.phrases[0]);
if (sujetProspects) resume.phrases.push(sujetProspects.phrases[0]);
if (sujetWorkflows && !sujetWorkflows.indisponible) resume.phrases.push(sujetWorkflows.phrases[1]);
resume.phrases.push('Demande-moi les relances, ce qui a mal tourné, tes décisions, tes prospects ou tes automatisations.');
sujets.resume = resume;

const sortie = {
  genere_le: new Date().toISOString(),
  sources,
  avertissements,
  sujets,
};

writeFileSync(SORTIE, JSON.stringify(sortie, null, 1));
console.log(`[cerveau] ${SORTIE}`);
console.log(`[cerveau] sujets : ${Object.keys(sujets).join(', ')}`);
console.log(`[cerveau] sources : ${sources.length}`);
if (avertissements.length) console.log(`[cerveau] avertissements : \n  - ${avertissements.join('\n  - ')}`);
