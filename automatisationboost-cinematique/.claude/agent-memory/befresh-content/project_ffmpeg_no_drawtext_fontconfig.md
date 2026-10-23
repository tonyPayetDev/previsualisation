---
name: ffmpeg-no-drawtext-fontconfig
description: Le ffmpeg statique du bac à sable n'a PAS drawtext, et fontconfig n'a aucune police — le filtre ass marche mais il faut lui fournir FONTCONFIG_FILE, sinon il retombe en silence sur une police de secours
metadata:
  type: project
---

Deux pièges du binaire `/home/claude/tools/ffmpeg-build/ffmpeg-7.0.2-amd64-static` :

1. **Pas de filtre `drawtext`.** Toute incrustation de texte doit passer par le filtre `ass`
   (présent, libass) ou par un PNG composé avec `overlay`. Un `drawtext` échoue avec
   `No such filter: 'drawtext'` et fait tomber tout le graphe.
2. **fontconfig n'a aucune configuration** — `fc-list` renvoie 0 police. Sans rien, le filtre `ass`
   affiche `Failed to load fontconfig fonts!` et rend avec une police de secours **sans planter** :
   le rendu « réussit » et la charte est perdue.

Recette qui marche (utilisée sur `befresh-03-evenementiel`) : un `work/fonts.conf` minimal avec
`<dir>` vers le dossier de polices et `<cachedir>`, puis
`export FONTCONFIG_FILE=<chemin absolu>/work/fonts.conf` avant l'appel ffmpeg.

**Why:** un rendu qui se termine sans erreur ne prouve rien — c'est exactement le cas où la
vidéo sort entière mais typographiée à côté de la charte.

**How to apply:** avant tout rendu ASS, exporter `FONTCONFIG_FILE` et **regarder une frame**.
Attention aussi au contrôle « police bidon » : dans un dossier qui ne contient qu'Outfit, un nom
de police inexistant retombe sur Outfit, donc le test ne prouve rien. Le seul vrai contrôle est
visuel. Autre piège de vérification : `ffmpeg -ss X -i video -vf ass=...` remet le PTS à zéro et
affiche le sous-titre de t=0 ; il faut **`-copyts`** pour extraire la frame de la bonne seconde.
