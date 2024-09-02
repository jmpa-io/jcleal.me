<<<<<<< HEAD

#
# This Makefile is generic across ALL repositories:
# https://github.com/jmpa-io/root-template/blob/main/Makefile.common.mk
#
# See the bottom for additional notes.
#

# The name of the project.
=======
#
# This Makefile is designed to be generic across ALL repositories.
#
# The original source code for this Makefile can be found here:
# https://github.com/jmpa-io/root-template/blob/main/Makefile.common.mk
# NOTE: Any changes to this Makefile should be made at the original source code.

# The name of the project.
# NOTE: This must be given by another Makefile that references this Makefile.
>>>>>>> template/main
ifndef PROJECT
$(error PROJECT not defined, missing from Makefile?)
endif

<<<<<<< HEAD
# The default command executed when running `make`.
.DEFAULT_GOAL:=	help
=======

#
# ┌─┐┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
# ├┤ │ │││││   │ ││ ││││└─┐
# └  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘o
#

# Determines if a given value is found within another given value, such as
# checking if a given string is found within a given array.
define contains
$(if $(findstring $(1),$(2)),true,false)
endef

# Determines if a given file is considered a SAM template.
define is_sam_template
$(if $(shell awk 'NR==3 && /Transform: AWS::Serverless-/' $(1)),$(1))
endef

# Converts a given path-to-a-Dockerfile to a human readable label associated
# with this project. This makes it easier to do further actions with the
# Dockerfile, like tagging and pushing the Docker image to AWS ECR.
define determine_image_name_from_dockerfile
$(patsubst cmd/%/Dockerfile,$(PROJECT)/%, \
	$(patsubst Dockerfile,$(PROJECT),$(1)) \
)
endef

# Determines the name of the Makefile target associated with the human readable
# label associated with this project.
define determine_target_from_image_name
$(patsubst $(PROJECT),image-root, \
	$(patsubst $(PROJECT)/%,image-%,$(1)) \
)
endef

>>>>>>> template/main

#
# ┬  ┬┌─┐┬─┐┬┌─┐┌┐ ┬  ┌─┐┌─┐
# └┐┌┘├─┤├┬┘│├─┤├┴┐│  ├┤ └─┐
#  └┘ ┴ ┴┴└─┴┴ ┴└─┘┴─┘└─┘└─┘o
#

<<<<<<< HEAD
# The shell used for executing commands.
SHELL = /bin/sh

# The environment used when deploying; This can affect which config is used when deploying.
ENVIRONMENT ?= dev # The environment to deploy to.

# The git commit hash.
COMMIT = $(shell git describe --tags --always)

# The name of this repository.
REPO = $(shell basename $(shell git rev-parse --show-toplevel))

# The name of the GitHub organization commonly used.
ORG ?= jmpa-io

# The operating system this Makefile is being executed on.
OS := $(shell uname | tr '[:upper:]' '[:lower:]')

# The operating system used when building binaries.
BUILDING_OS ?= $(OS)

# A comma separated list of operating systems that can be used when building binaries.
SUPPORTED_OPERATING_SYSTEMS = linux,darwin

# Used for 'if' conditions in Make where a comma is needed.
COMMA := ,
=======
# The shell used when executing commands.
SHELL = /bin/sh

# The default command executed when `make` is run without arguments.
.DEFAULT_GOAL := help

# ---

# The deployment environment (eg. dev, sit, prod).
# NOTE: This affects which config is used when deploying.
ENVIRONMENT ?= dev

# The git commit hash.
# NOTE: This affects how unique or identifiable resources deployed are.
COMMIT ?= $(shell git describe --tags --always)

# The name of this repository, derived from the 'git root directory'.
# NOTE: This affects how identifiable resources deployed are.
REPO = $(shell basename $(shell git rev-parse --show-toplevel))

# The GitHub organization associated with this repository.
ORG ?= jmpa-io

# ---

# A list of supported operating systems for building binaries.
SUPPORTED_OPERATING_SYSTEMS = linux darwin windows

# The operating system currently being used by the host.
OS := $(shell uname | tr '[:upper:]' '[:lower:]')

# The operating system to target when building binaries.
BUILDING_OS ?= $(OS)

# A list of supported CPU architectures for compiling binaries.
# NOTE: run 'go tool dist list' to see all supported architectures for Go.
SUPPORTED_ARCHITECTURES = arm64 amd64

# The CPU architecture currently being used by the host.
ARCH := $(shell uname -m)
ifeq ($(ARCH),x86_64)
	ARCH = amd64
else ifeq ($(ARCH),aarch64)
	ARCH = arm64
endif

# The CPU architecture to target when building binaries.
BUILDING_ARCH ?= $(ARCH)

# ---

# All '.*sh' files in the repository (excluding submodules).
SH_FILES := $(shell find . $(FILTER_IGNORE_SUBMODULES) -name "*.sh" -type f 2>/dev/null)

# All Go files in the repository (excluding submodules).
GO_FILES := $(shell find . $(FILTER_IGNORE_SUBMODULES) -name "*.go" -type f 2>/dev/null)

# All Cloudformation templates & SAM templates in the './cf' directory (excluding submodules).
TEMPLATE_FILES := $(shell find ./cf $(FILTER_IGNORE_SUBMODULES) -name "template.yml" -type f 2>/dev/null)

# All SAM templates in the repository (excluding submodules).
SAM_TEMPLATE_FILES := $(foreach file,$(TEMPLATE_FILES),$(call is_sam_template,$(file)))

# All Cloudformation templates in the repository (excluding submodules).
CLOUDFORMATION_TEMPLATE_FILES := $(filter-out $(SAM_TEMPLATE_FILES),$(TEMPLATE_FILES))

# GitHub Actions workflow files in the '.github/workflows' directory (excluding submodules).
WORKFLOW_FILES := $(shell find .github/workflows $(FILTER_IGNORE_SUBMODULES) -mindepth 1 -maxdepth 1 -name '*.yml' -type f 2>/dev/null)

# ---

# All Dockerfiles in the repository (excluding submodules).
DOCKERFILES := \
		$(subst ./,, \
			$(addsuffix /Dockerfile, \
				$(shell find . $(FILTER_IGNORE_SUBMODULES) -name 'Dockerfile' -exec dirname {} \; 2>/dev/null) \
			) \
		)

# A list of Docker images created from the Dockerfiles in the repository.
IMAGES := \
	$(foreach dockerfile,$(DOCKERFILES), \
		$(call determine_image_name_from_dockerfile,$(dockerfile)) \
	)

# A collection of targets used to build Docker images within this Makefile.
BUILD_TARGETS_FOR_IMAGES := \
	$(foreach image,$(IMAGES), \
		$(call determine_target_from_image_name,$(image)) \
	)

# Tags applied to Docker images when building, pushing, or promoting images.
TAGS ?= $(COMMIT) latest

# ---

# The Cloudformation stack name used when deploying a Cloudformation stack..
STACK_NAME = $(PROJECT)-$*

# The region used when deploying a Cloudformation stack, or other aws-cli
# commands, in the authed AWS account.
AWS_REGION ?= ap-southeast-2

# The id of the authed AWS account.
AWS_ACCOUNT_ID ?= $(shell aws sts get-caller-identity --query 'Account' --output text)

# The default path to an AWS ECR repository for the authed AWS account.
ECR = $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com

# The name of a generic S3 bucket in the AWS Account for storing artifacts.
ifndef BUCKET
BUCKET = $(shell aws ssm get-parameter --name "/common/artifacts-bucket" --query 'Parameter.Value' --output text 2>/dev/null)
endif

# ---

# The AWS region to promote Docker images from.
PROMOTE_FROM_AWS_REGION ?= $(AWS_REGION)

# The id of the AWS account to promote Docker images from.
PROMOTE_FROM_AWS_ACCOUNT_ID ?= $(AWS_ACCOUNT_ID)

# The default path to an AWS ECR repository in another AWS account.
# NOTE: This is used when promoting Docker images between AWS accounts.
PROMOTE_FROM_ECR = $(PROMOTE_FROM_AWS_ACCOUNT_ID).dkr.ecr.$(PROMOTE_AWS_REGION).amazonaws.com

# ---

# The paths to any given Git submodules found in this repository.
SUBMODULES := $(shell git config --file $(shell while [ ! -d .git ]; do cd ..; done; pwd)/.gitmodules --get-regexp path | awk '{ print $$2 }')

# A filter for ignoring Git submodules when using 'find' commands in this Makefile.
FILTER_IGNORE_SUBMODULES = $(foreach module,$(SUBMODULES),-not \( -path "./$(module)" -o -path "./$(module)/*" \))

# ---
>>>>>>> template/main

# Linux specific variables.
ifeq ($(OS),linux)

	# Flags used when doing certain 'sed' commands.
	SED_FLAGS = -i

	# Command used to determine the size of a given file.
	FILE_SIZE = $(shell stat -c '%s' $<)

# Darwin specific variables.
else ifeq ($(OS),darwin)

	# Flags used when doing certain 'sed' commands.
	SED_FLAGS = -i ''

	# Command used to determine the size of a given file.
	FILE_SIZE = $(shell stat -f '%z' $<)

<<<<<<< HEAD
endif

# ---- Files & Directories ----

# A list of shell scripts under ALL paths (except submodules) in this repository.
SH_FILES := $(shell find . $(IGNORE_SUBMODULES) -name "*.sh" -type f 2>/dev/null)

# A list of Go files under ALL paths (except submodules) in this repository.
GO_FILES := $(shell find . $(IGNORE_SUBMODULES) -name "*.go" -type f 2>/dev/null)

# A list of Cloudformation templates under './cf' (except submodules) in this repository.
CF_FILES := $(shell find ./cf $(IGNORE_SUBMODULES) -name 'template.yml' -type f 2>/dev/null)

# A list of SAM templates under './cf' (except submodules) in this repository.
SAM_FILES := $(shell find ./cf $(IGNORE_SUBMODULES) -name 'template.yaml' -type f 2>/dev/null)

# A list of directories under './cf' (except submodules) housing Cloudformation templates.
CF_DIRS := $(shell find ./cf $(IGNORE_SUBMODULES) -mindepth 1 -maxdepth 1 -type d 2>/dev/null)

# A list of workflows under '.github/workflows' (except submodules) in this repository.
WORKFLOW_FILES := $(shell find .github/workflows $(IGNORE_SUBMODULES) -mindepth 1 -maxdepth 1 -name '*.yml' -type f 2>/dev/null)

# A list of Dockerfiles under ALL paths (except submodules) in this repository.
IMAGES := $(patsubst .,$(PROJECT),$(patsubst ./%,%,$(shell find . -name 'Dockerfile' -type f -exec dirname {} \; 2>/dev/null)))

# A list of directories under './cmd' that contain 'main.go'.
CMD_DIRS = $(shell find cmd/* -name main.go -maxdepth 1 -type f -exec dirname {} \; 2>/dev/null | awk -F/ '{$$1=""; sub(/^ /, ""); print $$0}')

# Adds 'cmd/' to each directory found under $(CMD_DIRS).
CMD_SOURCE = $(addprefix cmd/,$(CMD_DIRS))

# Adds 'binary-' to each directory found under $(CMD_DIRS).
BINARIES_TARGETS = $(addprefix binary-,$(CMD_DIRS))

# Adds 'dist/' to each directory found under $(CMD_DIRS).
BINARIES_OUTPUT_DIRECTORIES = $(addprefix dist/,$(CMD_DIRS))

# ---- Submodules ----

# The paths to any given submodules found in this repository.
SUBMODULES := $(shell git config --file $(shell while [[ ! -d .git ]]; do cd ..; done; pwd)/.gitmodules --get-regexp path | awk '{ print $$2 }')

# A space separated list of submodules to ignore when using 'find' commands in
# this Makefile.
IGNORE_SUBMODULES = $(foreach module,$(SUBMODULES),-not \( -path "./$(module)" -o -path "./$(module)/*" \))

# ---- AWS ----

# The region used when deploying a Cloudformation stack, or doing some things
# via the aws-cli, in the authed AWS account.
AWS_REGION ?= ap-southeast-2

# The Cloudformation stack name used when deploying a Cloudformation stack to
# the authed AWS account.
STACK_NAME = $(PROJECT)-$*

# The id of the authed AWS account.
AWS_ACCOUNT_ID ?= $(shell aws sts get-caller-identity --query 'Account' --output text)

# The default path to an AWS ECR repository for the authed AWS account.
ECR = $$(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com

# The name of a generic S3 bucket in the authed AWS account.
# TODO: should this be an AWS SSM Parameter Store path?
BUCKET ?= $(ORG)-artifacts

#
# ┌─┐┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
# ├┤ │ │││││   │ ││ ││││└─┐
# └  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘o
#

# Splits a string by '/' and retrieves the last element in the given array.
get_last_element = $(lastword $(subst /, ,$1))
=======
else ifeq ($(OS),windows)

  # TODO

endif

>>>>>>> template/main

#
# ┌┬┐┌─┐┌─┐┌─┐┌┐┌┌┬┐┌─┐┌┐┌┌─┐┬┌─┐┌─┐
#  ││├┤ ├─┘├┤ │││ ││├┤ ││││  │├┤ └─┐
# ─┴┘└─┘┴  └─┘┘└┘─┴┘└─┘┘└┘└─┘┴└─┘└─┘o
#

ifndef CI
<<<<<<< HEAD
EXECUTABLES ?= \
=======

# Below is a list of dependencies required for running this Makefile.
DEPENDENCIES ?= \
>>>>>>> template/main
	awk \
	aws \
	cfn-lint \
	column \
	find \
	go \
	golangci-lint \
	grep \
	hadolint \
	sam \
	zip
<<<<<<< HEAD
MISSING := $(strip $(foreach bin,$(EXECUTABLES),$(if $(shell command -v $(bin) 2>/dev/null),,$(bin))))
$(if $(MISSING),$(error Please install: $(MISSING)))
endif

=======

# Determines if there are any missing dependencies.
MISSING := \
  $(strip \
    $(foreach binary,$(DEPENDENCIES), \
      $(if $(shell command -v $(binary) 2>/dev/null),,$(binary)) \
    ) \
  )

# Stops the Makefile execution if there are any missing dependencies.
$(if $(MISSING),$(error Please install: $(MISSING)))

endif


>>>>>>> template/main
#
# ┬  ┬┌┐┌┌┬┐
# │  ││││ │
# ┴─┘┴┘└┘ ┴ o
#
<<<<<<< HEAD

.PHONY: lint
=======
#

>>>>>>> template/main
lint: ## ** Lints everything.
lint: \
	lint-sh \
	lint-go \
	lint-cf \
	lint-sam \
	lint-docker \
	lint-workflows

<<<<<<< HEAD
.PHONY: lint-sh
lint-sh: ## Lints shell files.
	@test -z "$(CI)" || echo "##[group]Linting sh."
ifeq ($(SH_FILES),)
	@echo "No *.sh files to lint."
else
	find . -type f -name "*.sh" -exec shellcheck '{}' \+ || true
endif
	@test -z "$(CI)" || echo "##[endgroup]"

.PHONY: lint-go
lint-go: ## Lints Go files.
=======
lint-sh: ## Linting scripts.
lint-sh:
	@test -z "$(CI)" || echo "##[group]Linting scripts."
ifeq ($(SH_FILES),)
	@echo "No *.sh files to lint."
else
	@$(foreach file,$(SH_FILES), - shellcheck "$(file)";)
endif
	@test -z "$(CI)" || echo "##[endgroup]"

lint-go: ## Lints Go files.
lint-go:
>>>>>>> template/main
	@test -z "$(CI)" || echo "##[group]Linting Go."
ifeq ($(GO_FILES),)
	@echo "No *.go files to lint."
else
	golangci-lint run -v --allow-parallel-runners ./...
endif
	@test -z "$(CI)" || echo "##[endgroup]"

<<<<<<< HEAD
.PHONY: lint-cf
lint-cf: ## Lints CF templates.
	@test -z "$(CI)" || echo "##[group]Linting Cloudformation."
ifeq ($(CF_FILES),)
	@echo "No ./cf/*/template.yml files to lint."
else
	find ./cf -type f -name 'template.yml' -exec sh -c 'cfn-lint -r $(AWS_REGION) -t "{}" && aws cloudformation validate-template --template-body file://{}' \;
endif
	@test -z "$(CI)" || echo "##[endgroup]"

.PHONY: lint-sam
lint-sam: ## Lints SAM templates.
	@test -z "$(CI)" || echo "##[group]Linting sam."
ifeq ($(SAM_FILES),)
	@echo "No ./cf/*/template.yaml files to lint."
else
	find ./cf -type f -name 'template.yaml' -exec sam validate --region $(AWS_REGION)-t '{}' \; || true
endif
	@test -z "$(CI)" || echo "##[endgroup]"

.PHONY: lint-docker
lint-docker: ## Lints Dockerfiles.
	@test -z "$(CI)" || echo "##[group]Linting Docker."
ifeq ($(DOCKER_FILES),)
	@echo "No Dockerfiles to lint."
else
	find . -type f -name 'Dockerfile' -exec hadolint '{}' \; || true
endif
	@test -z "$(CI)" || echo "##[endgroup]"

.PHONY: lint-workflows
lint-workflows: ## Lints GitHub Action workflows.
=======
lint-cf: ## Lints CF templates.
lint-cf:
	@test -z "$(CI)" || echo "##[group]Linting CF templates."
ifeq ($(CLOUDFORMATION_TEMPLATE_FILES),)
	@echo "No Cloudformation templates found under ./cf/*/template.yml."
else
	@$(foreach file,$(CLOUDFORMATION_TEMPLATE_FILES), \
		cfn-lint -r $(AWS_REGION) -t $(file) || true; \
		aws cloudformation validate-template --region $(AWS_REGION) --template-body file://$(file) || true; \
	)
endif
	@test -z "$(CI)" || echo "##[endgroup]"

lint-sam: ## Lints SAM templates.
lint-sam:
	@test -z "$(CI)" || echo "##[group]Linting SAM templates."
ifeq ($(SAM_TEMPLATE_FILES),)
	@echo "No SAM templates found under ./cf/*/template.yml."
else
	@$(foreach file,$(SAM_TEMPLATE_FILES), \
		- sam validate --region $(AWS_REGION) -t "$(file)"; \
	)
endif
	@test -z "$(CI)" || echo "##[endgroup]"

lint-docker: ## Lints Dockerfiles.
lint-docker:
	@test -z "$(CI)" || echo "##[group]Linting Dockerfiles."
ifeq ($(DOCKERFILES),)
	@echo "No Dockerfiles to lint."
else
	@$(foreach file,$(DOCKERFILES), \
		hadolint "$(file)" || true; \
	)
endif
	@test -z "$(CI)" || echo "##[endgroup]"

lint-workflows: ## Lints GitHub Action workflows.
lint-workflows:
>>>>>>> template/main
	@test -z "$(CI)" || echo "##[group]Linting GitHub Action workflows."
ifeq ($(WORKFLOW_FILES),)
	@echo "No GitHub Action workflows to lint."
else
<<<<<<< HEAD
	find .github/workflows -mindepth 1 -maxdepth 1 -name '*.yml' -type f -exec actionlint '{}' \; || true
endif
	@test -z "$(CI)" || echo "##[endgroup]"

=======
	@$(foreach file,$(WORKFLOW_FILES), \
		actionlint "$(file)"; \
	)
endif
	@test -z "$(CI)" || echo "##[endgroup]"

PHONY += lint \
				 lint-sh lint-go lint-cf lint-sam lint-docker lint-workflows


>>>>>>> template/main
#
# ┌┬┐┌─┐┌─┐┌┬┐
#  │ ├┤ └─┐ │
#  ┴ └─┘└─┘ ┴ o
#

<<<<<<< HEAD
.PHONY: test
=======
>>>>>>> template/main
test: ## ** Tests everything.
test: \
	test-go

<<<<<<< HEAD
.PHONY: test-go
test-go: ## Runs Go tests.
test-go: dist/coverage.txt
dist/coverage.txt: dist
	@test -z "$(CI)" || echo "##[group]Unit tests."
ifeq ($(GO_FILES),)
	@echo "No *.go files to test or generate code-coverage."
=======
#
# Go.
#

test-go: ## Runs Go tests.
test-go: dist/coverage.txt

dist/coverage.txt: # Generates the dist/coverage.txt file.
dist/coverage.txt: # NOTE: Adding this target to PHONY will generate this file
dist/coverage.txt: #       every time this target is called. Otherwise
dist/coverage.txt: #			 `make clean` will have to be run.
dist/coverage.txt: dist
	@test -z "$(CI)" || echo "##[group]Unit tests for Go."
ifeq ($(GO_FILES),)
	@echo "No Go files found to test or generate code-coverage."
>>>>>>> template/main
else
	@go version
	CGO_ENABLED=1 go test -short -coverprofile=$@ \
    	-covermode=atomic -race -vet=off ./...
endif
	@test -z "$(CI)" || echo "##[endgroup]"

<<<<<<< HEAD
.PHONY: code-coverage
code-coverage: ## Generate a Go code coverage report, broken down by function.
code-coverage: dist/coverage.txt
	@if [[ -f $< ]]; then \
		test -z "$(CI)" || echo "##[group]Code coverage."; \
		go tool cover -func=$<; \
		test -z "$(CI)" || echo "##[endgroup]"; \
	fi

.PHONY: code-coverage-html
code-coverage-html: ## Generate a Go code HTML coverage report, rendered in the default browser.
code-coverage-html: dist/coverage.txt
	@if [[ -f $< ]]; then \
		go tool cover -html=$<; \
	fi
=======
PHONY += test \
				 test-go \
				 dist/coverage.txt


#
# ┌─┐┌─┐┌┬┐┌─┐  ┌─┐┌─┐┬  ┬┌─┐┬─┐┌─┐┌─┐┌─┐
# │  │ │ ││├┤   │  │ │└┐┌┘├┤ ├┬┘├─┤│ ┬├┤
# └─┘└─┘─┴┘└─┘  └─┘└─┘ └┘ └─┘┴└─┴ ┴└─┘└─┘o
#

# The default code-coverage format.
CODE_COVERAGE_FORMAT ?= default

# A list of supported code-coverage formats.
SUPPORTED_CODE_COVERAGE_FORMATS = default html

# Validates if the given code-coverage format is a supported format.
VALID_CODE_COVERAGE_FORMAT := $(strip $(call contains,$(CODE_COVERAGE_FORMAT),$(SUPPORTED_CODE_COVERAGE_FORMATS)))
ifeq ($(VALID_CODE_COVERAGE_FORMAT),false)
$(error "'$(CODE_COVERAGE_FORMAT)' is not a supported format for generating code-coverage in this Makefile")
endif

code-coverage: ## ** Generates code coverage for every programming language commonly used.
code-coverage: \
	code-coverage-go
#
# Go.
#

define code-coverage-go-default
go tool cover -func=$<
endef

define code-coverage-go-html
go tool cover -html=$<
endef

code-coverage-go: ## Generates a code coverage report for Go, formatted by $(CODE_COVERAGE_FORMAT).
code-coverage-go: dist/coverage.txt
	@if [ -f $< ]; then \
		test -z "$(CI)" || echo "##[group]Code coverage for Go."; \
		$(call code-coverage-go-$(CODE_COVERAGE_FORMAT)); \
		test -z "$(CI)" || echo "##[endgroup]"; \
	fi

PHONY += code-coverage \
				 code-coverage-go

>>>>>>> template/main

#
# ┌┐ ┬┌┐┌┌─┐┬─┐┬┌─┐┌─┐
# ├┴┐││││├─┤├┬┘│├┤ └─┐
# └─┘┴┘└┘┴ ┴┴└─┴└─┘└─┘o
#

<<<<<<< HEAD
.PHONY: binaries
binaries: ## ** Builds binaries only for the environment of the $(BUILDING_OS) operating system.
binaries: $(BINARIES_TARGETS)

.PHONY: binaries-all
binaries-all: ## ** Builds binaries for ALL supported operating systems under $(SUPPORTED_OPERATING_SYSTEMS).
	@for os in $(shell echo $(SUPPORTED_OPERATING_SYSTEMS) | tr ',' ' '); do \
		$(MAKE) --no-print-directory BUILDING_OS=$$os binaries; \
	done

# Creates the root output directory.
dist:
	@mkdir -p dist

# Creates the output directory, for a given service.
.SECONDARY: $(BINARIES_OUTPUT_DIRECTORIES)
dist/%: dist
	@mkdir -p dist/$*

# Builds a binary, for the given service, for the Linux environment.
define build_binary_linux
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
	go build --trimpath \
		-tags lambda.norpc \
		-ldflags "-w -s -X version.Version=$(COMMIT)" \
		-o dist/$*/$*-linux-amd64 ./cmd/$*
endef

# Builds a binary, for the given service, for the Darwin environment.
define build_binary_darwin
	CGO_ENABLED=1 GOOS=darwin GOARCH=arm64 \
	go build --trimpath \
		-ldflags "-w -s -X version.Version=$(COMMIT)" \
		-o dist/$*/$*-darwin-arm64 ./cmd/$*
endef

# A wrapper for building a binary, for the given service, for the $(BUILDING_OS) environment.
define build_binary
	@echo "##[group]Building $* binary for $1."
	@go version
	$(call build_binary_$1)
	@test -z "$(CI)" || echo "##[endgroup]"
endef

binary-%: ## Builds a binary, for the given service, for the $(BUILDING_OS) environment.
binary-%: cmd/%/main.go dist/%
	$(call build_binary,$(BUILDING_OS))
=======
# A list of directories under './cmd' that contain 'main.go' (excluding submodules).
CMD_SERVICES := $(shell find cmd/* $(FILTER_IGNORE_SUBMODULES) -name main.go -maxdepth 1 -type f -exec dirname {} \; 2>/dev/null | awk -F/ '{$$1=""; sub(/^ /, ""); print $$0}')

dist: # Creates the root output directory.
dist:
	@mkdir -p dist

dist/%: # Creates the output directory, for a given service.
dist/%: dist
	@mkdir -p dist/$*

print-go-version: # Prints the installed Go version.
print-go-version:
	@test -z "$(CI)" || echo "##[group]Go version."
	@go version
	@test -z "$(CI)" || echo "##[endgroup]"

# Determines if the given string should add ".exe" to the end of it.
define add_windows_suffix
$(if $(findstring windows,$(1)),.exe,)
endef

# Builds a Go binary for the given service, OS, and arch.
# $(1) = service (eg. hello).
# $(2) = operating system (OS) (eg. windows).
# $(3) = cpu architecture (arch) (eg. amd64).
define build_binary
	@test -z "$$CI" || echo "##[group]Building binary $(1)-$(2)-$(3)"
	GOOS=$(2) GOARCH=$(3) \
	go build --trimpath \
		-tags lambda.norpc \
		-ldflags "-w -s -X version.Version=$(COMMIT)" \
		-o dist/$(1)/$(1)-$(2)-$(3)$(call add_windows_suffix,$(2)) ./cmd/$(1)
	@test -z "$$CI" || echo "##[endgroup]"
endef

# Creates a target for building a Go binary for the given service, OS, and arch.
# $(1) = service (eg. hello).
# $(2) = operating system (OS) (eg. windows).
# $(3) = cpu architecture (arch) (eg. amd64).
define build_binary_target
binary-$(1)-$(2)-$(3): cmd/$(1)/main.go dist/$(1) print-go-version
	$(call build_binary_v2,$(1),$(2),$(3))
endef

# Generates targets for ALL combinations of services, operating systems, and
# CPU architectures. These can be executed by 'make binary-<service>-<os>-<arch>'
# below.
$(foreach service,$(CMD_SERVICES), \
	$(foreach os,$(SUPPORTED_OPERATING_SYSTEMS), \
		$(foreach arch,$(SUPPORTED_ARCHITECTURES), \
			$(eval $(call build_binary_target,$(service),$(os),$(arch))) \
		) \
	) \
)

binary-%-%-%: ## Creates a binary for the given service $(1), operating system $(2), and CPU architecture $(3).
binary-%-%-%: #	 NOTE: this target is 'dummy' and is just for adding a comment to the help page.

binary-%: ## Create a binary for the given service, using $(BUILDING_OS) and $(BUILDING_ARCH).
binary-%: cmd/%/main.go dist/%
	$(call build_binary,$*,$(BUILDING_OS),$(BUILDING_ARCH))

binaries-%: ## Creates a binary for all supported OS and ARCH for the given service.
binaries-%: print-go-version
	@$(foreach os,$(SUPPORTED_OPERATING_SYSTEMS), \
		$(foreach arch,$(SUPPORTED_ARCHITECTURES), \
			BUILDING_OS=$(os) BUILDING_ARCH=$(arch) \
			$(MAKE) --no-print-directory binary-$*; \
		) \
	)

build: binaries
binaries: ## ** Builds binaries only for the environment of the $(BUILDING_OS) operating system.
binaries: print-go-version
	@$(foreach service,$(CMD_SERVICES), \
		$(foreach os,$(SUPPORTED_OPERATING_SYSTEMS), \
			$(foreach arch,$(SUPPORTED_ARCHITECTURES), \
				BUILDING_OS=$(os) BUILDING_ARCH=$(arch) \
				$(MAKE) --no-print-directory binary-$(service); \
			) \
		) \
	)

build-%: ## Builds & executes the given service using the host $(OS) & $(ARCH).
build-%: binary-%
	@dist/$*/$*-$(OS)-$(ARCH)$(call add_windows_suffix, $(OS))

PHONY += print-go-version

>>>>>>> template/main

#
# ┬  ┌─┐┌┬┐┌┐ ┌┬┐┌─┐
# │  ├─┤│││├┴┐ ││├─┤
# ┴─┘┴ ┴┴ ┴└─┘─┴┘┴ ┴ o
#

<<<<<<< HEAD
# Moves the bootstrap, for the given service, into the dist directory.
=======
bootstrap-%: # Moves the bootstrap, for the given service, into the dist directory.
>>>>>>> template/main
bootstrap-%: dist/% cmd/%/bootstrap
	@cp cmd/$*/bootstrap dist/$*/

invoke-%: ## Invokes the given service locally, using aws-sam-cli, if able.
invoke-%: cmd/%/local.sh binary-% bootstrap-%
	@$<

<<<<<<< HEAD
#
# ┌┬┐┌─┐┌─┐┬┌─┌─┐┬─┐
#  │││ ││  ├┴┐├┤ ├┬┘
# ─┴┘└─┘└─┘┴ ┴└─┘┴└─ o
#

.PHONY: images
images: ## ** Builds ALL docker images for each services.
images: $(foreach image,$(IMAGES),image-$(image))

define build_image
.PHONY: image-$1
## Builds the docker image for the given service.
image-$1: dist/$1-linux $(subst $(PROJECT),.,$1)/Dockerfile
	@test -z "$(CI)" || echo "##[group]Building $(strip $(call get_last_element,$(subst .,,$1))) image."
	docker build -t $(if $(filter $1,$(PROJECT)),$1,$(PROJECT)/$(strip $(call get_last_element,$1))):$(COMMIT) -t $(if $(filter $1,$(PROJECT)),$1,$(PROJECT)/$(strip $(call get_last_element,$1))):latest -f $(if $(filter $1,$(PROJECT)),./,$1/Dockerfile) .
	@test -z "$(CI)" || echo "##[endgroup]"
endef
$(foreach image,$(IMAGES),$(eval $(call build_image,$(image))))

.PHONY: push
push: ## ** Pushes ALL docker images to AWS ECR.
push: images-development
images-development: $(foreach image,$(IMAGES),push-$(image))

define push_image
.PHONY: push-$1
## Pushes the docker image for a given service to AWS ECR.
push-$1: image-$1
	@test -z "$(CI)" || echo "##[group]Pushing $(strip $(call get_last_element,$(subst .,,$1))) image."
	docker tag $(if $(filter $1,$(PROJECT)),$1,$(PROJECT)/$(strip $(call get_last_element,$1))):$(COMMIT) $(strip $(ECR))/$(strip $(call get_last_element,$(subst .,,$1))):$(COMMIT)
	docker tag $(if $(filter $1,$(PROJECT)),$1,$(PROJECT)/$(strip $(call get_last_element,$1))):latest $(strip $(ECR))/$(strip $(call get_last_element,$(subst .,,$1))):latest
	docker push $(strip $(ECR))/$(strip $(call get_last_element,$(subst .,,$1))):$(COMMIT)
	docker push $(strip $(ECR))/$(strip $(call get_last_element,$(subst .,,$1))):latest
	@test -z "$(CI)" || echo "##[endgroup]"
endef
$(foreach image,$(IMAGES),$(eval $(call push_image,$(image))))

.PHONY: pull
pull: ## ** Pulls ALL docker images for every service from AWS ECR.
pull: $(foreach image,$(IMAGES),pull-$(image))

define pull_image
.PHONY: pull-$1
## For the given service, pulls the associated docker image from AWS ECR.
pull-$1:
	docker pull $(strip $(ECR))/$(strip $(call get_last_element,$(subst .,,$1))):$(COMMIT)
endef
$(foreach image,$(IMAGES),$(eval $(call pull_image,$(image))))
=======

#
# ┌┬┐┌─┐┌─┐┬┌─┌─┐┬─┐
#  │││ ││  ├┴┐├┤ ├┬┘
# ─┴┘└─┘└─┘┴ ┴└─┘┴└─o
#

print-docker-version: # Prints the installed Docker version.
print-docker-version:
	@test -z "$(CI)" || echo "##[group]Docker version."
	@docker version
	@test -z "$(CI)" || echo "##[endgroup]"

# Builds a Docker image for a given service.
# $(1) = The path to the Dockerfile.
# $(2) = The name to tag for the built Dockerfile (aka. a Docker image).
define build_image
	@test -z "$(CI)" || echo "##[group]Building $(2)."
	docker build \
		$(patsubst %,-t $(2):%,$(TAGS)) \
		-f $(1) .
	@test -z "$(CI)" || echo "##[endgroup]"
endef

image-%: ## Builds a Docker image using `./cmd/<service>/Dockerfile`.
image-%: #	NOTE: PHONY isn't declared for this target on purpose.
image-%: #     	  This should be done in any Makefiles reading this file instead.
image-%: cmd/%/Dockerfile print-docker-version
	$(call build_image,$<,$(call determine_image_name_from_dockerfile,$<))

image-root: ## Builds a Docker image using './Dockerfile'.
image-root: Dockerfile print-docker-version
	$(call build_image,$<,$(call determine_image_name_from_dockerfile,$<))

docker-images: images
images: ## Builds ALL the Docker images in this repository.
images: print-docker-version
	@$(foreach dockerfile,$(DOCKERFILES), \
		$(call build_image,$(dockerfile),$(call determine_image_name_from_dockerfile,$(dockerfile))) \
	)

# Pushes a Docker image to AWS ECR.
# $(1) = The name of the service to push to AWS ECR.
# NOTE: This target assumes the `docker push` is actually authenticated to push
# 		to AWS ECR. If not, this should be managed outside this Makefile.
define push_image
	@test -z "$(CI)" || echo "##[group]Tagging $(1) for AWS ECR in $(AWS_ACCOUNT_ID)."
	$(foreach tag,$(TAGS), \
		docker tag $(1) $(ECR)/$(1):$(tag); \
	)
	@test -z "$(CI)" || echo "##[endgroup]"
	@test -z "$(CI)" || echo "##[group]Pushing $(1) to AWS ECR in $(AWS_ACCOUNT_ID)."
	@$(foreach tag,$(TAGS), \
		docker push $(ECR)/$(1):$(tag); \
	)
	@test -z "$(CI)" || echo "##[endgroup]"
endef

push-%: ## For the given service, pushes a Docker image to AWS ECR.
push-%: #  NOTE: PHONY isn't declared for this target on purpose.
push-%: #        This should be done in any Makefiles reading this file instead.
push-%: image-%
	$(call push_image,$(call determine_image_name_from_dockerfile,cmd/$*/Dockerfile))

push-root: ## Pushes the Docker image built from `./Dockerfile`.
push-root: image-root
	$(call push_image,$(call determine_image_name_from_dockerfile,Dockerfile))

push: ## ** Pushes ALL Docker images for ALL services in this repository to AWS ECR.
push: images
	$(foreach image,$(IMAGES), \
		$(call push_image,$(image)); \
	)

# Pulls a Docker image from AWS ECR.
# $(1) = The name of the service to pull from in AWS ECR.
define pull_image
	@test -z "$(CI)" || echo "##[group]Pulling $(1) from AWS ECR in $(AWS_ACCOUNT_ID)."
	@docker pull $(ECR)/$(1):$(COMMIT)
	@test -z "$(CI)" || echo "##[endgroup]"
endef

pull-%: ## Pulls a Docker image, for the given servicea, from AWS ECR.
pull-%: cmd/%/Dockerfile
	$(call pull_image,$(call determine_image_name_from_dockerfile,$<))

pull-root: ## Pulls a Docker image, built from './Dockerfile', from AWS ECR.
pull-root: Dockerfile
	$(call pull_image,$(call determine_image_name_from_dockerfile,$<))

pull: ## ** Pulls ALL Docker images for ALL services from AWS ECR for this repository.
pull:
	$(foreach image,$(IMAGES), \
		$(call pull_image,$(image)); \
	)

# Promotes a Docker image from ECR in one AWS account to another.
# $(1) = The name of the service to promote between AWS accounts.
define promote_image
	@test -z "$(CI)" || echo "##[group]Pulling $(1) from AWS ECR in $(PROMOTE_FROM_AWS_ACCOUNT_ID)."
	@docker pull $(PROMOTE_FROM_ECR)/$(1):$(COMMIT)
	@test -z "$(CI)" || echo "##[endgroup]"

	@test -z "$(CI)" || echo "##[group]Tagging $(1) for AWS ECR in $(AWS_ACCOUNT_ID)."
	@$(foreach tag,$(TAGS), \
		@docker tag $(PROMOTE_FROM_ECR)/$(1):$(COMMIT) $(ECR)/$(1):$(tag)
	)
	@test -z "$(CI)" || echo "##[group]Pushing $(1) to AWS ECR in $(AWS_ACCOUNT_ID)."
	@$(foreach tag,$(TAGS), \
		@docker push $(ECR)/$(1):$(tag)
	)
	@test -z "$(CI)" || echo "##[endgroup]"
endef

promote-%: ## Promotes a Docker image for a given service to another AWS account.
promote-%: cmd/%/Dockerfile
	$(call promote_image,$(call determine_image_name_from_dockerfile,$<))

promote-root: # Promotes the root Docker image for this repository to another AWS account.
promote-root: Dockerfile
	$(call promote_image,$(call determine_image_name_from_dockerfile,$<))

promote: ## ** Promotes ALL Docker images for ALL services in this repository to another AWS account.
promote:
	@$(foreach image,$(IMAGES), \
		$(call promote_image,$(image)); \
	)

PHONY += print-docker-version \
				 images push pull promote \
				 image-root push-root pull-root promote-root

>>>>>>> template/main

#
# ┌┬┐┌─┐┌─┐┬  ┌─┐┬ ┬
#  ││├┤ ├─┘│  │ │└┬┘
# ─┴┘└─┘┴  ┴─┘└─┘ ┴ o
#

<<<<<<< HEAD
# Sets PRIMARY_SERVICES to be SERVICES, so either can be used in ANY Makefile.
PRIMARY_SERVICES ?= $(SERVICES)

.PHONY: deploy $(PRIMARY_SERVICES) $(SECONDARY_SERVICES) $(TERTIARY_SERVICES) $(QUATERNARY_SERVICES) $(QUINARY_SERVICES)
deploy: ## ** Deploys the Cloudformation template for ALL services.
deploy: \
	$(PRIMARY_SERVICES) \
	$(SECONDARY_SERVICES) \
	$(TERTIARY_SERVICES) \
	$(QUATERNARY_SERVICES) \
	$(QUINARY_SERVICES)
=======
# The default number of service groups to be created.
DEFAULT_NUM_SERVICE_GROUPS ?= 99

# Sets the maxiumum number of service groups to be created.
# NOTE: The more there are of these, the slower this Makefile executes.
NUM_SERVICE_GROUPS := $(DEFAULT_NUM_SERVICE_GROUPS)

# Sets PRIMARY_SERVICES to be SERVICES, so either can be used in subsequent Makefiles.
SERVICE_GROUP_1 ?= $(SERVICES)

# Determines which service groups have assigned targets to deploy.
SERVICE_GROUPS :=
SERVICE_GROUPS_WITH_VALUES :=
$(foreach i, $(shell seq 1 $(NUM_SERVICE_GROUPS)), \
  $(if $(value SERVICE_GROUP_$(i)), \
    $(eval SERVICE_GROUPS := $(SERVICE_GROUPS) SERVICE_GROUP_$(i)) \
	$(eval SERVICE_GROUPS_WITH_VALUES := $(SERVICE_GROUPS_WITH_VALUES) SERVICE_GROUP_$(i) = $(value SERVICE_GROUP_$(i))) \
  ) \
)

# A list of services under './cf' (except submodules) that contain Cloudformation templates.
CF_SERVICES := $(shell find ./cf $(FILTER_IGNORE_SUBMODULES) -mindepth 1 -maxdepth 1 -type d 2>/dev/null)

deploy: ## ** Deploys the Cloudformation template for ALL services.
deploy: $(foreach service,$(SERVICE_GROUPS),$($(service)))
>>>>>>> template/main

deploy-%: ## Deploys the Cloudformation template for the given service.
deploy-%: cf/%/package.yml
ifndef ENVIRONMENT
	$(error ENVIRONMENT not defined; please populate it before deploying)
else
	@test -z "$(CI)" || echo "##[group]Deploying $*."
	aws cloudformation deploy \
		--region $(AWS_REGION) \
		--template-file $< \
<<<<<<< HEAD
		$(shell [[ $(FILE_SIZE) -ge 51200 ]] && echo "--s3-bucket $(BUCKET)") \
=======
    $(shell [ -n "$(FILE_SIZE)" ] && [ $(FILE_SIZE) -gt 51200 ] && echo "--s3-bucket $(BUCKET)") \
>>>>>>> template/main
		--stack-name $(STACK_NAME) \
		--tags repository=$(REPO) project=$(PROJECT) component=$* revision=$(COMMIT) \
		$(if $(ADDITIONAL_STACK_TAGS),$(ADDITIONAL_STACK_TAGS),) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
		--parameter-overrides Component=$* Revision=$(COMMIT) Environment=$(ENVIRONMENT) \
		$(if $(wildcard cf/.params/$(ENVIRONMENT).json),$(shell jq -r 'map("\(.ParameterKey)=\(.ParameterValue)") | join(" ")' ./cf/.params/$(ENVIRONMENT).json),) \
		$(if $(ADDITIONAL_PARAMETER_OVERRIDES),$(ADDITIONAL_PARAMETER_OVERRIDES),) \
		--no-fail-on-empty-changeset
	@test -z "$(CI)" || echo "##[endgroup]"
endif

cf/%/package.yml: ## Packages the Cloudformation template for the given service.
cf/%/package.yml: cf/%/template.yml
ifndef ENVIRONMENT
	$(error ENVIRONMENT not defined; please populate it before deploying)
else
	@test -z "$(CI)" || echo "##[group]Packaging $*."
	aws cloudformation package \
		--region $(AWS_REGION) \
		--template-file $< \
		--output-template-file $@ \
		--s3-prefix $(PROJECT) \
		--s3-bucket $(BUCKET)
	@test -z "$(CI)" || echo "##[endgroup]"
endif

<<<<<<< HEAD
=======
PHONY += deploy
# NOTE: SERVICE_GROUPS *could* be added to PHONY here, but the aim is for these
# 		to be controlled from the Makefile where they are declared. Do this
# 		there, instead of here.


#
# ┬  ┬┌─┐┌┬┐
# │  │└─┐ │
# ┴─┘┴└─┘ ┴ o
#

# NOTE: All targets that begin with 'list-' are automatically added to PHONY.
#		See the PHONY section below for how this works.

# A simple command to help format the output of an array.
FORMAT_ARRAY ?= tr '[:space:]' '\n'

# ---

list-shell: # Lists the shell the Makefile uses when executing targets.
list-shell:
	@echo $(SHELL)

list-default-goal: # Lists the default Makefile goal set.
list-default-goal:
	@echo $(.DEFAULT_GOAL)

# ---

list-project: # Lists the project set for this repository.
list-project:
	@echo $(PROJECT)

list-env: list-environment
list-environment: # Lists the environment used.
list-environment:
	@echo $(ENVIRONMENT)

list-revision: list-commit
list-commit: # Lists the current git commit hash.
list-commit:
	@echo $(COMMIT)

list-repo: list-repository
list-repository: # Lists the name of the repository.
list-repository:
	@echo $(REPO)

list-org: list-organization
list-organization: # Lists the GitHub organization associated with this repository.
list-organization:
	@echo $(ORG)

# ---

list-os: list-operating-system
list-operating-system: # Lists the operating system detected by this Makefile.
list-operating-system:
	@echo $(OS)

list-building-os: list-building-operating-system
list-building-operating-system: # Lists the operating system used when building a binary in this Makefile.
list-building-operating-system:
	@echo $(BUILDING_OS)

list-supported-os: list-supported-operating-systems
list-supported-operating-systems: # Lists the operating systems supported by this Makefile.
list-supported-operating-systems:
	@echo $(SUPPORTED_OPERATING_SYSTEMS) | $(FORMAT_ARRAY)

list-arch: list-architecture
list-architecture: # Lists the CPU architecture detected by this Makefile.
list-architecture:
	@echo $(ARCH)

list-building-arch: list-building-architecture
list-building-architecture: # Lists the CPU architecture used when building a binary in this Makefile.
list-building-architecture:
	@echo $(BUILDING_ARCH)

list-supported-arch: list-supported-architectures
list-supported-architectures: # Lists the CPU architectures supported by this Makefile.
list-supported-architectures:
	@echo $(SUPPORTED_ARCHITECTURES) | $(FORMAT_ARRAY)

# ---

list-sh: list-shell-scripts
list-shell-scripts: # Lists ALL found shell scripts in this repository.
list-shell-scripts:
	@echo $(SH_FILES) | $(FORMAT_ARRAY)

list-go: list-go-files
list-go-files: list-Go-files
list-Go-files: # Lists ALL found Go files in this repository.
list-Go-files:
	@echo $(GO_FILES) | $(FORMAT_ARRAY)

list-sam: list-sam-templates
list-sam-templates: # Lists ALL found SAM templates in this repository.
list-sam-templates:
	@echo $(SAM_TEMPLATE_FILES) | $(FORMAT_ARRAY)

list-cf: list-cf-templates
list-cf-templates: # Lists ALL found Cloudformation templates in this repository.
list-cf-templates:
	@echo $(CLOUDFORMATION_TEMPLATE_FILES) | $(FORMAT_ARRAY)

list-workflows: # Lists ALL found GitHub Action workflows in this repository.
list-workflows:
	@echo $(WORKFLOWS) | $(FORMAT_ARRAY)

# ---

list-dockerfiles: list-Dockerfiles
list-Dockerfiles: # Lists ALL found Dockerfiles in this repository.
list-Dockerfiles:
	@echo $(DOCKERFILES) | $(FORMAT_ARRAY)

list-images: list-docker-images
list-docker-images: # Lists ALL Docker images built / can-be-built from this Makefile.
list-docker-images:
	@echo $(IMAGES) | $(FORMAT_ARRAY)

list-docker-image-build-targets: list-image-build-targets
list-image-build-targets: # Lists ALL targets generated from this Makefile to build a Docker image from the found Dockerfiles.
list-image-build-targets:
	@echo $(BUILD_TARGETS_FOR_IMAGES) | $(FORMAT_ARRAY)

list-tags: list-docker-tags
list-docker-tags: # Lists ALL tags used when tagging or pulling Docker images.
list-docker-tags:
	@echo $(TAGS) | $(FORMAT_ARRAY)

# ---

list-region: list-aws-region
list-aws-region: # Lists the configured AWS region used when deploying / configuring resources locally.
list-aws-region:
	@echo $(AWS_REGION)

list-account-id: list-aws-account-id
list-aws-account-id: # Lists the authed AWS account id.
list-aws-account-id:
	@echo $(AWS_ACCOUNT_ID)

list-bucket: list-generic-bucket
list-generic-bucket: # Lists the generic S3 bucket in the authed AWS account.
list-generic-bucket:
	@echo $(BUCKET)

list-ecr: # Lists the default path to AWS ECR in the authed AWS account.
list-ecr:
	@echo $(ECR)

# ---

list-promote-region: list-promote-aws-region
list-promote-from-region: list-promote-from-aws-region
list-promote-from-aws-region: # Lists the AWS region used when promoting a Docker image.
list-promote-from-aws-region:
	@echo $(PROMOTE_FROM_AWS_REGION)

list-promote-id: list-promote-from-aws-account-id
list-promote-from-id: list-promote-from-aws-account-id
list-promote-from-aws-account-id: # Lists the AWS account id used when promoting a Docker image.
list-promote-from-aws-account-id:
	@echo $(PROMOTE_FROM_AWS_ACCOUNT_ID)

list-promote-ecr: list-promote-from-ecr
list-promote-from-ecr: # Lists the AWS ECR repository path used when promoting a Docker image.
list-promote-from-ecr:
	@echo $(PROMOTE_FROM_ECR)

# ---

list-submodules: list-git-submodules
list-git-submodules: # Lists the path to any Git submodules in this repository.
list-git-submodules:
	@echo $(GIT_SUBMODULES)

list-filter-ignore-submodules: # Lists the filter used in many Makefile targets to ignore paths to Git submodules in this repository.
list-filter-ignore-submodules:
	@echo $(FILTER_IGNORE_SUBMODULES)

# ---

# Adds ALL 'list-' targets in the Makefile to PHONY.
PHONY += $(shell grep -E '^list-[^:]*:' $(MAKEFILE_LIST) | awk -F':' '{print $$2}' | sort -u)

list-phony: list-PHONY
list-PHONY: # Lists ALL PHONY values found in this Makefile.
list-PHONY:
	@echo $(PHONY) | $(FORMAT_ARRAY)


#
# ┬  ┬┌─┐┬  ┬┌┬┐┌─┐┌┬┐┌─┐┬─┐┌─┐
# └┐┌┘├─┤│  │ ││├─┤ │ │ │├┬┘└─┐
#  └┘ ┴ ┴┴─┘┴─┴┘┴ ┴ ┴ └─┘┴└─└─┘o
#

# Validates if a given BUILDING_OS is found within SUPPORTED_OPERATING_SYSTEMS.
VALID_OS := $(strip $(call contains,$(BUILDING_OS),$(SUPPORTED_OPERATING_SYSTEMS)))
ifeq ($(VALID_OS),false)
$(error "'$(BUILDING_OS)' is not a supported operating system in this Makefile")
endif

# Validates if a given BUILDING_ARCH is found within SUPPORTED_ARCHITECTURES.
VALID_ARCH := $(strip $(call contains,$(BUILDING_ARCH),$(SUPPORTED_ARCHITECTURES)))
ifeq ($(VALID_ARCH),false)
$(error "'$(BUILDING_ARCH)' is not a supported CPU architecture in this Makefile")
endif


>>>>>>> template/main
#
# ┌┬┐┬┌─┐┌─┐
# ││││└─┐│
# ┴ ┴┴└─┘└─┘ o
#

<<<<<<< HEAD
.PHONY: update-template
update-template: ## Pulls changes from the pre-defined template into this repository.
	git fetch template
	git merge template/main --allow-unrelated-histories

.PHONY: clean
clean: ## Removes generated files & folders, resetting this repository back to its initial clone state.
=======
update-template: ## Pulls changes from the pre-defined template into this repository.
update-template:
	git fetch template
	git merge template/main --allow-unrelated-histories

clean: ## Resets this repository back to state it was when first cloned.
clean:
>>>>>>> template/main
	@test -z "$(CI)" || echo "##[group]Cleaning up."
	@rm -f coverage.* traces.*
	@rm -rf dist
	@test -z "$(CI)" || echo "##[endgroup]"

<<<<<<< HEAD
.PHONY: help
help: ## Prints this help page.
=======
help: ## Prints this help page.
help:
>>>>>>> template/main
	@echo "Available targets:"
	@awk_script='\
		/^[a-zA-Z\-\\_0-9%\/$$]+:/ { \
			target = $$1; \
			gsub("\\$$1", "%", target); \
			nb = sub(/^## /, "", helpMsg); \
			if (nb == 0) { \
				helpMsg = $$0; \
				nb = sub(/^[^:]*:.* ## /, "", helpMsg); \
			} \
<<<<<<< HEAD
			if (nb) print "\033[33m" target "\033[0m" helpMsg; \
		} { helpMsg = $$0 } \
	'; \
	awk "$$awk_script" $(MAKEFILE_LIST) | column -ts:

#
# ┬  ┬┌─┐┌┬┐
# │  │└─┐ │
# ┴─┘┴└─┘ ┴ o
#

.PHONY: list-project
list-project: # Lists the project name used within the Makefile.
	@echo $(PROJECT)

.PHONY: list-org
list-org: # Lists the GitHub organization used within the Makefile.
	@echo $(ORG)

.PHONY: list-sh
list-sh: # Lists ALL shell scripts under the current directory.
	@echo $(SH_FILES)

.PHONY: list-go
list-go: # Lists ALL Go files under the current directory.
	@echo $(GO_FILES)

.PHONY: list-cf
list-cf: # Lists ALL dirs under ./cf.
	@echo $(CF_DIRS)

.PHONY: list-cmd
list-cmd: # Lists ALL dirs under ./cmd.
	@echo $(CMD_DIRS)

.PHONY: list-workflows
list-workflows: # Lists ALL workflows under the '.github/workflows' directory.
	@echo $(WORKFLOW_FILES)

.PHONY: list-binaries
list-binaries: # Lists ALL binary targets and their output directories.
	@echo $(BINARIES_TARGETS)
	@echo $(BINARIES_OUTPUT_DIRECTORIES)

.PHONY: list-images
list-images: # Lists ALL docker images for every service.
	@echo $(IMAGES)

.PHONY: list-deploy
list-deploy: # Lists ALL services to deploy.
	@echo $(PRIMARY_SERVICES)
	@echo $(SECONDARY_SERVICES)
	@echo $(TERTIARY_SERVICES)
	@echo $(QUATERNARY_SERVICES)
	@echo $(QUINARY_SERVICES)

.PHONY: list-deploy
list-submodules: # Lists ALL submodules.
	@echo $(SUBMODULES)
=======
			if (nb && !match(helpMsg, /^List/)) print "\033[33m" target "\033[0m" helpMsg; \
		} \
		{ helpMsg = $$0 } \
	'; \
	awk "$$awk_script" $(MAKEFILE_LIST) | column -ts:

PHONY += update-template \
				 clean help


# PHONY tells make that the given target doesn't deal with files specifically,
# and that the target itself is in essence "fake". There are some thing that are
# not performed, like cleaning up generated files, when telling make a target is
# PHONY. Populate $(PHONY) with any targets you want this for.
# NOTE: this must be last in this file.
.PHONY: $(PHONY)
>>>>>>> template/main

