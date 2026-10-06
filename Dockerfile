FROM node:24-alpine

WORKDIR /app

# Install production dependencies first, so this layer is reused across code changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy only the runtime files; app.js serves the whole directory statically.
COPY *.js *.css *.html *.mp3 *.png *.jpg *.ico ./

EXPOSE 8080

CMD ["npm", "run", "prod"]
