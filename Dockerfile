FROM php:8.2-apache

# Installation des extensions SQLite
RUN apt-get update && apt-get install -y libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite

# Configuration du dossier public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# Copie des fichiers (On utilise un point pour copier tout le projet)
COPY . /var/www/html/

# Permissions sur le dossier config (Un seul slash !)
RUN chmod -R 777 /var/www/html/config

# Activation du module rewrite
RUN a2enmod rewrite

EXPOSE 80
