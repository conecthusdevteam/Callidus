FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY scripts/ ./scripts/

RUN npm run build

RUN chmod +x ./scripts/*.sh

EXPOSE 3000

CMD ["sh", "./scripts/entrypoint.sh"]