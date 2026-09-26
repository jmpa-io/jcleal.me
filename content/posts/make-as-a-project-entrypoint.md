---
date: 2025-10-15
title: "Make as a project entrypoint"
description: "Why I standardised on Make across ~20 repositories, and what that actually looks like in practice."
tags: [make, ci-cd, platform-engineering, automation]
---

Every team I've worked on eventually develops the same problem: repositories that each need their own tribal knowledge to build and run. One repo uses `npm run build`. Another has a `build.sh`. A third needs three environment variables set before anything works, and you find that out by reading through a 400-line bash script on a Friday afternoon when something is broken in production.

After hitting this wall enough times at MYOB, I started standardising on Make as the entrypoint for every repository. By the time I left, it was adopted across roughly 20 repositories. When I joined CBA, I did the same thing.

This is what I learned.

---

## The problem Make solves

The real value of Make isn't that it's a build tool. It's that it gives you a standard vocabulary that works the same way regardless of what language, framework, or runtime is inside the repository.

```
make build
make test
make lint
make deploy
```

A new engineer joining the team doesn't need to learn which build tool each repo uses, where the run script lives, or which flags are required. They look at the Makefile and they understand what's available. That discoverability matters — especially in platform teams that own a lot of repositories.

---

## What a good Makefile looks like

I've converged on a pattern across all my repos. Here's the skeleton:

```makefile
PROJECT = my-service

.DEFAULT_GOAL := help

PHONY += help
help: ## Show this help.
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

PHONY += build
build: ## Build the binary.
	go build -o dist/$(PROJECT) ./cmd/$(PROJECT)/

PHONY += test
test: ## Run tests.
	go test ./...

PHONY += lint
lint: ## Run linters.
	golangci-lint run ./...

.PHONY: $(PHONY)
```

A few things worth noting:

**`make help` as the default goal.** Running `make` with no arguments shows what's available. This is the single most useful thing you can do for discoverability — it costs nothing and saves a lot of time.

**`##` comments on every target.** The `help` target greps for these and displays them. Targets without a `##` comment are internal and don't show up. This is a lightweight way to separate public targets from private ones without any tooling.

**PHONY collected at the top.** Rather than scattering `.PHONY:` declarations throughout the file, I collect everything into a `PHONY` variable and declare it once at the bottom. This makes it easy to see at a glance what's marked phony.

---

## The CI pattern

Once every repository has a consistent Make entrypoint, CI pipelines become trivially composable. At MYOB and CBA, the pipeline steps look like this:

```yaml
- name: Build
  run: make build

- name: Test
  run: make test

- name: Lint
  run: make lint
```

No per-repo logic. No conditional scripts. The pipeline definition is identical across every repository — what varies is the Makefile.

When running in CI, I pass `CI=true` as an environment variable. Makefile targets can use this to enable grouping:

```makefile
build:
	@test -z "$(CI)" || echo "##[group]Building."
	go build -o dist/$(PROJECT) ./cmd/$(PROJECT)/
	@test -z "$(CI)" || echo "##[endgroup]"
```

GitHub Actions and Buildkite both support log grouping via `##[group]` annotations, which folds output in the CI UI. It's a small thing but it makes long pipelines much easier to scan.

---

## Sharing common targets

The pattern I use at jmpa-io is a `Makefile.common.mk` that lives in a separate repository and gets included at the bottom of every consuming Makefile:

```makefile
include $(shell while [[ ! -d .git ]]; do cd ..; done; pwd)/Makefile.common.mk
```

This walks up the directory tree to find the repo root, then includes the common file. Common targets — Docker image builds, CloudFormation deploys, binary builds, test helpers — live in one place. When the pattern changes, it changes once.

The consuming Makefile only needs to define `PROJECT` and whatever targets are specific to that repo:

```makefile
PROJECT = my-service

build: ## Build the binary.
	go build ./cmd/$(PROJECT)/

include $(shell while [[ ! -d .git ]]; do cd ..; done; pwd)/Makefile.common.mk
```

Everything else comes from the common file.

---

## What I'd do differently

The main tradeoff with Make is that it's not obvious. Someone who's never written a Makefile will find the syntax weird — the tab requirement, the automatic variables (`$@`, `$<`, `$^`), the way variables expand. I've seen junior engineers avoid modifying Makefiles because they don't want to break something they don't understand.

The answer is documentation and workshops. At MYOB I ran sessions specifically on Makefiles as part of onboarding to the CI/CD platform. At CBA I've done the same. The investment is small compared to the consistency you get back.

The other thing I'd do differently: don't put logic in Makefiles that belongs in scripts. Makefiles are for defining targets and their dependencies. The implementation should be in a script or a Go binary. Once a Makefile target exceeds about 5 lines of shell, it should probably be extracted.

---

Standardising on Make didn't solve every problem. But it solved the one that costs the most time at scale: figuring out how to work in a repository you haven't touched before.

For any platform team managing more than a handful of repos, it's worth the investment.
