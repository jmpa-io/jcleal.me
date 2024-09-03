
# Default PROJECT, if not given by another Makefile.
ifndef PROJECT
PROJECT=jcleal.me
endif

# Vars.
HUGO_IMAGE ?= klakegg/hugo:0.78.2-alpine
RESUME_METADATA ?= content/resume/metadata.yml
RESUME_CONTENT ?= content/resume/data.md

# Targets.
generate-website: ## Generates everything related to the 'jcleal.me' website.
generate-website: \
	compile-website \
	generate-resume

compile-website: ## Compiles the 'jcleal.me' website.
compile-website: dist/public
	@test -z "$(CI)" || echo "##[group]Compiling website."
	docker run --rm \
		-w /app \
		-v "$(PWD):/app" \
		-v "$(PWD)/public" \
		-v "$(PWD)/resources" \
		$(HUGO_IMAGE) \
		--log --destination $<
	@test -z "$(CI)" || echo "##[endgroup]"

generate-resume: ## Generates 'Resume.pdf', using pandoc.
generate-resume: $(RESUME_METADATA) $(RESUME_CONTENT)
generate-resume: cmd/pandoc image-pandoc
generate-resume: dist/public
	@test -z "$(CI)" || echo "##[group]Generating Resume.pdf."
	docker run --rm \
	-w /app \
	-v "$(PWD):/app" \
	$(REPO)/pandoc \
		-f markdown \
		-t latex \
		--metadata-file $(RESUME_METADATA) \
		$(RESUME_CONTENT) \
		-o $</resume.pdf
	@test -z "$(CI)" || echo "##[endgroup]"

serve: ## Serves this website locally, mounted inside a Docker container.
serve: dist/public
	@docker run --rm -it \
  		-w /app \
  		-v "$(PWD):/app" \
  		-p "1313:1313" \
		$(HUGO_IMAGE) \
		server

---: ## ---

# Includes the common Makefile.
# NOTE: this recursively goes back and finds the `.git` directory and assumes
# this is the root of the project. This could have issues when this assumtion
# is incorrect.
include $(shell while [[ ! -d .git ]]; do cd ..; done; pwd)/Makefile.common.mk

