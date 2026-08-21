// Lit les deux audits bruts et tranche : est-ce que mes sites sont meilleurs ?
//
// Le fichier brut mesure, celui-ci juge — et les deux sont séparés exprès.
// Les seuils ci-dessous sont discutables ; les mesures ne le sont pas. Si un
// seuil change, on rejoue l'analyse sans relancer 160 chargements de pages.
//
// Produit audit-resume.json, consommé par build-vue.mjs pour poser une
// pastille sur chaque fiche de la galerie.
import fs from 'fs';
import path from 'path';

const D = '/work/previsualisation/sites-clients';
const lire = f => fs.existsSync(path.join(D, f)) ? JSON.parse(fs.readFileSync(path.join(D, f), 'utf8')) : [];
const mes = lire('audit-mes.json');
const avant = lire('audit-avant.json');

// Un <a> encadré de 248 px de haut n'est pas un bouton, c'est une carte.
// Sans ce tri, chaque site avec une grille de cartes ressort en « bouton
// géant » et l'audit crie au loup partout.
const estBouton = b => b.h <= 110 && b.texte.length <= 32;

// Seuils. Justification de chacun :
//   72 px de haut  — au-delà, sur un écran de 844 px, un seul bouton occupe
//                    près d'un dixième de la hauteur visible.
//   police > 24 px — la taille d'un titre, pas d'un libellé d'action.
//   pleine largeur ET haut — un bouton pleine largeur est normal sur mobile ;
//                    c'est la combinaison avec la hauteur qui écrase la page.
const TROP_HAUT = 72, TROP_GROSSE_POLICE = 24;

function defauts(a) {
  if (!a || a.err) return null;
  const t = a.tel;
  const boutons = (t.boutons || []).filter(estBouton);
  const enormes = boutons.filter(b =>
    b.h > TROP_HAUT || b.police > TROP_GROSSE_POLICE || (b.partVw > 96 && b.h > 60));

  const d = {
    // Sous 8 px, c'est du bruit de sous-pixel et d'arrondi, pas un défaut visible.
    debordement: t.debordement >= 8 ? t.debordement : 0,
    debordementBureau: a.bureau && a.bureau.debordement >= 8 ? a.bureau.debordement : 0,
    pasDeViewport: !t.viewportMeta,
    // Une balise viewport présente mais qui interdit le zoom est un défaut
    // d'accessibilité réel : quelqu'un qui voit mal ne peut plus agrandir.
    zoomBloque: /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(t.viewportContenu || ''),
    boutonsEnormes: enormes.length,
    plusGrosBouton: enormes.sort((x, y) => y.h - x.h)[0] || null,
    ciblesPetites: t.ciblesPetites || 0,
    texteMin: t.texteMin,
    petitTexte: t.nPetitTexte || 0,
    nBoutons: boutons.length,
  };
  d.note = (d.debordement ? 1 : 0) + (d.pasDeViewport ? 1 : 0) + (d.zoomBloque ? 1 : 0)
         + (d.boutonsEnormes ? 1 : 0) + (d.ciblesPetites ? 1 : 0) + (d.petitTexte ? 1 : 0);
  return d;
}

const parDirAvant = Object.fromEntries(avant.map(a => [a.dir, a]));
const resume = {};
const lignes = [];

for (const m of mes) {
  const dm = defauts(m);
  const av = parDirAvant[m.dir];
  const da = defauts(av);
  const e = {
    nom: m.nom,
    err: m.err || null,
    mien: dm,
    leur: da,
    leurUrl: av ? av.url : null,
    // Verdict UNIQUEMENT quand on a mesuré les deux côtés avec la même sonde.
    // Comparer mon site à un domaine mort n'aurait aucun sens.
    verdict: (dm && da) ? (dm.note < da.note ? 'mieux' : dm.note > da.note ? 'moins bien' : 'egal') : null,
  };
  resume[m.dir] = e;
  lignes.push({ dir: m.dir, ...e });
}

fs.writeFileSync(path.join(D, 'audit-resume.json'), JSON.stringify(resume, null, 1));

// --- Restitution console ------------------------------------------------------
const ok = lignes.filter(l => l.mien);
const n = ok.length;
const cpt = f => ok.filter(f).length;

console.log(`\n  ${n} sites audités sur ${lignes.length}` + (lignes.length - n ? ` · ${lignes.length - n} en échec` : ''));
console.log(`\n  DÉFAUTS SUR MES SITES (téléphone, 390 px)`);
console.log(`    débordent horizontalement ....... ${cpt(l => l.mien.debordement)} / ${n}`);
console.log(`    sans balise viewport ............ ${cpt(l => l.mien.pasDeViewport)} / ${n}`);
console.log(`    zoom bloqué ..................... ${cpt(l => l.mien.zoomBloque)} / ${n}`);
console.log(`    au moins un bouton trop gros .... ${cpt(l => l.mien.boutonsEnormes)} / ${n}`);
console.log(`    cibles tactiles < 40 px ......... ${cpt(l => l.mien.ciblesPetites)} / ${n}`);
console.log(`    texte sous 12 px ................ ${cpt(l => l.mien.petitTexte)} / ${n}`);
console.log(`    débordent aussi en 1280 px ...... ${cpt(l => l.mien.debordementBureau)} / ${n}`);
console.log(`    AUCUN défaut .................... ${cpt(l => l.mien.note === 0)} / ${n}`);

const cmp = lignes.filter(l => l.verdict);
if (cmp.length) {
  console.log(`\n  COMPARAISON avec leur site actuel (${cmp.length} clients qui en ont un)`);
  ['mieux', 'egal', 'moins bien'].forEach(v => {
    const s = cmp.filter(l => l.verdict === v);
    console.log(`    ${v.padEnd(11)} : ${s.length}`);
  });
  const pires = cmp.filter(l => l.verdict === 'moins bien');
  if (pires.length) {
    console.log(`\n  MOINS BIEN QUE L'EXISTANT — à traiter en premier :`);
    pires.sort((a, b) => b.mien.note - a.mien.note).forEach(l =>
      console.log(`    ${l.nom.slice(0, 34).padEnd(35)} moi ${l.mien.note} défaut(s) · eux ${l.leur.note}`));
  }
}

console.log(`\n  PIRES DÉBORDEMENTS (téléphone) :`);
ok.filter(l => l.mien.debordement).sort((a, b) => b.mien.debordement - a.mien.debordement).slice(0, 12)
  .forEach(l => console.log(`    ${String(l.mien.debordement + ' px').padStart(7)}  ${l.nom}`));

console.log(`\n  BOUTONS LES PLUS GROS :`);
ok.filter(l => l.mien.plusGrosBouton).sort((a, b) => b.mien.plusGrosBouton.h - a.mien.plusGrosBouton.h).slice(0, 12)
  .forEach(l => { const b = l.mien.plusGrosBouton;
    console.log(`    ${String(b.h + ' px').padStart(7)} h · ${String(b.police).padStart(4)} px police · ${String(b.partVw).padStart(3)}% larg. · « ${b.texte} » — ${l.nom}`); });

console.log(`\n  audit-resume.json écrit\n`);
