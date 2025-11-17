# VNC Manager

A secure, multi-user web application for managing and accessing VNC connections through a browser-based interface.

## Features

- **User Authentication**: Registration and login with JWT-based authentication
- **Role-Based Access Control**: Admin and User roles with different permissions
- **VNC Machine Management**:
  - Create, edit, and delete VNC machines
  - Shared machines (admin-created, visible to all users)
  - Personal machines (user-owned)
- **Tabbed VNC Sessions**: Open multiple VNC connections in tabs within the UI
- **Admin Panel**: User management and shared machine administration
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Tech Stack

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Input validation

### Frontend
- **React** + **TypeScript**
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Infrastructure
- **Docker** + **Docker Compose** - Containerization
- **noVNC** - Web-based VNC client

## Project Structure

```
ManagerVNC/
├── backend/              # Backend API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth & error handling
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Entry point
│   ├── prisma/           # Database schema & migrations
│   └── Dockerfile
├── frontend/             # Frontend React app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   └── Dockerfile
├── docker-compose.yml    # Docker Compose configuration
└── README.md
```

## Prerequisites

- Docker and Docker Compose installed
- Git (for cloning the repository)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/jakubp3/ManagerVNC.git
cd ManagerVNC
```

### 2. Start the Application

Start all services using Docker Compose:

```bash
docker compose up -d
```

This will start:
- **PostgreSQL** database on port `5432`
- **Backend API** on port `4000`
- **Frontend** on port `3000`
- **noVNC** service on port `6080`

### 3. Initialize the Database

Run Prisma migrations to set up the database schema:

```bash
docker compose exec backend npx prisma migrate dev --name init
```

### 4. Seed the Database (Optional)

Create default admin and test users:

```bash
docker compose exec backend npm run prisma:seed
```

This creates:
- **Admin user**: `admin@example.com` / `admin123`
- **Test user**: `user@example.com` / `user123`

### 5. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **noVNC**: http://localhost:6080

## Default Credentials

After seeding:
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

**⚠️ Important**: Change these passwords in production!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user info

### Users (Admin only)
- `GET /api/users` - List all users
- `PATCH /api/users/:id` - Update user (e.g., change role)
- `DELETE /api/users/:id` - Delete user

### VNC Machines
- `GET /api/vnc-machines` - Get all accessible machines (shared + personal)
- `GET /api/vnc-machines/shared` - Get shared machines only
- `GET /api/vnc-machines/personal` - Get personal machines only
- `GET /api/vnc-machines/:id` - Get specific machine
- `POST /api/vnc-machines` - Create new machine
- `PATCH /api/vnc-machines/:id` - Update machine
- `DELETE /api/vnc-machines/:id` - Delete machine

## Usage

### Creating Your First Admin User

If you didn't use the seed script, you can create an admin user via the registration page, then manually update the database:

```bash
docker compose exec db psql -U managervnc -d managervnc
```

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Adding VNC Machines

1. Log in to the application
2. Click "Create Personal Machine" or "Create Shared Machine" (admin only)
3. Fill in:
   - **Name**: A friendly name for the machine
   - **Host**: IP address or hostname of the VNC server
   - **Port**: VNC port (default: 5900)
   - **Password**: VNC password (optional)
4. Click "Save"

### Opening VNC Sessions

1. Find a machine in the list (Shared or Personal)
2. Click "Open" to start a VNC session
3. The session opens in a new tab
4. You can open multiple machines simultaneously
5. Close tabs by clicking the "×" button

### Admin Panel

Admins can:
- View and manage all users
- Promote/demote users
- Delete users
- Manage shared VNC machines

Access the admin panel via the "Admin Panel" link in the header.

## Development

### Running Locally (without Docker)

#### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
# Create a new migration
docker compose exec backend npx prisma migrate dev --name migration_name

# Apply migrations in production
docker compose exec backend npx prisma migrate deploy
```

### Prisma Studio

View and edit database data:

```bash
docker compose exec backend npx prisma studio
```

Access at: http://localhost:5555

## Environment Variables

### Backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://managervnc:managervnc_password@db:5432/managervnc
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

## VNC Connection Notes

The application uses noVNC to provide web-based VNC access. The current setup:

1. The frontend embeds noVNC via iframe
2. noVNC connects directly to VNC servers using the host:port specified
3. VNC passwords are passed as URL parameters (consider using a proxy in production)

**For Production**:
- Use a VNC proxy (websockify) for secure connections
- Implement proper authentication for VNC access
- Consider using a vault for storing VNC passwords
- Set up proper network security (firewall rules, VPN, etc.)

## Security Considerations

- **Passwords**: VNC passwords are stored in plain text in the database. In production, use a secrets vault.
- **JWT Secret**: Change the default JWT secret in production.
- **Database**: Use strong passwords and restrict network access.
- **CORS**: Configure CORS properly for your domain.
- **HTTPS**: Use HTTPS in production.
- **VNC Access**: Ensure VNC servers are properly secured and not exposed to the public internet.

## Troubleshooting

### Database Connection Issues

```bash
# Check database logs
docker compose logs db

# Restart database
docker compose restart db
```

### Backend Issues

```bash
# Check backend logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Frontend Issues

```bash
# Check frontend logs
docker compose logs frontend

# Rebuild frontend
docker compose up -d --build frontend
```

### VNC Connection Not Working

- Verify the VNC server is running and accessible
- Check firewall rules
- Ensure the host and port are correct
- Verify VNC password (if required)

## License

This project is provided as-is for educational and development purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

