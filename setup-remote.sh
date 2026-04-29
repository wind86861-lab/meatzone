#!/bin/bash
# Run this script ON the remote server ONCE to fully deploy VipStroy
# Usage: bash setup-remote.sh
# Domain: iltergroup.uz → must already point to this server's IP in DNS

set -e
DOMAIN="iltergroup.uz"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== 1. Installing nginx + certbot ==="
sudo apt-get update -qq
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "=== 2. Temporary HTTP-only nginx (needed for certbot challenge) ==="
sudo tee /etc/nginx/sites-available/vipstroy > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root /var/www/html;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 200 'ok'; }
}
EOF
sudo ln -sf /etc/nginx/sites-available/vipstroy /etc/nginx/sites-enabled/vipstroy
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "=== 3. Getting SSL certificate from Let's Encrypt ==="
sudo certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN \
  --non-interactive --agree-tos --email admin@$DOMAIN \
  --redirect 2>/dev/null || \
sudo certbot certonly --webroot -w /var/www/html -d $DOMAIN -d www.$DOMAIN \
  --non-interactive --agree-tos --email admin@$DOMAIN

echo "=== 4. Installing full nginx config with HTTPS ==="
sudo cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/vipstroy
sudo nginx -t && sudo systemctl reload nginx
echo "nginx serving HTTPS on port 443"

echo "=== 5. Auto-renew SSL (cron) ==="
(sudo crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | sudo sort -u | sudo crontab -

echo "=== 6. Installing pm2 ==="
sudo npm install -g pm2 2>/dev/null || npm install -g pm2

echo "=== 7. Installing dependencies ==="
cd "$APP_DIR"
npm install --silent
cd "$APP_DIR/client" && npm install --silent

echo "=== 8. Building client (production) ==="
npm run build
cd "$APP_DIR"

echo "=== 9. Starting app with pm2 ==="
pm2 delete vipstroy 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null | grep "sudo" | bash 2>/dev/null || true

echo ""
echo "======================================"
echo " DONE! App running at:"
echo "   https://$DOMAIN"
echo "======================================"
echo ""
echo "Useful commands:"
echo "  pm2 logs vipstroy        — live logs"
echo "  pm2 restart vipstroy     — restart"
echo "  pm2 status              — health check"
echo "  certbot renew --dry-run — test SSL renewal"
