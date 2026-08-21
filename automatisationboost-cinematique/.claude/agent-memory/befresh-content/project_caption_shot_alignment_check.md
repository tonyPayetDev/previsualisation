---
name: caption-shot-alignment-check
description: Le contrôle qui attrape les désynchronisations mot/image (« UNE SALLE » écrit sur le bar de plage) — une table chunk × plan, à lire AVANT de lancer un rendu de plusieurs minutes
metadata:
  type: project
---

Sur un montage à sous-titres mot-à-mot, le défaut le plus visible n'est ni technique ni sonore :
c'est un **mot qui contredit l'image**. Aucune erreur ffmpeg, aucun avertissement de frames, rien
dans le contrôle d'une seule frame — et pourtant c'est la première chose que le client voit.

Outil : `befresh-videos/befresh-03-evenementiel/src/verify.mjs`. Il croise
`work/chunk-times-<tag>.json` avec les temps de coupe recalculés depuis `src/shots-<tag>.json`
et imprime, pour chaque chunk, le ou les plans sous lesquels il passe.

Trois défauts réels sortis de cette table sur une seule vidéo :
« UNE SALLE » sur le bar de plage · « SUR LE SABLE » sur le bar de jardin · « JAUNE » sur le
distributeur rouge.

**Why:** les temps de sous-titre viennent de whisper (parole) et les temps de coupe du shot-list
(image) — deux horloges indépendantes. Rien ne les fait coïncider tout seul.

**How to apply:** lancer `verify.mjs` **entre** `gen-captions` et `build-shots`, et corriger les
durées de plans avant de payer plusieurs minutes de rendu. Quand un mot ne peut pas rentrer dans
un plan (mots de 0,65 s contre unités de coupe de 0,92 s en beat-sync), **ne pas forcer** : mettre
sous le passage une image qui ne contredit aucun des mots. Voir [[bgm-manifest-bpm-wrong]] pour la
contrainte de grille qui crée ce cas.
