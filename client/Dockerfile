FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
