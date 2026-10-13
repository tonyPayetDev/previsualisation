# Format vidéo « Boost Niveau » — référence Journal IA

> Style maison des vidéos Journal IA à partir du 13/10/2026. Extrait des gabarits existants
> `journal-ia-2026-10-07-bn/index.html`, `journal-ia-2026-10-06-bn/index.html` et
> `journal-ia-boost-niveau-test/index.html`. **Rien n'est inventé ici** : chaque valeur vient
> d'un de ces fichiers (ou de son `qa.json`). Les points marqués *(à confirmer)* sont en conflit
> avec le prompt planifié actuel et attendent l'arbitrage de Tony.

## Chaîne de production
1. L'édition du jour reste écrite dans `journal-ia/AAAA-MM-JJ.md` (script voix off + 6 brèves + coup à jouer + sources).
2. Le pipeline local rend le MP4 **au style Boost Niveau** et publie une page de prévisualisation
   `journal-ia-AAAA-MM-JJ-bn/index.html` (neon, carte vidéo 9:16, méta durée/poids/date, bloc QA).
3. Publication réseaux seulement si le MP4 passe le QA.

## Spécifications techniques (depuis qa.json du test)
- **Format :** 1080 × 1920, **30 i/s**, 9:16.
- **Durée :** cible **30–45 s**, jamais sous 30 s pour le format « montée de niveau » ;
  la version 6-brèves a été acceptée à **~58 s** (10-07). *(à confirmer : le prompt planifié demande 60–115 s — Boost Niveau est plus court.)*
- **Audio :** niveau moyen ≈ −14,5 dB, crête ≈ −1,5 dB ; ouverture audible dès les 3 premières s ; pas d'image noire (luminance min > 28).
- **Lip-sync :** chaque phrase calée dans une plage de lèvres actives (min ~4 lèvres actives/phrase).

## Grammaire visuelle Boost Niveau
- **Palette neon :** fond `#0a0a0f`, panel `#111117`, jaune `#f5d90a`, violet `#a855f7`, orange `#ff7a1a`, texte `#f2f2f5`.
- **Ouverture sur l'avatar** plein écran (layout `D_plein_ecran`).
- **5 layouts** alternés sur la vidéo : D, B, A, C, E (plein écran, split, incrustation…).
- **Stickers animés** (≥ 6 distincts), ex. : `TROP_LENT`, `DEJA_MIEUX`, `GAIN_TEMPS`, `CA_MONTE`, `NIVEAU_MAX`, `TU_PILOTES`.
- **Anneaux rotatifs** (≥ 3 styles).
- **Captions mot-à-mot** néon, mot courant surligné.
- **Preuve à l'écran :** pour chaque brève, le **vrai défilement de la source** (page ouverte sur son titre, sans fenêtre ni pub), avec **le chiffre exact affiché** (ex. 10-07 : text-to-cad, Agent-Reach, Nano Banana 2.1, Gemini 4 Argon, Mistral Large 4, Doe v. GitHub).

## Structure narrative
- **Journal 6-brèves (format courant) :** accroche → 6 brèves (chacune avec sa source qui défile + chiffre) → coup à jouer → carton CTA.
- **« Montée de niveau » (variante test) :** hook → problème → niveau 1 → 2 → 3 → 4 → niveau max → résultat → CTA.

## CTA / gate
- Carton CTA final = **« JOURNAL »**. **Confirmé** : les gabarits bn *et* le rendu auto du 13/10
  (`journal-ia-2026-10-13/index.html`, « CTA JOURNAL ») utilisent JOURNAL.
- **À corriger dans l'écriture :** les éditions markdown écrivent encore « Commente VEILLE » ;
  le mot de gate Blotato canonique est **JOURNAL** → écrire désormais « Commente JOURNAL, je t'envoie tout ».

## QA bloquant avant publication (12 contrôles)
Durée · format 1080×1920/30 · niveau audio · ouverture audible · phrases dans plages de lèvres ·
lèvres actives/phrase · pas d'image noire · 5/5 layouts utilisés · ≥6 stickers distincts ·
≥3 styles d'anneau · ouverture sur l'avatar · carton CTA présent. **Verdict OK = 12/12.**
