#!/bin/sh
# Écrit le secret partagé du webhook n8n « memoire-chatgpt » dans une inclusion nginx,
# à partir de la variable Coolify MEMOIRE_SECRET. Le dépôt est public : ni le secret
# ni aucune conversation n'y sont écrits (les données restent sur le serveur, derrière
# n8n). Absent ou mal formé => chaîne vide => /memoire/api répond 503 (on échoue fermé).
CONF="/etc/nginx/memoire-secret.conf"
if printf '%s' "$MEMOIRE_SECRET" | grep -Eq '^[A-Za-z0-9]{16,128}$'; then
    printf 'set $memoire_secret "%s";\n' "$MEMOIRE_SECRET" > "$CONF"
    echo "[44-memoire] secret du webhook pose pour /memoire/api"
else
    printf 'set $memoire_secret "";\n' > "$CONF"
    echo "[44-memoire] MEMOIRE_SECRET absent ou invalide — /memoire/api ferme (503)"
fi
chmod 640 "$CONF" 2>/dev/null
exit 0
