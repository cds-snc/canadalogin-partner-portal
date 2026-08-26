PYTHON_VERSION ?= 3.12
PYTHON_BOOTSTRAP ?= python$(PYTHON_VERSION)
VENV_DIR ?= .venv
PYTHON ?= $(VENV_DIR)/bin/python
PIP ?= $(PYTHON) -m pip
NODE ?= $(if $(NVM_BIN),$(NVM_BIN)/node,node)
NPM ?= $(if $(NVM_BIN),$(NVM_BIN)/npm,npm)
COREPACK ?= $(if $(NVM_BIN),$(NVM_BIN)/corepack,corepack)
PNPM ?= $(COREPACK) pnpm
UV ?= uv
UV_CACHE_DIR ?= $(if $(TMPDIR),$(TMPDIR)/copilot-uv-cache,$(ROOT_DIR)/.uv-cache)
FRONTEND_DIR := frontend
FRONTEND_HOST ?= 127.0.0.1
FRONTEND_PORT ?= 3000
BACKEND_DIR := backend
ROOT_DIR := $(CURDIR)
ROOT_VENV := $(ROOT_DIR)/$(VENV_DIR)
UV_PROJECT_ENVIRONMENT ?= $(ROOT_VENV)
BACKEND_CMD := cd $(BACKEND_DIR) && UV_CACHE_DIR="$(UV_CACHE_DIR)" UV_PROJECT_ENVIRONMENT="$(UV_PROJECT_ENVIRONMENT)" $(UV) run
ALEMBIC_CMD := cd $(BACKEND_DIR)/src && UV_CACHE_DIR="$(UV_CACHE_DIR)" UV_PROJECT_ENVIRONMENT="$(UV_PROJECT_ENVIRONMENT)" $(UV) run alembic
FRONTEND_CMD := cd $(FRONTEND_DIR) && $(PNPM) run
BACKEND_HOST ?= 127.0.0.1
BACKEND_IMAGE ?= delorean-template-backend:local
BACKEND_CONTAINER ?= delorean-template-backend
BACKEND_PORT ?= 8000
DATABASE_COMPOSE_FILE ?= $(BACKEND_DIR)/docker-compose.yml
LOCAL_PERSONA_ENV := \
	ENVIRONMENT=local \
	AUTH_MODE=local_dev \
	ENABLE_DEV_ROLE_SELECTOR=true \
	OIDC_ENABLED=false \
	SECRET_KEY=local-persona-only-000000000000000000000000000000000000000000000000 \
	SESSION_COOKIE_DOMAIN= \
	SESSION_COOKIE_SECURE=false \
	SESSION_COOKIE_SAMESITE=lax \
	OIDC_SERVER_METADATA_URL= \
	OIDC_CLIENT_ID= \
	OIDC_CLIENT_SECRET= \
	OIDC_REDIRECT_URI= \
	OIDC_POST_LOGIN_REDIRECT=http://$(FRONTEND_HOST):$(FRONTEND_PORT)/auth-complete \
	OIDC_ACCESS_DENIED_REDIRECT=http://$(FRONTEND_HOST):$(FRONTEND_PORT)/access-denied \
	OIDC_POST_LOGOUT_REDIRECT_URI=http://$(FRONTEND_HOST):$(FRONTEND_PORT)/ \
	IBM_SV_ADMIN_BASE_URL= \
	IBM_SV_ADMIN_CLIENT_ID= \
	IBM_SV_ADMIN_CLIENT_SECRET= \
	GC_NOTIFY_API_KEY= \
	AWS_ACCESS_KEY_ID= \
	AWS_SECRET_ACCESS_KEY= \
	AWS_SESSION_TOKEN= \
	CORS_ORIGINS='["http://127.0.0.1:3000","http://localhost:3000"]' \
	CORS_METHODS='["GET","POST","PUT","PATCH","DELETE","OPTIONS"]' \
	CORS_HEADERS='["Accept","Authorization","Content-Type","Idempotency-Key","Origin","X-Requested-With","X-Request-ID"]'
POSTGRES_USER ?= postgres
POSTGRES_DB ?= postgres
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
LOAD_NVM = nvm_dir="$${NVM_DIR:-$$HOME/.nvm}"; \
	if [ -s "$$nvm_dir/nvm.sh" ]; then \
		. "$$nvm_dir/nvm.sh"; \
		nvm use "$(NODE_VERSION)" >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true; \
	fi

.PHONY: help help-all doctor setup setup-delorean setup-local-env install-node check-node setup-python-venv install test lint format typecheck install-python install-dev-python install-frontend-deps install-backend-deps install-openspec-cli check-openspec-cli validate-openspec-change pick-openspec-change validate-active-openspec-change check-delorean-setup start start-dev start-local-personas seed-local-personas reset-local-personas dev backend-dev worker start-frontend start-backend frontend-install frontend-build frontend-dev frontend-test frontend-lint frontend-format frontend-preview all-install all-build all-test all-lint all-format bk-install bk-test bk-lint bk-format bk-typecheck bk-dev bk-worker bk-migration ft-install ft-build ft-dev ft-test ft-lint ft-format ft-preview backend-image frontend-image bk-image ft-image db-up db-wait db-down db-logs db-upgrade db-downgrade db-revision db-reset-local bootstrap-cl-admin ensure-local-db-ready migration update-from-template update-from-template-dry-run update-existing-solution update-existing-solution-dry-run update-architecture-docs update-architecture-docs-dry-run update-agent-configs update-agent-configs-dry-run check-codex-assets collect-agent-run new-openspec-change fix autofix format-fix fmt-python fmt-ci-python format-python check-python-format lint-python run-pytest pytest export-openapi check-openapi container-checks build-backend-container run-backend-container stop-backend-container test-backend-container scan-backend-container setup-hooks uninstall-hooks

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
	@echo "  make start-dev"
	@echo "  make start-local-personas"
	@echo "  make seed-local-personas"
	@echo "  make reset-local-personas"
	@echo "  make dev"
	@echo "  make bk-dev"
	@echo "  make frontend-dev"
	@echo "  make start-frontend"
	@echo "  make start-backend"
	@echo "  make db-up"
	@echo "  make db-reset-local"
	@echo "  make bootstrap-cl-admin"
	@echo "  make db-upgrade"
	@echo "  make db-down"
	@echo ""
	@echo "Repo-local backend and frontend commands:"
	@echo "  make install"
	@echo "  make test"
	@echo "  make lint"
	@echo "  make format"
	@echo "  make typecheck"
	@echo "  make worker"
	@echo "  make frontend-install"
	@echo "  make frontend-build"
	@echo "  make frontend-test"
	@echo "  make frontend-lint"
	@echo "  make frontend-format"
	@echo "  make frontend-preview"
	@echo "  make all-install"
	@echo "  make all-build"
	@echo "  make all-test"
	@echo "  make all-lint"
	@echo "  make all-format"
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
	@echo "  make check-codex-assets"
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
	@echo "Start the full local app: make start-dev"
	@echo "Start only the backend: make dev"
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
		node_path="$$(nvm which current 2>/dev/null || true)"; \
		if [ -n "$$node_path" ] && [ -x "$$node_path" ]; then \
			npm_path="$${node_path%/node}/npm"; \
		else \
			node_path="$(NODE)"; \
			npm_path="$(NPM)"; \
		fi; \
		"$$node_path" -v; \
		"$$npm_path" -v; \
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
	node_cmd="$(NODE)"; \
	if [ "$$node_cmd" = "node" ]; then \
		if ! command -v node >/dev/null 2>&1; then \
			echo "Node.js is required. Run 'make install-node' or install Node.js $(NODE_MIN_VERSION) or higher." >&2; \
			exit 1; \
		fi; \
	elif [ ! -x "$$node_cmd" ]; then \
		echo "Node.js is required. Run 'make install-node' or install Node.js $(NODE_MIN_VERSION) or higher." >&2; \
		exit 1; \
	fi; \
	NODE_MIN_VERSION="$(NODE_MIN_VERSION)" "$$node_cmd" -e 'const current = process.versions.node.split(".").map(Number); const min = process.env.NODE_MIN_VERSION.split(".").map(Number); for (let i = 0; i < 3; i += 1) { if ((current[i] || 0) > (min[i] || 0)) { console.log("Node.js " + process.versions.node + " satisfies minimum " + process.env.NODE_MIN_VERSION + "."); process.exit(0); } if ((current[i] || 0) < (min[i] || 0)) { console.error("Node.js " + process.env.NODE_MIN_VERSION + " or higher is required. Found " + process.versions.node + ". Run make install-node."); process.exit(1); } } console.log("Node.js " + process.versions.node + " satisfies minimum " + process.env.NODE_MIN_VERSION + ".");'

frontend-install: check-node
	@echo "Installing frontend dependencies (pnpm)"
	@set -e; \
	$(LOAD_NVM); \
	cd $(FRONTEND_DIR) && $(PNPM) install

install-frontend-deps: frontend-install

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

install: setup-python-venv
	@echo "Installing backend dependencies (uses uv wrapper)"
	cd $(BACKEND_DIR) && UV_PROJECT_ENVIRONMENT="$(UV_PROJECT_ENVIRONMENT)" $(UV) sync --group dev --extra dev

test:
	@echo "Running backend tests"
	$(BACKEND_CMD) pytest -q

lint:
	@echo "Running ruff lint checks (using pyproject.toml config)"
	$(BACKEND_CMD) ruff check src/ tests/

format:
	@echo "Auto-fixing lintable issues with ruff (using pyproject.toml config)"
	$(BACKEND_CMD) ruff check src/ tests/ --fix

typecheck:
	@echo "Running mypy type checker"
	$(BACKEND_CMD) mypy src/app

install-python: install

install-dev-python: install

install-backend-deps: install

install-openspec-cli: check-node
	@set -e; \
	nvm_dir="$${NVM_DIR:-$$HOME/.nvm}"; \
	if [ -s "$$nvm_dir/nvm.sh" ]; then \
		. "$$nvm_dir/nvm.sh"; \
		nvm use "$(NODE_VERSION)" >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true; \
	fi; \
	npm_cmd="$(NPM)"; \
	if [ "$$npm_cmd" = "npm" ]; then \
		if ! command -v npm >/dev/null 2>&1; then \
			echo "npm is required to install the OpenSpec CLI."; \
			exit 1; \
		fi; \
	elif [ ! -x "$$npm_cmd" ]; then \
		echo "npm is required to install the OpenSpec CLI."; \
		exit 1; \
	fi; \
	"$$npm_cmd" install -g $(OPENSPEC_NPM_PACKAGE)
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

dev: backend-dev

ensure-local-db-ready:
	@$(MAKE) --no-print-directory db-up
	@$(MAKE) --no-print-directory db-upgrade

backend-dev: ensure-local-db-ready
	@if [ ! -x "$(PYTHON)" ]; then \
		echo "Backend development dependencies are missing. Run 'make install-backend-deps' first."; \
		exit 1; \
	fi
	@echo "Starting backend API server"
	$(BACKEND_CMD) uvicorn src.app.main:app --reload --host $(BACKEND_HOST) --port $(BACKEND_PORT)

worker:
	@if [ ! -x "$(PYTHON)" ]; then \
		echo "Backend development dependencies are missing. Run 'make install-backend-deps' first."; \
		exit 1; \
	fi
	@echo "Starting backend ARQ worker"
	$(BACKEND_CMD) python -m src.app.core.worker.settings

frontend-build:
	@echo "Building frontend for production"
	@set -e; \
	$(LOAD_NVM); \
	$(FRONTEND_CMD) build

frontend-dev:
	@if [ ! -x "$(FRONTEND_DIR)/node_modules/.bin/vite" ]; then \
		echo "Frontend dependencies are missing. Run 'make install-frontend-deps' first."; \
		exit 1; \
	fi
	@echo "Starting frontend dev server"
	@set -e; \
	$(LOAD_NVM); \
	$(FRONTEND_CMD) dev -- --host $(FRONTEND_HOST) --port $(FRONTEND_PORT)

frontend-test:
	@echo "Running frontend tests"
	@set -e; \
	$(LOAD_NVM); \
	$(FRONTEND_CMD) test

frontend-lint:
	@echo "Running frontend lint"
	@set -e; \
	$(LOAD_NVM); \
	$(FRONTEND_CMD) lint

frontend-format:
	@echo "Formatting frontend"
	@set -e; \
	$(LOAD_NVM); \
	$(FRONTEND_CMD) format

frontend-preview:
	@echo "Preview production frontend build"
	@set -e; \
	$(LOAD_NVM); \
	$(FRONTEND_CMD) preview

start-frontend: frontend-dev

start-backend: backend-dev

all-install:
	@echo "Installing backend and frontend dependencies"
	@$(MAKE) --no-print-directory install
	@$(MAKE) --no-print-directory frontend-install

all-build:
	@echo "Building frontend (backend has no global build target)"
	@$(MAKE) --no-print-directory frontend-build

all-test:
	@echo "Running backend and frontend tests"
	@$(MAKE) --no-print-directory test
	@$(MAKE) --no-print-directory frontend-test

all-lint:
	@echo "Linting backend and frontend"
	@$(MAKE) --no-print-directory lint
	@$(MAKE) --no-print-directory frontend-lint

all-format:
	@echo "Formatting backend and frontend"
	@$(MAKE) --no-print-directory format
	@$(MAKE) --no-print-directory frontend-format

backend-image:
	@echo "Building backend Docker image"
	cd $(BACKEND_DIR) && docker build --pull -t canadalogin-partner-portal-backend .

frontend-image:
	@echo "Building frontend Docker image"
	@$(MAKE) --no-print-directory frontend-build
	cd $(FRONTEND_DIR) && docker build --pull -t canadalogin-partner-portal-frontend .

bk-image: backend-image

ft-image: frontend-image

bk-install: install

bk-test: test

bk-lint: lint

bk-format: format

bk-typecheck: typecheck

bk-dev: backend-dev

bk-worker: worker

bk-migration: migration

ft-install: frontend-install

ft-build: frontend-build

ft-dev: frontend-dev

ft-test: frontend-test

ft-lint: frontend-lint

ft-format: frontend-format

ft-preview: frontend-preview

migration: db-upgrade

db-up:
	docker compose -f $(DATABASE_COMPOSE_FILE) up -d db redis
	@$(MAKE) --no-print-directory db-wait

db-wait:
	@printf 'Waiting for Postgres to accept connections'
	@attempts=0; \
	until docker compose -f $(DATABASE_COMPOSE_FILE) exec -T db sh -lc 'pg_isready -U "$(POSTGRES_USER)" -d "$(POSTGRES_DB)" >/dev/null 2>&1'; do \
		attempts=$$((attempts + 1)); \
		if [ "$$attempts" -ge 30 ]; then \
			echo ''; \
			echo 'Postgres did not become ready within 30 seconds.' >&2; \
			exit 1; \
		fi; \
		printf '.'; \
		sleep 1; \
	done; \
	echo ' ready'

db-down:
	docker compose -f $(DATABASE_COMPOSE_FILE) stop db redis

db-logs:
	docker compose -f $(DATABASE_COMPOSE_FILE) logs -f db redis

db-reset-local:
	docker compose -f $(DATABASE_COMPOSE_FILE) down -v
	docker compose -f $(DATABASE_COMPOSE_FILE) up -d db redis
	@$(MAKE) --no-print-directory db-wait
	$(ALEMBIC_CMD) upgrade head
	@echo "Local database reset complete."
	@echo "Next step: make bootstrap-cl-admin (when a roster is configured), or make start-dev"

bootstrap-cl-admin: ensure-local-db-ready
	@echo "Bootstrapping configured CL Admin roster without resetting local data"
	$(BACKEND_CMD) python -m src.app.commands.bootstrap_cl_admin


seed-local-personas:
	env $(LOCAL_PERSONA_ENV) $(MAKE) --no-print-directory ensure-local-db-ready
	cd $(BACKEND_DIR) && env $(LOCAL_PERSONA_ENV) UV_CACHE_DIR="$(UV_CACHE_DIR)" UV_PROJECT_ENVIRONMENT="$(UV_PROJECT_ENVIRONMENT)" $(UV) run python -m src.scripts.seed_local_personas

reset-local-personas:
	env $(LOCAL_PERSONA_ENV) $(MAKE) --no-print-directory ensure-local-db-ready
	cd $(BACKEND_DIR) && env $(LOCAL_PERSONA_ENV) UV_CACHE_DIR="$(UV_CACHE_DIR)" UV_PROJECT_ENVIRONMENT="$(UV_PROJECT_ENVIRONMENT)" $(UV) run python -m src.scripts.seed_local_personas --cleanup --confirm-cleanup
	cd $(BACKEND_DIR) && env $(LOCAL_PERSONA_ENV) UV_CACHE_DIR="$(UV_CACHE_DIR)" UV_PROJECT_ENVIRONMENT="$(UV_PROJECT_ENVIRONMENT)" $(UV) run python -m src.scripts.seed_local_personas

db-upgrade:
	$(ALEMBIC_CMD) upgrade head

db-downgrade:
	$(ALEMBIC_CMD) downgrade -1

db-revision:
	$(ALEMBIC_CMD) revision --autogenerate -m "$(DB_MIGRATION_MESSAGE)"

start-dev:
	@if [ ! -x "$(FRONTEND_DIR)/node_modules/.bin/vite" ]; then \
		echo "Frontend dependencies are missing. Run 'make install-frontend-deps' first."; \
		exit 1; \
	fi
	@if [ ! -x "$(PYTHON)" ]; then \
		echo "Backend development dependencies are missing. Run 'make install-backend-deps' first."; \
		exit 1; \
	fi
	@$(MAKE) --no-print-directory ensure-local-db-ready
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
	( cd $(BACKEND_DIR) && exec env UV_CACHE_DIR="$(UV_CACHE_DIR)" UV_PROJECT_ENVIRONMENT="$(UV_PROJECT_ENVIRONMENT)" $(UV) run uvicorn src.app.main:app --reload --host $(BACKEND_HOST) --port $(BACKEND_PORT) ) & \
	backend_pid=$$!; \
	( cd $(FRONTEND_DIR) && exec $(PNPM) run dev -- --host $(FRONTEND_HOST) --port $(FRONTEND_PORT) ) & \
	frontend_pid=$$!; \
	while kill -0 "$$backend_pid" 2>/dev/null && kill -0 "$$frontend_pid" 2>/dev/null; do \
		sleep 1; \
	done; \
	exit_code=0; \
	if ! kill -0 "$$backend_pid" 2>/dev/null; then \
		wait "$$backend_pid" || exit_code=$$?; \
	fi; \
	if ! kill -0 "$$frontend_pid" 2>/dev/null; then \
		wait "$$frontend_pid" || exit_code=$$?; \
	fi; \
	exit "$$exit_code"

start-local-personas: seed-local-personas
	env $(LOCAL_PERSONA_ENV) $(MAKE) --no-print-directory start-dev

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

check-codex-assets:
	scripts/delorean/check-codex-assets.sh

collect-agent-run:
	scripts/delorean/collect-agent-run.sh $(COLLECT_AGENT_RUN_ARGS)

new-openspec-change:
	CHANGE_ID="$(CHANGE_ID)" CAPABILITY="$(CAPABILITY)" TITLE="$(TITLE)" SUMMARY="$(SUMMARY)" WORK_CONTEXT="$(WORK_CONTEXT)" scripts/delorean/create-openspec-change.sh $(NEW_OPENSPEC_CHANGE_ARGS)

fix:
	scripts/delorean/run-autofix.sh

autofix: fix

format-fix: fix

fmt-python:
	$(BACKEND_CMD) ruff format src/ tests/
	$(BACKEND_CMD) ruff check src/ tests/ --fix

fmt-ci-python:
	$(BACKEND_CMD) ruff format --check src/ tests/

format-python: fmt-python

check-python-format: fmt-ci-python

lint-python:
	$(BACKEND_CMD) ruff check src/ tests/

run-pytest:
	$(BACKEND_CMD) pytest -q

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
