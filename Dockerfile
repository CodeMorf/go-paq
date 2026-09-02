FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
  && npm ci \
  && apk del .build-deps
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache --virtual .build-deps python3 make g++ \
  && npm install --global tsx@4.21.0 \
  && apk del .build-deps
COPY --chown=node:node package*.json ./
RUN apk add --no-cache --virtual .runtime-deps python3 make g++ \
  && npm ci --omit=dev \
  && apk del .runtime-deps

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data

EXPOSE 4000
USER node
CMD ["tsx", "server/index.ts"]
