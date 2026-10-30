# Use lightweight official Node.js image
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for Docker cache optimization
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose port (default 3000)
EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
