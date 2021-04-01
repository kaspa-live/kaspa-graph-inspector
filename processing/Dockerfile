FROM golang:1.15-alpine AS build

# gcc and libc (musl-dev) are required by kaspad
RUN apk add gcc musl-dev

RUN mkdir /build
WORKDIR /build

COPY ./go.mod .
COPY ./go.sum .

ARG KASPAD_VERSION
RUN if [ -n "${KASPAD_VERSION}" ]; then \
        # use replace instead of require - to propagate into nested dependancies
        go mod edit -replace github.com/kaspanet/kaspad=github.com/kaspanet/kaspad@$KASPAD_VERSION ;\
    fi

RUN go mod download

RUN cp go.mod go.mod.bu
RUN cp go.sum go.sum.bu

COPY . .

# Restore go.mod and go.sum because `COPY . .` overwrote them
RUN mv go.mod.bu go.mod
RUN mv go.sum.bu go.sum

RUN GOOS=linux go build -o processing .

FROM alpine
WORKDIR /app
COPY --from=build /build/processing /app/

RUN mkdir -p /app/database/migrations
COPY --from=build /build/database/migrations/ /app/database/migrations/
