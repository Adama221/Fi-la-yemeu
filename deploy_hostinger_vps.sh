#!/bin/bash

# =====================================================
# 🚀 AUTO DEPLOY HOSTINGER VPS - SAMA BUTIK (NODE.JS)
# =====================================================

echo "🚀 Déploiement automatique Sama Butik (Node.js/React)..."

# =====================================================
# 📌 INFORMATIONS DU SITE
# =====================================================

PROJECT_NAME="Fi-la-yemeu"
DOMAIN="samabutik.com"   # ⚠️ REMPLACE PAR TON DOMAINE
PROJECT_DIR="/root/$PROJECT_NAME"

ADMIN_EMAIL="papesamabutik@gmail.com"
ADMIN_USERNAME="Pape"
ADMIN_PASSWORD="Pape221"

WHATSAPP="+221751059213"

# =====================================================
# 🔥 UPDATE SERVER
# =====================================================

apt update && apt upgrade -y

# =====================================================
# 🔥 INSTALLATION PACKAGES (NODE.JS & NGINX)
# =====================================================

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git certbot python3-certbot-nginx

# Installation de PM2 (Gestionnaire de processus Node.js)
npm install -g pm2

# =====================================================
# 🔥 CLONE GITHUB
# =====================================================

cd /root

if [ ! -d "$PROJECT_NAME" ]; then
    git clone https://github.com/Adama221/Fi-la-yemeu.git
fi

cd $PROJECT_DIR

# =====================================================
# 🔥 INSTALL DEPENDANCES & BUILD
# =====================================================

echo "📦 Installation des dépendances et Build du Frontend..."
npm install
npm run build

# =====================================================
# 🔥 FICHIER .ENV
# =====================================================

cat > .env <<EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=SAMA_BUTIK_SECRET_2026
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_USERNAME=$ADMIN_USERNAME
EOF

# =====================================================
# 🔥 CONFIGURATION NGINX (Reverse Proxy)
# =====================================================

cat > /etc/nginx/sites-available/$PROJECT_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 100M;

    # Routes API et Uploads vers Express (Port 3000)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
    }

    # Frontend (React SPA)
    location / {
        root $PROJECT_DIR/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# =====================================================
# 🔥 ACTIVER NGINX
# =====================================================

ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx

# =====================================================
# 🔥 LANCEMENT DU SERVEUR AVEC PM2
# =====================================================

pm2 stop $PROJECT_NAME || true
pm2 delete $PROJECT_NAME || true

# On utilise tsx pour lancer le TypeScript en prod ou la version compilée
# Ici, on lance server.ts directement avec npx tsx pour simplifier
pm2 start "npx tsx server.ts" --name "$PROJECT_NAME"

# Sauvegarde pour redémarrage automatique après reboot VPS
pm2 save
pm2 startup

# =====================================================
# 🔥 SSL HTTPS
# =====================================================

certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL || true

echo ""
echo "======================================="
echo "✅ DÉPLOIEMENT TERMINE (NODE.JS)"
echo "======================================="
echo "🌐 URL : https://$DOMAIN"
echo "🚀 Backend Node sur port 3000 géré par PM2"
echo "======================================="
