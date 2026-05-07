### DÉPLOIEMENT SAMA BUTIK (HOSTINGER VPS)

Voici les instructions complètes et les fichiers de configuration pour déployer le back-end Django sur votre VPS Hostinger (avec Ubuntu).

#### 1. Configuration Gunicorn (`/etc/systemd/system/gunicorn.service`)

Créez le fichier de service pour que Gunicorn tourne en arrière-plan :

```ini
[Unit]
Description=gunicorn daemon pour Sama Butik
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory=/chemin/vers/votre/django_project
ExecStart=/chemin/vers/votre/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/chemin/vers/votre/django_project/samabutik.sock core.wsgi:application

[Install]
WantedBy=multi-user.target
```
*Remplacez `/chemin/vers/votre/django_project` et `/chemin/vers/votre/venv` par le vrai chemin de votre projet.*

Activez Gunicorn :
```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

#### 2. Configuration Nginx (`/etc/nginx/sites-available/samabutik`)

Cette configuration va gérer React, les API vers Django, et surtout les **Images (Media)** et **Fichiers Statiques**.

```nginx
server {
    listen 80;
    server_name samabutik.com www.samabutik.com; # Remplacez par votre domaine ou IP

    # React Frontend
    location / {
        root /chemin/vers/votre/frontend/dist; # Chemin vers le build de React
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Django API proxy
    location /api/ {
        include proxy_params;
        proxy_pass http://unix:/chemin/vers/votre/django_project/samabutik.sock;
    }

    # Django Admin proxy
    location /admin/ {
        include proxy_params;
        proxy_pass http://unix:/chemin/vers/votre/django_project/samabutik.sock;
    }

    # Serveur Fichiers Media (Upload Images)
    location /media/ {
        alias /chemin/vers/votre/django_project/media/;
    }

    # Serveur Fichiers Static (Django Admin)
    location /static/ {
        alias /chemin/vers/votre/django_project/staticfiles/;
    }
}
```

Activez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/samabutik /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

#### 3. Commandes Django pour Finaliser

Une fois le code de l'application mis à jour, exécutez ceci dans `/django_project` (avec votre environnement virtuel activé) :

```bash
# 1. Installer les dépendances
pip install -r requirements.txt
pip install gunicorn

# 2. Appliquer les migrations
python manage.py makemigrations shop
python manage.py migrate

# 3. Réunir les fichiers statiques (pour l'interface admin Django)
python manage.py collectstatic --noinput

# 4. Créer le dossier media et ajuster les permissions Nginx
mkdir -p media
sudo chown -R www-data:www-data media/
sudo chmod -R 775 media/

sudo chown -R www-data:www-data db.sqlite3
sudo chmod 664 db.sqlite3
sudo chown www-data:www-data /chemin/vers/votre/django_project/

# 5. Créer l'Admistrateur par défaut manuellement (au cas où il manquerait)
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(email='papesamabutik@gmail.com').exists() or User.objects.create_superuser('Pape', 'papesamabutik@gmail.com', 'Pape221')" | python manage.py shell

# 6. Redémarrer Gunicorn pour prendre en compte les nouveaux paramètres
sudo systemctl restart gunicorn
```

#### Résumé des Corrections Appliquées dans le Code Source (Déjà effectuées) :

1. **Login & Auth**: Le Token JWT ignore désormais la casse lors du typage d'email. Le rôle administrateur est injecté correctement quelles que soient les majuscules grâce à des `strip().lower()` dans `models.py`. Le Logout ne bloque plus React même en cas d'erreur de réseau avec Supabase.
2. **Produits (Création / Upload)**: L'API ignorait silencieusement la création car l'ID de Catégorie n'était pas un entier, et l'image ne se processait pas. Nous avons défini "Category" comme un simple texte, ce qui permet à l'admin Django d'enregistrer. L'upload a été re-typé pour que le multipart/form ne freeze pas si aucune photo n'est présente, gérant ainsi les champs `is_published` robustement.
3. **Configurations Prod (`settings.py`)**: `CSRF_TRUSTED_ORIGINS`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_PROXY_SSL_HEADER`, et `DEBUG=False` (si en production) ont été finalisés de manière sécurisée pour les sous-domaines sur ce système.
