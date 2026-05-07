# Déploiement sur Hostinger VPS

## 1. Préparation du serveur VPS
```bash
sudo apt update && sudo apt upgrade
sudo apt install python3-pip python3-venv nginx postgresql postgresql-contrib
```

## 2. Configuration PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE samabutik;
CREATE USER samabutikuser WITH PASSWORD 'Pape221';
ALTER ROLE samabutikuser SET client_encoding TO 'utf8';
ALTER ROLE samabutikuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE samabutikuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE samabutik TO samabutikuser;
\q
```

## 3. Cloner et préparer le projet
```bash
mkdir -p /var/www/samabutik
cd /var/www/samabutik
# Importer le code source ici...

# Compiler react
npm install
npm run build

# Python venv
python3 -m venv venv
source venv/bin/activate
cd django_project
pip install -r requirements.txt
```

## 4. Fichier .env
Créer le fichier `/var/www/samabutik/.env`:
```env
DEBUG=False
ALLOWED_HOSTS=votre_domaine.com,votrevpsip
CSRF_TRUSTED_ORIGINS=https://votre_domaine.com,http://votre_domaine.com
DATABASE_URL=postgres://samabutikuser:Pape221@localhost:5432/samabutik
```

## 5. Démarrage de Django
```bash
python manage.py migrate
python manage.py collectstatic --noinput

# Tester gunicorn
gunicorn --bind 0.0.0.0:8000 core.wsgi:application
# Si ça marche, on peut passer à systemd.
```

## 6. Gunicorn & Nginx permissions
```bash
sudo cp /var/www/samabutik/django_project/deploy/gunicorn.service /etc/systemd/system/
sudo systemctl start gunicorn
sudo systemctl enable gunicorn

sudo chmod -R 775 /var/www/samabutik/django_project/media
sudo chown -R www-data:www-data /var/www/samabutik/django_project/media
sudo chown -R www-data:www-data /var/www/samabutik/django_project/staticfiles

sudo cp /var/www/samabutik/django_project/deploy/nginx.conf /etc/nginx/sites-available/samabutik
sudo ln -s /etc/nginx/sites-available/samabutik /etc/nginx/sites-enabled
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Configuration SSL
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre_domaine.com
```
