---
title: 3. Debugging & Registry.
---

## docker logs

```bash
# Print all logs
docker logs my-container

# Follow (tail -f equivalent)
docker logs -f my-container

# Last N lines
docker logs --tail 50 my-container

# With timestamps
docker logs -t my-container

# Since a point in time
docker logs --since 5m my-container
docker logs --since 2024-01-15T10:00:00 my-container

# Combine: follow last 20 lines with timestamps
docker logs -f -t --tail 20 my-container
```

Logs come from container stdout/stderr. If your app writes to a file instead, you will not see anything here. Always write to stdout in containers.

---

## docker exec

```bash
# Open a shell in a running container
docker exec -it my-container sh     # Alpine / minimal images
docker exec -it my-container bash   # Debian/Ubuntu-based

# Run a one-off command
docker exec my-container ls /app
docker exec my-container cat /etc/os-release

# Common debugging patterns
docker exec -it my-container sh -c "env | grep DATABASE"
docker exec -it my-container sh -c "ps aux"
docker exec -it my-container sh -c "ls -la /app"
docker exec -it my-container sh -c "curl -s localhost:3000/health"

# Check what process is PID 1 (the one that gets SIGTERM)
docker exec my-container cat /proc/1/cmdline
```

---

## Debugging a crashed container

```bash
# Container exited - check the exit code
docker ps -a
# EXITED (1) means the process failed
# EXITED (137) means OOM killed (or SIGKILL)

# Check logs of a stopped container
docker logs my-container

# Inspect the container metadata
docker inspect my-container | jq '.[0].State'

# Run the image with a shell override (skip CMD/ENTRYPOINT)
docker run -it --entrypoint sh my-app
```

**Scratch containers have no shell** - `docker exec` will not work. Build a separate `:debug` image tag that uses `FROM busybox` as the final stage instead of `FROM scratch`.

---

## Try it - debug a running container

```bash
# Start a container
docker run -d --name debug-me nginx:alpine

# Explore from inside
docker exec -it debug-me sh

# Inside the container:
# ps aux              - what's running
# env                 - environment variables
# ls /etc/nginx       - nginx config location
# cat /etc/nginx/nginx.conf
# exit

# Check resource usage
docker stats debug-me   # live CPU/memory

# Clean up
docker rm -f debug-me
```

---

## Image naming

```text
registry/repository:tag

docker.io/library/nginx:alpine
│          │       │     │
│          │       │     └── tag (version/variant)
│          │       └──────── image name
│          └──────────────── user/org (library = Docker official)
└─────────────────────────── registry host (docker.io = Docker Hub)

# Short form (defaults apply)
nginx            → docker.io/library/nginx:latest
nginx:alpine     → docker.io/library/nginx:alpine
myuser/myapp     → docker.io/myuser/myapp:latest
```

---

## Tag, push, pull

```bash
# Build and tag
docker build -t myapp:1.0.0 .

# Tag with a registry prefix
docker tag myapp:1.0.0 myregistry.example.com/myteam/myapp:1.0.0

# Push to registry (must be logged in)
docker push myregistry.example.com/myteam/myapp:1.0.0

# Pull on another machine
docker pull myregistry.example.com/myteam/myapp:1.0.0

# Login to a registry
docker login myregistry.example.com
# or with credentials
echo $TOKEN | docker login myregistry.example.com -u $USER --password-stdin
```

---

## Try it - tag and inspect

```bash
# Pull an image and inspect its full name
docker pull nginx:alpine
docker inspect nginx:alpine | jq '.[0].RepoDigests'

# Build a tiny image and tag it
cat > /tmp/Dockerfile.hello << 'EOF'
FROM alpine:latest
CMD ["echo", "hello from my-registry"]
EOF
docker build -f /tmp/Dockerfile.hello \
  -t my-registry.example.com/demo/hello:1.0.0 .

# Verify the tag appears
docker images | grep my-registry

# Add a second tag (same image, different name)
docker tag my-registry.example.com/demo/hello:1.0.0 \
           my-registry.example.com/demo/hello:latest
docker images | grep hello

# Inspect before pushing (dry-run)
docker image inspect my-registry.example.com/demo/hello:1.0.0 \
  | jq '.[0] | {Id, RepoTags, Size}'

# Clean up
docker rmi my-registry.example.com/demo/hello:1.0.0 \
           my-registry.example.com/demo/hello:latest
```
