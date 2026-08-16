FROM node:24-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev --ignore-scripts

FROM node:24-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:24-alpine AS runtime
# Create app directory with proper permissions
RUN mkdir -p /app && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Copy package files
COPY ./package.json package-lock.json /app/

# Copy dependencies from production stage
COPY --from=production-dependencies-env --chown=node:node /app/node_modules /app/node_modules

# Copy built assets
COPY --from=build-env --chown=node:node /app/build /app/build
COPY --from=build-env --chown=node:node /app/generated /app/generated

WORKDIR /app

# Switch to non-root user
USER node

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

CMD ["npm", "run", "start"]