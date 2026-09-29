#!/bin/sh
# Écrit le secret partagé du webhook n8n « studio-video » dans une inclusion nginx,
# à partir de la variable Coolify STUDIO_VIDEO_SECRET. Le dépôt est public : le
# secret n'y est jamais écrit. Absent ou mal formé => chaîne vide => /studio-video/api
# répond 503 (on échoue fermé). Même principe que 42-a-publier.sh.
CONF="/etc/nginx/studio-video-secret.conf"
if printf '%s' "$STUDIO_VIDEO_SECRET" | grep -Eq '^[A-Za-z0-9]{16,128}$'; then
    printf 'set $studiovideo_secret "%s";\n' "$STUDIO_VIDEO_SECRET" > "$CONF"
    echo "[43-studio-video] secret du webhook pose pour /studio-video/api"
else
    printf 'set $studiovideo_secret "";\n' > "$CONF"
    echo "[43-studio-video] STUDIO_VIDEO_SECRET absent ou invalide — /studio-video/api ferme (503)"
fi
chmod 640 "$CONF" 2>/dev/null
exit 0
