FROM node:18-alpine

WORKDIR /app

COPY . .

# Install client deps including devDependencies (Vite lives in devDeps)
RUN npm install --include=dev --prefix client

# Install server deps (esbuild is in dependencies, no --include=dev needed)
RUN npm install --prefix server

# Build React frontend
RUN npm run build --prefix client

# Build Express backend → produces server/dist/index.js
RUN npm run build --prefix server

EXPOSE 5001

CMD ["node", "server/dist/index.js"]
