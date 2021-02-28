FROM golang:1.15-alpine AS build

# gcc and libc (musl-dev) are required by kaspad
RUN apk add gcc musl-dev

RUN mkdir /build
WORKDIR /build

COPY processing/go.mod .
COPY processing/go.sum .

RUN go mod download

COPY processing .

RUN GOOS=linux go build -o processing .

FROM alpine
WORKDIR /app
COPY --from=build /build/processing /app/

RUN mkdir -p /app/database/migrations
COPY --from=build /build/database/migrations/ /app/database/migrations/
