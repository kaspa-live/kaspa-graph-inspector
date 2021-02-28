FROM golang:1.15-alpine AS build

RUN mkdir /build
WORKDIR /build

COPY node/go.mod .
COPY node/go.sum .

RUN go mod download

COPY node .

RUN GOOS=linux go build -o node .

FROM alpine
WORKDIR /app
COPY --from=build /build/node /app/
