FROM node:22.14-alpine

# Make app directory in the container.
RUN mkdir /app

# Copy whole code to app directory.
COPY src/ /app

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