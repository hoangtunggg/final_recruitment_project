FROM node:20.19.1-alpine3.21 AS deps
WORKDIR /app
COPY shared ./shared
COPY company-service/package*.json ./company-service/
RUN cd shared && npm install --omit=dev --ignore-scripts && cd ../company-service && npm install --omit=dev --ignore-scripts
FROM node:20.19.1-alpine3.21
ENV NODE_ENV=production
WORKDIR /app/company-service
COPY --from=deps /app /app
COPY company-service .
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=4 CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","src/server.js"]
