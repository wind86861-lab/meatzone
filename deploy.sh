#!/bin/bash

# VipStroy Deployment Script
echo "🚀 Starting VipStroy deployment..."

# Clone the repository
echo "📥 Cloning repository from GitHub..."
git clone https://github.com/wind86861-lab/pnemux.git VipStroy

# Navigate to the project directory
cd VipStroy

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Install client dependencies and build
echo "🏗️ Building client application..."
cd ../client
npm install
npm run build

# Go back to root
cd ..

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

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    npm install -g pm2
fi

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
