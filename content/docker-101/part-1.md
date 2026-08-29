---
title: 1. Basics.
images: [/img/docker-101/logo.png]
---

## Images and containers

Before running anything, it helps to understand the two core concepts Docker is built on:

- An **image** is a read-only template — a snapshot of a filesystem, application, and its dependencies. Images are what you download from Docker Hub or build yourself. Think of an image as a recipe.
- A **container** is a running instance of an image. You can run many containers from the same image, each isolated from the others. Think of a container as the meal you made from the recipe.

---

## Your first container: `hello-world`

The fastest way to confirm Docker is working is to run the official `hello-world` image:

```bash
docker run hello-world
```

Docker will:
1. Check whether the `hello-world` image exists locally
2. Pull it from Docker Hub if it does not
3. Create a container from the image and run it
4. Print a message confirming everything is working, then exit

You will see output like `Hello from Docker!` along with a brief explanation of what just happened.

---

## Running an interactive shell

You can run a container and drop straight into a shell inside it. This is useful for exploring an environment or running one-off commands without installing anything on your host machine:

```bash
docker run -it ubuntu bash
```

- `-i` keeps stdin open so you can type commands
- `-t` allocates a pseudo-TTY so the shell prompt renders correctly
- `ubuntu` is the image name
- `bash` is the command to run inside the container

You are now inside an Ubuntu container. Try `ls`, `cat /etc/os-release`, or `apt list --installed`. Type `exit` to leave.

---

## Listing containers

To see containers that are currently running:

```bash
docker ps
```

To see all containers — including stopped ones:

```bash
docker ps -a
```

The output shows each container's ID, the image it came from, when it was created, its status, and its name (auto-generated if you did not provide one with `--name`).

---

## Listing images

To see all images downloaded to your machine:

```bash
docker images
```

This shows the repository, tag, image ID, creation date, and size of each image.

---

## Stopping and removing containers

To stop a running container (use the container ID or name from `docker ps`):

```bash
docker stop <container-id>
```

To remove a stopped container:

```bash
docker rm <container-id>
```

To stop and remove in one command:

```bash
docker rm -f <container-id>
```

To remove all stopped containers at once:

```bash
docker container prune
```

---

## Removing images

To remove an image (it must not be in use by any container, even a stopped one):

```bash
docker rmi <image-id>
```

To remove all images that are not referenced by any container:

```bash
docker image prune -a
```

---

## Key commands

| Command | What it does |
|---|---|
| `docker run <image>` | Create and start a container from an image |
| `docker run -it <image> bash` | Start a container with an interactive shell |
| `docker run --rm <image>` | Start a container and remove it automatically when it exits |
| `docker ps` | List running containers |
| `docker ps -a` | List all containers including stopped |
| `docker images` | List downloaded images |
| `docker stop <id>` | Stop a running container |
| `docker rm <id>` | Remove a stopped container |
| `docker rm -f <id>` | Force-stop and remove a container |
| `docker rmi <id>` | Remove an image |
| `docker container prune` | Remove all stopped containers |
| `docker image prune -a` | Remove all unused images |
