#!/bin/bash
# Script de déploiement Ubuntu 22.04+ (Nginx, Gunicorn, PostgreSQL)

echo ">>> Installation des dépendances systèmes..."
apt update
apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib curl

echo ">>> Configuration de la base de données..."
sudo -u postgres psql -c "CREATE DATABASE samabutik;"
sudo -u postgres psql -c "CREATE USER samabutik_user WITH PASSWORD 'motdepassefort';"
sudo -u postgres psql -c "ALTER ROLE samabutik_user SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE samabutik_user SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE samabutik_user SET timezone TO 'UTC';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE samabutik TO samabutik_user;"

echo ">>> Configuration du projet..."
mkdir -p /var/www/samabutik
cp -r ../* /var/www/samabutik/
cd /var/www/samabutik

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export DEBUG=False
export SECRET_KEY='django-insecure-key-generee-ici'

python manage.py makemigrations shop
python manage.py migrate
python manage.py collectstatic --noinput

echo ">>> Configuration Gunicorn/Nginx..."
cp deploy/gunicorn.service /etc/systemd/system/
systemctl daemon-reload
systemctl start gunicorn
systemctl enable gunicorn

cp deploy/nginx.conf /etc/nginx/sites-available/samabutik
ln -s /etc/nginx/sites-available/samabutik /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo ">>> Déploiement terminé. Le backend est accessible."
