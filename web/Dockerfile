FROM node:15.8.0-alpine AS build
WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

ARG REACT_APP_API_ADDRESS
RUN REACT_APP_API_ADDRESS=${REACT_APP_API_ADDRESS} npm run build

FROM node:15.8.0-alpine
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/build /app/
