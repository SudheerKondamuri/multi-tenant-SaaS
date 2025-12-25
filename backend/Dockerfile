FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Port 5000 is mandatory for the backend service
EXPOSE 5000 
CMD ["npm", "start"]