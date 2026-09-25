#!/bin/sh
# Écrit le secret partagé du webhook n8n « a-publier » dans une inclusion nginx,
# à partir de la variable Coolify A_PUBLIER_SECRET. Le dépôt est public : le
# secret n'y est jamais écrit. Absent ou mal formé => chaîne vide => /a-publier/api
# répond 503 (on échoue fermé).
CONF="/etc/nginx/a-publier-secret.conf"
if printf '%s' "$A_PUBLIER_SECRET" | grep -Eq '^[A-Za-z0-9]{16,128}$'; then
    printf 'set $apublier_secret "%s";\n' "$A_PUBLIER_SECRET" > "$CONF"
    echo "[42-a-publier] secret du webhook pose pour /a-publier/api"
else
    printf 'set $apublier_secret "";\n' > "$CONF"
    echo "[42-a-publier] A_PUBLIER_SECRET absent ou invalide — /a-publier/api ferme (503)"
fi
chmod 640 "$CONF" 2>/dev/null
exit 0
