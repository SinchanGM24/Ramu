FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci
COPY backend ./backend
WORKDIR /app/backend
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start"]
