---
title: 1. Concepts & Building.
---

## Containers vs VMs

| | Virtual Machine | Container |
|---|---|---|
| Kernel | Full OS per VM | Shares host OS kernel |
| Isolation | Hypervisor emulates hardware | Kernel namespaces + cgroups |
| Boot time | Seconds to minutes | Milliseconds |
| Disk | GBs per image | MBs per image |

Containers use Linux **namespaces** (PID, net, mnt, uts, ipc) to give each container its own view of the world, and **cgroups** to cap CPU and memory usage.

---

## Images vs containers

- An **image** is a read-only blueprint - layers stacked on top of each other. Images are what you download from a registry or build yourself. Think of it as a recipe.
- A **container** is a running instance of an image. It adds a thin writable layer on top. Think of it as the meal made from the recipe.

```bash
# Pull an image (download layers)
docker pull nginx:alpine

# Run a container from that image
docker run --name web nginx:alpine

# List running containers
docker ps

# The image is unchanged - the container has its own writable layer
```

One image can run many containers simultaneously. Stopping a container does not delete its writable layer. Deleting a container discards that writable layer permanently.

---

## Image layers

Every Dockerfile instruction that changes the filesystem creates a new layer. Metadata instructions (`ENV`, `CMD`, `EXPOSE`) create zero-byte layers.

```dockerfile
FROM ubuntu:22.04           # base layer
RUN apt-get update \
 && apt-get install -y curl # new layer: packages added
COPY app/ /app              # new layer: your files
RUN chmod +x /app/run.sh    # new layer: permission change
CMD ["/app/run.sh"]         # metadata only (no layer)
```

**Gotcha:** `RUN apt-get update` on one line and `RUN apt-get install` on another creates a stale cache problem. Always combine them with `&&`.

---

## Why layer order matters

```dockerfile
# Slow - cache busted on any file change
FROM node:20-alpine
COPY . .           # copies everything
RUN npm install    # re-runs on ANY file change
```

```dockerfile
# Fast - cache-friendly
FROM node:20-alpine
COPY package*.json ./   # only deps metadata
RUN npm install         # cached until pkg.json changes
COPY . .                # source changes don't bust npm cache
```

**Rule:** put things that change least often at the top. Dependencies before source code. Config before data.

```bash
# Inspect layers after building
docker history my-app:latest
docker image inspect my-app:latest | jq '.[0].RootFS.Layers'
```

---

## Dockerfile core instructions

```dockerfile
# Base image - always pin a specific tag in production
FROM node:20-alpine

# Working directory inside the container
WORKDIR /app

# Build-time variable (not in final image)
ARG NODE_ENV=production

# Runtime environment variable (baked into image)
ENV PORT=3000

# Copy files from host → image
COPY package*.json ./

# Run a command during build
RUN npm install --omit=dev

COPY . .

# Document the port (informational - doesn't publish it)
EXPOSE 3000

# Default executable - exec form, no shell wrapping
ENTRYPOINT ["node"]

# Default arguments - overridable at runtime
CMD ["server.js"]
```

---

## CMD vs ENTRYPOINT

```dockerfile
# Pattern 1: fixed command
CMD ["node", "server.js"]

# Pattern 2: entrypoint + overridable args
ENTRYPOINT ["node"]
CMD ["server.js"]       # override: docker run myimage other.js

# Pattern 3: shell script entrypoint (handles signals correctly)
COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
```

Always use **exec form** `["executable", "arg"]` - shell form `CMD node server.js` wraps in `/bin/sh -c`, which swallows SIGTERM and means your app never gets a graceful shutdown signal.

---

## .dockerignore

Prevents files from being sent to the Docker build context. Faster builds, smaller images, no accidental secrets.

```text
node_modules/       # huge - container builds its own
.git/               # version history not needed in image
.env                # secrets must never be baked in
.env.*
dist/               # build output (rebuilt inside container)
coverage/
*.log
.DS_Store
README.md
.github/
```

**Security:** a missing `.dockerignore` is the most common way secrets end up baked into images. Check `docker history` if you are unsure.

---

## docker build

```bash
# Basic build
docker build -t my-app:latest .

# Build with a specific tag
docker build -t my-app:1.2.3 .

# Pass build args
docker build --build-arg NODE_ENV=staging -t my-app:staging .

# Build from a specific Dockerfile
docker build -f Dockerfile.dev -t my-app:dev .

# No cache (useful when deps change under you)
docker build --no-cache -t my-app:fresh .

# Multi-platform (for M1 Macs building for Linux amd64)
docker buildx build --platform linux/amd64 -t my-app:latest .
```

---

## Multi-stage builds

Separate the build environment from the runtime environment. The builder stage can be huge - only the final stage ships.

```dockerfile
FROM golang:1.22 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

# Final stage - scratch has no shell, no libc, nothing
FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server /server

ENTRYPOINT ["/server"]
```

golang builder (~800MB) → `scratch` final image is just the binary (~5MB). No CVEs from the toolchain, no shell, minimal attack surface.

---

## Try it - build a multi-stage image

```bash
# Create a minimal Go HTTP server
mkdir /tmp/scratch-demo && cd /tmp/scratch-demo
cat > main.go << 'EOF'
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "hello from scratch")
    })
    log.Fatal(http.ListenAndServe(":8080", nil))
}
EOF
go mod init example.com/scratch-demo

# Build and check the size
docker build -t scratch-demo .
docker images scratch-demo

# Run it
docker run -d --name scratch-demo -p 8080:8080 scratch-demo
curl http://localhost:8080

# Clean up
docker rm -f scratch-demo
```
