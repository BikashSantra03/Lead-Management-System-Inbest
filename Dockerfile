# Use the official Node.js 20 image as the base
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies (including devDependencies for nodemon and ts-node)
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy the .env file (ensure it exists in the project root)
COPY .env ./

# Generate Prisma client
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 3000

# Command to start the application in development mode
CMD ["npm", "run", "dev"]