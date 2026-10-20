#!/bin/sh
# Clé partagée du webhook n8n « Task Pilot — stockage », depuis la variable Coolify PILOTE_SECRET.
# Le dépôt est public : la clé n'y est jamais écrite. Absente ou mal formée => /pilote/api répond 503.
CONF="/etc/nginx/pilote-secret.conf"
if printf '%s' "$PILOTE_SECRET" | grep -Eq '^[A-Za-z0-9]{16,128}$'; then
    printf 'set $pilote_secret "%s";\n' "$PILOTE_SECRET" > "$CONF"
    echo "[46-pilote] clé posée pour /pilote/api"
else
    printf 'set $pilote_secret "";\n' > "$CONF"
    echo "[46-pilote] PILOTE_SECRET absent ou invalide — /pilote/api fermé (503)"
fi
chmod 640 "$CONF" 2>/dev/null
exit 0
