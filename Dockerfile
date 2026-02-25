FROM php:8.2-apache

# Installation des extensions pour la base de données
RUN apt-get update && apt-get install -y libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite

# On pointe le serveur vers ton dossier public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# Copie de tes dossiers (public, config, etc.)
COPY . /var/www/html/

# On s'assure que PHP peut écrire dans le dossier config pour aerio.db
RUN chmod -R 777 /var/www/html/config

# Activation du module de réécriture
RUN a2enmod rewrite

EXPOSE 80
