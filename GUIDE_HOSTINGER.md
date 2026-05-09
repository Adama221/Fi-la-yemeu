# 🚀 Guide de Correction Hostinger (Sama Butik)

Si vous voyez une page HTML (404) au lieu de vos données API, c'est que **votre serveur Node.js ne reçoit pas l'appel**. Voici comment corriger cela sur votre VPS Hostinger.

## 1. La configuration Nginx (Crucial)
Sur un VPS, Nginx doit agir comme un **Reverse Proxy**. Il doit envoyer les requêtes `/api` vers le port `3000`.

Connectez-vous à votre VPS en SSH et modifiez votre fichier de configuration (ex: `/etc/nginx/sites-available/samabutik.com`) :

```nginx
server {
    listen 80;
    server_name samabutik.com www.samabutik.com;

    # Frontend (Les fichiers statiques du dossier dist)
    location / {
        root /root/Fi-la-yemeu/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend (Rediriger /api vers Node.js sur le port 3000)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads (Images produits)
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

## 2. Démarrer le serveur avec PM2
N'utilisez pas `npm run dev` en production. Utilisez **PM2** pour que le site reste en ligne 24h/24.

```bash
# Dans le dossier du projet
npm run build
pm2 start dist/server.cjs --name "sama-butik"
pm2 save
pm2 startup
```

## 3. Vérifier les logs
Si le login échoue toujours, regardez les logs en direct sur votre VPS :
```bash
pm2 logs sama-butik
```

## 4. Problème de .htaccess (Si vous n'utilisez PAS Nginx directement)
Si vous utilisez le "Node.js Selector" de Hostinger, assurez-vous que votre fichier `.htaccess` à la racine ressemble à ceci pour forcer la redirection :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Rediriger tout ce qui commence par /api vers votre application Node
  RewriteCond %{REQUEST_URI} ^/api/ [NC]
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
  
  # Le reste va vers le frontend React
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---
**Note :** J'ai ajouté le support **CORS** dans le code. Le backend accepte maintenant les requêtes venant de votre domaine.
