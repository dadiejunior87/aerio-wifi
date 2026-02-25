FROM php:8.2-apache

# Installation de SQLite
RUN apt-get update && apt-get install -y libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite

# Configuration d'Apache pour le dossier public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# Activation de rewrite
RUN a2enmod rewrite

# Copie des fichiers
COPY . /var/www/html/

# Permissions pour la base de données
RUN mkdir -p /var/www/html/config && chown -R www-data:www-data /var/www/html/config

EXPOSE 80
