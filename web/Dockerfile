FROM node:15.8.0-alpine
WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .
