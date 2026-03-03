# Stage 1: Build web frontend
FROM node:22-alpine AS web-builder
WORKDIR /build
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY --chown=node:node . .
COPY --chown=node:node --from=web-builder /build/build ./web/build

USER node
CMD ["node", "app.js"]
