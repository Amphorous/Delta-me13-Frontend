# ---- Stage 1: Build the React app ----
FROM node:22-alpine AS build

WORKDIR /app

COPY remuria-for-hsr/package*.json ./
RUN npm ci

COPY remuria-for-hsr/ ./

ENV VITE_CELESTIA_API_URL=/delta
ENV VITE_TRANSLATION_API_URL=/translator
ENV VITE_AUTH_API_URL=
ENV VITE_BASE_FRONTEND_URL=

RUN npm run build

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
