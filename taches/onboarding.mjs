/* Génère /onboarding/ — la porte d'entrée : où j'en suis par rapport à mes OKR.
 *
 * Les objectifs ne sont PAS inventés ici : ils sont recopiés du Cockpit 2026 de
 * Notion (North Star, OBJ 1/2/3, règles anti-dispersion). Ce fichier ne fait
 * que confronter ces cibles aux tâches réelles du tableau de bord.
 *
 * Le ratio de santé suit la règle que Tony s'est lui-même donnée : « 1 action
 * cash par jour, le dev produit ne compte pas » et « si une semaine passe avec
 * 0 message envoyé → tout stopper ». On mesure donc l'activité qui rapproche
 * de l'argent, pas le volume de travail.
 */
import fs from 'node:fs';

const R = '/work/previsualisation';
const OUT = `${R}/onboarding`;
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const taches = JSON.parse(fs.readFileSync(`${R}/taches/taches.json`, 'utf8')).taches || [];

/* ── Les OKR, recopiés du Cockpit Notion ─────────────────────────────── */
const OKR = [
  {
    id: 'obj1', icone: '🔥', titre: 'Freelance automatisation rentable',
    cible: '100 messages · 5 missions à 500 €+ · 2 000 €/mois récurrent',
    echeance: 'juin → octobre 2026',
    notion: 'https://app.notion.com/p/3265fda3ad05817f864dfc86d5f16baf',
    /* Une tâche sert cet objectif si elle rapproche d'une facture. */
    filtre: (t) => t.cash === 'direct',
    kr: [
      { texte: '100 messages de prospection d’ici fin juin', mesure: 'tableau de suivi rempli' },
      { texte: '5 missions signées à 500 € minimum', mesure: 'contrat + virement reçu' },
      { texte: '2 000 €/mois récurrent d’ici octobre', mesure: 'relevé bancaire, 3 mois' },
    ],
  },
  {
    id: 'obj2', icone: '⚡', titre: 'Valider Fusionia ou pivoter',
    cible: 'décision GO / NO-GO sur chiffres réels',
    echeance: '1er septembre 2026',
    notion: 'https://app.notion.com/p/3265fda3ad0581e583aecbb4d9f138d3',
    /* Le filtre d'origine ne cherchait que « fusionia / oz / humian » et ne
       trouvait RIEN : aucune tâche ne porte ces noms. On cherche donc ce qui
       fait avancer une décision produit — offre, lancement, inscrits, payant. */
    filtre: (t) => /produit|saas|offre|lancement|inscrit|payant|abonnement|fusionia|humian/i.test(`${t.t} ${t.note || ''} ${t.cashNote || ''}`),
    kr: [{ texte: '30 inscrits payants avant juillet', mesure: 'compteur produit' }],
  },
  {
    id: 'obj3', icone: '🎯', titre: 'Indépendance financière partielle',
    cible: '1 500 €/mois hors CDI · 1 revenu récurrent automatisé · épargne 10 %',
    echeance: 'fin août 2026',
    notion: 'https://app.notion.com/p/3265fda3ad058193a25bd14c561aab04',
    /* Un revenu récurrent vient d'un système qui tourne seul. */
    /* Le « et cash === proche » vidait le filtre : les tâches marquées proches
       sont des tâches de contenu, jamais des tâches de tuyauterie. Ce qui sert
       un revenu récurrent, c'est un système qui tourne seul — quel que soit son
       éloignement de la facture. */
    filtre: (t) => /workflow|automatis|r[ée]current|abonnement|n8n|cron|pipeline/i.test(`${t.t} ${t.note || ''} ${t.cashNote || ''}`),
    kr: [
      { texte: '1 500 €/mois hors CDI en août', mesure: 'relevé bancaire mensuel' },
      { texte: '1 workflow qui tourne 30 jours sans intervention', mesure: 'exécutions n8n' },
      { texte: 'épargne automatique 10 %', mesure: 'solde compte business' },
    ],
  },
];

/* ── Activité réelle, lue dans le journal ────────────────────────────── */
const journal = fs.readFileSync('/work/TASKLOG.md', 'utf8').split('\n');
const parJour = {};
let jour = '';
for (const l of journal) {
  const j = l.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
  if (j) { jour = j[1]; continue; }
  if (/^- \[/.test(l) && jour) parJour[jour] = (parJour[jour] || 0) + 1;
}

const jours = (n) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.now() - i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};
const somme = (liste) => liste.reduce((s, d) => s + (parJour[d] || 0), 0);

const sem = somme(jours(7)), semAvant = somme(jours(14).slice(7));
const mois = somme(jours(30)), moisAvant = somme(jours(60).slice(30));
const trim = somme(jours(90));

const evo = (a, b) => (b === 0 ? (a > 0 ? '+∞' : '=') : `${a >= b ? '+' : ''}${Math.round((a - b) / b * 100)} %`);

/* ── Ratio de santé, selon SES règles ────────────────────────────────── */
const direct = taches.filter((t) => t.cash === 'direct');
const directLivre = direct.filter((t) => t.etat === 'livre');
const bloquees = taches.filter((t) => t.etat === 'bloque');
const attente = taches.filter((t) => t.etat === 'attente');

/* La règle de Tony : livrer ne suffit pas, il faut que ça SORTE. Une tâche
   cash direct livrée mais jamais envoyée ne rapproche d'aucune facture. */
const livreNonEnvoye = directLivre.length;
const sante = Math.max(0, Math.min(100, Math.round(
  40 * (direct.length ? 1 - livreNonEnvoye / direct.length : 1)   // ce qui est parti
  + 30 * (sem > 0 ? 1 : 0)                                        // activité de la semaine
  + 30 * (taches.length ? 1 - bloquees.length / taches.length : 1) // ce qui n'est pas bloqué
)));
const verdict = sante >= 70 ? ['#22c55e', 'ça avance'] : sante >= 45 ? ['#f5d90a', 'à surveiller'] : ['#ef4444', 'ça coince'];

const carteOKR = (o) => {
  const liees = taches.filter(o.filtre);
  const faites = liees.filter((t) => t.etat === 'livre').length;
  const pct = liees.length ? Math.round(faites / liees.length * 100) : 0;
  return `
  <div class="okr">
    <div class="okr-t">${o.icone} ${esc(o.titre)}</div>
    <div class="okr-c">${esc(o.cible)}</div>
    <div class="barre"><span style="width:${pct}%"></span></div>
    <div class="okr-m">${liees.length
    /* Un « 0/0 » silencieux se lit comme « rien à signaler » alors qu'il dit
       l'inverse : un objectif sur lequel personne ne travaille. On le nomme. */
    ? `${faites}/${liees.length} tâches liées livrées · échéance ${esc(o.echeance)}`
    : `⚠️ aucune tâche en cours ne sert cet objectif · échéance ${esc(o.echeance)}`}</div>
    <ul class="kr">${o.kr.map((k) => `<li>${esc(k.texte)} <i>— ${esc(k.mesure)}</i></li>`).join('')}</ul>
    <a href="${o.notion}" target="_blank" rel="noopener">ouvrir dans Notion →</a>
  </div>`;
};

const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Où j'en suis — OKR 2026</title>
<style>
 :root{--bg:#0a0a0f;--p:#111117;--b:#242430;--or:#f5d90a;--t:#f2f2f5;--m:#9a9aa8}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--t);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:1.8rem 1rem 4rem;line-height:1.6}
 .w{max-width:680px;margin:0 auto}
 h1{font-size:1.4rem;margin:0 0 .2rem;background:linear-gradient(90deg,var(--or),#ff7a1a);-webkit-background-clip:text;background-clip:text;color:transparent}
 .ns{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.35);border-radius:12px;padding:.9rem 1rem;margin:1rem 0;font-size:.9rem}
 .ns b{color:#fff}
 section{background:var(--p);border:1px solid var(--b);border-radius:14px;padding:1rem 1.1rem;margin-bottom:1rem}
 h2{font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:var(--or);margin:0 0 .7rem}
 .sante{display:flex;align-items:center;gap:1rem}
 .jauge{width:74px;height:74px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:700;flex:0 0 auto}
 .okr{border-top:1px solid var(--b);padding-top:.9rem;margin-top:.9rem}
 .okr:first-of-type{border-top:0;padding-top:0;margin-top:0}
 .okr-t{font-weight:700;font-size:.98rem}
 .okr-c{color:var(--m);font-size:.84rem;margin:.15rem 0 .5rem}
 .barre{height:7px;background:#1b1b24;border-radius:99px;overflow:hidden}
 .barre span{display:block;height:100%;background:linear-gradient(90deg,var(--or),#ff7a1a)}
 .okr-m{font-size:.78rem;color:var(--m);margin-top:.35rem}
 ul.kr{margin:.5rem 0 .4rem;padding-left:1.1rem;font-size:.84rem}
 ul.kr i{color:var(--m);font-style:normal;font-size:.92em}
 a{color:var(--or);font-size:.82rem;text-decoration:none}
 table{width:100%;border-collapse:collapse;font-size:.85rem}
 th,td{text-align:left;padding:.4rem .3rem;border-bottom:1px solid rgba(128,128,128,.16)}
 th{color:var(--or);font-weight:600}
 td.n{text-align:right;font-variant-numeric:tabular-nums}
 .liens{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.3rem}
 .lien{background:#1b1b24;border:1px solid var(--b);border-radius:999px;padding:.45rem .9rem;font-size:.84rem;text-decoration:none;color:var(--t)}
 .lien-fort{background:var(--j,#f5d90a);color:#000;border-color:var(--j,#f5d90a);font-weight:700}
 .regle{font-size:.86rem;margin:.3rem 0}
 .pied{color:var(--m);font-size:.75rem;margin-top:1.5rem;text-align:center}
</style></head><body><div class="w">

<h1>Où j'en suis</h1>
<div class="ns"><b>North Star :</b> 10 000 €/mois avec Humian.<br>
Étape 1 : <b>1 500 €/mois hors CDI d'ici fin août 2026</b>.<br>
Le seul chiffre qui compte chaque jour : <b>nombre de prospects contactés</b>.</div>

<section>
  <h2>Ratio de santé</h2>
  <div class="sante">
    <div class="jauge" style="background:${verdict[0]}22;border:2px solid ${verdict[0]};color:${verdict[0]}">${sante}</div>
    <div>
      <div style="font-weight:700;color:${verdict[0]}">${verdict[1]}</div>
      <div style="font-size:.83rem;color:var(--m);margin-top:.2rem">
        ${livreNonEnvoye} livrable${livreNonEnvoye > 1 ? 's' : ''} cash direct terminé${livreNonEnvoye > 1 ? 's' : ''} mais pas encore parti${livreNonEnvoye > 1 ? 's' : ''}<br>
        ${bloquees.length} tâche${bloquees.length > 1 ? 's' : ''} bloquée${bloquees.length > 1 ? 's' : ''} · ${attente.length} en attente
      </div>
    </div>
  </div>
  <p style="font-size:.8rem;color:var(--m);margin:.8rem 0 0">Calculé sur tes propres règles : ce qui est
  <b>parti</b> (40), l'activité de la semaine (30), ce qui n'est pas bloqué (30). Livrer ne compte pas —
  seul ce qui sort rapproche d'une facture.</p>
</section>

<section>
  <h2>Mes 3 OKR 2026</h2>
  ${OKR.map(carteOKR).join('')}
</section>

<section>
  <h2>Activité — semaine · mois · trimestre</h2>
  <table>
    <tr><th>Période</th><th class="n">Demandes</th><th class="n">vs période précédente</th></tr>
    <tr><td>7 derniers jours</td><td class="n">${sem}</td><td class="n">${evo(sem, semAvant)}</td></tr>
    <tr><td>30 derniers jours</td><td class="n">${mois}</td><td class="n">${evo(mois, moisAvant)}</td></tr>
    <tr><td>90 derniers jours</td><td class="n">${trim}</td><td class="n">—</td></tr>
  </table>
  <p style="font-size:.79rem;color:var(--m);margin:.7rem 0 0">Mesure le volume d'échanges, pas la valeur
  produite. Une semaine chargée sans action cash reste une mauvaise semaine.</p>
</section>

<section>
  <h2>Les règles que tu t'es données</h2>
  <div class="regle">1 · Max <b>2 projets actifs</b> — le reste en pause.</div>
  <div class="regle">2 · <b>1 action cash par jour</b> : message, relance, devis ou facture. Le dev produit ne compte pas.</div>
  <div class="regle">3 · <b>0 nouveau système</b> tant que Humian n'est pas à 5 000 €/mois.</div>
  <div class="regle">4 · <b>Vendredi, 15 min</b> : revue de la semaine.</div>
  <div class="regle">5 · Définir « terminé » <b>avant</b> de commencer.</div>
  <p style="font-size:.82rem;color:#ff7a1a;margin:.7rem 0 0">⚠️ Une semaine à 0 message envoyé → tout stopper et comprendre pourquoi.</p>
</section>

<section>
  <h2>Aller à</h2>
  <div class="liens">
    <!-- Le sprint passe en premier et en évidence : c'est la seule entrée d'où
         l'on ressort avec du travail fait, les autres ne font que montrer. -->
    <a class="lien lien-fort" href="/sprint/">▶ Lancer un sprint de 7 min</a>
    <a class="lien" href="/taches/">Mes tâches (${taches.length})</a>
    <a class="lien" href="/a-envoyer/">À envoyer</a>
    <a class="lien" href="/cta/">Mots-clés &amp; portes</a>
    <a class="lien" href="/banque/">Ma banque d'assets</a>
    <a class="lien" href="/sites-clients/">Sites clients</a>
    <a class="lien" href="/">Toutes les prévisualisations</a>
  </div>
</section>

<p class="pied">Généré le ${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · OKR recopiés du Cockpit 2026 (Notion)</p>
</div></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/index.html`, html);
console.log(`  onboarding/index.html · ${(html.length / 1024).toFixed(1)} Ko`);
console.log(`  santé ${sante}/100 (${verdict[1]}) · ${taches.length} tâches · semaine ${sem} (${evo(sem, semAvant)})`);
for (const o of OKR) {
  const l = taches.filter(o.filtre);
  console.log(`    ${o.icone} ${o.titre.padEnd(38)} ${l.filter((t) => t.etat === 'livre').length}/${l.length} liées livrées`);
}
