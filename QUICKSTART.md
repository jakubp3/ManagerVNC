# Quick Start Guide

Get VNC Manager up and running in minutes!

## Prerequisites

- Docker Desktop installed and running
- Git (optional, if cloning)

## Steps

### 1. Start the Application

```bash
docker compose up -d
```

### 2. Initialize Database

```bash
# Run migrations
docker compose exec backend npx prisma migrate dev --name init

# Seed with default users (optional)
docker compose exec backend npm run prisma:seed
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **noVNC**: http://localhost:6080

### 4. Login

If you seeded the database:
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

## Using Setup Scripts

### Linux/Mac

```bash
chmod +x setup.sh
./setup.sh
```

### Windows (PowerShell)

```powershell
.\setup.ps1
```

## Next Steps

1. **Create a VNC Machine**:
   - Click "Create Personal Machine" or "Create Shared Machine" (admin only)
   - Enter VNC server details (host, port, password)
   - Click "Save"

2. **Open a VNC Session**:
   - Find your machine in the list
   - Click "Open"
   - The VNC session opens in a new tab

3. **Admin Tasks**:
   - Access Admin Panel from the header
   - Manage users and shared machines

## Troubleshooting

### Database not ready?

```bash
# Check database status
docker compose ps

# View logs
docker compose logs db
```

### Backend not starting?

```bash
# Check backend logs
docker compose logs backend

# Rebuild backend
docker compose up -d --build backend
```

### Frontend not loading?

```bash
# Rebuild frontend
docker compose up -d --build frontend
```

## Stopping the Application

```bash
docker compose down
```

To also remove volumes (deletes database):

```bash
docker compose down -v
```

## Need Help?

See the full [README.md](README.md) for detailed documentation.

