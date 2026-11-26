FROM node:20.20.1-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && chown -R node:node /app
COPY --chown=node:node . .
USER node

EXPOSE 3001
CMD ["npm", "run", "dev"]
