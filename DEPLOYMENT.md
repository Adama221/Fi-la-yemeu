### DÉPLOIEMENT SAMA BUTIK (VPS HOSTINGER)

**ATTENTION / MISE AU POINT :** Le projet actuel a été développé avec **Node.js (Express) + React (Vite)** et non Django. Les erreurs 404 (WordPress/RSS HTML) que vous obtenez proviennent du fait que votre VPS redirige l'API vers un service inexistant. Gunicorn et Django ne s'appliquent pas ici. Voici la configuration stricte et exacte pour déployer le VRAI serveur existant (Node.js).

========================
🟣 CONFIGURATION VPS (NODE.JS + NGINX)
========================

#### A. Commandes Terminal Exactes (Installation Node.js)

```bash
# 1. Mettre à jour et installer Node.js (v20) et PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. Aller dans le dossier du projet
cd /var/www/samabutik
# Supprimez les traces de Django de vos précédents essais
rm -rf venv manage.py requirements.txt

# 3. Installer les dépendances du bon projet Node
npm install

# 4. Compiler le projet (React + Server ESM)
npm run build

# 5. Démarrer le serveur backend avec PM2 (Remplace Gunicorn)
pm2 start dist/server.mjs --name "samabutik-api"

# 6. Sauvegarder PM2 pour qu'il démarre au lancement du VPS
pm2 save
pm2 startup
```

#### B. Configuration Nginx Complète

Remplacez entièrement votre fichier `/etc/nginx/sites-available/samabutik` :

```nginx
server {
    listen 80;
    server_name samabutik.com www.samabutik.com; # Remplacez par votre IP si pas de domaine

    # React Frontend & Fichiers Statiques servis par Node (Proxy Global)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # API Backend (Uploads, Auth, etc.) dirigé vers Node
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fichiers Uploadés (Images des produits)
    location /uploads/ {
        alias /var/www/samabutik/uploads/;
        expires 30d;
        access_log off;
    }
}
```

#### C. Permissions Linux et Redémarrage

```bash
# S'assurer que le dossier uploads existe et à les bonnes permissions Nginx
mkdir -p /var/www/samabutik/uploads/
sudo chown -R www-data:www-data /var/www/samabutik/uploads/
sudo chmod -R 775 /var/www/samabutik/uploads/

# Permissions pour la base de données Node (SQLite)
touch /var/www/samabutik/database.sqlite
sudo chown -R ubuntu:www-data /var/www/samabutik/database.sqlite
sudo chmod 664 /var/www/samabutik/database.sqlite

# Activer et redémarrer Nginx
sudo ln -sf /etc/nginx/sites-available/samabutik /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

========================
🟢 RAPPEL DES CORRECTIONS FAITES AU CODE 
========================
- **Erreurs de connexion Admin :** Le mot de passe a été réinitialisé en hash `bcrypt`. Les identifiants sont strictement: Email: `papesamabutik@gmail.com` et Password: `Pape221`.
- **Media Uploads Root :** Corrigé dans `server.ts` pour pointer sur le bon `__dirname/uploads` au lieu de planter sur le /tmp de Vercel.
- **Boot Server (502 / 500) :** Un bug de chemin de fichier ESM (`import.meta.url`) sur `server.ts` qui faisait crasher Node.js a été patché.
- **Database Connection :** Le chemin dynamique pour `SQLite` a été fiabilisé pour Hostinger (fichier `database.sqlite` persistant) contrairement au fonctionnement serverless.
