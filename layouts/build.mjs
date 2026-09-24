/* La banque de layouts vidéo — page de validation mobile.
 *
 *   node /work/previsualisation/layouts/build.mjs   → layouts/index.html
 *
 * Données : table n8n « BanqueLayouts », via /layouts/api (proxy nginx derrière le
 * mot de passe du site, qui ajoute le secret du webhook). Rien de secret dans ce
 * fichier ni dans la page : le dépôt est public.
 * Si le proxy répond 503 (variable Coolify absente), la page demande le secret une
 * fois et appelle le webhook n8n en direct (text/plain, sans préflight CORS).
 *
 * Règles (appliquées par n8n, reflétées ici) : propose → valide / rejete ;
 * bloque seulement si les zones sont définies ; bloque est définitif.
 * La règle « zones complètes » et la liste des skills viennent de la banque
 * (_shared/banque-layouts/lib.mjs) : une seule définition.
 */
import fs from 'node:fs';
import { SKILLS, zonesCompletes } from '/work/autoboost-neon-videos/_shared/banque-layouts/lib.mjs';

const D = '/work/previsualisation/layouts';
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0a0a0f">
<title>Banque de layouts</title>
<style>
  :root{--fond:#0a0a0f;--surface:#111117;--filet:#232330;--texte:#EDEDED;--sourd:#8A8A8A;
        --jaune:#eab308;--violet:#8b5cf6;--erreur:#ff6b6b;--clair:#BEF264}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{background:var(--fond);color:var(--texte)}
  body{font:16px/1.5 Sora,system-ui,-apple-system,"Segoe UI",sans-serif;padding:20px 16px 110px;min-height:100vh}
  .w{max-width:860px;margin:0 auto}
  .eb{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--sourd)}
  h1{font-size:clamp(26px,7vw,38px);font-weight:800;letter-spacing:-.02em;line-height:1.08;margin:8px 0 6px}
  h1 b{color:var(--jaune)}
  .sous{color:var(--sourd);font-size:14.5px;max-width:60ch}
  .compte{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 14px}
  .compte span{font-size:12px;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--filet);border-radius:999px;padding:5px 10px;color:var(--sourd);font-variant-numeric:tabular-nums}
  .compte b{color:var(--texte)}
  .puces{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .puces::-webkit-scrollbar{display:none}
  .puces button{flex:none}
  button{font:inherit;font-size:14px;color:var(--texte);background:var(--surface);border:1px solid var(--filet);border-radius:10px;
         padding:9px 14px;min-height:44px;cursor:pointer;touch-action:manipulation}
  button[aria-pressed=true]{border-color:var(--jaune);color:var(--jaune);background:#1a1606}
  button:disabled{opacity:.45;cursor:not-allowed}
  button.oui{border-color:#6b5510;background:#231d05;color:#fde68a}
  button.non{border-color:#5b2a2a;background:#241212;color:#fca5a5}
  button.verrou{border-color:#4c3a86;background:#17122b;color:#c4b5fd}
  .grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:6px}
  @media (min-width:640px){.grille{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media (min-width:860px){.grille{grid-template-columns:repeat(4,minmax(0,1fr))}}
  .carte{background:var(--surface);border:1px solid var(--filet);border-radius:14px;overflow:hidden;cursor:pointer;position:relative;text-align:left;padding:0;min-height:0;display:block;width:100%}
  .vign{aspect-ratio:9/16;background:#07070b center/cover no-repeat;position:relative}
  .vign.vide{display:flex;align-items:center;justify-content:center;color:var(--sourd);font-size:12.5px;padding:10px;text-align:center}
  .carte .meta{padding:9px 10px 11px}
  .carte .nom{font-size:13px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .carte .sk{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--sourd);margin-top:4px}
  .badge{position:absolute;top:8px;left:8px;font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;border-radius:999px;padding:4px 8px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  .b-propose{background:rgba(17,17,23,.85);color:var(--texte);border:1px solid var(--filet)}
  .b-valide{background:rgba(35,29,5,.9);color:var(--jaune);border:1px solid #6b5510}
  .b-bloque{background:rgba(23,18,43,.92);color:#c4b5fd;border:1px solid var(--violet)}
  .b-rejete{background:rgba(36,18,18,.9);color:#fca5a5;border:1px solid #5b2a2a}
  .b-echec{background:rgba(36,18,18,.9);color:var(--erreur);border:1px solid #5b2a2a}
  .b-encours{background:rgba(17,17,23,.85);color:var(--sourd);border:1px dashed var(--filet)}
  .carte.rejete .vign{filter:grayscale(1) brightness(.5)}
  .nz{position:absolute;bottom:8px;left:8px;right:8px;font-size:10.5px;color:var(--sourd);background:rgba(10,10,15,.8);border-radius:8px;padding:3px 7px;text-align:center}
  .vide-liste{color:var(--sourd);font-size:14px;padding:26px 4px;grid-column:1/-1}
  .nouveau{background:var(--surface);border:1px solid var(--filet);border-left:3px solid var(--jaune);border-radius:14px;padding:14px;margin:6px 0 20px}
  .nouveau summary{cursor:pointer;font-weight:700;list-style:none;min-height:28px}
  .nouveau summary::-webkit-details-marker{display:none}
  .nouveau summary::after{content:" +";color:var(--jaune)}
  .nouveau[open] summary::after{content:" −"}
  .champ{display:flex;flex-direction:column;gap:6px;margin-top:12px}
  .champ label{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--sourd)}
  select,textarea,input{font:inherit;font-size:16px;color:var(--texte);background:#0b0b10;border:1px solid var(--filet);border-radius:10px;padding:11px 12px;width:100%}
  textarea{min-height:84px;resize:vertical}
  select:focus,textarea:focus,input:focus{outline:0;border-color:var(--jaune)}
  .ligne{display:flex;gap:10px;align-items:flex-end;margin-top:12px;flex-wrap:wrap}
  .ligne .champ{margin:0;flex:1;min-width:120px}
  .dit{font-size:13.5px;color:var(--sourd);margin-top:10px;min-height:1em}
  .dit.ko{color:var(--erreur)}
  .bandeau{position:fixed;left:0;right:0;bottom:0;background:rgba(10,10,15,.94);border-top:1px solid var(--filet);padding:10px 16px calc(10px + env(safe-area-inset-bottom));font-size:13px;color:var(--sourd);text-align:center;z-index:5}
  /* Visionneuse plein écran */
  .vis{position:fixed;inset:0;background:rgba(5,5,8,.97);z-index:10;display:none;flex-direction:column}
  .vis.on{display:flex}
  .vis-haut{display:flex;align-items:center;gap:10px;padding:10px 12px;padding-top:calc(10px + env(safe-area-inset-top))}
  .vis-haut .t{flex:1;min-width:0;font-size:13.5px;line-height:1.3}
  .vis-haut .t small{display:block;color:var(--sourd);font-size:11px;letter-spacing:.1em;text-transform:uppercase}
  .scene{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;touch-action:pan-y}
  .cadre{position:relative;height:100%;max-height:calc(100vh - 190px);aspect-ratio:9/16;max-width:92vw;transition:transform .22s ease}
  .cadre img{width:100%;height:100%;object-fit:contain;border-radius:12px;display:block;background:#07070b;user-select:none;-webkit-user-drag:none}
  .cadre svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
  .indice{position:absolute;top:18px;font-weight:800;font-size:18px;letter-spacing:.12em;padding:6px 12px;border-radius:10px;opacity:0;transition:opacity .1s}
  .indice.g{left:18px;color:#fca5a5;border:2px solid #fca5a5;transform:rotate(-8deg)}
  .indice.d{right:18px;color:var(--jaune);border:2px solid var(--jaune);transform:rotate(8deg)}
  .vis-bas{padding:10px 12px calc(12px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px}
  .actes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
  .actes button{min-height:50px;font-weight:700}
  .note{font-size:12.5px;color:var(--sourd);text-align:center;min-height:1em}
  .note.ko{color:var(--erreur)}
  .fermer{background:none;border:1px solid var(--filet);min-width:44px}
  .nav{display:flex;gap:8px}
  .sceau{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#c4b5fd;word-break:break-all;text-align:center}
</style>
</head>
<body>
<div class="w">
  <div class="eb">AutomatisationBoost · skills vidéo</div>
  <h1>Banque de <b>layouts</b></h1>
  <p class="sous">Glisse à droite pour valider, à gauche pour rejeter. Un layout <b>bloqué</b> devient une référence fixe : plus rien ne le change. Pour bloquer, il faut d’abord que ses zones soient posées.</p>
  <div class="compte" id="compte"></div>
  <details class="nouveau" id="nouveau">
    <summary>Nouveau layout</summary>
    <div class="champ"><label for="n-skill">Skill vidéo</label>
      <select id="n-skill">${Object.keys(SKILLS).map((s) => `<option value="${s}">${s}</option>`).join('')}</select></div>
    <div class="champ"><label for="n-idee">Description</label>
      <textarea id="n-idee" placeholder="Ex : split vertical, avant à gauche désaturé, après à droite, avatar en petit cercle en bas"></textarea></div>
    <div class="ligne">
      <div class="champ"><label for="n-n">Nombre</label>
        <select id="n-n"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></div>
      <button type="button" class="oui" id="n-ok">Générer</button>
    </div>
    <p class="dit" id="n-dit">WaveSpeed seedream-v4 · ~0,03 $ l’image · 30 à 60 s chacune.</p>
  </details>
  <div class="puces" id="f-skill"></div>
  <div class="puces" id="f-statut"></div>
  <div class="grille" id="grille"><p class="vide-liste">Chargement…</p></div>
</div>

<div class="vis" id="vis" role="dialog" aria-modal="true">
  <div class="vis-haut">
    <button type="button" class="fermer" id="v-fermer" aria-label="Fermer">✕</button>
    <div class="t" id="v-titre"></div>
    <div class="nav">
      <button type="button" id="v-zones" aria-pressed="false">Zones</button>
    </div>
  </div>
  <div class="scene" id="scene">
    <div class="cadre" id="cadre"><img id="v-img" alt=""><svg id="v-svg" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid meet"></svg>
      <span class="indice g" id="i-g">REJETER</span><span class="indice d" id="i-d">VALIDER</span></div>
  </div>
  <div class="vis-bas">
    <div class="actes" id="v-actes">
      <button type="button" class="non" data-v="rejete">Rejeter</button>
      <button type="button" class="oui" data-v="valide">Valider</button>
      <button type="button" class="verrou" data-v="bloque">🔒 Bloquer</button>
    </div>
    <p class="note" id="v-note"></p>
    <p class="sceau" id="v-sceau"></p>
  </div>
</div>
<div class="bandeau" id="bandeau">Connexion à la banque…</div>

<script>
(() => {
  const API = '/layouts/api';
  const DIRECT = 'https://n7n.automatisationboost.com/webhook/banque-layouts';
  const LIB = { propose: 'À valider', valide: 'Validé', bloque: 'Bloqué', rejete: 'Rejeté' };
  ${zonesCompletes.toString()}
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lire = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const ecrire = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  const parse = (s) => { try { return s ? JSON.parse(s) : {}; } catch (e) { return {}; } };

  let layouts = [];
  let enCours = [];               // lids demandés, pas encore dans la table
  let fSkill = lire('bl-skill') || 'tous';
  let fStatut = lire('bl-statut') || 'ouverts';
  let direct = false;             // proxy indisponible → appel direct avec secret saisi
  let courant = null;             // lid ouvert dans la visionneuse
  let voirZones = false;

  async function appeler(action, charge) {
    const corps = Object.assign({ action }, charge || {});
    if (!direct) {
      try {
        const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(corps), credentials: 'same-origin' });
        if (r.status !== 503 && r.status !== 404 && r.status !== 405) {
          const j = await r.json().catch(() => ({ ok: false, erreur: 'réponse illisible (' + r.status + ')' }));
          return j;
        }
      } catch (e) {}
      direct = true;
    }
    let s = lire('bl-secret');
    if (!s) { s = prompt('Le proxy de la page est indisponible. Colle le secret de la banque (~/.config/autoboost/banque-layouts.secret) :'); if (!s) return { ok: false, erreur: 'secret requis' }; }
    corps.secret = s.trim();
    const r = await fetch(DIRECT, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(corps) });
    const j = await r.json().catch(() => ({ ok: false, erreur: 'réponse illisible' }));
    if (j.erreur === 'secret invalide') ecrire('bl-secret', null); else ecrire('bl-secret', corps.secret);
    return j;
  }

  const statutDe = (l) => l.erreur ? 'echec' : l.statut;
  const zonesOk = (l) => zonesCompletes(parse(l.zones));

  function puces() {
    const sk = ['tous'].concat([...new Set(layouts.map((l) => l.skill))].sort());
    $('f-skill').innerHTML = sk.map((s) => '<button type="button" data-s="' + esc(s) + '" aria-pressed="' + (s === fSkill) + '">' + (s === 'tous' ? 'Tous les skills' : esc(s)) + '</button>').join('');
    const st = [['ouverts', 'À traiter'], ['valide', 'Validés'], ['bloque', 'Bloqués'], ['rejete', 'Rejetés'], ['tout', 'Tout']];
    $('f-statut').innerHTML = st.map(([k, t]) => '<button type="button" data-f="' + k + '" aria-pressed="' + (k === fStatut) + '">' + t + '</button>').join('');
  }
  $('f-skill').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; fSkill = b.dataset.s; ecrire('bl-skill', fSkill); peindre(); };
  $('f-statut').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; fStatut = b.dataset.f; ecrire('bl-statut', fStatut); peindre(); };

  function visibles() {
    return layouts.filter((l) => (fSkill === 'tous' || l.skill === fSkill) && (
      fStatut === 'tout' || (fStatut === 'ouverts' ? (l.statut === 'propose' || !!l.erreur) : (l.statut === fStatut && !l.erreur))));
  }

  function peindre() {
    puces();
    const n = (s) => layouts.filter((l) => !l.erreur && l.statut === s).length;
    $('compte').innerHTML = '<span><b>' + n('propose') + '</b> à valider</span><span><b>' + n('valide') + '</b> validés</span><span><b>' + n('bloque') + '</b> bloqués</span><span><b>' + n('rejete') + '</b> rejetés</span>';
    const v = visibles();
    const attente = enCours.filter((lid) => !layouts.some((l) => l.lid === lid) && (fSkill === 'tous' || lid.startsWith(fSkill + '/')));
    let h = attente.map((lid) => '<div class="carte"><div class="vign vide">génération en cours…<br>' + esc(lid.split('/')[1]) + '</div><span class="badge b-encours">En cours</span><div class="meta"><div class="sk">' + esc(lid.split('/')[0]) + '</div></div></div>').join('');
    h += v.map((l) => {
      const st = statutDe(l);
      const img = l.image_url ? ' style="background-image:url(&quot;' + esc(l.image_url) + '&quot;)"' : '';
      return '<button type="button" class="carte ' + st + '" data-lid="' + esc(l.lid) + '">' +
        '<div class="vign' + (l.image_url ? '' : ' vide') + '"' + img + '>' + (l.image_url ? '' : (l.erreur ? esc(l.erreur) : 'pas d’image')) +
        (!l.erreur && l.statut !== 'bloque' && l.statut !== 'rejete' && !zonesOk(l) ? '<span class="nz">zones à définir</span>' : '') + '</div>' +
        '<span class="badge b-' + st + '">' + (st === 'echec' ? 'Échec' : (st === 'bloque' ? '🔒 ' : '') + LIB[st]) + '</span>' +
        '<div class="meta"><div class="nom">' + esc(l.nom || l.lid) + '</div><div class="sk">' + esc(l.skill) + ' · ' + esc(l.source || '') + '</div></div></button>';
    }).join('');
    $('grille').innerHTML = h || '<p class="vide-liste">Rien ici pour ce filtre.</p>';
    if (courant) ouvrir(courant, true);
  }
  $('grille').onclick = (e) => { const c = e.target.closest('.carte[data-lid]'); if (c) ouvrir(c.dataset.lid); };

  async function charger(silencieux) {
    const j = await appeler('list');
    if (!j.ok) { $('bandeau').textContent = 'Banque injoignable : ' + (j.erreur || 'erreur'); return; }
    layouts = j.layouts || [];
    enCours = enCours.filter((lid) => !layouts.some((l) => l.lid === lid));
    peindre();
    $('bandeau').innerHTML = '<b>' + layouts.length + '</b> layouts · à jour ' + new Date(j.maj).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + (direct ? ' · mode direct' : '');
  }

  /* Visionneuse + glisser */
  function dessinerZones(l) {
    const z = parse(l.zones), s = [];
    const r = (o, c, t) => { if (!o || !(o.w > 0)) return; const h = o.h > 0 ? o.h : 200;
      s.push('<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + h + '" rx="' + (o.forme === 'cercle' ? o.w / 2 : 16) + '" fill="' + c + '" fill-opacity=".14" stroke="' + c + '" stroke-width="8"/><text x="' + (o.x + 18) + '" y="' + (o.y + 58) + '" fill="' + c + '" font-size="46" font-weight="800" font-family="sans-serif">' + t + '</text>'); };
    r(z.avatar, '#22d3ee', 'AVATAR'); r(z.contenu, '#f472b6', 'CONTENU'); r(z.texte_haut, '#eab308', 'TEXTE');
    if (z.sous_titres && typeof z.sous_titres.y === 'number') s.push('<line x1="0" x2="1080" y1="' + z.sous_titres.y + '" y2="' + z.sous_titres.y + '" stroke="#fff" stroke-width="6" stroke-dasharray="26 16"/>');
    if (z.separateur && typeof z.separateur.x === 'number') s.push('<line y1="0" y2="1920" x1="' + z.separateur.x + '" x2="' + z.separateur.x + '" stroke="#fb923c" stroke-width="8"/>');
    return s.join('');
  }
  function ouvrir(lid, rafraichir) {
    const l = layouts.find((x) => x.lid === lid); if (!l) { fermer(); return; }
    courant = lid;
    $('vis').classList.add('on'); document.body.style.overflow = 'hidden';
    $('v-titre').innerHTML = '<small>' + esc(l.skill) + ' · ' + esc(statutDe(l) === 'echec' ? 'échec' : LIB[l.statut]) + '</small>' + esc(l.nom || l.lid);
    if (!rafraichir || $('v-img').dataset.src !== l.image_url) { $('v-img').src = l.image_url || ''; $('v-img').dataset.src = l.image_url || ''; }
    $('v-svg').innerHTML = voirZones ? dessinerZones(l) : '';
    $('v-zones').setAttribute('aria-pressed', String(voirZones));
    const bloque = l.statut === 'bloque', ok = zonesOk(l);
    const [bR, bV, bB] = $('v-actes').querySelectorAll('button');
    bR.disabled = bloque || l.statut === 'rejete'; bV.disabled = bloque || !!l.erreur || l.statut === 'valide';
    bB.disabled = bloque || !!l.erreur || !ok || l.statut === 'rejete';
    bR.textContent = l.erreur ? 'Effacer' : 'Rejeter';
    if (l.erreur) bR.disabled = false;
    $('v-actes').style.display = bloque ? 'none' : '';
    $('v-note').className = 'note' + (l.erreur ? ' ko' : '');
    $('v-note').textContent = l.erreur ? l.erreur
      : bloque ? 'Bloqué le ' + new Date(l.bloque_le).toLocaleString('fr-FR') + ' — définitif.'
      : !ok ? '🔒 zones à définir : lance « node zones.mjs ' + l.lid + ' » puis --appliquer et --envoyer.'
      : l.statut === 'rejete' ? 'Rejeté. Il reste dans la banque, hors des filtres ouverts.'
      : 'Glisse → pour valider, ← pour rejeter.';
    $('v-sceau').textContent = bloque && l.sha256 ? 'sha256 ' + l.sha256 : '';
  }
  function fermer() { courant = null; $('vis').classList.remove('on'); document.body.style.overflow = ''; }
  $('v-fermer').onclick = fermer;
  $('v-zones').onclick = () => { voirZones = !voirZones; if (courant) ouvrir(courant, true); };
  document.addEventListener('keydown', (e) => { if (!courant) return; if (e.key === 'Escape') fermer(); if (e.key === 'ArrowRight') decider('valide'); if (e.key === 'ArrowLeft') decider('rejete'); });

  async function decider(vers) {
    const l = layouts.find((x) => x.lid === courant); if (!l) return;
    if (l.statut === 'bloque') return;
    if (l.erreur) { vers = 'effacer'; }
    if (vers === 'bloque' && !confirm('Bloquer « ' + (l.nom || l.lid) + ' » ? C’est définitif : le layout ne pourra plus jamais changer.')) return;
    $('v-note').className = 'note'; $('v-note').textContent = 'Enregistrement…';
    const j = vers === 'effacer' ? await appeler('effacer', { lid: l.lid }) : await appeler('statut', { lid: l.lid, statut: vers });
    if (!j.ok) { $('v-note').className = 'note ko'; $('v-note').textContent = 'Refusé : ' + (j.erreur || 'erreur'); return; }
    const suivant = visibles().map((x) => x.lid); const i = suivant.indexOf(l.lid);
    await charger(true);
    const reste = visibles().map((x) => x.lid).filter((x) => x !== l.lid);
    const prochain = (fStatut === 'ouverts' && vers !== 'bloque') ? (suivant.slice(i + 1).find((x) => reste.includes(x)) || null) : l.lid;
    if (vers === 'effacer') { fermer(); return; }
    if (prochain && layouts.some((x) => x.lid === prochain)) ouvrir(prochain); else if (layouts.some((x) => x.lid === l.lid) && fStatut !== 'ouverts') ouvrir(l.lid); else fermer();
  }
  $('v-actes').onclick = (e) => { const b = e.target.closest('button'); if (b && !b.disabled) decider(b.dataset.v); };

  // Glisser (pointer events : doigt et souris)
  let x0 = null, dx = 0;
  const cadre = $('cadre');
  $('scene').addEventListener('pointerdown', (e) => { x0 = e.clientX; dx = 0; cadre.style.transition = 'none'; });
  window.addEventListener('pointermove', (e) => {
    if (x0 == null) return; dx = e.clientX - x0;
    cadre.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 30) + 'deg)';
    $('i-d').style.opacity = Math.max(0, Math.min(1, dx / 110)); $('i-g').style.opacity = Math.max(0, Math.min(1, -dx / 110));
  });
  window.addEventListener('pointerup', () => {
    if (x0 == null) return; x0 = null;
    cadre.style.transition = ''; cadre.style.transform = ''; $('i-d').style.opacity = 0; $('i-g').style.opacity = 0;
    const l = layouts.find((x) => x.lid === courant);
    if (!l || l.statut === 'bloque' || l.erreur) return;
    if (dx > 110 && l.statut !== 'valide') decider('valide');
    else if (dx < -110 && l.statut !== 'rejete') decider('rejete');
  });

  // Nouveau layout
  $('n-skill').value = fSkill !== 'tous' && [...$('n-skill').options].some((o) => o.value === fSkill) ? fSkill : $('n-skill').value;
  $('n-ok').onclick = async () => {
    const idee = $('n-idee').value.trim();
    const d = $('n-dit'); d.className = 'dit';
    if (idee.length < 4) { d.className = 'dit ko'; d.textContent = 'Décris le layout en une phrase.'; return; }
    $('n-ok').disabled = true; d.textContent = 'Envoi…';
    const j = await appeler('generer', { skill: $('n-skill').value, idee, n: +$('n-n').value });
    $('n-ok').disabled = false;
    if (!j.ok) { d.className = 'dit ko'; d.textContent = 'Refusé : ' + (j.erreur || 'erreur'); return; }
    enCours = enCours.concat(j.en_cours || []);
    d.textContent = j.message + '. Les cartes apparaissent ci-dessous.';
    $('n-idee').value = '';
    fStatut = 'ouverts'; peindre();
    let k = 0; const t = setInterval(async () => { k++; await charger(true); if (!enCours.length || k > 24) clearInterval(t); }, 10000);
  };

  charger();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) charger(true); });
})();
</script>
</body>
</html>
`;
fs.writeFileSync(`${D}/index.html`, html);
console.log('écrit', `${D}/index.html`, (html.length / 1024).toFixed(1) + ' Ko');
