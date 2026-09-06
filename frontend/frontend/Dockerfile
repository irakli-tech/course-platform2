# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# SSL სერტიფიკატების შემოწმების გათიშვა npm-ისთვის
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm config set strict-ssl false

COPY package*.json ./

# დამოკიდებულებების დაინსტალირება
RUN npm install

COPY . .

ENV CI=false
ENV NODE_OPTIONS=--max-old-space-size=4096

# ლოკალურად დაინსტალირებული react-scripts-ის გაშვება npm run build-ით
RUN npm run build

# Stage 2: Nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]