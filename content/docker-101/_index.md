---
title: Docker 101
---

# Docker 101

Docker packages your application and everything it needs to run - code, runtime, libraries, config - into a single portable unit called a container. Run that container anywhere Docker is installed and it behaves identically: the same on your laptop as in production, regardless of what else is installed on the host machine.

This solves the classic "works on my machine" problem. Your colleague running a different version of Python, your CI server running a different Linux distro, the production server with its own installed packages - none of that matters once your application is containerised.

**What you will need:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your machine. It is free to download for Mac, Windows, and Linux. After installation, verify it is working by opening a terminal and running `docker version`.

**What this workshop covers:**

- Part 1 - Concepts & building: containers vs VMs, images, layers, Dockerfile, `.dockerignore`, multi-stage builds
- Part 2 - Running & storage: `docker run` flags, container lifecycle, bind mounts, named volumes, the node_modules gotcha
- Part 3 - Debugging & registry: `docker logs`, `docker exec`, crashed containers, image naming, push/pull
- Part 4 - Scratch containers: `FROM scratch`, static linking, CA certificates, minimal images

Select a section from the sidebar to get started.
