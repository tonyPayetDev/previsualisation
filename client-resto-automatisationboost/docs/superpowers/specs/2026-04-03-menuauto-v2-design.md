# MenuAuto v2 — Design Spec
**Date:** 2026-04-03  
**Projet:** resto.automatisationboost.com  
**Objectif:** Génération et publication automatique de menus Instagram pour restaurants

---

## Vue d'ensemble

Système n8n en deux flux :
- **Flux A** : Création d'un nouveau template visuel via Gemini + Claude
- **Flux B** : Réutilisation d'un template existant avec nouveaux paramètres via Claude

L'avantage clé : éviter de régénérer un design complet à chaque post. Le template est créé une fois, puis réutilisé avec injection de contenu (plats, date).

---

## Formulaire d'entrée (n8n Form Trigger)

Champs communs :
- `email` — Email du restaurateur (pour approbation)
- `restaurant_name` — Nom du restaurant
- `plats` — Plats du jour (texte libre, séparés par virgule ou retour ligne)
- `extras` — À emporter / extras (optionnel)
- `date` — Date du menu (défaut : aujourd'hui)
- `mode` — **"Nouveau template"** ou **"Template existant"**

Champs conditionnels :
- Si `mode = Nouveau template` : `style` (description ambiance/style souhaité, ex: "coloré, moderne, fond sombre")
- Si `mode = Template existant` : `template_id` (clé du template dans le datastore)

---

## Flux A — Nouveau Template

### Étapes

1. **Formulaire** → collecte restaurant_name, plats, style, email
2. **Gemini Imagen** → génère un visuel de référence (image PNG du design souhaité)
   - Prompt : `"Menu Instagram pour restaurant [nom], style [style], avec plats [plats]"`
3. **Claude API** → reçoit l'image Gemini + contexte
   - Génère un HTML/CSS complet reproduisant le design
   - Inclut des placeholders dynamiques pour les paramètres réutilisables
4. **Sauvegarde n8n datastore**
   - Clé : `tpl_{restaurant_name_slug}_{timestamp}`
   - Valeur : `{ html, restaurant_name, style, created_at }`
5. **HCTI screenshot** → `POST https://hcti.io/v1/image` → image 1000×1800px (device_scale_factor: 2)
6. **Email approbation** (Gmail sendAndWait) → aperçu image + formulaire (date publication, heure, publier oui/non)
7. **Si Oui** → Blotato upload media → POST Blotato posts avec scheduledTime
8. **Si Non** → NoOp (annulé)

---

## Flux B — Template Existant

### Étapes

1. **Formulaire** → collecte restaurant_name, plats, extras, date, template_id, email
2. **Charger template** depuis n8n datastore (clé = template_id)
3. **Claude API** → reçoit le HTML sauvegardé + nouveaux paramètres
   - Régénère le HTML en remplaçant le contenu (plats, date, restaurant_name, extras)
   - Conserve le style, les couleurs, la structure visuelle
4. **HCTI screenshot** → image 1000×1800px
5. **Email approbation** (Gmail sendAndWait) → aperçu + formulaire
6. **Si Oui** → Blotato upload → Post Instagram planifié
7. **Si Non** → NoOp

---

## Stockage — n8n Datastore

```json
{
  "key": "tpl_snack-etoile_1743680000",
  "value": {
    "html": "<html>...</html>",
    "restaurant_name": "Snack Étoile",
    "style": "coloré, moderne, fond sombre",
    "created_at": "2026-04-03"
  }
}
```

Opérations :
- **Écriture** : après génération Claude (Flux A)
- **Lecture** : avant injection Claude (Flux B)

---

## Nœuds n8n requis

| Nœud | Type | Usage |
|------|------|-------|
| Formulaire Client | `formTrigger` | Collecte des données |
| Switch Mode | `switch` | Route vers Flux A ou B |
| Gemini Imagen | `httpRequest` (Google AI API) | Génération visuelle |
| Claude HTML Builder | `httpRequest` (Anthropic API) | Génération/régénération HTML |
| n8n Datastore Write | `n8n-nodes-base.set` + code | Sauvegarde template |
| n8n Datastore Read | code node | Lecture template |
| HCTI Screenshot | `httpRequest` | HTML → Image |
| Gmail sendAndWait | `gmail` | Approbation email |
| If Publier | `if` | Condition publication |
| Blotato Upload | `httpRequest` | Upload media |
| Blotato Post | `httpRequest` | Publication Instagram |

---

## Credentials requis

| Service | Type | Note |
|---------|------|------|
| htmlcsstoimage | HTTP Basic Auth | user_id + api_key |
| Gmail OAuth2 | OAuth2 | déjà configuré (`8IlDEgihQ00v54lT`) |
| Blotato | HTTP Header Auth | déjà configuré (`krtcIfRPhx6xSQvk`) |
| Google AI (Gemini) | API Key | Gemini Imagen |
| Anthropic (Claude) | API Key | claude-sonnet-4-6 |

---

## Réseau social cible

- **Instagram uniquement** via Blotato API
- Account ID : `35077`
- Format image : 1000×1800px (portrait, Stories-compatible)

---

## Contraintes techniques

- Templates stockés dans n8n datastore natif (pas de base externe)
- HCTI utilisé pour le rendu HTML → image (pas de Puppeteer)
- Claude régénère le HTML à chaque utilisation du Flux B (pas de simple remplacement de placeholder)
- Approbation humaine obligatoire avant toute publication
