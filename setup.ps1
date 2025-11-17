# Setup script for VNC Manager (PowerShell)
# This script helps initialize the project

Write-Host "🚀 Setting up VNC Manager..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "📦 Starting Docker containers..." -ForegroundColor Cyan
docker compose up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
docker compose exec -T backend npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    docker compose exec -T backend npx prisma migrate dev --name init
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Cyan
docker compose exec -T backend npx prisma generate

# Seed database (optional)
$seed = Read-Host "🌱 Do you want to seed the database with default users? (y/n)"
if ($seed -eq "y" -or $seed -eq "Y") {
    Write-Host "🌱 Seeding database..." -ForegroundColor Cyan
    docker compose exec -T backend npm run prisma:seed
    Write-Host ""
    Write-Host "✅ Default users created:" -ForegroundColor Green
    Write-Host "   Admin: admin@example.com / admin123" -ForegroundColor Yellow
    Write-Host "   User:  user@example.com / user123" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Access the application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:4000" -ForegroundColor White
Write-Host "   noVNC:    http://localhost:6080" -ForegroundColor White
Write-Host ""
Write-Host "📚 See README.md for more information" -ForegroundColor Cyan

