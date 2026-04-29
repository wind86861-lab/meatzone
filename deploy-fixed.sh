#!/bin/bash

# VipStroy Fixed Deployment Script
echo "🚀 Starting VipStroy deployment (Fixed)..."

# Go to the VipStroy directory
cd VipStroy

# Install PM2 globally with sudo
echo "📥 Installing PM2 globally..."
sudo npm install -g pm2

# Create PM2 configuration file
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vipstroy',
    script: './server/index.js',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
EOF

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo "✅ Deployment complete!"
echo "🌐 Your application should be running on port 5000"
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs vipstroy"
echo "🔄 Restart with: pm2 restart vipstroy"
