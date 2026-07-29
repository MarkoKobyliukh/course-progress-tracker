# Backend: Express + Prisma (Node 22).
FROM node:22-bookworm-slim

WORKDIR /app

# Prisma needs OpenSSL at runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install deps first (better layer caching).
COPY package*.json ./
RUN npm ci

# Generate Prisma client (needs the schema).
COPY prisma ./prisma
RUN npx prisma generate

# Compile TypeScript -> dist.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 4000

# Apply migrations, then start the compiled server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
