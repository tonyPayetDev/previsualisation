#!/usr/bin/env node
/* Fabrique DEUX livrables a partir de index.html :
 *   · integration/bloc-elementor.html — le fragment a coller dans un widget
 *     HTML Elementor (methode C) ;
 *   · export/koytcha-accueil.html — la page complete et autonome (methode A).
 *
 *
 * On genere plutot qu on recopie : la page evolue (ordre des realisations,
 * etat des boutons, animations), et un bloc recopie a la main aurait diverge
 * des la premiere correction. Relancer ce script apres chaque modification :
 *   node integration/faire-bloc-elementor.mjs
 *
 * Le bloc contient : un <style> de compatibilite Elementor, les deux feuilles
 * de style de la page, puis tout le contenu du <body>. Pas de <html>, pas de
 * <head> : un widget HTML Elementor vit deja dans une page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'index.html');
const OUT = path.join(HERE, 'bloc-elementor.html');
const EXPORT = path.join(HERE, '..', 'export', 'koytcha-accueil.html');
const COMPAT = path.join(HERE, 'compat-elementor.html');

const h = fs.readFileSync(SRC, 'utf8');
const iHead = h.indexOf('<!-- ORDRE IMPORTANT');
const iFinHead = h.indexOf('</head>');
const iBody = h.indexOf('>', h.indexOf('<body')) + 1;
const iFinBody = h.lastIndexOf('</body>');
if (iHead < 0 || iFinHead < 0 || iBody < 1 || iFinBody < 0) {
  console.error('structure inattendue dans index.html — bloc non genere');
  process.exit(1);
}
/* Les chemins sont relatifs dans index.html (`assets/…`), ce qui marche tant
 * que le fichier reste dans son dossier. Colle dans une page WordPress, un
 * chemin relatif se resout par rapport a l URL de la page : /mon-accueil/
 * cherche /mon-accueil/assets/logo.webp, qui n existe pas — logo casse, photo
 * de fond absente. On les rend donc absolus. Une fois les images televersees
 * dans la mediatheque, remplacer BASE par l URL du site : c est la meme chaine
 * partout, un rechercher/remplacer suffit. */
const BASE = process.env.KOYTCHA_BASE
  || 'https://previsualisation.automatisationboost.com/koytcha-refonte-v5/';
const absolu = (t) => t
  .replace(/(src|href)="(?!https?:|data:|#|\/)([^"]+)"/g, (m, a, u) => `${a}="${BASE}${u}"`)
  .replace(/srcset="([^"]+)"/g, (m, v) => 'srcset="' + v.split(',').map((d) => {
    const s = d.trim();
    return /^(https?:|data:|\/)/.test(s) ? s : BASE + s;
  }).join(', ') + '"')
  .replace(/url\((?!['"]?(?:https?:|data:|#|\/))['"]?([^)'"]+)['"]?\)/g, (m, u) => `url(${BASE}${u})`);

/* Le <meta charset> doit etre le TOUT PREMIER octet du fichier, avant meme le
 * commentaire d en-tete : le navigateur ne renifle l encodage que dans les 1024
 * premiers octets du flux. Place plus bas, il arrive trop tard et les accents
 * sortent en Ã©. Dans un widget Elementor la balise est simplement ignoree —
 * elle ne sert que si quelqu un ouvre ce fichier directement pour le copier,
 * ce qui est justement l usage prevu. */
/* La page complete : meme fichier, chemins rendus absolus, rien d autre.
 * Elle etait fabriquee a la main et avait pris huit versions de retard — d ou
 * sa regeneration ici, dans le meme geste que le bloc. */
fs.mkdirSync(path.dirname(EXPORT), { recursive: true });
fs.writeFileSync(EXPORT, absolu(h));
console.error(`[export] ${EXPORT} · ${(absolu(h).length / 1024).toFixed(0)} Ko`);

const bloc = '<meta charset="utf-8">\n'
  + fs.readFileSync(COMPAT, 'utf8')
  + absolu(h.slice(iHead, iFinHead) + '\n' + h.slice(iBody, iFinBody)) + '\n';
fs.writeFileSync(OUT, bloc);
console.error(`[bloc] ${OUT} · ${(bloc.length / 1024).toFixed(0)} Ko`);
