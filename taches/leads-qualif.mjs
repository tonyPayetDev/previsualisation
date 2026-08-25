/* Qualifier les leads par l'état RÉEL de leur site web.
 *
 * 565 numéros, c'est inappelable. Ce qui manque n'est pas de la donnée, c'est
 * un ordre — et surtout une raison d'appeler celui-là plutôt qu'un autre.
 *
 * Le signal est gratuit et c'est exactement l'argument de vente de Tony : on
 * mesure ce qui cloche sur leur site. Quatre défauts, tous vérifiables, tous
 * énonçables au téléphone en une phrase :
 *
 *   · le site ne répond plus        → « votre site est hors ligne »
 *   · pas de HTTPS                  → « Chrome affiche “non sécurisé” »
 *   · pas de balise viewport        → « illisible sur téléphone »
 *   · dernier copyright ancien      → « votre site date de 2019 »
 *
 * Rien n'est déduit ni supposé : chaque défaut vient d'une requête réelle,
 * et la phrase d'accroche cite le défaut constaté.
 */
import fs from 'node:fs';
import path from 'node:path';

const R = '/work/previsualisation/leads-restaurants';
const leads = JSON.parse(fs.readFileSync(path.join(R, 'leads.json'), 'utf8'));
const avecSite = leads.filter((l) => l.site);
console.log(`  ${leads.length} leads · ${avecSite.length} avec un site à tester\n`);

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; AutomatisationBoost/1.0; +https://automatisationboost.com)' };
const ANNEE = new Date().getFullYear();

const nettoie = (u) => u.replace(/\/+$/, '');

async function tester(site) {
  const nu = nettoie(site).replace(/^https?:\/\//, '');
  const d = { httpsOk: false, httpOk: false, code: null, html: null, erreur: null };

  /* On essaie HTTPS d'abord : son absence est en soi un défaut vendable. */
  for (const [proto, cle] of [['https', 'httpsOk'], ['http', 'httpOk']]) {
    try {
      const r = await fetch(`${proto}://${nu}`, { redirect: 'follow', headers: UA, signal: AbortSignal.timeout(15000) });
      if (r.ok) {
        d[cle] = true;
        d.code = r.status;
        if (!d.html) d.html = (await r.text()).slice(0, 400000);
      } else if (d.code === null) d.code = r.status;
    } catch (e) { if (!d.erreur) d.erreur = e.name; }
  }
  return d;
}

/* ⚠️ Une page Facebook n'est PAS un site web, et il ne faut surtout pas la
   tester comme tel. Facebook rend un mur de connexion aux robots : ma
   première version en concluait « aucune balise viewport, illisible sur
   téléphone » — sur trois établissements dont la page Facebook est
   parfaitement lisible au téléphone. Trois accroches fausses, et un appel
   grillé dès la première phrase.
   C'est en réalité le MEILLEUR argument : ils n'ont pas de site du tout. */
/* Le test porte sur le NOM D'HÔTE, pas sur l'URL entière. Ancré sur l'URL,
   le motif `(^|\.)facebook\.com` laissait passer `https://facebook.com/x`
   (précédé de « // », ni début de chaîne ni point) et le classait « pas adapté
   au mobile ». Un cas sur quatre y échappait en silence. */
const SOCIAL = /^(www\.|fr-fr\.|m\.)?(facebook|fb)\.com$|^(www\.)?instagram\.com$|linktr\.ee$|\.business\.site$|^(www\.)?google\.[a-z.]+$/i;
const hote = (u) => {
  try { return new URL(/^https?:/.test(u) ? u : 'https://' + u).hostname; }
  catch { return String(u).replace(/^https?:\/\//, '').split('/')[0]; }
};

const resultats = [];
let n = 0;
for (const l of avecSite) {
  n++;

  if (SOCIAL.test(hote(l.site))) {
    const quoi = /facebook|fb\.com/i.test(l.site) ? 'une page Facebook'
      : /instagram/i.test(l.site) ? 'un compte Instagram'
      : 'une fiche Google';
    resultats.push({
      ...l, score: 5,
      defauts: [{ code: 'social', poids: 5, phrase: `pas de site — seulement ${quoi}` }],
    });
    if (n % 25 === 0) process.stdout.write(`\r  ${n}/${avecSite.length} testés · ${resultats.length} avec un défaut`);
    continue;
  }

  const d = await tester(l.site);
  const defauts = [];

  if (!d.httpsOk && !d.httpOk) {
    defauts.push({ code: 'mort', poids: 4, phrase: d.code ? `site hors ligne (HTTP ${d.code})` : `site injoignable (${d.erreur || 'aucune réponse'})` });
  } else {
    if (!d.httpsOk && d.httpOk) defauts.push({ code: 'https', poids: 3, phrase: 'pas de HTTPS — Chrome affiche « non sécurisé »' });
    const h = d.html || '';
    if (h && !/<meta[^>]+name=["']viewport["']/i.test(h)) {
      defauts.push({ code: 'mobile', poids: 3, phrase: 'aucune balise viewport — illisible sur téléphone' });
    }
    /* Année de copyright : on prend la PLUS RÉCENTE trouvée, sinon un
       « © 2003 » isolé dans une mention légale ferait crier au site mort. */
    const annees = [...h.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,20}(20[0-2][0-9])/gi)].map((m) => Number(m[1]));
    if (annees.length) {
      const recente = Math.max(...annees);
      /* Seuil à 4 ans, pas 3 : un pied de page « © 2023 » en 2026 est banal
         sur un site pourtant tenu à jour — beaucoup n'actualisent jamais
         l'année. Annoncer « votre site date de 2023 » à quelqu'un qui l'a
         refait l'an dernier grille l'appel. */
      if (ANNEE - recente >= 4) defauts.push({ code: 'date', poids: 2, phrase: `dernière mise à jour affichée : ${recente}` });
    }
  }

  if (defauts.length) {
    defauts.sort((a, b) => b.poids - a.poids);
    resultats.push({ ...l, score: defauts.reduce((s, x) => s + x.poids, 0), defauts });
  }
  if (n % 25 === 0) process.stdout.write(`\r  ${n}/${avecSite.length} testés · ${resultats.length} avec un défaut`);
}
console.log(`\r  ${n}/${avecSite.length} testés · ${resultats.length} avec au moins un défaut\n`);

resultats.sort((a, b) => b.score - a.score || a.nom.localeCompare(b.nom));

const parType = {};
for (const r of resultats) for (const d of r.defauts) parType[d.code] = (parType[d.code] || 0) + 1;
const LIB = { social: 'pas de site propre', mort: 'site hors ligne', https: 'pas de HTTPS',
  mobile: 'pas adapté au mobile', date: 'site daté' };
for (const [k, v] of Object.entries(parType).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)}  ${LIB[k]}`);

/* ── La page ───────────────────────────────────────────────────────────── */
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telBrut = (t) => t.replace(/[^\d+]/g, '');
const lien = (s) => (/^https?:/.test(s) ? s : 'https://' + s);

const carte = (x, rang) => `  <div class="l ${x.score >= 4 ? 'fort' : ''}">
    <div class="hd"><span class="rang">${rang}</span><b>${esc(x.nom)}</b>
      <span class="g">${esc(x.genre)}${x.ville ? ' · ' + esc(x.ville) : ''}</span></div>
    <ul class="d">${x.defauts.map((d) => `<li>${esc(d.phrase)}</li>`).join('')}</ul>
    <div class="phrase">${x.defauts[0].code === 'social'
      ? `« Bonjour, Tony PAYET. J'ai cherché le site de ${esc(x.nom)} et je n'en ai trouvé aucun — seulement votre page. Je peux vous en montrer un, sans engagement. »`
      : `« Bonjour, Tony PAYET. J'ai regardé le site de ${esc(x.nom)} : ${esc(x.defauts[0].phrase)}. Je peux vous montrer ce que ça donnerait corrigé, sans engagement. »`}</div>
    <div class="act">
      <a class="tel" href="tel:${esc(telBrut(x.tel))}">${esc(x.tel)}</a>
      <a href="${esc(lien(x.site))}" target="_blank" rel="noopener">voir le site</a>
      ${x.mail ? `<a href="mailto:${esc(x.mail)}">email</a>` : ''}
    </div>
  </div>`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Leads qualifiés — par défaut de site</title>
<style>
:root{--noir:#0f1115;--carte:#171a21;--ligne:#262b36;--blanc:#eef1f6;--gris:#8b93a3;
      --vert:#3BC47D;--chaud:#F5A524;--rouge:#C2444C}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--noir);color:var(--blanc);
  font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:20px 14px 70px}
.wrap{max-width:760px;margin:0 auto}
.sur{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gris)}
h1{font-size:clamp(25px,6vw,34px);line-height:1.08;font-weight:800;letter-spacing:-.03em;margin:8px 0 12px}
.intro{color:var(--gris);font-size:14.5px;line-height:1.7}
.intro b{color:var(--blanc)}
.compte{display:flex;gap:15px;flex-wrap:wrap;margin:16px 0 6px;padding:13px 15px;background:var(--carte);
  border:1px solid var(--ligne);border-radius:11px;font-size:12.5px;color:var(--gris)}
.compte b{display:block;color:var(--blanc);font-size:21px;line-height:1.2}
.compte .v b{color:var(--vert)} .compte .r b{color:var(--rouge)}
h2{font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;
  margin:28px 0 10px;color:var(--chaud)}
.l{background:var(--carte);border:1px solid var(--ligne);border-left:3px solid var(--ligne);
  border-radius:10px;padding:12px 14px;margin-bottom:9px}
.l.fort{border-left-color:var(--rouge)}
.hd{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.rang{font-size:12px;color:var(--gris);font-variant-numeric:tabular-nums}
.hd b{font-size:15.5px}
.g{font-size:11.5px;color:var(--gris);text-transform:uppercase;letter-spacing:.07em}
.d{margin:8px 0 0;padding-left:18px;font-size:13.5px;color:#d8a8ac;line-height:1.6}
.phrase{margin-top:9px;padding:9px 11px;background:#0b0d11;border:1px solid var(--ligne);
  border-radius:8px;font-size:13px;line-height:1.6;color:var(--gris)}
.act{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}
.act a{font-size:13px;text-decoration:none;border:1px solid var(--ligne);border-radius:7px;
  padding:6px 11px;color:var(--blanc)}
.act a.tel{border-color:rgba(59,196,125,.45);color:var(--vert)}
.pied{margin-top:26px;color:var(--gris);font-size:13px;line-height:1.7}
.pied b{color:var(--blanc)}
</style></head><body><div class="wrap">

<p class="sur">Prospection — qualifiée</p>
<h1>${resultats.length} restaurants dont le site cloche</h1>
<p class="intro">Sur les <b>${avecSite.length}</b> établissements qui ont un site, chacun a été
<b>appelé en HTTP</b> pour mesurer quatre défauts vendables. Rien n'est supposé : la phrase
d'accroche cite le défaut réellement constaté. Les plus atteints d'abord.</p>

<div class="compte">
  <span class="r"><b>${resultats.filter((r) => r.score >= 4).length}</b>défaut lourd</span>
  <span><b>${resultats.length}</b>avec un défaut</span>
  <span><b>${avecSite.length}</b>sites testés</span>
  <span class="v"><b>${leads.length}</b>leads au total</span>
</div>

<p class="intro" style="margin-top:14px">Les ${leads.length - resultats.length} autres restent
sur <a href="../leads-restaurants/" style="color:var(--vert)">la liste complète</a> — un site sain
n'est pas une mauvaise cible, c'est juste une accroche plus difficile.</p>

<h2>À appeler en premier</h2>
${resultats.slice(0, 25).map((x, i) => carte(x, i + 1)).join('\n')}

${resultats.length > 25 ? `<h2>Le reste — ${resultats.length - 25}</h2>
${resultats.slice(25).map((x, i) => carte(x, i + 26)).join('\n')}` : ''}

<p class="pied">Défauts mesurés le ${new Date().toLocaleString('fr-FR', { timeZone: 'Indian/Reunion', dateStyle: 'short', timeStyle: 'short' })} :
un site peut avoir été réparé depuis. <b>Vérifie en cliquant « voir le site » avant d'appeler</b> —
annoncer un défaut corrigé fait mauvais effet.<br>
Régénérer : <code>node previsualisation/taches/leads-qualif.mjs</code></p>
</div></body></html>`;

const D = '/work/previsualisation/leads-qualifies';
fs.mkdirSync(D, { recursive: true });
fs.writeFileSync(path.join(D, 'index.html'), html);
fs.writeFileSync(path.join(D, 'qualifies.json'), JSON.stringify(resultats, null, 2));
console.log(`\n  page écrite : ${D}/index.html`);
