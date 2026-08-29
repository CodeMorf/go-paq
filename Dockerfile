FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
RUN npm ci --omit=dev && npm install --global tsx@4.21.0

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 4000
CMD ["tsx", "server/index.ts"]
