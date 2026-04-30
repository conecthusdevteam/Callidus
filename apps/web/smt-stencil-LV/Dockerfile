FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ARG VITE_SMT_STENCIL_API_URL=http://localhost:3001
# ENV VITE_SMT_STENCIL_API_URL=$VITE_SMT_STENCIL_API_URL

RUN npm run build

FROM nginx:1.29-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 81

CMD ["nginx", "-g", "daemon off;"]
