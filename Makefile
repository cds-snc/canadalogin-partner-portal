PYTHON_VERSION ?= 3.12
PYTHON_BOOTSTRAP ?= python$(PYTHON_VERSION)
VENV_DIR ?= .venv
PYTHON ?= $(VENV_DIR)/bin/python
PIP ?= $(PYTHON) -m pip
NPM ?= npm
FRONTEND_DIR := frontend
FRONTEND_HOST ?= 127.0.0.1
FRONTEND_PORT ?= 3000
BACKEND_DIR := backend
BACKEND_HOST ?= 127.0.0.1
BACKEND_IMAGE ?= delorean-template-backend:local
BACKEND_CONTAINER ?= delorean-template-backend
BACKEND_PORT ?= 8000
DATABASE_COMPOSE_FILE ?= compose.database.yaml
DB_MIGRATION_MESSAGE ?= change
OPENAPI_FILE ?= openapi/openapi.json
NODE_MIN_VERSION ?= 20.19.0
NODE_VERSION ?= --lts
NODE_SET_DEFAULT ?= 1
OPENSPEC ?= openspec
OPENSPEC_NPM_PACKAGE ?= @fission-ai/openspec@latest
HOOKS_DIR := $(if $(wildcard .github/hooks/install.sh),.github/hooks,agent-configs/shared/hooks)
VSCODE_EXTENSIONS_CONFIG := $(if $(wildcard .vscode/extensions.json),.vscode/extensions.json,agent-configs/vscode/vscode/extensions.json)
VSCODE_LAUNCH_CONFIG := $(if $(wildcard .vscode/launch.json),.vscode/launch.json,agent-configs/vscode/vscode/launch.json)
VSCODE_SETTINGS_CONFIG := $(if $(wildcard .vscode/settings.json),.vscode/settings.json,agent-configs/vscode/vscode/settings.json)
VSCODE_TASKS_CONFIG := $(if $(wildcard .vscode/tasks.json),.vscode/tasks.json,agent-configs/vscode/vscode/tasks.json)
OPENSPEC_CHANGE_PICKER := scripts/delorean/select-openspec-change.sh
TEMPLATE_REPO ?= https://github.com/cds-snc/delorean_template.git
TEMPLATE_REF ?= main
ARCHITECTURE_REPO ?= https://github.com/cds-snc/delorean_architecture.git
ARCHITECTURE_REF ?= main
ARCHITECTURE_DOCS_DIR ?= architecture_docs
ARCHITECTURE_DOCS_UPDATE_ARGS ?=
SOLUTION_TARGET ?= .
UPDATE_EXISTING_SOLUTION_ARGS ?=
LEVEL2_PROMPT_SET ?= core
AGENT_TOOL ?= auto
COLLECT_AGENT_RUN_ARGS ?=
CHANGE_ID ?=
CAPABILITY ?=
TITLE ?=
SUMMARY ?=
WORK_CONTEXT ?= local
NEW_OPENSPEC_CHANGE_ARGS ?=
DELOREAN_CONFIG ?= delorean/config.yaml
DELOREAN_DEFAULT_LEVEL ?= 2
DELOREAN_CONFIG_LEVEL = $(shell awk -F ':' '$$1 == "adoptionLevel" { gsub(/[[:space:]]/, "", $$2); gsub(/"/, "", $$2); gsub(/\047/, "", $$2); print $$2; found = 1; exit } END { if (!found) print "" }' "$(DELOREAN_CONFIG)" 2>/dev/null || printf "$(DELOREAN_DEFAULT_LEVEL)")
LEVEL ?= $(DELOREAN_CONFIG_LEVEL)
HELP_LEVEL := $(if $(filter 2 3 4,$(LEVEL)),$(LEVEL),$(DELOREAN_DEFAULT_LEVEL))

.PHONY: help help-all doctor setup setup-delorean setup-local-env install-node check-node setup-python-venv install-python install-dev-python install-frontend-deps install-backend-deps install-openspec-cli check-openspec-cli validate-openspec-change pick-openspec-change validate-active-openspec-change check-delorean-setup start start-dev dev start-frontend start-backend db-up db-down db-logs db-upgrade db-downgrade db-revision update-from-template update-from-template-dry-run update-existing-solution update-existing-solution-dry-run update-architecture-docs update-architecture-docs-dry-run update-agent-configs update-agent-configs-dry-run sync-codex-adapters check-codex-adapters collect-agent-run new-openspec-change fix autofix format-fix fmt-python fmt-ci-python format-python check-python-format lint-python run-pytest pytest export-openapi check-openapi container-checks build-backend-container run-backend-container stop-backend-container test-backend-container scan-backend-container setup-hooks uninstall-hooks

help:
	@echo "Starter commands (Delorean Level $(HELP_LEVEL); override with LEVEL=2|3|4; use make help-all for the full list):"
	@echo ""
	@echo "Setup and readiness:"
	@echo "  make doctor"
	@echo "  make setup"
	@echo "  make setup-local-env"
	@echo "  make install-node"
	@echo "  make check-node"
	@echo "  make setup-python-venv"
	@echo "  make install-frontend-deps"
	@echo "  make install-backend-deps"
	@echo "  make setup-hooks"
	@echo "  make uninstall-hooks"
	@echo ""
	@echo "Local app:"
	@echo "  make dev"
	@echo "  make start-frontend"
	@echo "  make start-backend"
	@echo "  make db-up"
	@echo "  make db-upgrade"
	@echo "  make db-down"
	@echo ""
	@echo "Local checks and fixes:"
	@echo "  make fix"
	@echo "  make fmt-ci-python"
	@echo "  make lint-python"
	@echo "  make run-pytest"
	@echo "  make export-openapi"
	@echo "  make check-openapi"
	@echo ""
	@echo "Lightweight OpenSpec:"
	@echo "  make new-openspec-change CHANGE_ID=my-change CAPABILITY=my-capability"
	@echo "  make pick-openspec-change"
	@echo ""
	@echo "Template and guidance updates:"
	@echo "  make update-from-template-dry-run"
	@echo "  make update-from-template"
	@echo "  make update-architecture-docs-dry-run"
	@echo "  make update-architecture-docs"
	@echo "  make update-agent-configs-dry-run"
	@echo "  make update-agent-configs"
	@echo "  make update-agent-configs AGENT_TOOL=codex"
	@echo "  make update-agent-configs LEVEL2_PROMPT_SET=full"
	@echo "  make sync-codex-adapters"
	@echo "  make check-codex-adapters"
	@if [ "$(HELP_LEVEL)" -ge 3 ]; then \
		echo ""; \
		echo "OpenSpec validation and guided delivery:"; \
		echo "  make install-openspec-cli"; \
		echo "  make check-openspec-cli"; \
		echo "  make validate-openspec-change CHANGE_ID=my-change"; \
		echo "  make validate-active-openspec-change"; \
		echo "  make setup-delorean"; \
		echo "  make check-delorean-setup"; \
		echo "  make collect-agent-run"; \
	fi
	@if [ "$(HELP_LEVEL)" -ge 4 ]; then \
		echo ""; \
		echo "Template maintenance for another solution repo:"; \
		echo "  make update-existing-solution-dry-run SOLUTION_TARGET=/path/to/repo"; \
		echo "  make update-existing-solution SOLUTION_TARGET=/path/to/repo"; \
		echo ""; \
		echo "Container details:"; \
		echo "  make container-checks"; \
		echo "  make build-backend-container"; \
		echo "  make run-backend-container"; \
		echo "  make stop-backend-container"; \
		echo "  make test-backend-container"; \
		echo "  make scan-backend-container"; \
		echo ""; \
		echo "Aliases and lower-level helpers:"; \
		echo "  make start"; \
		echo "  make start-dev"; \
		echo "  make install-python"; \
		echo "  make install-dev-python"; \
		echo "  make fmt-python"; \
		echo "  make format-python"; \
		echo "  make check-python-format"; \
		echo "  make pytest"; \
		echo "  make autofix"; \
		echo "  make format-fix"; \
	fi

help-all:
	@$(MAKE) --no-print-directory help LEVEL=4

doctor:
	@scripts/delorean/doctor.sh

setup:
	@$(MAKE) --no-print-directory setup-local-env
	@$(MAKE) --no-print-directory install-node
	@$(MAKE) --no-print-directory install-frontend-deps
	@$(MAKE) --no-print-directory install-backend-deps
	@$(MAKE) --no-print-directory install-openspec-cli
	@echo "Starter setup complete."
	@echo "Start the local app: make dev"
	@echo "Optional hooks: make setup-hooks"
	@echo "Optional Delorean readiness check: make setup-delorean"
	@echo "Next check: scripts/delorean/run-local-verification.sh"

setup-local-env:
	@if [ -f "$(FRONTEND_DIR)/.env.example" ]; then \
		if [ ! -f "$(FRONTEND_DIR)/.env" ]; then \
			cp "$(FRONTEND_DIR)/.env.example" "$(FRONTEND_DIR)/.env"; \
			echo "Created $(FRONTEND_DIR)/.env from $(FRONTEND_DIR)/.env.example."; \
		else \
			echo "Keeping existing $(FRONTEND_DIR)/.env."; \
		fi; \
	fi
	@if [ -f "$(BACKEND_DIR)/.env.example" ]; then \
		if [ ! -f "$(BACKEND_DIR)/.env" ]; then \
			cp "$(BACKEND_DIR)/.env.example" "$(BACKEND_DIR)/.env"; \
			echo "Created $(BACKEND_DIR)/.env from $(BACKEND_DIR)/.env.example."; \
		else \
			echo "Keeping existing $(BACKEND_DIR)/.env."; \
		fi; \
	fi

setup-delorean:
	@$(MAKE) --no-print-directory setup
	@$(MAKE) --no-print-directory check-delorean-setup
	@echo "Delorean local setup complete."
	@echo "Optional hooks: make setup-hooks"
	@echo "Next check: scripts/delorean/run-local-verification.sh"

install-node:
	@set -e; \
	nvm_dir="$${NVM_DIR:-$$HOME/.nvm}"; \
	if [ -s "$$nvm_dir/nvm.sh" ]; then \
		. "$$nvm_dir/nvm.sh"; \
		used_requested_node=0; \
		if [ "$(NODE_VERSION)" = "--lts" ] || [ "$(NODE_VERSION)" = "lts/*" ]; then \
			nvm use "$(NODE_VERSION)" >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true; \
			if command -v node >/dev/null 2>&1 && NODE_MIN_VERSION="$(NODE_MIN_VERSION)" node -e 'const current = process.versions.node.split(".").map(Number); const min = process.env.NODE_MIN_VERSION.split(".").map(Number); for (let i = 0; i < 3; i += 1) { if ((current[i] || 0) > (min[i] || 0)) process.exit(0); if ((current[i] || 0) < (min[i] || 0)) process.exit(1); }'; then \
				echo "Node.js $$(node -v) already satisfies minimum $(NODE_MIN_VERSION)."; \
			else \
				nvm install "$(NODE_VERSION)"; \
				nvm use "$(NODE_VERSION)"; \
				used_requested_node=1; \
			fi; \
		else \
			nvm install "$(NODE_VERSION)"; \
			nvm use "$(NODE_VERSION)"; \
			used_requested_node=1; \
		fi; \
		if [ "$$used_requested_node" = "1" ] && [ "$(NODE_SET_DEFAULT)" = "1" ]; then \
			if [ "$(NODE_VERSION)" = "--lts" ] || [ "$(NODE_VERSION)" = "lts/*" ]; then \
				nvm alias default 'lts/*'; \
			else \
				nvm alias default "$(NODE_VERSION)"; \
			fi; \
		fi; \
		node -v; \
		npm -v; \
	else \
		if command -v node >/dev/null 2>&1 && NODE_MIN_VERSION="$(NODE_MIN_VERSION)" node -e 'const current = process.versions.node.split(".").map(Number); const min = process.env.NODE_MIN_VERSION.split(".").map(Number); for (let i = 0; i < 3; i += 1) { if ((current[i] || 0) > (min[i] || 0)) process.exit(0); if ((current[i] || 0) < (min[i] || 0)) process.exit(1); }'; then \
			echo "Node.js $$(node -v) already satisfies minimum $(NODE_MIN_VERSION)."; \
		else \
			echo "nvm is required to install Node.js automatically, or install Node.js $(NODE_MIN_VERSION) or higher yourself." >&2; \
			echo "Set NODE_VERSION to choose a version, for example: make install-node NODE_VERSION=20.19.0" >&2; \
			exit 1; \
		fi; \
	fi

check-node:
	@set -e; \
	nvm_dir="$${NVM_DIR:-$$HOME/.nvm}"; \
	if [ -s "$$nvm_dir/nvm.sh" ]; then \
		. "$$nvm_dir/nvm.sh"; \
		nvm use "$(NODE_VERSION)" >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true; \
	fi; \
	if ! command -v node >/dev/null 2>&1; then \
		echo "Node.js is required. Run 'make install-node' or install Node.js $(NODE_MIN_VERSION) or higher." >&2; \
		exit 1; \
	fi; \
	NODE_MIN_VERSION="$(NODE_MIN_VERSION)" node -e 'const current = process.versions.node.split(".").map(Number); const min = process.env.NODE_MIN_VERSION.split(".").map(Number); for (let i = 0; i < 3; i += 1) { if ((current[i] || 0) > (min[i] || 0)) { console.log("Node.js " + process.versions.node + " satisfies minimum " + process.env.NODE_MIN_VERSION + "."); process.exit(0); } if ((current[i] || 0) < (min[i] || 0)) { console.error("Node.js " + process.env.NODE_MIN_VERSION + " or higher is required. Found " + process.versions.node + ". Run make install-node."); process.exit(1); } } console.log("Node.js " + process.versions.node + " satisfies minimum " + process.env.NODE_MIN_VERSION + ".");'

install-frontend-deps: check-node
	@set -e; \
	nvm_dir="$${NVM_DIR:-$$HOME/.nvm}"; \
	if [ -s "$$nvm_dir/nvm.sh" ]; then \
		. "$$nvm_dir/nvm.sh"; \
		nvm use "$(NODE_VERSION)" >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true; \
	fi; \
	cd $(FRONTEND_DIR) && $(NPM) ci

setup-python-venv:
	@set -e; \
	if [ "$(PYTHON)" = "$(VENV_DIR)/bin/python" ]; then \
		if [ ! -x "$(VENV_DIR)/bin/python" ]; then \
			if ! command -v "$(PYTHON_BOOTSTRAP)" >/dev/null 2>&1; then \
				echo "Python $(PYTHON_VERSION) is required to create $(VENV_DIR)." >&2; \
				echo "Install Python $(PYTHON_VERSION), or rerun with PYTHON_BOOTSTRAP=/path/to/python$(PYTHON_VERSION) or PYTHON=/path/to/python." >&2; \
				exit 1; \
			fi; \
			"$(PYTHON_BOOTSTRAP)" -m venv "$(VENV_DIR)"; \
		fi; \
		"$(VENV_DIR)/bin/python" -m pip --version; \
		"$(VENV_DIR)/bin/python" --version; \
	else \
		if ! command -v "$(PYTHON)" >/dev/null 2>&1; then \
			echo "$(PYTHON) is missing." >&2; \
			exit 1; \
		fi; \
		"$(PYTHON)" --version; \
	fi

install-python: setup-python-venv
	$(PIP) install -r $(BACKEND_DIR)/requirements.txt

install-dev-python: setup-python-venv
	$(PIP) install -r $(BACKEND_DIR)/requirements-dev.txt

install-backend-deps: install-dev-python

install-openspec-cli: check-node
	@set -e; \
	nvm_dir="$${NVM_DIR:-$$HOME/.nvm}"; \
	if [ -s "$$nvm_dir/nvm.sh" ]; then \
		. "$$nvm_dir/nvm.sh"; \
		nvm use "$(NODE_VERSION)" >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true; \
	fi; \
	if ! command -v $(NPM) >/dev/null 2>&1; then \
		echo "npm is required to install the OpenSpec CLI."; \
		exit 1; \
	fi; \
	$(NPM) install -g $(OPENSPEC_NPM_PACKAGE)
	@$(MAKE) --no-print-directory check-openspec-cli

check-openspec-cli: check-node
	@set -e; \
	nvm_dir="$${NVM_DIR:-$$HOME/.nvm}"; \
	if [ -s "$$nvm_dir/nvm.sh" ]; then \
		. "$$nvm_dir/nvm.sh"; \
		nvm use "$(NODE_VERSION)" >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true; \
	fi; \
	if ! command -v $(OPENSPEC) >/dev/null 2>&1; then \
		echo "OpenSpec CLI is not installed or is not on PATH." >&2; \
		echo "Run 'make install-openspec-cli' if this solution repo has opted into the official CLI." >&2; \
		exit 1; \
	fi; \
	$(OPENSPEC) --version

validate-openspec-change: check-node
	@if [ -z "$(CHANGE_ID)" ]; then \
		echo "CHANGE_ID is required. Example: make validate-openspec-change CHANGE_ID=partner-self-service-mvp" >&2; \
		exit 1; \
	fi
	@set -e; \
	nvm_dir="$${NVM_DIR:-$$HOME/.nvm}"; \
	if [ -s "$$nvm_dir/nvm.sh" ]; then \
		. "$$nvm_dir/nvm.sh"; \
		nvm use "$(NODE_VERSION)" >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true; \
	fi; \
	if ! command -v $(OPENSPEC) >/dev/null 2>&1; then \
		echo "OpenSpec CLI is not installed or is not on PATH." >&2; \
		echo "Run 'make install-openspec-cli' and 'make check-openspec-cli' to verify the local CLI setup." >&2; \
		exit 1; \
	fi; \
	$(OPENSPEC) validate "$(CHANGE_ID)" --strict; \
	node scripts/delorean/check-openspec-scenario-preservation.js "$(CHANGE_ID)"

pick-openspec-change:
	@$(OPENSPEC_CHANGE_PICKER) --print

validate-active-openspec-change:
	@$(OPENSPEC_CHANGE_PICKER) --validate

check-delorean-setup: check-node check-openspec-cli
	@if [ ! -f "$(VSCODE_EXTENSIONS_CONFIG)" ]; then \
		echo "VS Code workspace extension recommendations are missing: $(VSCODE_EXTENSIONS_CONFIG)" >&2; \
		exit 1; \
	fi
	@if [ ! -f "$(VSCODE_LAUNCH_CONFIG)" ]; then \
		echo "VS Code launch config is missing: $(VSCODE_LAUNCH_CONFIG)" >&2; \
		exit 1; \
	fi
	@if [ ! -f "$(VSCODE_SETTINGS_CONFIG)" ]; then \
		echo "VS Code workspace settings are missing: $(VSCODE_SETTINGS_CONFIG)" >&2; \
		exit 1; \
	fi
	@if [ ! -f "$(VSCODE_TASKS_CONFIG)" ]; then \
		echo "VS Code workspace tasks are missing: $(VSCODE_TASKS_CONFIG)" >&2; \
		exit 1; \
	fi
	@echo "VS Code extension recommendations present: $(VSCODE_EXTENSIONS_CONFIG)"
	@echo "VS Code launch config present: $(VSCODE_LAUNCH_CONFIG)"
	@echo "VS Code workspace settings present: $(VSCODE_SETTINGS_CONFIG)"
	@echo "VS Code workspace tasks present: $(VSCODE_TASKS_CONFIG)"

start: start-dev

dev: start-dev

start-frontend:
	@if [ ! -x "$(FRONTEND_DIR)/node_modules/.bin/vite" ]; then \
		echo "Frontend dependencies are missing. Run 'make install-frontend-deps' first."; \
		exit 1; \
	fi
	$(NPM) --prefix $(FRONTEND_DIR) run dev -- --host $(FRONTEND_HOST) --port $(FRONTEND_PORT)

start-backend:
	@if ! $(PYTHON) -c "import uvicorn" >/dev/null 2>&1; then \
		echo "Backend development dependencies are missing. Run 'make install-dev-python' first."; \
		exit 1; \
	fi
	$(PYTHON) -m uvicorn app.main:app --reload --app-dir $(BACKEND_DIR) --host $(BACKEND_HOST) --port $(BACKEND_PORT)

db-up:
	docker compose -f $(DATABASE_COMPOSE_FILE) up -d

db-down:
	docker compose -f $(DATABASE_COMPOSE_FILE) down

db-logs:
	docker compose -f $(DATABASE_COMPOSE_FILE) logs -f postgres

db-upgrade:
	$(PYTHON) -m alembic -c $(BACKEND_DIR)/alembic.ini upgrade head

db-downgrade:
	$(PYTHON) -m alembic -c $(BACKEND_DIR)/alembic.ini downgrade -1

db-revision:
	$(PYTHON) -m alembic -c $(BACKEND_DIR)/alembic.ini revision --autogenerate -m "$(DB_MIGRATION_MESSAGE)"

start-dev:
	@if [ ! -x "$(FRONTEND_DIR)/node_modules/.bin/vite" ]; then \
		echo "Frontend dependencies are missing. Run 'make install-frontend-deps' first."; \
		exit 1; \
	fi
	@if ! $(PYTHON) -c "import uvicorn" >/dev/null 2>&1; then \
		echo "Backend development dependencies are missing. Run 'make install-dev-python' first."; \
		exit 1; \
	fi
	@echo "Starting backend at http://$(BACKEND_HOST):$(BACKEND_PORT)"
	@echo "Starting frontend at http://$(FRONTEND_HOST):$(FRONTEND_PORT)"
	@echo "Stop both with Ctrl-C."
	@cleanup() { \
		echo ""; \
		echo "Stopping dev servers..."; \
		kill "$$backend_pid" "$$frontend_pid" 2>/dev/null || true; \
		wait "$$backend_pid" "$$frontend_pid" 2>/dev/null || true; \
	}; \
	trap 'cleanup; exit 130' INT TERM; \
	trap 'cleanup' EXIT; \
	( exec $(PYTHON) -m uvicorn app.main:app --reload --app-dir $(BACKEND_DIR) --host $(BACKEND_HOST) --port $(BACKEND_PORT) ) & \
	backend_pid=$$!; \
	( cd $(FRONTEND_DIR) && exec $(NPM) run dev -- --host $(FRONTEND_HOST) --port $(FRONTEND_PORT) ) & \
	frontend_pid=$$!; \
	while kill -0 "$$backend_pid" 2>/dev/null && kill -0 "$$frontend_pid" 2>/dev/null; do \
		sleep 1; \
	done; \
	status=0; \
	if ! kill -0 "$$backend_pid" 2>/dev/null; then \
		wait "$$backend_pid" || status=$$?; \
	fi; \
	if ! kill -0 "$$frontend_pid" 2>/dev/null; then \
		wait "$$frontend_pid" || status=$$?; \
	fi; \
	exit "$$status"

update-from-template-dry-run:
	LEVEL2_PROMPT_SET="$(LEVEL2_PROMPT_SET)" scripts/delorean/update-from-template.sh --repo "$(TEMPLATE_REPO)" --ref "$(TEMPLATE_REF)" --dry-run

update-from-template:
	LEVEL2_PROMPT_SET="$(LEVEL2_PROMPT_SET)" scripts/delorean/update-from-template.sh --repo "$(TEMPLATE_REPO)" --ref "$(TEMPLATE_REF)"

update-existing-solution-dry-run:
	LEVEL2_PROMPT_SET="$(LEVEL2_PROMPT_SET)" scripts/delorean/update-from-template.sh --target "$(SOLUTION_TARGET)" --repo "$(TEMPLATE_REPO)" --ref "$(TEMPLATE_REF)" --architecture-repo "$(ARCHITECTURE_REPO)" --architecture-ref "$(ARCHITECTURE_REF)" --architecture-docs-dir "$(ARCHITECTURE_DOCS_DIR)" --dry-run $(UPDATE_EXISTING_SOLUTION_ARGS)

update-existing-solution:
	LEVEL2_PROMPT_SET="$(LEVEL2_PROMPT_SET)" scripts/delorean/update-from-template.sh --target "$(SOLUTION_TARGET)" --repo "$(TEMPLATE_REPO)" --ref "$(TEMPLATE_REF)" --architecture-repo "$(ARCHITECTURE_REPO)" --architecture-ref "$(ARCHITECTURE_REF)" --architecture-docs-dir "$(ARCHITECTURE_DOCS_DIR)" $(UPDATE_EXISTING_SOLUTION_ARGS)

update-architecture-docs-dry-run:
	scripts/delorean/update-architecture-docs.sh --target "$(SOLUTION_TARGET)" --repo "$(ARCHITECTURE_REPO)" --ref "$(ARCHITECTURE_REF)" --architecture-docs-dir "$(ARCHITECTURE_DOCS_DIR)" --dry-run $(ARCHITECTURE_DOCS_UPDATE_ARGS)

update-architecture-docs:
	scripts/delorean/update-architecture-docs.sh --target "$(SOLUTION_TARGET)" --repo "$(ARCHITECTURE_REPO)" --ref "$(ARCHITECTURE_REF)" --architecture-docs-dir "$(ARCHITECTURE_DOCS_DIR)" $(ARCHITECTURE_DOCS_UPDATE_ARGS)

update-agent-configs-dry-run:
	LEVEL2_PROMPT_SET="$(LEVEL2_PROMPT_SET)" scripts/delorean/update-from-template.sh --repo "$(TEMPLATE_REPO)" --ref "$(TEMPLATE_REF)" --agent-config-only --agent-tool "$(AGENT_TOOL)" --dry-run

update-agent-configs:
	LEVEL2_PROMPT_SET="$(LEVEL2_PROMPT_SET)" scripts/delorean/update-from-template.sh --repo "$(TEMPLATE_REPO)" --ref "$(TEMPLATE_REF)" --agent-config-only --agent-tool "$(AGENT_TOOL)"

sync-codex-adapters:
	scripts/delorean/sync-codex-adapters.sh --write

check-codex-adapters:
	scripts/delorean/sync-codex-adapters.sh --check

collect-agent-run:
	scripts/delorean/collect-agent-run.sh $(COLLECT_AGENT_RUN_ARGS)

new-openspec-change:
	CHANGE_ID="$(CHANGE_ID)" CAPABILITY="$(CAPABILITY)" TITLE="$(TITLE)" SUMMARY="$(SUMMARY)" WORK_CONTEXT="$(WORK_CONTEXT)" scripts/delorean/create-openspec-change.sh $(NEW_OPENSPEC_CHANGE_ARGS)

fix:
	scripts/delorean/run-autofix.sh

autofix: fix

format-fix: fix

fmt-python:
	$(PYTHON) -m black $(BACKEND_DIR)

fmt-ci-python:
	$(PYTHON) -m black --check $(BACKEND_DIR)

format-python: fmt-python

check-python-format: fmt-ci-python

lint-python:
	$(PYTHON) -m flake8 $(BACKEND_DIR)

run-pytest:
	$(PYTHON) -m pytest

pytest: run-pytest

export-openapi:
	$(PYTHON) $(BACKEND_DIR)/scripts/export_openapi.py --output $(OPENAPI_FILE)

check-openapi:
	$(PYTHON) $(BACKEND_DIR)/scripts/export_openapi.py --output $(OPENAPI_FILE) --check

container-checks:
	DELOREAN_RUN_CONTAINER_CHECKS=1 scripts/delorean/run-container-checks.sh

build-backend-container:
	docker build -f $(BACKEND_DIR)/Dockerfile -t $(BACKEND_IMAGE) $(BACKEND_DIR)

run-backend-container:
	@if docker ps -a --format '{{.Names}}' | grep -qx "$(BACKEND_CONTAINER)"; then \
		echo "Container $(BACKEND_CONTAINER) already exists. Run 'make stop-backend-container' first."; \
		exit 1; \
	fi
	docker run --rm -d --name $(BACKEND_CONTAINER) -p 127.0.0.1:$(BACKEND_PORT):8000 -e APP_ENV=local -e LOG_LEVEL=info -e REQUEST_ID_HEADER=X-Request-ID $(BACKEND_IMAGE)
	@echo "Backend container started at http://localhost:$(BACKEND_PORT)/health"
	@echo "Stop it with: make stop-backend-container"

stop-backend-container:
	@if docker ps -a --format '{{.Names}}' | grep -qx "$(BACKEND_CONTAINER)"; then \
		docker stop $(BACKEND_CONTAINER); \
	else \
		echo "No backend container named $(BACKEND_CONTAINER) is running or stopped."; \
	fi

test-backend-container:
	@started=0; \
	if docker ps --format '{{.Names}}' | grep -qx "$(BACKEND_CONTAINER)"; then \
		echo "Using running container $(BACKEND_CONTAINER)."; \
	else \
		echo "Starting $(BACKEND_CONTAINER) for a local health check."; \
		docker run --rm -d --name $(BACKEND_CONTAINER) -e APP_ENV=local -e LOG_LEVEL=info -e REQUEST_ID_HEADER=X-Request-ID $(BACKEND_IMAGE) >/dev/null || exit $$?; \
		started=1; \
	fi; \
	ok=0; \
	for attempt in 1 2 3 4 5; do \
		if docker exec $(BACKEND_CONTAINER) python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5).read().decode())" 2>/dev/null; then \
			ok=1; \
			break; \
		fi; \
		sleep 1; \
	done; \
	if [ "$$ok" != "1" ]; then \
		docker logs $(BACKEND_CONTAINER) 2>/dev/null || true; \
	fi; \
	if [ "$$started" = "1" ] && docker ps -a --format '{{.Names}}' | grep -qx "$(BACKEND_CONTAINER)"; then \
		docker stop $(BACKEND_CONTAINER) >/dev/null || true; \
	fi; \
	if [ "$$ok" != "1" ]; then \
		echo "Backend container health check failed." >&2; \
		exit 1; \
	fi

scan-backend-container:
	@if command -v docker >/dev/null 2>&1 && docker scout version >/dev/null 2>&1; then \
		if ! docker scout cves $(BACKEND_IMAGE); then \
			echo "Docker Scout scan did not complete. Check Docker login or scanner setup."; \
			echo "Skipping container scan for this starter template."; \
		fi; \
	elif command -v trivy >/dev/null 2>&1; then \
		if ! trivy image $(BACKEND_IMAGE); then \
			echo "Trivy scan did not complete. Check scanner setup."; \
			echo "Skipping container scan for this starter template."; \
		fi; \
	elif command -v grype >/dev/null 2>&1; then \
		if ! grype $(BACKEND_IMAGE); then \
			echo "Grype scan did not complete. Check scanner setup."; \
			echo "Skipping container scan for this starter template."; \
		fi; \
	else \
		echo "No container scanner found. Install Docker Scout, Trivy, or Grype to scan $(BACKEND_IMAGE)."; \
		echo "Skipping container scan for this starter template."; \
	fi

setup-hooks:
	@echo "Configuring Git to use $(HOOKS_DIR) for this repo."
	$(HOOKS_DIR)/install.sh

uninstall-hooks:
	@if git config --local --get core.hooksPath >/dev/null; then \
		git config --local --unset core.hooksPath; \
		echo "Git hooks disabled for this repo. Git will use its default hooks path."; \
	else \
		echo "No local core.hooksPath is configured."; \
	fi
