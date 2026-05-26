# =========================
# STAGE 1: BUILD
# =========================
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependency files dulu (IMPORTANT)
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code setelah install
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS app
RUN npm run build


# =========================
# STAGE 2: PRODUCTION
# =========================
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy hasil build dari stage builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/src/main"]