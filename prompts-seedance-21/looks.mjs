/* 21 nouveaux looks Seedance — suite des 7 déjà publiés.
 *
 * Règles d'écriture tenues ici :
 *  · aucun ne reprend un des 7 existants (déchirure de papier, sortir de sa
 *    propre vidéo, plan-séquence sans coupe, pub SF, parodie action, tutoriel
 *    cinématique, horreur nocturne) ;
 *  · aucun ne décrit une œuvre, une marque ou un personnage existants — ce sont
 *    des concepts de plan, pas des reproductions ;
 *  · chacun sert un usage réel du compte : démontrer, incarner, ou imager une
 *    idée abstraite. Un look joli qui ne porte aucun propos ne sert à rien.
 *
 * Le prompt est en anglais : le modèle y est nettement plus obéissant sur la
 * caméra et la lumière. L'explication reste en français.
 */

export const FAMILLES = {
  A: { nom: 'Montrer', dit: 'un écran, un produit, une preuve' },
  B: { nom: 'Incarner', dit: 'une présence humaine, un regard, une main' },
  C: { nom: 'Imager', dit: 'rendre visible une idée qui ne se filme pas' },
};

export const LOOKS = [
  /* ── A · Montrer ─────────────────────────────────────────────────── */
  { n: 8, f: 'A', nom: 'Le tableau de bord qui se remplit seul',
    format: '10 s · 9:16', usage: 'prouver qu’un système tourne sans personne',
    prompt: 'Macro shot of a dark dashboard screen, rows filling one after another with soft green confirmations, thin cyan progress bars completing, no cursor and no hands anywhere in frame, slow push-in, shallow depth of field, cold screen light reflecting on a matte desk, cinematic, 4k',
    regarder: 'Aucune main, aucun curseur : c’est ce qui dit « personne ne l’a fait ». Si une main apparaît, le plan raconte l’inverse.' },

  { n: 9, f: 'A', nom: 'Le empilement de fenêtres',
    format: '10 s · 16:9', usage: 'montrer une chaîne d’outils, un enchaînement',
    prompt: 'Floating application windows stacking in depth one behind another, each sliding into place with a soft snap, dark UI, thin amber accent lines, camera drifting laterally past them, volumetric dust in the light beams, shallow focus racking from front window to back, cinematic, 4k',
    regarder: 'Le racking de mise au point porte le sens : ce qui est net est ce dont on parle.' },

  { n: 10, f: 'A', nom: 'Le document qui s’écrit',
    format: '8 s · 9:16', usage: 'un devis, un email, un script généré',
    prompt: 'Overhead shot of a white document on a dark desk, text appearing line by line as if typed by nobody, warm desk lamp from the left, faint paper grain, slow rotation of the camera around the page, no hands, no keyboard visible, cinematic macro, 4k',
    regarder: 'La rotation lente évite le plan fixe mortel. Sans elle, huit secondes paraissent trente.' },

  { n: 11, f: 'A', nom: 'Le téléphone posé qui s’allume',
    format: '8 s · 9:16', usage: 'une notification, un lead qui tombe',
    prompt: 'A phone lying face up on a dark wooden table in a quiet room, screen suddenly lighting the surroundings with a soft glow, notification appearing, camera at table level very close, everything else in darkness, no person in frame, cinematic, shallow depth of field, 4k',
    regarder: 'La pièce doit être vide et sombre : c’est le contraste qui fait exister la notification.' },

  { n: 12, f: 'A', nom: 'L’avant / après par balayage',
    format: '10 s · 9:16', usage: 'un site refait, un visuel corrigé',
    prompt: 'A vertical light sweep travelling from left to right across the frame, revealing a transformed version of the same scene behind it, before state dull and grey, after state warm and saturated, seamless single take, no cuts, camera perfectly static, cinematic, 4k',
    regarder: 'Caméra strictement fixe, sinon l’œil ne peut plus comparer les deux états.' },

  { n: 13, f: 'A', nom: 'La pile qui s’effondre puis se range',
    format: '12 s · 16:9', usage: 'le chaos qui devient un système',
    prompt: 'A messy stack of papers and folders collapsing in slow motion on a dark surface, then reversing and reassembling into a perfectly aligned grid, dramatic side lighting, dust particles suspended in the air, single continuous take, cinematic, 4k',
    regarder: 'Le retour en arrière doit être lisible : si les deux mouvements se ressemblent, personne ne comprend qu’il y a inversion.' },

  { n: 14, f: 'A', nom: 'Le compteur qui grimpe',
    format: '8 s · 9:16', usage: 'un chiffre, un résultat, une preuve',
    prompt: 'Extreme close-up on a mechanical split-flap counter flipping upward rapidly then slowing to a stop, metallic texture, warm rim light on the edges, dark background, subtle motion blur on the fastest flips, camera locked off, cinematic macro, 4k',
    regarder: 'Le ralentissement final est tout : c’est lui qui donne le poids au chiffre d’arrivée.' },

  /* ── B · Incarner ────────────────────────────────────────────────── */
  { n: 15, f: 'B', nom: 'Le regard qui se relève',
    format: '6 s · 9:16', usage: 'ouvrir une vidéo, capter en deux secondes',
    prompt: 'Close-up portrait of a man looking down, then slowly raising his eyes directly into the lens, subtle confident half-smile at the end, warm key light from the side, dark background falling off to black, very shallow depth of field, camera static, cinematic, 4k',
    regarder: 'Le regard doit arriver dans le cadre à la deuxième seconde, pas à la cinquième. C’est le moment où l’on décide de rester.' },

  { n: 16, f: 'B', nom: 'La main qui pose l’objet',
    format: '8 s · 9:16', usage: 'présenter un produit, un livrable',
    prompt: 'A hand entering frame from the right and placing a small object down on a dark textured surface, then withdrawing, single warm light source above, deep shadows, camera slightly above the object looking down, slow motion, cinematic macro, 4k',
    regarder: 'La main sort du cadre à la fin. Si elle reste, l’objet n’est jamais vraiment donné.' },

  { n: 17, f: 'B', nom: 'Le dos qui se retourne',
    format: '8 s · 16:9', usage: 'une décision, un changement de cap',
    prompt: 'A man seen from behind facing a wall of soft light, turning around slowly toward the camera, expression calm and resolved, backlit with a strong rim separating him from the background, haze in the air, slow push-in, cinematic, 4k',
    regarder: 'Le contre-jour fait tout : sans liseré lumineux, la silhouette se noie dans le fond.' },

  { n: 18, f: 'B', nom: 'Les mains qui construisent',
    format: '10 s · 9:16', usage: 'montrer le travail, l’artisanat',
    prompt: 'Overhead close-up of two hands assembling small modular pieces on a dark workbench, deliberate unhurried movements, warm directional light, fine dust visible in the beam, camera slowly descending toward the work, no face in frame, cinematic, 4k',
    regarder: 'Pas de visage : on regarde le geste, donc le savoir-faire.' },

  { n: 19, f: 'B', nom: 'La marche qui ne s’arrête pas',
    format: '12 s · 9:16', usage: 'la constance, le fait de continuer',
    prompt: 'A man walking steadily forward through an empty corridor of light, camera tracking backward at exactly his pace so he stays centered, environment blurring past on both sides, determined and unhurried, cinematic, shallow depth of field, 4k',
    regarder: 'La caméra doit reculer exactement à sa vitesse. Un écart, et il rattrape ou décroche — le plan perd son calme.' },

  { n: 20, f: 'B', nom: 'Le sourire retenu',
    format: '6 s · 9:16', usage: 'la fin d’une vidéo, un CTA chaleureux',
    prompt: 'Tight portrait of a man holding back a smile that finally breaks through, eyes crinkling, natural and unforced, soft warm light wrapping the face, neutral dark background, static camera, very shallow depth of field, cinematic, 4k',
    regarder: 'Le sourire doit venir à la fin, pas au début. Un sourire d’entrée ne se remarque pas.' },

  /* ── C · Imager ──────────────────────────────────────────────────── */
  { n: 21, f: 'C', nom: 'Le fil qui relie',
    format: '10 s · 9:16', usage: 'connecter des outils, « tout est lié »',
    prompt: 'Glowing thin threads of light travelling between floating nodes in a dark volume, connecting them one by one until a network is complete, amber and cyan accents, slow orbital camera move, volumetric haze, cinematic, 4k',
    regarder: 'Les liaisons doivent se faire une par une, pas toutes ensemble : c’est l’enchaînement qui raconte la chaîne.' },

  { n: 22, f: 'C', nom: 'La porte de lumière',
    format: '8 s · 16:9', usage: 'un accès, une ouverture, un déblocage',
    prompt: 'A thin rectangle of warm light widening in complete darkness like a door opening, light spilling forward across a textured floor, camera slowly advancing toward the opening, dust suspended in the beam, no figure visible, cinematic, 4k',
    regarder: 'Personne ne franchit la porte. C’est au spectateur de s’y projeter.' },

  { n: 23, f: 'C', nom: 'Le sablier inversé',
    format: '8 s · 9:16', usage: 'le temps gagné, l’automatisation',
    prompt: 'An hourglass on a dark surface with sand flowing upward instead of down, defying gravity, warm rim light on the glass, macro detail on individual grains, camera slowly circling, deep black background, cinematic, 4k',
    regarder: 'Le sens du sable doit être évident dans la première seconde, sinon l’effet passe inaperçu.' },

  { n: 24, f: 'C', nom: 'La marée de messages',
    format: '10 s · 9:16', usage: 'la surcharge, le trop-plein',
    prompt: 'Countless small message bubbles rising like a slow tide filling the frame from the bottom, dark background, each bubble faintly glowing, camera static as they accumulate past the top edge, oppressive but beautiful, cinematic, 4k',
    regarder: 'La montée doit être lente et régulière : c’est ce qui rend la submersion inévitable plutôt que spectaculaire.' },

  { n: 25, f: 'C', nom: 'Le labyrinthe vu d’en haut',
    format: '10 s · 16:9', usage: 'la complexité, avant la simplification',
    prompt: 'Top-down view of an intricate maze of glowing corridors, camera rising steadily to reveal its full extent, a single bright path illuminating through it from entrance to exit, dark surroundings, cinematic, 4k',
    regarder: 'Le chemin s’allume après la révélation du labyrinthe, jamais avant.' },

  { n: 26, f: 'C', nom: 'Le mur qui tombe',
    format: '8 s · 16:9', usage: 'lever un blocage, un obstacle franchi',
    prompt: 'A solid dark wall crumbling into fine particles from the center outward, revealing warm open space behind it, slow motion, dramatic side light catching the falling dust, camera pushing through the opening, cinematic, 4k',
    regarder: 'La lumière derrière doit précéder l’effondrement d’une fraction de seconde — sinon on voit une destruction, pas une ouverture.' },

  { n: 27, f: 'C', nom: 'La graine qui devient structure',
    format: '12 s · 9:16', usage: 'partir de peu, construire un système',
    prompt: 'A single point of light in darkness unfolding into an intricate geometric structure that keeps growing outward, organic then architectural, amber glow, slow continuous camera pull-back revealing the full scale, cinematic, 4k',
    regarder: 'Le recul de caméra doit être continu : chaque arrêt casse l’impression de croissance.' },

  { n: 28, f: 'C', nom: 'Les deux horloges',
    format: '10 s · 16:9', usage: 'comparer deux façons de travailler',
    prompt: 'Two clocks side by side in a dark space, the left one turning painfully slowly, the right one spinning fast and smooth, warm light on the fast one and cold blue on the slow one, camera drifting between them, shallow depth of field, cinematic, 4k',
    regarder: 'La différence de température de lumière fait le verdict avant même qu’on lise les aiguilles.' },
];
