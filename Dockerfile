# Lexis — Docker image with Node + Git (required for the pipeline)
FROM node:20-bookworm-slim

# Install git (not present in slim by default)
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
# Install all deps (tailwindcss, postcss, typescript are devDependencies but needed for next build)
RUN npm ci

COPY . .
RUN npm run build

# Remove devDependencies so the image only has what's needed at runtime
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
