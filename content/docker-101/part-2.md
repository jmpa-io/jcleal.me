---
title: 2. Running & Storage.
---

## docker run - flags you'll use daily

```bash
docker run \
  --name my-container \    # give it a name (else random)
  -d \                     # detached (background)
  -it \                    # interactive + TTY (for shells)
  -p 8080:80 \             # host:container port mapping
  -e DATABASE_URL=postgres://... \
  -v $(pwd):/app \         # bind mount: host path → container path
  -v my-data:/data \       # named volume
  --rm \                   # delete container on exit
  nginx:alpine
```

---

## Container lifecycle

```bash
# Run → background
docker run -d --name web nginx:alpine

# See running containers
docker ps

# See all containers (including stopped)
docker ps -a

# Stop (sends SIGTERM, waits 10s, then SIGKILL)
docker stop web

# Start again
docker start web

# Remove (must be stopped first)
docker rm web

# Force-remove (stop + rm in one)
docker rm -f web

# Remove all stopped containers
docker container prune
```

---

## Try it - nginx on port 8080

```bash
# Run nginx in the background, map port 8080 → 80
docker run -d --name my-nginx -p 8080:80 nginx:alpine

# Verify it's running
docker ps

# Hit it
curl http://localhost:8080
# or open http://localhost:8080 in a browser

# Check logs
docker logs my-nginx
docker logs -f my-nginx    # follow (like tail -f)

# Clean up
docker stop my-nginx
docker rm my-nginx
```

---

## COPY vs volumes

**COPY** bakes files into the image at build time. Fast. Immutable. Requires a rebuild to update.

**Volume / bind mount** mounts external storage at runtime. Live updates. Not part of the image.

```bash
# COPY: file is baked in - editing the host file does nothing
docker run my-app       # uses /app/config.json from the image

# Bind mount: host file is live-mounted
docker run -v $(pwd)/config.json:/app/config.json my-app
# edit config.json on the host → container sees it immediately

# Named volume: Docker manages the storage location
docker run -v my-db-data:/var/lib/postgresql/data postgres
# data persists across container restarts and removes
```

---

## The node_modules gotcha

```bash
# This looks right - live-reload source code during dev
docker run -v $(pwd):/app node-app

# But it MASKS /app/node_modules from the container!
# The host probably has: node_modules/ (wrong arch, or missing)
# The container had:     /app/node_modules (built correctly with npm install)
# Mounting $(pwd) over /app hides the container's node_modules
```

The bind mount replaces the entire `/app` directory. Anything that was in the container at `/app` - including `node_modules` - is hidden.

---

## The fix - anonymous volume trick

```bash
docker run \
  -v $(pwd):/app \           # bind mount source code
  -v /app/node_modules \     # anonymous volume: preserves container's node_modules
  -p 3000:3000 \
  node-app
```

Docker resolves mount precedence: the anonymous volume at `/app/node_modules` takes priority over the bind mount above. The container sees its own correctly-built node_modules, plus your live source files.

**In `docker-compose.yml`:**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app              # live code reload
      - /app/node_modules   # preserve container's node_modules
```

---

## Named volumes for persistence

```bash
# Named volume - data survives container removal
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=secret \
  -v pg-data:/var/lib/postgresql/data \
  postgres:16-alpine

# Remove and recreate - data is still there
docker rm -f postgres
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=secret \
  -v pg-data:/var/lib/postgresql/data \
  postgres:16-alpine

# Manage volumes
docker volume ls
docker volume inspect pg-data
docker volume rm pg-data     # explicitly delete when done
```

---

## Try it - bind mounts & the node_modules fix

```bash
# 1. Run nginx serving a local HTML file via bind mount
mkdir -p /tmp/html
echo "<h1>hello from the host</h1>" > /tmp/html/index.html
docker run -d --name vol-demo -p 8080:80 \
  -v /tmp/html:/usr/share/nginx/html:ro \
  nginx:alpine
curl http://localhost:8080
# Edit /tmp/html/index.html and curl again - live update, no rebuild

# 2. See the node_modules gotcha in action
docker run --rm -v $(pwd):/app node:20-alpine sh -c \
  "ls /app/node_modules 2>/dev/null || echo 'node_modules is GONE'"

# 3. Fix it with the anonymous volume
docker run --rm -v $(pwd):/app -v /app/node_modules node:20-alpine sh -c \
  "ls /app/node_modules 2>/dev/null && echo 'node_modules is intact' || echo 'still gone'"

# Clean up
docker rm -f vol-demo
```
