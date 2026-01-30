#!/bin/bash

# Deployment script for Calgary Properties
# Usage: ./deploy.sh

set -e

SERVER="5.249.160.54"
DEPLOY_PATH="/srv/calgary.ypilo.com"
PROJECT_NAME="calgary-properties"

echo "🚀 Starting deployment to $SERVER..."

# Find available port on remote server
echo "🔍 Finding available port..."
AVAILABLE_PORT=$(ssh root@$SERVER "
  for port in {3010..3100}; do
    if ! lsof -Pi :\$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo \$port
      break
    fi
  done
")

if [ -z "$AVAILABLE_PORT" ]; then
  echo "❌ No available ports found!"
  exit 1
fi

echo "✅ Found available port: $AVAILABLE_PORT"

# Build project locally
echo "📦 Building project..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf deploy.tar.gz \
  .next \
  public \
  src \
  node_modules \
  package.json \
  package-lock.json \
  next.config.js \
  tsconfig.json \
  tailwind.config.ts \
  postcss.config.mjs \
  .env.local

# Upload to server
echo "📤 Uploading to server..."
scp deploy.tar.gz root@$SERVER:/tmp/calgary-deploy.tar.gz

# Deploy on server
echo "🔧 Deploying on server..."
ssh root@$SERVER << EOF
  set -e
  
  # Create directory
  mkdir -p $DEPLOY_PATH
  cd $DEPLOY_PATH
  
  # Extract files
  tar -xzf /tmp/calgary-deploy.tar.gz
  rm /tmp/calgary-deploy.tar.gz
  
  # Create ecosystem file for PM2
  cat > ecosystem.config.js << 'EOFINNER'
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p $AVAILABLE_PORT',
    cwd: '$DEPLOY_PATH',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $AVAILABLE_PORT
    }
  }]
}
EOFINNER
  
  # Stop existing process
  pm2 stop $PROJECT_NAME || true
  pm2 delete $PROJECT_NAME || true
  
  # Start new process
  pm2 start ecosystem.config.js
  pm2 save
  
  echo "✅ Deployment complete!"
  echo "🌐 Application running on port: $AVAILABLE_PORT"
  echo "📊 PM2 status:"
  pm2 list
EOF

# Cleanup
rm deploy.tar.gz

echo ""
echo "✅ Deployment successful!"
echo "🌐 Access at: http://$SERVER:$AVAILABLE_PORT"
echo "📝 Port: $AVAILABLE_PORT"
echo ""
echo "Useful commands:"
echo "  ssh root@$SERVER 'pm2 logs $PROJECT_NAME'"
echo "  ssh root@$SERVER 'pm2 restart $PROJECT_NAME'"
echo "  ssh root@$SERVER 'pm2 stop $PROJECT_NAME'"
