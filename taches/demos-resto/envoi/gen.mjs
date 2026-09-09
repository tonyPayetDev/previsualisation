// Reprend le gabarit d'email deja utilise dans n8n (workflow
// « Envoi emails quotidien - Restaurants Avec Image Avant Aprés ») :
// carte blanche sur fond gris, Arial, bouton noir plein. Seul le contenu
// change — ici le bouton mene a l'EDITEUR, pour qu'ils generent un post
// eux-memes en un clic.
import fs from 'fs';
const R = 'https://resto.automatisationboost.com';
export const RESTOS = [
  { slug:'delices-thai',              nom:'Délices Thaï',             email:'contact@lesdelicesthai.re' },
  { slug:'fogo',                      nom:'Fogo',                     email:'contact@fogo-restaurant.com' },
  { slug:'mediterraneo',              nom:'Mediterraneo',             email:'info@mediterraneo.re' },
  { slug:'relais-de-l-hermitage',     nom:"Relais de l'Hermitage",    email:'reservation@relais-hermitage-saintgilles.fr' },
  { slug:'restaurant-le-grand-natte', nom:'Restaurant Le Grand Natte',email:'bienvenue@woodhotel.re' },
];

export function html(r){
  const demo = `${R}/demo/${r.slug}/`;
  const edit = `${R}/foodboost-editeur/?client=${r.slug}`;
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${r.nom} — votre feed Instagram</title>
<style>
  body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; }
  h2 { color: #333; }
  p { color: #555; line-height: 1.5; }
  .images { margin-top: 14px; }
  .images img { width: 100%; max-width: 560px; border-radius: 6px; display: block; }
  .cta { margin-top: 24px; text-align: center; }
  .cta a { background: #000; color: #fff; text-decoration: none; padding: 14px 28px;
           border-radius: 6px; display: inline-block; font-weight: bold; }
  .second { margin-top: 14px; text-align: center; font-size: 14px; }
  .second a { color: #555; }
  .footer { margin-top: 30px; font-size: 12px; color: #888; }
</style></head>
<body><div class="container">
  <p>Bonjour l'équipe de <strong>${r.nom}</strong>,</p>

  <p>Je m'appelle <strong>Tony Payet</strong>, je suis développeur à La Réunion et j'aide
     les restaurants à tenir leurs réseaux sociaux sans y passer de temps.</p>

  <p>J'ai préparé pour vous <strong>un exemple de feed Instagram</strong>, à partir de vos
     propres photos. Rien n'a été publié : cette page n'est visible que par vous.</p>

  <!-- p01 est souvent le LOGO de l'etablissement, pas un plat : on montre
       deux photos a partir de la deuxieme, comme le gabarit d'origine qui
       affichait « Image 1 / Image 2 ». -->
  <div class="images">
    <img src="${R}/demo/${r.slug}/photos/p02.jpg" alt="Exemple de publication pour ${r.nom}">
    <img src="${R}/demo/${r.slug}/photos/p03.jpg" alt="Deuxieme exemple pour ${r.nom}" style="margin-top:10px">
  </div>

  <p style="margin-top:22px">Le plus simple, c'est d'essayer : le bouton ci-dessous ouvre
     un éditeur où <strong>vous générez vous-même une publication</strong> en un clic —
     l'image et le texte sont proposés, vous n'avez qu'à choisir.</p>

  <div class="cta">
    <a href="${edit}" target="_blank">Générer une publication</a>
  </div>
  <p class="second"><a href="${demo}" target="_blank">ou voir d'abord le feed complet</a></p>

  <p style="margin-top:26px">Si ça vous plaît, on en parle. Si ça ne vous intéresse pas,
     répondez simplement « non merci » et je ne vous recontacterai pas.</p>

  <p>Cordialement,<br>
  <strong>Tony Payet</strong><br>
  Développeur fullstack et automatisation IA<br>
  06 92 41 77 49</p>

  <p class="footer">Vous recevez ce message parce que votre établissement est référencé
     publiquement à La Réunion. Une réponse suffit pour ne plus être contacté.</p>
</div></body></html>`;
}
