#!/bin/sh
# Génère le fichier d'authentification à partir des variables d'environnement Coolify.
# Le hash n'est JAMAIS écrit dans le dépôt : le dépôt est public.
#
# Variables attendues (à définir dans Coolify) :
#   INVENTAIRE_USER      — identifiant
#   INVENTAIRE_PASSWORD  — mot de passe
#
# Comportement en cas d'absence : les pages protégées sont SUPPRIMÉES du
# conteneur. On échoue fermé, jamais ouvert — mieux vaut une page introuvable
# qu'un tableau de bord ou une feuille d'appel servis sans mot de passe.
#
# Ce script vit dans /docker-entrypoint.d/, le point d'extension officiel de
# l'image nginx. Une erreur ici ne doit pas empêcher nginx de démarrer et de
# servir les autres routes — les maquettes clientes, elles, sont publiques
# par conception : ce sont elles qu'on envoie en démonstration.

RACINE="/usr/share/nginx/html"
HTPASSWD="/etc/nginx/.htpasswd"

# Le sommaire liste toutes les maquettes : sans mot de passe il ne doit pas
# exister. Les autres dossiers portent des noms, des numéros et des chiffres.
PROTEGES="$RACINE/sites-clients $RACINE/taches $RACINE/appels $RACINE/carte $RACINE/partage $RACINE/a-envoyer"
SOMMAIRE="$RACINE/index.html"

fermer() {
    echo "[40-htpasswd] $1 — retrait des pages protegees"
    rm -rf $PROTEGES 2>/dev/null
    rm -f "$SOMMAIRE" 2>/dev/null
}

if [ -n "$INVENTAIRE_USER" ] && [ -n "$INVENTAIRE_PASSWORD" ]; then
    if htpasswd -bcB "$HTPASSWD" "$INVENTAIRE_USER" "$INVENTAIRE_PASSWORD" 2>/dev/null; then
        chmod 644 "$HTPASSWD" 2>/dev/null
        echo "[40-htpasswd] authentification active sur / /taches/ /appels/ /carte/ /partage/ /a-envoyer/ /sites-clients/"
        echo "[40-htpasswd] les maquettes clientes restent publiques (liens de demonstration)"
    else
        fermer "echec de generation du htpasswd"
    fi
else
    fermer "INVENTAIRE_USER / INVENTAIRE_PASSWORD absents"
fi

exit 0
