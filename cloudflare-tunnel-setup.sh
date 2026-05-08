#!/bin/bash
# Cloudflare Tunnel Setup for MeatZone Telegram Mini App
# Run these commands on your server (159.194.210.37)

echo "=== Step 1: Login to Cloudflare ==="
echo "Run: cloudflared tunnel login"
echo "Then visit the URL it prints and login with your Cloudflare account"
echo ""

echo "=== Step 2: Create tunnel ==="
echo "Run: cloudflared tunnel create meatzone"
echo "Save the tunnel UUID it outputs"
echo ""

echo "=== Step 3: Create config ==="
TUNNEL_UUID="YOUR_TUNNEL_UUID_HERE"
cat > ~/.cloudflared/config.yml << CONFIG
tunnel: $TUNNEL_UUID
credentials-file: /root/.cloudflared/$TUNNEL_UUID.json

ingress:
  - hostname: meatzone-mini.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
CONFIG

echo "=== Step 4: Start tunnel ==="
echo "Run: cloudflared tunnel run meatzone"
echo ""

echo "=== Step 5 (optional): Run as service ==="
echo "Run: cloudflared service install"
echo "Then: systemctl start cloudflared"
