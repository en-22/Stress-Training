# ---------- BUILD ----------
    FROM node:22-alpine AS build

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    RUN npm run build
    
    # ---------- NGINX ----------
    FROM nginx:alpine
    
    # Remove config default
    RUN rm /etc/nginx/conf.d/default.conf
    
    # Copia config do nginx
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # Copia build do Vite
    COPY --from=build /app/dist /usr/share/nginx/html
    
    EXPOSE 80
    
    CMD ["nginx", "-g", "daemon off;"]    