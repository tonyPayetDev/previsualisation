#!/bin/sh
# Mot de passe à part pour /commercial/ : le commercial ne doit voir que sa journée d'appels,
# pas le tableau de bord, les candidatures ou les autres listes de Tony.
#
# Le fichier contient toujours le compte de Tony (INVENTAIRE_*, pour tester la page),
# plus le compte du commercial si COMMERCIAL_USER / COMMERCIAL_PASSWORD sont définis dans Coolify.
# /commercial/suivi/ reste derrière le mot de passe de Tony seul (voir nginx.conf).
# Sans compte Tony : on échoue fermé, le dossier est retiré.
RACINE="/usr/share/nginx/html"
FICHIER="/etc/nginx/.htpasswd-commercial"

if [ -z "$INVENTAIRE_USER" ] || [ -z "$INVENTAIRE_PASSWORD" ]; then
    echo "[45-commercial] pas de compte Tony — retrait de /commercial/"
    rm -rf "$RACINE/commercial"
    exit 0
fi
if ! htpasswd -bcB "$FICHIER" "$INVENTAIRE_USER" "$INVENTAIRE_PASSWORD" 2>/dev/null; then
    echo "[45-commercial] echec htpasswd — retrait de /commercial/"
    rm -rf "$RACINE/commercial"
    exit 0
fi
if [ -n "$COMMERCIAL_USER" ] && [ -n "$COMMERCIAL_PASSWORD" ]; then
    htpasswd -bB "$FICHIER" "$COMMERCIAL_USER" "$COMMERCIAL_PASSWORD" 2>/dev/null \
        && echo "[45-commercial] compte commercial actif" \
        || echo "[45-commercial] compte commercial non ajouté (htpasswd en erreur)"
else
    echo "[45-commercial] pas encore de compte commercial (COMMERCIAL_USER / COMMERCIAL_PASSWORD)"
fi
chmod 644 "$FICHIER" 2>/dev/null
exit 0
