# Build stage
FROM oven/bun:alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Absolute origin for canonical/og:url/og:image/sitemap. Without it the build
# falls back to a placeholder and social previews break.
#   docker build --build-arg SITE_URL=https://passgen.example .
ARG SITE_URL
ENV SITE_URL=$SITE_URL
RUN bun run build

# Production stage
FROM oven/bun:alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./

EXPOSE 80

CMD ["bun", "run", "server.js"]
