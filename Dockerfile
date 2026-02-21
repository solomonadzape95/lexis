# Lexis — Docker image with Node + Git (required for the pipeline)
FROM node:20-bookworm-slim

# Install git (not present in slim by default)
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
# Install all deps (tailwindcss, postcss, typescript are devDependencies but needed for next build)
RUN npm ci

COPY . .

# NEXT_PUBLIC_* must be present at build time (Next.js inlines them into the client bundle).
# Pass them as build args when building the image, e.g.:
#   docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=... --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... -t lexis .
# On Render: set these in the service Environment and enable "Use build-time env for Docker" or pass as Docker build args.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# Remove devDependencies so the image only has what's needed at runtime
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
