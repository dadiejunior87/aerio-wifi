# Utilise l'image PHP avec Apache (vérifie bien le tiret -apache)
FROM php:8.2-apache

# Installe les outils pour la base de données SQLite
RUN apt-get update && apt-get install -y libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite

# Configure le serveur pour lire dans ton dossier 'public'
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# Copie tous tes fichiers dans le serveur (Espace entre le point et le slash !)
COPY . /var/www/html/

# Donne les droits d'écriture sur le dossier config pour ta base aerio.db
RUN chmod -R 777 /var/www/html/config

# Active les liens URL propres
RUN a2enmod rewrite

EXPOSE 80
