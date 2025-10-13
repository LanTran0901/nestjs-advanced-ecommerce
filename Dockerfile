FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy code & prisma
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose NestJS default port
EXPOSE 5000

# Start the app
CMD ["npm", "run", "start:prod"]
