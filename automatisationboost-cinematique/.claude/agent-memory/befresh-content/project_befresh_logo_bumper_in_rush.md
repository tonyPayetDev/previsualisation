---
name: befresh-logo-bumper-in-rush
description: Le vrai bumper logo BeFresh (fond noir, cercle blanc, anneau or) existe en ~478 px à la fin du rush événementiel — bien meilleur que l'asset 110 px que le SKILL décrit comme la seule source
metadata:
  type: project
---

Le rush événementiel `aa992a7f-VID20260820WA0000.mp4` (83,7 s) **se termine sur le bumper logo
officiel de BeFresh** : fond noir, cercle blanc, anneau dégradé or, « BE FRESH » en noir.
Il est propre et stable de **82,0 s à 83,7 s**, et le cercle occupe ~440 px de large.

Extraction utilisée pour la carte de fin des trois montages :
`-ss 82.60 -vf "crop=478:478:0:186,scale=680:680:flags=lanczos,unsharp=5:5:0.8"`
puis overlay centré sur un fond noir 1080×1920 (à y=520).

**Why:** le SKILL.md `befresh-content` affirme que « le logo n'existe qu'en ~110 px »
(`befresh-01-decathlon/work/brand/befresh-asset.png`) et interdit donc tout usage plein écran.
C'était vrai avant ce rush ; ça ne l'est plus. À 680 px le logo tient en carte de fin plein écran
sans baver.

**How to apply:** pour toute vidéo BeFresh qui a besoin d'une carte de fin logo, repartir de ce
bumper plutôt que de l'asset 110 px, et surtout jamais de `logo-befresh-recree.png`
(typographie fausse — cette interdiction-là reste valable). Ça ne remplace pas une demande de
logo vectoriel au client : c'est toujours un agrandissement. Voir [[befresh-rush-lowdef-treatment]].
