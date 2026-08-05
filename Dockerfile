# Stage 1: Build the React application and Express server bundle
FROM node:24-slim AS builder
WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code and config files
COPY tsconfig.json vite.config.ts index.html components.json ./
COPY src/ ./src/
COPY components/ ./components/
COPY lib/ ./lib/
COPY server.ts ./

# Build both client-side React and server bundle (outputs to dist/)
RUN npm run build

# Stage 2: Production runtime image
FROM node:24-slim
WORKDIR /app

# Install git required by the analyzer to scan repositories
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

# Copy package configurations
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built distribution folder from the builder stage
COPY --from=builder /app/dist ./dist

# Create .repo-cache directory for repository scanning and set proper permissions
RUN mkdir -p .repo-cache && chmod 777 .repo-cache

# Expose the port on which the Express server listens
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the Express server
CMD ["npm", "start"]
