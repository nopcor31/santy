# Base image with Node.js 20 on Debian
FROM node:20-slim

# Install LibreOffice, writer module, Java runtime, dbus, graphics libraries, and standard fonts for document rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    libreoffice-java-common \
    default-jre-headless \
    fonts-liberation \
    fonts-dejavu \
    fontconfig \
    dbus \
    libgl1 \
    which \
    && rm -rf /var/lib/apt/lists/*

# Ensure /tmp is fully writable and set default HOME
ENV HOME=/tmp
RUN mkdir -p /tmp && chmod 777 /tmp

# Verify LibreOffice installation and headless mode during image build
RUN soffice --headless --version

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

# Perform real DOCX to PDF conversion test using the exact command executed by server.ts
RUN HOME=/tmp soffice --headless --norestore --writer --convert-to pdf "PROPUESTA COMERCIAL.docx" --outdir /tmp \
    && test -s "/tmp/PROPUESTA COMERCIAL.pdf" \
    && rm -f "/tmp/PROPUESTA COMERCIAL.pdf"

# Build application assets and compiled server
RUN npm run build

# Expose default application port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]

