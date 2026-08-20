FROM nginx:alpine

# htpasswd, pour générer le fichier d'authentification au démarrage
RUN apk add --no-cache apache2-utils

COPY . /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Point d'extension officiel de l'image nginx : les scripts de
# /docker-entrypoint.d/ sont exécutés avant le démarrage du serveur.
COPY docker-entrypoint.d/40-htpasswd.sh /docker-entrypoint.d/40-htpasswd.sh
RUN chmod +x /docker-entrypoint.d/40-htpasswd.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
