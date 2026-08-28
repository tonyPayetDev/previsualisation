/* La page de validation.
 *
 * Deux sources, jamais mélangées :
 *   — les DÉFINITIONS de tâches vivent dans taches.json (je les tiens) ;
 *   — les DÉCISIONS de Tony vivent dans le webhook n8n `taches-validation`.
 * Si les décisions étaient écrites dans le dépôt, la prochaine reconstruction
 * de cette page les effacerait. C'est le même partage que la feuille d'appels.
 *
 * Trois pièges déjà payés sur le stockage n8n, respectés ici :
 *   1. envoyer en `text/plain` — `application/json` déclenche un préflight
 *      OPTIONS que le webhook ne traite pas ;
 *   2. ne pas se fier à une minuterie d'envoi : un envoi en vol annulait le
 *      suivant et la décision suivante était perdue. On suit un DRAPEAU
 *      « il reste du neuf », et on renvoie tant qu'il est levé ;
 *   3. localStorage ne tient pas chez Tony (navigateur intégré des apps, et
 *      Safari efface au bout de 7 jours) — il ne sert ici que de cache
 *      d'affichage, jamais de source de vérité.
 */
import fs from 'node:fs';
const D = '/work/previsualisation/taches/valider';
const { taches, maj } = JSON.parse(fs.readFileSync(`${D}/taches.json`, 'utf8'));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const LIB = {
  propose: ['À valider', 'Je ne commence pas tant que tu n’as pas dit oui.'],
  valide: ['Validé — en cours', 'Tu as dit oui. C’est à moi de jouer.'],
  refuse: ['Écarté', 'Tu n’en veux pas. Je n’y touche plus.'],
  fait: ['Fait — à ton avis', 'C’est livré. Dis-moi si ça passe.'],
  ok: ['Clos', 'Validé des deux côtés.'],
  revoir: ['À reprendre', 'Tu as dit non. Je reprends.'],
  'attente-toi': ['Sur toi', 'Rien à valider : c’est une action que je ne peux pas faire à ta place.'],
};

const carte = (t) => `
  <li class="t" data-id="${esc(t.id)}" data-defaut="${esc(t.etat)}">
    <div class="haut">
      <span class="etat"></span>
      <h3>${esc(t.titre)}</h3>
    </div>
    <p class="pq">${esc(t.pourquoi)}</p>
    <p class="fi"><b>Fini quand :</b> ${esc(t.fini)}</p>
    <p class="co"><b>Coût :</b> ${esc(t.cout)}</p>
    ${t.note ? `<p class="no">${esc(t.note)}</p>` : ''}
    ${t.lien ? `<a class="lien" href="${esc(t.lien)}" target="_blank" rel="noopener">Voir le résultat ↗</a>` : ''}
    <div class="actes"></div>
    <p class="dit"></p>
  </li>`;

fs.writeFileSync(`${D}/index.html`, `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>À valider</title>
<style>
  :root{--noir:#07080b;--carte:#0f1218;--ligne:#212734;--blanc:#eef1f6;--gris:#8b93a3;
        --vert:#34d399;--ambre:#fbbf24;--rouge:#f87171;--bleu:#60a5fa}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:var(--noir);color:var(--blanc);font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;
       padding:22px 16px 120px}
  .w{max-width:760px;margin:0 auto}
  .eb{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gris)}
  h1{font-size:clamp(26px,6vw,38px);line-height:1.08;letter-spacing:-.02em;margin:10px 0 6px}
  .sous{color:var(--gris);font-size:14.5px;max-width:52ch}
  .compte{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 26px}
  .pill{border:1px solid var(--ligne);border-radius:999px;padding:5px 13px;font-size:12.5px;color:var(--gris)}
  .pill b{color:var(--blanc)}
  ul{list-style:none;display:flex;flex-direction:column;gap:14px}
  .t{background:var(--carte);border:1px solid var(--ligne);border-radius:12px;padding:16px 16px 14px}
  .t.e-valide{border-left:3px solid var(--bleu)}
  .t.e-propose{border-left:3px solid var(--ambre)}
  .t.e-fait{border-left:3px solid var(--vert)}
  .t.e-ok{opacity:.55}
  .t.e-refuse{opacity:.42}
  .t.e-revoir{border-left:3px solid var(--rouge)}
  .t.e-attente-toi{border-left:3px solid #7c8598}
  .haut{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
  h3{font-size:18px;line-height:1.25;font-weight:650;letter-spacing:-.01em}
  .etat{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gris);
        border:1px solid var(--ligne);border-radius:999px;padding:3px 9px;white-space:nowrap}
  .pq{color:#c3cad6;font-size:14.5px;margin-top:9px}
  .fi,.co{color:var(--gris);font-size:13.5px;margin-top:7px}
  .fi b,.co b{color:#aab3c2;font-weight:600}
  .no{color:var(--gris);font-size:13.5px;margin-top:8px;padding-left:11px;border-left:2px solid var(--ligne)}
  .lien{display:inline-block;margin-top:11px;color:var(--bleu);font-size:14px;text-decoration:none}
  .actes{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}
  button{font:inherit;font-size:14.5px;font-weight:600;border:1px solid var(--ligne);background:#161b23;
         color:var(--blanc);border-radius:9px;padding:11px 17px;cursor:pointer;min-height:46px}
  button:active{transform:translateY(1px)}
  button.oui{border-color:#1f6f52;background:#123024;color:#8ff0c4}
  button.non{border-color:#6f2626;background:#2b1414;color:#f4a3a3}
  .dit{font-size:13px;color:var(--gris);margin-top:9px;min-height:0}
  .dit:empty{display:none}
  .bandeau{position:fixed;left:0;right:0;bottom:0;background:#0b0e13;border-top:1px solid var(--ligne);
           padding:11px 16px;font-size:13px;color:var(--gris);text-align:center}
  .bandeau b{color:var(--blanc)}
</style>
</head>
<body>
<div class="w">
  <div class="eb">Tableau de validation</div>
  <h1>Ce que je propose de faire</h1>
  <p class="sous">Tu dis oui, je le fais. Quand c’est livré, tu dis si ça passe.
     Rien ne se lance sans ton feu vert — et rien n’est considéré fini sans ton « c’est bon ».</p>
  <div class="compte" id="compte"></div>
  <ul id="liste">${taches.map(carte).join('')}</ul>
</div>
<div class="bandeau" id="bandeau">Chargement de tes décisions…</div>
<script>
(() => {
  const URL_ETAT = 'https://n7n.automatisationboost.com/webhook/taches-validation';
  const LIB = ${JSON.stringify(LIB)};
  let etat = {};             // { id: { etat, maj } }
  let duNeuf = false;        // le drapeau : il reste quelque chose à envoyer
  let enVol = false;

  const boutons = (e) => {
    if (e === 'propose') return [['valide', 'Go', 'oui'], ['refuse', 'Non merci', 'non']];
    if (e === 'fait') return [['ok', 'C’est bon', 'oui'], ['revoir', 'À reprendre', 'non']];
    if (e === 'valide') return [['propose', 'Annuler le go', '']];
    if (e === 'refuse' || e === 'ok' || e === 'revoir') return [['propose', 'Remettre à valider', '']];
    return [];
  };

  const peindre = () => {
    let aValider = 0, enCours = 0, aTonAvis = 0;
    document.querySelectorAll('.t').forEach((li) => {
      const id = li.dataset.id;
      const e = (etat[id] && etat[id].etat) || li.dataset.defaut;
      li.className = 't e-' + e;
      const lib = LIB[e] || [e, ''];
      li.querySelector('.etat').textContent = lib[0];
      if (e === 'propose') aValider++;
      if (e === 'valide') enCours++;
      if (e === 'fait') aTonAvis++;
      const zone = li.querySelector('.actes');
      zone.innerHTML = '';
      for (const [vers, texte, cl] of boutons(e)) {
        const b = document.createElement('button');
        b.textContent = texte; if (cl) b.className = cl;
        b.onclick = () => decider(id, vers);
        zone.appendChild(b);
      }
      const d = li.querySelector('.dit');
      d.textContent = etat[id] && etat[id].maj
        ? 'Ta décision : ' + lib[0].toLowerCase() + ' — ' + new Date(etat[id].maj).toLocaleString('fr-FR')
        : '';
    });
    document.getElementById('compte').innerHTML =
      '<span class="pill"><b>' + aValider + '</b> à valider</span>' +
      '<span class="pill"><b>' + enCours + '</b> en cours</span>' +
      '<span class="pill"><b>' + aTonAvis + '</b> à ton avis</span>';
  };

  const decider = (id, vers) => {
    etat[id] = { etat: vers, maj: new Date().toISOString() };
    peindre();
    duNeuf = true;
    envoyer();
  };

  /* On n'annule jamais un envoi en cours : on lève un drapeau et on renvoie
     après. Une minuterie annulée a déjà fait perdre une décision. */
  const envoyer = async () => {
    if (enVol || !duNeuf) return;
    enVol = true; duNeuf = false;
    const bandeau = document.getElementById('bandeau');
    bandeau.innerHTML = 'Enregistrement…';
    try {
      await fetch(URL_ETAT, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
                              body: JSON.stringify(etat) });
      bandeau.innerHTML = '<b>Enregistré.</b> Tes décisions sont sur le serveur, pas sur ce téléphone.';
    } catch (err) {
      duNeuf = true;
      bandeau.innerHTML = 'Enregistrement impossible — je réessaie.';
    } finally {
      enVol = false;
      if (duNeuf) setTimeout(envoyer, 1200);
    }
  };

  (async () => {
    try {
      const r = await fetch(URL_ETAT + '?t=' + Date.now());
      const j = await r.json();
      const d = typeof j.donnees === 'string' ? JSON.parse(j.donnees || '{}') : (j.donnees || {});
      etat = d && typeof d === 'object' ? d : {};
      document.getElementById('bandeau').innerHTML =
        'Tes décisions sont enregistrées côté serveur. Dernière écriture : <b>' +
        (j.maj ? new Date(j.maj).toLocaleString('fr-FR') : 'jamais') + '</b>';
    } catch (e) {
      document.getElementById('bandeau').textContent =
        'Impossible de lire tes décisions — la page affiche les états par défaut.';
    }
    peindre();
  })();
})();
</script>
</body>
</html>
`);
console.log(`page écrite · ${taches.length} tâches`);
