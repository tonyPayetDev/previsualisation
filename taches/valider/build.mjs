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
  <li class="t" data-id="${esc(t.id)}" data-defaut="${esc(t.etat)}" data-qui="${esc(t.qui || 'claude')}">
    <div class="haut">
      <span class="qui q-${esc(t.qui || 'claude')}">${t.qui === 'toi' ? 'Toi' : 'Claude'}</span>
      <span class="etat"></span>
      <h3>${esc(t.titre)}</h3>
    </div>
    <p class="pq">${esc(t.pourquoi)}</p>
    <p class="fi"><b>Fini quand :</b> ${esc(t.fini)}</p>
    <p class="co"><b>Coût :</b> ${esc(t.cout)}</p>
    ${t.note ? `<p class="no">${esc(t.note)}</p>` : ''}
    ${t.lien ? `<a class="lien" href="${esc(t.lien)}" target="_blank" rel="noopener">Voir le résultat ↗</a>` : ''}
    <div class="actes"></div>
    <button type="button" class="lancer" data-titre="${esc(t.titre)}">▶ Lancer 25 min</button>
    <p class="dit"></p>
    <div class="msg">
      <button type="button" class="msg-ouvrir">Dire ce qui ne va pas</button>
      <div class="msg-zone" hidden>
        <textarea class="msg-txt" rows="3"
          placeholder="Ce qui cloche, en une phrase. Je le lis au prochain passage."></textarea>
        <div class="msg-actes">
          <button type="button" class="msg-ok oui">Enregistrer</button>
          <button type="button" class="msg-annul">Annuler</button>
        </div>
      </div>
      <p class="msg-vu"></p>
    </div>
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
  .msg{margin-top:10px}
  .msg-ouvrir{background:none;border:0;color:var(--gris);font:inherit;font-size:13px;
    text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:11px 0;min-height:44px}
  .msg-ouvrir:hover{color:var(--blanc)}
  .msg-zone{display:flex;flex-direction:column;gap:9px;margin-top:2px}
  .msg-txt{width:100%;font:inherit;font-size:15px;line-height:1.5;color:var(--blanc);
    background:#0a0d12;border:1px solid var(--ligne);border-radius:9px;padding:11px 12px;resize:vertical}
  .msg-txt:focus{outline:0;border-color:#3f4a5f}
  .msg-actes{display:flex;gap:8px}
  .msg-vu{font-size:13.5px;line-height:1.55;color:#e8c98a;background:#1d1706;
    border:1px solid #443814;border-radius:9px;padding:11px 13px;margin-top:9px}
  .msg-vu:empty{display:none}
  .dit{font-size:13px;color:var(--gris);margin-top:9px;min-height:0}
  .dit:empty{display:none}
  .bandeau{position:fixed;left:0;right:0;bottom:0;background:#0b0e13;border-top:1px solid var(--ligne);
           padding:11px 16px;font-size:13px;color:var(--gris);text-align:center}
  .bandeau b{color:var(--blanc)}
  .qui{font-size:11px;letter-spacing:.14em;text-transform:uppercase;border-radius:999px;padding:3px 9px;white-space:nowrap;font-weight:700}
  .q-toi{background:#3b2a06;color:#fbbf24}.q-claude{background:#0d2a3a;color:#60a5fa}
  .filtres{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}
  .filtres button{min-height:40px;padding:8px 14px;font-size:14px}
  .filtres button[aria-pressed=true]{border-color:var(--ambre);color:var(--ambre);background:#1f1705}
  body[data-filtre=toi] .t[data-qui=claude]{display:none}
  body[data-filtre=claude] .t[data-qui=toi]{display:none}
  body[data-filtre=ouvert] .t.e-ok,body[data-filtre=ouvert] .t.e-refuse,body[data-filtre=ouvert] .t.e-fait{display:none}
  .lancer{margin-top:10px;background:#12231a;border-color:#1f6f52;color:#8ff0c4;font-size:13.5px;min-height:40px;padding:8px 14px}
  .lancer.en-cours{background:#2a2410;border-color:#8a6a10;color:#fbbf24}
  .focus{position:fixed;left:0;right:0;bottom:44px;background:#0b0e13;border-top:1px solid var(--ligne);padding:10px 16px;display:none;align-items:center;gap:12px;flex-wrap:wrap;font-size:14px}
  .focus.on{display:flex}
  .focus .chrono{font-family:ui-monospace,Menlo,monospace;font-size:22px;font-weight:700;color:var(--ambre);min-width:70px}
  .focus .quoi{flex:1;min-width:160px;color:var(--blanc)}
  .focus select{background:#161b23;color:var(--blanc);border:1px solid var(--ligne);border-radius:8px;padding:6px 8px;font:inherit;font-size:13px;max-width:180px}
  .focus button{min-height:38px;padding:6px 12px;font-size:13.5px}
  .focus .chance{font-size:12px;color:var(--gris)}
</style>
</head>
<body>
<div class="w">
  <div class="eb">Tableau de validation</div>
  <h1>Ce que je propose de faire</h1>
  <p class="sous">Tu dis oui, je le fais. Quand c’est livré, tu dis si ça passe.
     Rien ne se lance sans ton feu vert — et rien n’est considéré fini sans ton « c’est bon ».</p>
  <div class="compte" id="compte"></div>
  <div class="filtres" id="filtres">
    <button type="button" data-f="ouvert" aria-pressed="true">Ouvertes</button>
    <button type="button" data-f="toi">Pour toi</button>
    <button type="button" data-f="claude">Pour Claude</button>
    <button type="button" data-f="tout">Tout</button>
  </div>
  <ul id="liste">${taches.map(carte).join('')}</ul>
</div>
<div class="focus" id="focus">
  <span class="chrono" id="f-chrono">25:00</span>
  <span class="quoi" id="f-quoi"></span>
  <select id="f-musique" title="Musique du bloc (libre de droits)">
    <option value="mindset-epical-drums-03-80.mp3">🥁 Epical Drums — motivant</option>
    <option value="hook-epical-drums-02-80.mp3">⚡ Epical Drums 02 — action</option>
    <option value="food-sunny-groove-120.mp3">☀️ Sunny Groove — léger</option>
    <option value="journal-digital-clouds-128.mp3">☁️ Digital Clouds — focus</option>
    <option value="">🔇 sans musique</option>
  </select>
  <button type="button" id="f-pause">Pause</button>
  <button type="button" id="f-stop">Terminer</button>
  <span class="chance" id="f-chance"></span>
  <audio id="f-audio" loop preload="none"></audio>
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
    if (e === 'attente-toi') return [['ok', 'Je l’ai fait ✓', 'oui']];
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
      const m = etat[id] && etat[id].message;
      li.querySelector('.msg-vu').textContent = m ? 'Ce que tu as noté : ' + m : '';
      li.querySelector('.msg-ouvrir').textContent =
        m ? 'Modifier ce que tu as noté' : 'Dire ce qui ne va pas';
      const d = li.querySelector('.dit');
      d.textContent = etat[id] && etat[id].maj
        ? 'Ta décision : ' + lib[0].toLowerCase() + ' — ' + new Date(etat[id].maj).toLocaleString('fr-FR')
        : '';
    });
    document.querySelectorAll('.t').forEach((li) => {
      if (li.dataset.msgPret) return;
      li.dataset.msgPret = '1';
      const id = li.dataset.id;
      const zone = li.querySelector('.msg-zone');
      const txt = li.querySelector('.msg-txt');
      li.querySelector('.msg-ouvrir').onclick = () => {
        txt.value = (etat[id] && etat[id].message) || '';
        zone.hidden = false;
        txt.focus();
      };
      li.querySelector('.msg-annul').onclick = () => { zone.hidden = true; };
      li.querySelector('.msg-ok').onclick = () => {
        zone.hidden = true;
        noter(id, txt.value.trim());
      };
    });

    document.getElementById('compte').innerHTML =
      '<span class="pill"><b>' + aValider + '</b> à valider</span>' +
      '<span class="pill"><b>' + enCours + '</b> en cours</span>' +
      '<span class="pill"><b>' + aTonAvis + '</b> à ton avis</span>';
  };

  const noter = (id, texte) => {
    const p = etat[id] || {};
    const defaut = document.querySelector('.t[data-id="' + id + '"]').dataset.defaut;
    etat[id] = { etat: p.etat || defaut, maj: p.maj || new Date().toISOString(),
                 message: texte, messageMaj: new Date().toISOString() };
    peindre();
    duNeuf = true;
    envoyer();
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

  /* ── filtres Toi / Claude ─────────────────────────────────────────── */
  const F = document.getElementById('filtres');
  let filtre = 'ouvert';
  try { filtre = localStorage.getItem('taches-filtre') || 'ouvert'; } catch (_) {}
  const appliquerFiltre = () => {
    document.body.dataset.filtre = filtre;
    F.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === filtre)));
  };
  F.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    filtre = b.dataset.f; try { localStorage.setItem('taches-filtre', filtre); } catch (_) {}
    appliquerFiltre();
  });
  appliquerFiltre();

  /* ── « Lancer 25 min » : un bloc de concentration sur UNE tâche, avec musique.
     Échéance en heure absolue (un onglet en arrière-plan ralentit les minuteurs).
     La musique ne part que sur le clic — un navigateur refuse sinon. ────────── */
  const TRAVAIL = 25 * 60 * 1000;
  const fo = document.getElementById('focus'), fc = document.getElementById('f-chrono'), fq = document.getElementById('f-quoi');
  const fm = document.getElementById('f-musique'), fa = document.getElementById('f-audio'), fch = document.getElementById('f-chance');
  let bloc = null;   // { id, titre, fin, reste, marche }
  try { bloc = JSON.parse(localStorage.getItem('taches-bloc') || 'null'); } catch (_) {}
  try { const m = localStorage.getItem('pomo-musique'); if (m !== null) fm.value = m; } catch (_) {}
  const sauverBloc = () => { try { localStorage.setItem('taches-bloc', JSON.stringify(bloc)); } catch (_) {} };
  const restant = () => bloc ? (bloc.marche ? Math.max(0, bloc.fin - Date.now()) : bloc.reste) : TRAVAIL;
  const jouer = () => {
    if (!fm.value) { fa.pause(); return; }
    const src = '/studio/ecoute/' + fm.value;
    if (fa.getAttribute('src') !== src) { fa.setAttribute('src', src); fa.load(); }
    fa.volume = 0.35; fa.play().catch(() => {});
  };
  const faits = () => { try { const j = JSON.parse(localStorage.getItem('taches-faits') || '{}'); const d = new Date().toISOString().slice(0, 10); return j[d] || 0; } catch (_) { return 0; } };
  const compterFait = () => { try { const j = JSON.parse(localStorage.getItem('taches-faits') || '{}'); const d = new Date().toISOString().slice(0, 10); j[d] = (j[d] || 0) + 1; localStorage.setItem('taches-faits', JSON.stringify(j)); } catch (_) {} };
  const peindreBloc = () => {
    fo.classList.toggle('on', !!bloc);
    document.querySelectorAll('.lancer').forEach((b) => {
      const li = b.closest('.t'); const actif = bloc && bloc.id === li.dataset.id;
      b.classList.toggle('en-cours', !!actif);
      b.textContent = actif ? (bloc.marche ? '⏱ En cours…' : '⏸ En pause') : '▶ Lancer 25 min';
    });
    if (!bloc) { document.title = 'À valider'; return; }
    const ms = restant(); const m = Math.floor(ms / 60000), sec = Math.floor((ms % 60000) / 1000);
    const t = String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    fc.textContent = t; fq.textContent = bloc.titre;
    document.getElementById('f-pause').textContent = bloc.marche ? 'Pause' : 'Reprendre';
    document.title = t + ' · ' + bloc.titre;
    fch.textContent = 'blocs finis aujourd’hui : ' + faits() + ' · chances que ça marche : ' + Math.min(95, 30 + faits()) + ' % (jeu, pas une prévision)';
  };
  document.querySelectorAll('.lancer').forEach((b) => b.onclick = () => {
    const li = b.closest('.t');
    if (bloc && bloc.id === li.dataset.id) { // même tâche : pause / reprise
      if (bloc.marche) { bloc.reste = restant(); bloc.marche = false; bloc.fin = 0; fa.pause(); }
      else { bloc.fin = Date.now() + bloc.reste; bloc.marche = true; jouer(); }
    } else {
      bloc = { id: li.dataset.id, titre: b.dataset.titre, fin: Date.now() + TRAVAIL, reste: TRAVAIL, marche: true };
      jouer();
    }
    sauverBloc(); peindreBloc();
  });
  document.getElementById('f-pause').onclick = () => { if (!bloc) return; if (bloc.marche) { bloc.reste = restant(); bloc.marche = false; bloc.fin = 0; fa.pause(); } else { bloc.fin = Date.now() + bloc.reste; bloc.marche = true; jouer(); } sauverBloc(); peindreBloc(); };
  document.getElementById('f-stop').onclick = () => { bloc = null; fa.pause(); sauverBloc(); peindreBloc(); };
  fm.addEventListener('change', () => { try { localStorage.setItem('pomo-musique', fm.value); } catch (_) {} if (bloc && bloc.marche) jouer(); });
  setInterval(() => {
    if (bloc && bloc.marche && restant() <= 0) {
      compterFait(); fa.pause();
      const titre = bloc.titre; bloc = null; sauverBloc(); peindreBloc();
      let n = 0; const id = setInterval(() => { document.title = (n % 2 ? '✅ ' : '') + 'Bloc fini — ' + titre; if (++n > 9) { clearInterval(id); peindreBloc(); } }, 700);
    } else peindreBloc();
  }, 1000);
  if (bloc && bloc.marche) { /* la musique ne peut pas repartir seule après rechargement : elle repart au prochain clic */ }
  peindreBloc();
})();
</script>
</body>
</html>
`);
console.log(`page écrite · ${taches.length} tâches`);
