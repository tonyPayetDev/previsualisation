# Journal IA — édition d'exemple, construite avec last30days

*Démonstration : cette édition ne vient PAS de la routine de veille habituelle. Toutes les brèves sortent d'un seul appel au skill `last30days` — `python3 last30days.py "AI coding agents" --days 30 --emit brief` — exécuté le 29 août 2026. Sources actives sur ce passage : GitHub, Hacker News, Jobs, Reddit. Rien n'a été ajouté de mémoire.*

---

## 🎙️ Script voix off (à générer voix clonée de Tony)

**Journal IA. Aujourd'hui, une seule question — et ce sont les développeurs qui y répondent sans le vouloir.**

**Un — Six outils sortent le même mois, et ils font tous la même chose.** Grith, ProofRun, Heimdall, Naeos, Surfil, Devx. Un proxy de sécurité, une surveillance au niveau des appels système, un reçu de vérification, une couche de confiance, un plan de contrôle. Six équipes différentes, une seule obsession. *C'est indéniable. Irréfutable. Indiscutable.*

**Deux — Aucun ne sert à mieux coder.** Ils servent à **empêcher l'agent de faire une bêtise**. Grith surveille les appels système sous Linux. ProofRun délivre un reçu prouvant ce que l'agent a réellement exécuté. Personne ne vend de la vitesse, tout le monde vend du garde-fou.

**Trois — La question du marché a changé.** L'an dernier c'était « comment je fais coder l'agent ». Ce mois-ci c'est « comment je l'empêche de casser la production ». Ce n'est pas une opinion : c'est le classement par engagement, sur trente jours.

**Quatre — Et derrière les outils, il y a des gens fatigués.** Le post le mieux noté de Reddit sur le sujet n'est pas une annonce. C'est un salarié de la logistique : « ma boîte adopte le codage agentique en mode bâclé, j'envisage de démissionner ». Quarante-huit points. *C'est indéniable. Irréfutable. Indiscutable.*

**Cinq — Les deux signaux disent la même chose.** Les développeurs construisent des freins, les salariés partent. Entre les deux, il y a des directions qui ont déployé avant de savoir encadrer.

**Le coup à jouer.** Regarde la brève un. Six outils de contrôle sortis en trente jours, c'est un marché qui se forme sous tes yeux. Pose la question à tes clients : qui vérifie ce que fait l'IA chez eux, aujourd'hui. La plupart n'auront pas de réponse. C'est exactement là que se vend un audit.

**Tu veux la veille chaque matin ? Commente VEILLE, je t'envoie tout.**

---

## Ce que cette édition démontre

**Ce que la routine actuelle aurait produit :** six lignes « Untel a sorti tel outil ». Une liste.

**Ce que last30days permet en plus :** le classement par engagement fait ressortir que *six sorties sur huit résolvent le même problème*. Cette convergence est le sujet — et elle n'est visible que parce qu'on regarde trente jours d'un coup, triés par ce que les gens ont réellement upvoté.

**La voix humaine.** Le post Reddit du salarié qui songe à démissionner ne serait jamais remonté dans une veille par communiqués. C'est pourtant lui qui donne sa température à l'édition.

---

## Limites, mesurées et non supposées

- **Ce serveur n'est pas ta machine.** Sur un passage de 3 jours, Reddit n'a rien rendu et une seule source était active ; sur 30 jours, quatre sources ont répondu dont Reddit. La fenêtre courte est fragile ici. Chez toi, avec un navigateur et ses cookies, ce sera plus stable.
- **Sources indisponibles faute d'outils optionnels :** arXiv, Techmeme, Digg, yt-dlp. Installables séparément.
- **Aucune clé API n'a été utilisée.** Le diagnostic du skill annonce `Ready to research with safe defaults`, sans identifiants.
- **Python 3.12 a dû être installé** (`uv python install 3.12`) : il n'existait pas dans cet environnement, et le skill est écrit en Python.
