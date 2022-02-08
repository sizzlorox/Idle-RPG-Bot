FROM node:11-alpine
ENV NODE_ENV=production

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
CMD [ "node", "app.js" ]
