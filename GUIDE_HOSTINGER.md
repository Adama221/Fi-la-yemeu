# 🚀 Guide de Correction Hostinger (Sama Butik)

Si vous voyez une page HTML (404) au lieu de vos données API, c'est que **votre serveur Node.js ne reçoit pas l'appel** ou qu'il n'est pas démarré.

## 1. Vérification du serveur Node.js
Connectez-vous en SSH et vérifiez que PM2 fait bien tourner l'app :
```bash
pm2 status
```
Si l'application n'apparaît pas ou est en "stopped", lancez :
```bash
cd /root/Fi-la-yemeu
npm run build
pm2 start "npm start" --name "sama-butik"
pm2 save
```

## 2. Test direct du port 3000
Vérifiez si Node répond localement sur le VPS :
```bash
curl http://127.0.0.1:3000/api/health
```
- Si vous recevez du JSON : Node fonctionne, le problème vient de **Nginx**.
- Si vous recevez "Connection refused" : Node ne tourne pas sur le port 3000.

## 3. Configuration Nginx (Reverse Proxy)
Sur un VPS, Nginx doit rediriger les appels `/api` vers Node. Modifiez votre fichier (ex: `/etc/nginx/sites-available/samabutik.com`) :

```nginx
server {
    listen 80;
    server_name samabutik.com www.samabutik.com;

    # Frontend (React files)
    location / {
        root /root/Fi-la-yemeu/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # IMPORTANT: Rediriger l'API vers Node sur le port 3000
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads (Images)
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
    }
}
```
**Après modification :** `nginx -t` puis `systemctl restart nginx`.

## 4. Problème de .htaccess (Si vous n'utilisez PAS Nginx)
Si votre hébergement utilise Apache (rare sur un VPS "pur" mais possible avec OpenLiteSpeed ou autre), assurez-vous d'avoir ce `.htaccess` à la racine :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Forcer le backend pour /api
  RewriteCond %{REQUEST_URI} ^/api/ [NC]
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
  
  # Le reste vers React
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 5. Diagnostic en ligne
Visitez : `https://samabutik.com/api/debug-env` pour voir si le backend répond.
Si vous recevez une page 404 HTML, c'est que Nginx ne trouve pas le serveur Node.
