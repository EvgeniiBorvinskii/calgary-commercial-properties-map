# Deployment script for Calgary Properties (Windows)
# Usage: .\deploy.ps1

$SERVER = "5.249.160.54"
$DEPLOY_PATH = "/srv/calgary.ypilo.com"
$PROJECT_NAME = "calgary-properties"

Write-Host "🚀 Starting deployment to $SERVER..." -ForegroundColor Green

# Find available port on remote server
Write-Host "🔍 Finding available port..." -ForegroundColor Yellow
$AVAILABLE_PORT = ssh root@$SERVER @"
for port in {3010..3100}; do
  if ! lsof -Pi :`$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo `$port
    break
  fi
done
"@

if ([string]::IsNullOrEmpty($AVAILABLE_PORT)) {
  Write-Host "❌ No available ports found!" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Found available port: $AVAILABLE_PORT" -ForegroundColor Green

# Build project
Write-Host "📦 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Build failed!" -ForegroundColor Red
  exit 1
}

# Create temp directory for deployment
$TEMP_DIR = Join-Path $env:TEMP "calgary-deploy-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null

# Copy necessary files
Write-Host "📦 Preparing deployment package..." -ForegroundColor Yellow
Copy-Item -Path ".next" -Destination "$TEMP_DIR\.next" -Recurse -Force
Copy-Item -Path "public" -Destination "$TEMP_DIR\public" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "package.json" -Destination "$TEMP_DIR\" -Force
Copy-Item -Path "package-lock.json" -Destination "$TEMP_DIR\" -Force
Copy-Item -Path "next.config.js" -Destination "$TEMP_DIR\" -Force
Copy-Item -Path ".env.local" -Destination "$TEMP_DIR\" -Force

# Create archive
Write-Host "📦 Creating archive..." -ForegroundColor Yellow
$ARCHIVE_PATH = Join-Path $env:TEMP "calgary-deploy.zip"
if (Test-Path $ARCHIVE_PATH) { Remove-Item $ARCHIVE_PATH -Force }
Compress-Archive -Path "$TEMP_DIR\*" -DestinationPath $ARCHIVE_PATH -Force

# Upload to server
Write-Host "📤 Uploading to server..." -ForegroundColor Yellow
scp $ARCHIVE_PATH root@${SERVER}:/tmp/calgary-deploy.zip

# Deploy on server
Write-Host "🔧 Deploying on server..." -ForegroundColor Yellow
ssh root@$SERVER @"
set -e

# Install unzip if not present
command -v unzip >/dev/null 2>&1 || yum install -y unzip || apt-get install -y unzip

# Create directory
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH

# Backup existing deployment
if [ -d ".next" ]; then
  echo "📦 Backing up existing deployment..."
  tar -czf ../calgary-backup-`$(date +%Y%m%d-%H%M%S).tar.gz . 2>/dev/null || true
fi

# Extract files
unzip -o /tmp/calgary-deploy.zip
rm /tmp/calgary-deploy.zip

# Install dependencies (production only)
echo "📦 Installing dependencies..."
npm ci --production --ignore-scripts

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
      PORT: $AVAILABLE_PORT,
      HOSTNAME: '0.0.0.0'
    }
  }]
}
EOFINNER

# Ensure PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2..."
  npm install -g pm2
fi

# Stop existing process
pm2 stop $PROJECT_NAME 2>/dev/null || true
pm2 delete $PROJECT_NAME 2>/dev/null || true

# Start new process
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application running on port: $AVAILABLE_PORT"
echo "📊 PM2 status:"
pm2 list

# Show logs
echo ""
echo "📝 Recent logs:"
pm2 logs $PROJECT_NAME --lines 20 --nostream
"@

# Cleanup
Remove-Item $ARCHIVE_PATH -Force -ErrorAction SilentlyContinue
Remove-Item $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host "🌐 Access at: http://${SERVER}:${AVAILABLE_PORT}" -ForegroundColor Cyan
Write-Host "📝 Port: $AVAILABLE_PORT" -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  ssh root@$SERVER 'pm2 logs $PROJECT_NAME'" -ForegroundColor Gray
Write-Host "  ssh root@$SERVER 'pm2 restart $PROJECT_NAME'" -ForegroundColor Gray
Write-Host "  ssh root@$SERVER 'pm2 stop $PROJECT_NAME'" -ForegroundColor Gray
Write-Host "  ssh root@$SERVER 'pm2 monit'" -ForegroundColor Gray
