---
name: bgm-manifest-bpm-wrong
description: Le BPM du bgm-manifest.json n'est pas fiable (food-cat-walk-128 est en réalité à 130,00 BPM) — mesurer sur la bande de kick avant tout beat-sync
metadata:
  type: project
---

`autoboost-neon-videos/_shared/bgm/bgm-manifest.json` annonce `food-cat-walk-128.mp3` à **128 BPM**.
Mesure sur la piste : **130,00 BPM** (temps = 0,461538 s), premier temps à 0,232 s.

Méthode de mesure (outils écrits dans `befresh-videos/befresh-03-evenementiel/src/`) :
`beatscan.mjs` filtre 40–140 Hz, dérive une courbe d'attaques, puis balaie 60–190 BPM avec un banc
de peignes en cherchant la meilleure phase pour chaque tempo. Le pic est à 130,00 entouré de ses
harmoniques 65 / 97,5 / 162,5 — la signature d'une grille unique. Contrôle indépendant : les
attaques détectées retombent toutes à 0, ±115 ou ±230 ms d'un temps (grille de doubles-croches).

**Why:** 2 BPM d'écart, c'est ~0,45 s de dérive sur un montage de 28 s — le beat-sync s'effondre
à la fin, et l'erreur est invisible tant qu'on ne regarde pas la dernière coupe.

**How to apply:** ne jamais prendre le BPM du manifeste pour un montage calé. Et **ne jamais
arrondir plan par plan** : à 30 fps un plan de 2 temps fait 27,69 frames, donc arrondir chaque plan
ajoute ~10 ms par coupe. Placer les temps de coupe sur la grille exacte, les arrondir à la frame,
et prendre les différences de frames comme durées — erreur max 15,4 ms. Voir
[[ffmpeg-no-drawtext-fontconfig]] pour les autres pièges de rendu du bac à sable.
