FROM golang:1.15-alpine AS build

# gcc and libc (musl-dev) are required by kaspad
RUN apk add gcc musl-dev

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
