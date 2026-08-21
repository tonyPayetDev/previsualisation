---
name: qwen3-tts-voice-list
description: Liste réelle des voix acceptées par wavespeed-ai/qwen3-tts/text-to-speech (Cherry, Jennifer, Katerina n'existent PAS) et les deux voix féminines encore libres pour BeFresh
metadata:
  type: reference
---

Le modèle `wavespeed-ai/qwen3-tts/text-to-speech` (celui du preset, ≠ `voice-clone`) n'accepte
que cette liste — toute autre valeur renvoie un HTTP 400 qui énumère les valeurs permises :

`Vivian, Serena, Ono_Anna, Sohee, Uncle_Fu, Dylan, Eric, Ryan, ...` (+1 non affichée par l'erreur)

Les noms de voix Qwen habituels (**Cherry**, Jennifer, Katerina, Chelsie…) sont **refusés ici**.

Voix féminines mesurées en français (phrase de test identique, 75 caractères) :

| Voix | Durée | F0 médiane | Note |
|---|---|---|---|
| Ono_Anna | 4,51 s | 254 Hz | débit posé — retenue pour `befresh-03-evenementiel` |
| Sohee | 3,48 s | 239 Hz | même qualité de français, ~30 % plus rapide |

Les deux prononcent un français parfaitement intelligible (contrôlé en repassant l'audio dans
whisper : transcription exacte).

**How to apply:** Serena, Vivian et désormais Ono_Anna ont servi sur BeFresh. Pour la prochaine
vidéo, il ne reste que **Sohee** comme voix féminine inédite dans cette liste. Au-delà, il faudra
soit réutiliser, soit changer de fournisseur — le dire à Tony plutôt que d'installer en douce une
voix déjà employée. Vérifier chaque prise avec `src/f0.mjs` : une médiane dans 105–145 Hz signifie
que le clone de Tony a répondu, c'est un échec à refaire.
