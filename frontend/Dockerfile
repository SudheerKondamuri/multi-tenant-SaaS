# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app (optional, depending on if you're using a dev server)
# RUN npm run build

# Expose port 3000 as required by the task
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]