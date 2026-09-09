
# Default PROJECT, if not given by another Makefile.
ifndef PROJECT
PROJECT=jcleal.me
endif

# The path to the resume metadata file.
RESUME_METADATA ?= resume/metadata.yml

# The path to the resume content.
RESUME_CONTENT ?= resume/data.md

# ---

# The param prefix is the beginning of a path in AWS SSM Parameter Store that
# points to config for this website.
ifeq ($(ENVIRONMENT),prod)
PARAM_PREFIX ?= $(REPO)
else
PARAM_PREFIX ?= $(ENVIRONMENT).$(REPO)
endif

# The hosted zone id in Route53.
HOSTED_ZONE_ID ?= $(shell aws ssm get-parameter --name /$(PARAM_PREFIX)/hosted-zone/id --query 'Parameter.Value' --output text)

# The bucket to upload the website to.
UPLOAD_BUCKET ?= $(shell aws ssm get-parameter --name /$(PARAM_PREFIX)/bucket --query 'Parameter.Value' --output text)

# The arn to the cert stored in ACM.
# NOTE: This is using '$(REPO)' because this cert is only deployed to production.
CERT_ARN ?= $(shell aws ssm get-parameter --region us-east-1 --name /certs/$(REPO)/arn --query 'Parameter.Value' --output text)

pull-config: # Pulls the config pulled from AWS when deploying.
pull-config:
	@echo $(HOSTED_ZONE_ID)
	@echo $(UPLOAD_BUCKET)
	@echo $(CERT_ARN)

# ---

# Services.
# Deployed manually: cert
SERVICE_GROUP_1 = website

# Targets.
cert: ## Deploys the 'cert' stack.
cert: AWS_REGION=us-east-1
cert: ADDITIONAL_PARAMETER_OVERRIDES="HostedZoneId=$(HOSTED_ZONE_ID) "
cert: deploy-cert

website: ## Deploys the 'website' stack.
website: ADDITIONAL_PARAMETER_OVERRIDES="AcmCertificateArn=$(CERT_ARN) "
website: ADDITIONAL_PARAMETER_OVERRIDES+="HostedZoneId=$(HOSTED_ZONE_ID) "
website: deploy-website

upload: ## Uploads generated website content to AWS S3. Be careful with this command!
upload:
	aws s3 sync --delete dist/public/ s3://$(UPLOAD_BUCKET)/

# ---

generate-website: ## Generates everything related to the 'jcleal.me' website.
generate-website: \
	compile-website \
	generate-resume-pdf \
	generate-workshop-pdfs

compile-website: ## Compiles the 'jcleal.me' website, using hugo.
compile-website: cmd/hugo image-hugo
compile-website: dist/public
	@test -z "$(CI)" || echo "##[group]Compiling website."
	docker run --rm \
		-w /app \
		-v "$(PWD):/app" \
		-v "$(PWD)/public" \
		-v "$(PWD)/resources" \
		$(REPO)/hugo \
		--log --destination $<
	@test -z "$(CI)" || echo "##[endgroup]"

generate-resume-pdf: ## Generates 'resume.pdf', using pandoc.
generate-resume-pdf: $(RESUME_METADATA) $(RESUME_CONTENT)
generate-resume-pdf: cmd/pandoc image-pandoc
generate-resume-pdf: dist/public
	@test -z "$(CI)" || echo "##[group]Generating resume.pdf."
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

generate-workshop-pdfs: ## Generates workshop PDFs (bash-101, docker-101), using pandoc/latex.
generate-workshop-pdfs: dist/public
	@test -z "$(CI)" || echo "##[group]Generating bash-101.pdf."
	@mkdir -p dist/public/pdf
	docker run --rm \
	-w /app \
	-v "$(PWD):/app" \
	pandoc/latex:latest \
		-f markdown \
		-t pdf \
		--pdf-engine=xelatex \
		--metadata-file content/bash-101/metadata.yml \
		-M title="Bash 101" \
		content/bash-101/_index.md \
		content/bash-101/part-1.md \
		content/bash-101/part-2.md \
		-o dist/public/pdf/bash-101.pdf
	@test -z "$(CI)" || echo "##[endgroup]"
	@test -z "$(CI)" || echo "##[group]Generating docker-101.pdf."
	docker run --rm \
	-w /app \
	-v "$(PWD):/app" \
	pandoc/latex:latest \
		-f markdown \
		-t pdf \
		--pdf-engine=xelatex \
		--metadata-file content/docker-101/metadata.yml \
		-M title="Docker 101" \
		content/docker-101/_index.md \
		content/docker-101/part-1.md \
		content/docker-101/part-2.md \
		content/docker-101/part-3.md \
		content/docker-101/part-4.md \
		-o dist/public/pdf/docker-101.pdf
	@test -z "$(CI)" || echo "##[endgroup]"

serve: ## Serves this website locally, mounted inside a Docker container.
serve: cmd/hugo image-hugo
serve: dist/public
	@docker run --rm -it \
		-w /app \
  		-v "$(PWD):/app" \
  		-p "1313:1313" \
		$(REPO)/hugo \
		server --disableFastRender

PHONY += generate-website generate-resume-pdf generate-workshop-pdfs serve

---: ## ---

# Includes the common Makefile.
# NOTE: this recursively goes back and finds the `.git` directory and assumes
# this is the root of the project. This could have issues when this assumtion
# is incorrect.
include $(shell while [[ ! -d .git ]]; do cd ..; done; pwd)/Makefile.common.mk

