---
title: 4. Scratch Containers.
---

## What is `FROM scratch`?

`FROM scratch` is a special Docker keyword - it means "start with an empty filesystem." No shell, no libc, no package manager, no utilities.

```dockerfile
FROM scratch
COPY my-binary /app
ENTRYPOINT ["/server"]
```

- The resulting image contains *only* what you explicitly COPY in
- No shell → `docker exec -it ... sh` fails (nothing to exec)
- No libc → dynamically linked binaries will segfault at startup
- Minimal CVE surface → security scanners have almost nothing to report

---

## Static vs dynamic linking

Most languages (C, Python, Ruby) link against glibc at runtime. If glibc is not in the image, the binary crashes immediately.

```bash
# Dynamic binary - doesn't work on scratch
ldd ./my-app
# libpthread.so.0 => /lib/...
# libc.so.6 => /lib/...
```

```bash
# Go with CGO disabled - statically linked, works on scratch
CGO_ENABLED=0 go build -o server .
ldd ./server
# not a dynamic executable ✓
```

Other languages that work on scratch: Rust (statically links by default), C compiled with musl.

---

## The CA certificates gotcha

Your scratch binary makes an HTTPS call and gets:

```
x509: certificate signed by unknown authority
```

**Why:** `/etc/ssl/certs/ca-certificates.crt` does not exist on a scratch image - there is nothing there.

**Fix:** copy the cert bundle from the builder stage before it is thrown away.

```dockerfile
FROM golang:1.22 AS builder
RUN CGO_ENABLED=0 go build -o server .

FROM scratch
# Without this line, any HTTPS request fails
COPY --from=builder /etc/ssl/certs/ca-certificates.crt \
                    /etc/ssl/certs/
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

---

## Other files you may need on scratch

```dockerfile
FROM scratch

# TLS certificate bundle (HTTPS calls)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Timezone data (if your app formats local times)
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# /etc/passwd (if your app looks up the current user)
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# Your binary
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

---

## Full scratch Dockerfile

```dockerfile
FROM golang:1.22 AS builder

WORKDIR /app
COPY . .

# CGO_ENABLED=0 = statically linked binary
# -ldflags="-s -w" strips debug symbols (smaller binary)
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o server .

FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt \
                    /etc/ssl/certs/
COPY --from=builder /app/server /server

ENTRYPOINT ["/server"]
```

~800MB build image → ~6MB scratch image. The attack surface shrinks from hundreds of packages to zero.

---

## Try it - build a scratch image

```bash
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

# Try to exec in (will fail - no shell)
docker exec -it scratch-demo sh   # OCI runtime exec failed

# Clean up
docker rm -f scratch-demo
```

---

## Key gotchas to remember

| Problem | Cause | Fix |
|---|---|---|
| `node_modules` missing in dev container | Bind mount masks the container's `/app` directory | Add `-v /app/node_modules` anonymous volume |
| Binary crashes on scratch | Dynamically linked against glibc | Set `CGO_ENABLED=0` or use musl - check with `ldd` |
| HTTPS fails on scratch | No CA cert bundle | Copy `ca-certificates.crt` from the builder stage |
| SIGTERM not received | CMD in shell form | Use exec form `["node", "server.js"]` |

---

## Where to go next

- [Docker Compose](https://docs.docker.com/compose/) - multi-container apps locally
- [Kubernetes](https://kubernetes.io/docs/home/) - container orchestration at scale
- [AWS ECS](https://docs.aws.amazon.com/ecs/) - managed containers on AWS
- [Trivy](https://github.com/aquasecurity/trivy) - vulnerability scanner for images
- [dive](https://github.com/wagoodman/dive) - interactive layer inspector
