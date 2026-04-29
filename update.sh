#!/bin/bash
# Run on VPS to pull latest code and restart
# Usage: bash update.sh
set -e
cd /var/www/e-shop
git pull origin main
npm install --production
cd client && npm install && npm run build && cd ..
pm2 restart vipstroy
pm2 status
echo "Update complete — http://159.194.201.181"
