FROM node:24-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
