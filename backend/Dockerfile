FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Create startup script
RUN echo '#!/bin/sh\n\
npx prisma migrate deploy || true\n\
npm start' > /app/start.sh && chmod +x /app/start.sh

# Start server
CMD ["/app/start.sh"]

