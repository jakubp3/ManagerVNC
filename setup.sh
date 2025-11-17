#!/bin/bash

# Setup script for VNC Manager
# This script helps initialize the project

echo "🚀 Setting up VNC Manager..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Start services
echo "📦 Starting Docker containers..."
docker compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run migrations
echo "🗄️  Running database migrations..."
docker compose exec -T backend npx prisma migrate deploy || docker compose exec -T backend npx prisma migrate dev --name init

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker compose exec -T backend npx prisma generate

# Seed database (optional)
read -p "🌱 Do you want to seed the database with default users? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    docker compose exec -T backend npm run prisma:seed
    echo ""
    echo "✅ Default users created:"
    echo "   Admin: admin@example.com / admin123"
    echo "   User:  user@example.com / user123"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo "   noVNC:    http://localhost:6080"
echo ""
echo "📚 See README.md for more information"

