FROM node:22.14-alpine

# Make app directory in the container.
RUN mkdir /app

# Copy whole code to app directory.
COPY app.js /app
COPY audio-system.js /app
COPY bee-loop.mp3 /app
COPY bee.js /app
COPY bee.png /app
COPY bees.mp3 /app
COPY bump.mp3 /app
COPY favicon.ico /app
COPY grass.jpg /app
COPY index.html /app
COPY qr.png /app
COPY slurp.mp3 /app
COPY sse-connection.js /app
COPY styles.css /app

# Copy package.json app directory.
COPY package.json /app
COPY package-lock.json /app
COPY *.js /app
COPY *.css /app

# make app directory as the working directory.
WORKDIR /app

# Install dependencies.
RUN npm install -only=production

# Expose the port
EXPOSE 8080

# Start the process
CMD ["npm", "run", "prod"]