---
name: befresh-rush-lowdef-treatment
description: Les rushes BeFresh arrivent par WhatsApp en 478×850 — recette de traitement plein cadre (zooms plafonnés + grain) et pourquoi les bandes latérales sont une fausse bonne idée
metadata:
  type: project
---

Le client envoie ses rushes par **WhatsApp** : `478 × 850`, ~1,3 Mb/s. Monter en 1080 × 1920 est
un agrandissement de 2,26× et il n'y a rien à récupérer.

Parti pris retenu et validé à l'œil sur `befresh-03-evenementiel` : **plein cadre, pas de bandes.**
La source est déjà en 9:16 (0,5624 contre 0,5625), donc l'encadrer rétrécit une image déjà pauvre
sans gagner de netteté, et empiète sur la zone des sous-titres.

Chaîne de rattrapage, dans cet ordre, après le grade « fresh food » :
`unsharp=5:5:0.55:5:5:0.0, noise=alls=7:allf=t+u, vignette=PI/5`
et surtout **zooms plafonnés à 1,09** (le gabarit `befresh-01-decathlon` monte beaucoup plus haut —
sur une source WhatsApp ça ne fait qu'étaler le flou).

Encodage : CRF 24 preset slow ≈ 9 Mb/s. Le grain fait exploser le débit — à CRF 18 le même
montage pesait 77 Mo pour 30 s, et la différence est invisible à l'œil.

**Why:** c'est le grain qui fait lire un agrandissement comme « filmé » plutôt que comme « flou ».
Sans lui, un upscale propre paraît juste mou.

**How to apply:** appliquer tel quel à tout rush BeFresh venu de WhatsApp, et **dire dans le
rapport que ce n'est pas du 1080 natif** — ne jamais laisser croire l'inverse. Demander le fichier
d'origine au client reste la seule vraie correction.
