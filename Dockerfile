# Base image with Node.js 20 on Debian
FROM node:20-slim

# Install LibreOffice, writer module, and standard fonts for document rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    fonts-liberation \
    fonts-dejavu \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency manifests and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and assets (including PROPUESTA COMERCIAL.docx and BROCHURE.pdf)
COPY . .

# Build application assets and compiled server
RUN npm run build

# Expose default application port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
