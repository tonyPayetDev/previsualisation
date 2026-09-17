# Cartes proposées — pour les deux agents programmés à venir

Ce fichier documente les fondations déjà construites (webhook + stockage + UI) pour
que la session principale puisse configurer, via `/schedule` (CronCreate) :

1. un **générateur hebdomadaire** — propose 1 à 3 nouvelles cartes d'action ;
2. un **veilleur quotidien** — relève ce que Tony a cliqué et agit en conséquence.

Ni l'un ni l'autre n'est mis en place ici. Ce qui suit est le contrat entre eux et
les fondations déjà en ligne.

## 1. Ce qui existe déjà (construit dans cette tâche)

- **Data Table n8n `CartesActions`** (id `gc4BxpPm1s4H84df`, dans le projet
  personnel de Tony) — colonnes : `carte_id` (string), `action` (string :
  `"approuve"` ou `"modifier"`), `retour` (string, vide si `approuve`), `date`
  (date, horodatage ISO de la soumission), `traite` (boolean, `false` par défaut).
- **Workflow n8n `Carte action — reception approuve/modifier`** (id
  `Eqv4WLHwGWFUlY57`, actif) — webhook `POST /webhook/carte-action` qui reçoit
  `{carte_id, action, retour}`, normalise, et insère une ligne dans
  `CartesActions` avec `traite: false`. Testé en production le 2026-09-17 :
  200 OK + ligne visible dans la table (id de test `test-fondations-carte-action`,
  à retirer ou ignorer par le veilleur).
- **`taches.json` / `build.mjs`** — un nouvel état de carte `"propose"` (et
  `"a-retravailler"` pour un brouillon renvoyé après retour de Tony), rendu avec
  un badge « 💡 proposé cette semaine », les champs `justification` et `impact`,
  et deux boutons qui postent vers le webhook ci-dessus. Aucune fausse
  confirmation : le message « ✓ Envoyé — repris dans la journée » ne s'affiche
  qu'après un vrai 200 du webhook (une reprise automatique si le réseau
  échoue, sinon message d'erreur explicite).

## 2. Comment lire `CartesActions` (agent quotidien)

Utiliser le node **Data table** (`n8n-nodes-base.dataTable`, resource `row`,
operation `get`) pointé sur `CartesActions` (`dataTableId` mode `id`, valeur
`gc4BxpPm1s4H84df`), avec un filtre `traite = false`. Chaque ligne donne :

- `carte_id` — à faire correspondre au champ `id` d'une carte dans `taches.json`
  (ou, si la carte n'a pas de champ `id` explicite, au slug dérivé de son titre
  — voir `slug()` dans `build.mjs`, qui fait exactement ça : minuscule, accents
  retirés, tout ce qui n'est pas `a-z0-9` remplacé par `-`, tronqué à 60
  caractères).
- `action` — `"approuve"` : Tony a validé, l'action à impact public peut partir
  (voir §4, règle non négociable). `"modifier"` : Tony a renvoyé la carte avec
  un commentaire, il faut produire un nouveau brouillon.
- `retour` — le texte que Tony a tapé dans le `<textarea>`, uniquement rempli
  si `action = "modifier"`. C'est la seule source de vérité sur ce qu'il faut
  changer.
- `date` — horodatage de la soumission (ISO 8601).

## 3. Comment marquer une ligne traitée

Après avoir agi (publié ce qui est approuvé, ou produit un nouveau brouillon
pour ce qui est en modification), mettre à jour la ligne dans `CartesActions`
avec le node **Data table**, operation `update`, filtre sur `carte_id`
(et idéalement l'`id` interne de la ligne renvoyé par le `get`, pour ne pas
retoucher une ligne plus récente sur la même carte), et poser `traite: true`.
Ne jamais supprimer la ligne — elle sert d'historique de ce qui a été demandé.

S'il existe déjà plusieurs lignes non traitées pour le même `carte_id`
(ex. deux clics rapides), traiter la plus récente par `date` et marquer les
autres `traite: true` sans action supplémentaire pour éviter un double envoi.

## 4. Comment ajouter une nouvelle carte "propose" dans `taches.json`

Ouvrir `/work/previsualisation/taches/taches.json`, ajouter un objet dans le
tableau `"taches"` (n'importe où, avant l'accolade fermante du tableau) au
format exact suivant — voir la carte modèle déjà présente,
`"id": "relance-prospects-audit-ia"` :

```json
{
  "id": "un-slug-stable-et-unique",
  "t": "Le titre de la carte, une phrase d'action",
  "etat": "propose",
  "lien": "",
  "note": "Carte proposée automatiquement cette semaine — à valider ou à renvoyer en modification. Rien ne part avant ton clic.",
  "justification": "Une phrase : pourquoi cette carte, maintenant, avec un fait vérifiable derrière.",
  "impact": "volume",
  "cash": "direct",
  "cashNote": "Une phrase cohérente avec la grille de cash.mjs (direct/proche/loin).",
  "demande_le": "AAAA-MM-JJ"
}
```

Règles :

- `id` : slug stable, unique, choisi par l'agent qui propose la carte — pas
  regénéré à chaque exécution (sinon les clics de Tony sur l'ancien slug ne
  correspondent plus à rien). Si l'agent ne fournit pas d'`id`, `build.mjs`
  dérive un slug du titre `t`, mais deux titres proches donneraient alors deux
  slugs différents d'une semaine à l'autre — toujours préférer un `id` explicite.
- `impact` : une des trois valeurs `"volume"`, `"clients"`, `"strategie"` (voir
  `IMPACT` dans `build.mjs` — `📈 volume`, `🤝 clients`, `🧭 stratégie`).
- `cash` / `cashNote` : suivre la même grille que le reste du fichier (voir
  `cash.mjs` — `direct` si un prospect ou client nommé est au bout,`proche`
  sinon si ça sert la vente, `loin` pour de l'outillage interne). Une règle de
  correspondance a été ajoutée à `cash.mjs` pour la carte modèle
  (`35 prospects|prospects-audit-ia|audit-ia\.md`) ; ajouter la même logique
  pour toute nouvelle famille de cartes récurrente, sans changer les règles
  existantes.
- Pour renvoyer une carte en modification après un retour de Tony (`action:
  "modifier"` dans `CartesActions`), soit réécrire la même carte en place
  (même `id`, nouveau texte/justification tenant compte de `retour`), soit
  passer temporairement son `etat` à `"a-retravailler"` pendant que le nouveau
  brouillon est produit, puis repasser à `"propose"` une fois prêt. Les deux
  états sont rendus identiquement par `build.mjs` (badge + deux boutons).
- Après édition de `taches.json`, régénérer la page avec
  `node /work/previsualisation/taches/build.mjs` (ne jamais éditer
  `index.html` à la main — il est généré).

## 5. La règle non négociable

**Aucune action à impact public (publication d'une vidéo, envoi d'un mail ou
d'un message à un prospect, dépense, activation d'une offre testée) ne part
sans qu'une carte soit passée par `action: "approuve"` dans `CartesActions`.**

Tout le reste — rendu vidéo, brouillon de mail, preview, mise à jour de
`taches.json` pour proposer une carte — peut se faire librement, sans
attendre de validation. C'est précisément ce que la case `previsualisation`
existe pour permettre : tout reste en aperçu tant que Tony n'a pas cliqué
« ✅ OK, envoie ».
