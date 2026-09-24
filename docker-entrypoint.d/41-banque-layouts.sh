#!/bin/sh
# Écrit le secret partagé du webhook n8n « banque-layouts » dans une inclusion nginx,
# à partir de la variable Coolify BANQUE_LAYOUTS_SECRET. Le dépôt est public : le
# secret n'y est jamais écrit. Absent ou mal formé => chaîne vide => /layouts/api
# répond 503 (on échoue fermé).
CONF="/etc/nginx/banque-layouts-secret.conf"
if printf '%s' "$BANQUE_LAYOUTS_SECRET" | grep -Eq '^[A-Za-z0-9]{16,128}$'; then
    printf 'set $banque_secret "%s";\n' "$BANQUE_LAYOUTS_SECRET" > "$CONF"
    echo "[41-banque-layouts] secret du webhook pose pour /layouts/api"
else
    printf 'set $banque_secret "";\n' > "$CONF"
    echo "[41-banque-layouts] BANQUE_LAYOUTS_SECRET absent ou invalide — /layouts/api ferme (503)"
fi
chmod 640 "$CONF" 2>/dev/null
exit 0
