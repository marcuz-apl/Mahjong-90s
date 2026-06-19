# Stage 1: Build the application
FROM node:24-alpine AS builder

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++ gcc sqlite-dev

WORKDIR /app

# Copy dependency configs
COPY package.json package-lock.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Build Next.js app
RUN npm run build

# Remove development dependencies to keep final image small
RUN npm prune --production

# Stage 2: Production runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy necessary files from build stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Ensure the database data directory exists and has correct permissions
RUN mkdir -p data

EXPOSE 3000

CMD ["npm", "run", "start"]
