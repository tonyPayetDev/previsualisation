#!/bin/sh
# Génère le fichier d'authentification à partir des variables d'environnement Coolify.
# Le hash n'est JAMAIS écrit dans le dépôt : le dépôt est public.
#
# Variables attendues (à définir dans Coolify) :
#   INVENTAIRE_USER      — identifiant
#   INVENTAIRE_PASSWORD  — mot de passe
#
# Comportement en cas d'absence : la page protégée est SUPPRIMÉE du conteneur.
# On échoue fermé, jamais ouvert — mieux vaut une page introuvable qu'une page
# contenant 106 noms de clients servie sans mot de passe.
#
# Ce script vit dans /docker-entrypoint.d/, le point d'extension officiel de
# l'image nginx. Une erreur ici ne doit pas empêcher nginx de démarrer et de
# servir les autres routes.

PROTECTED_DIR="/usr/share/nginx/html/sites-clients"
HTPASSWD="/etc/nginx/.htpasswd"

if [ -n "$INVENTAIRE_USER" ] && [ -n "$INVENTAIRE_PASSWORD" ]; then
    if htpasswd -bcB "$HTPASSWD" "$INVENTAIRE_USER" "$INVENTAIRE_PASSWORD" 2>/dev/null; then
        chmod 644 "$HTPASSWD" 2>/dev/null
        echo "[40-htpasswd] authentification active sur /sites-clients/"
    else
        echo "[40-htpasswd] echec de generation — retrait de la page protegee"
        rm -rf "$PROTECTED_DIR" 2>/dev/null
    fi
else
    echo "[40-htpasswd] INVENTAIRE_USER / INVENTAIRE_PASSWORD absents — retrait de la page protegee"
    rm -rf "$PROTECTED_DIR" 2>/dev/null
fi

exit 0
