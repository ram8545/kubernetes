# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files (if you have package.json/package-lock.json)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
