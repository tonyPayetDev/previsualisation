FROM nginx:alpine

# htpasswd, pour générer le fichier d'authentification au démarrage
RUN apk add --no-cache apache2-utils

COPY . /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ─────────────────────────────────────────────────────────────────────────────
# Le sommaire est RECONSTRUIT ici, à chaque déploiement.
#
# Pourquoi à la construction de l'image et pas dans /docker-entrypoint.d/ :
# le contenu du site est figé dans l'image, il ne change plus une seule fois
# le conteneur démarré. Le régénérer à chaque démarrage referait exactement le
# même fichier, mais imposerait de garder Node dans l'image finale (~50 Mo) et
# de refaire le travail à chaque redémarrage. Ici, Node est installé, utilisé,
# puis désinstallé dans la MÊME couche : l'image finale n'en garde rien.
#
# Le `if` n'est pas décoratif. Si le réseau du builder est indisponible ou que
# le paquet manque, on ne fait pas échouer la construction : l'index.html versionné
# dans le dépôt est servi tel quel. Un sommaire d'hier vaut mieux qu'un site mort.
# ─────────────────────────────────────────────────────────────────────────────
RUN if apk add --no-cache nodejs >/dev/null 2>&1; then \
        node /usr/share/nginx/html/build-index.mjs \
          || echo "[sommaire] generation en echec — index.html du depot conserve"; \
        apk del nodejs >/dev/null 2>&1 || true; \
    else \
        echo "[sommaire] nodejs indisponible — index.html du depot conserve"; \
    fi

# Point d'extension officiel de l'image nginx : les scripts de
# /docker-entrypoint.d/ sont exécutés avant le démarrage du serveur.
COPY docker-entrypoint.d/40-htpasswd.sh /docker-entrypoint.d/40-htpasswd.sh
RUN chmod +x /docker-entrypoint.d/40-htpasswd.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
