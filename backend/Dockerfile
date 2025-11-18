FROM node:20-slim

WORKDIR /app

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (postinstall script will try to generate Prisma Client)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client with aggressive retry logic (required for TypeScript build)
# Try multiple times with increasing delays
RUN PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate || \
    (echo "Retry 1..." && sleep 10 && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate) || \
    (echo "Retry 2..." && sleep 20 && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate) || \
    (echo "Retry 3..." && sleep 30 && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate) || \
    (echo "Retry 4..." && sleep 40 && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate) || \
    (echo "Final retry..." && sleep 60 && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate)

# Build TypeScript (requires Prisma Client to be generated)
RUN npm run build

# Expose port
EXPOSE 4000

# Start server (generate Prisma Client, create tables from schema on startup)
# Generate Prisma Client at runtime with retry logic for network issues
CMD ["sh", "-c", "PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate || (sleep 5 && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate) || (sleep 10 && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate) && npx prisma db push --accept-data-loss || true && npm start"]

