# 🚀 Guide de Production Hostinger (Sama Butik)

Si vous voyez une erreur 403 "Host not in allowlist" ou une page 404 HTML, suivez ces étapes pour corriger votre configuration Nginx et sécuriser votre serveur.

## 1. Configuration Nginx (Correction 403 & 404)
Connectez-vous en SSH et remplacez votre fichier de configuration (ex: `/etc/nginx/sites-available/samabutik`) par celui-ci :

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name samabutik.com www.samabutik.com;
    return 301 https://$host$request_uri;
}

# HTTPS principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name samabutik.com www.samabutik.com;

    # Certificat SSL (Généré via Certbot)
    ssl_certificate /etc/letsencrypt/live/samabutik.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/samabutik.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Taille max des uploads (photos produits)
    client_max_body_size 20M;

    # HEADERS DE SÉCURITÉ
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # IMAGES UPLOADÉES
    location /uploads/ {
        alias /root/Fi-la-yemeu/uploads/;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    # API BACKEND (Node.js port 3000)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # FRONTEND REACT SPA
    location / {
        root /root/Fi-la-yemeu/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

**Appliquer :**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 2. Configuration .env
Assurez-vous que votre fichier `/root/Fi-la-yemeu/.env` contient les bonnes valeurs :

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=VOTRE_CLE_LONGUE_ET_SECURE
CORS_ORIGIN=https://samabutik.com
```

## 3. Gestion PM2
Relancez l'app pour prendre les changements en compte :
```bash
cd /root/Fi-la-yemeu
npm run build
pm2 restart sama-butik || pm2 start "npm start" --name "sama-butik"
pm2 save
```

## 4. Permissions
```bash
chown -R www-data:www-data /root/Fi-la-yemeu/uploads
chmod -R 775 /root/Fi-la-yemeu/uploads
```
