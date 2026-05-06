# Project Makefile - common developer commands

BACKEND_DIR := backend
UV := uv
ROOT_DIR := $(CURDIR)
ROOT_VENV := $(ROOT_DIR)/.venv
UV_PROJECT_ENVIRONMENT := $(ROOT_VENV)

.PHONY: help install test lint format typecheck
.PHONY: frontend-install frontend-build frontend-dev frontend-test frontend-lint frontend-format frontend-preview

# Common helpers
BACKEND_CMD := cd $(BACKEND_DIR) && UV_PROJECT_ENVIRONMENT=$(UV_PROJECT_ENVIRONMENT) $(UV) run
FRONTEND_DIR := frontend
PNPM := pnpm
FRONTEND_CMD := cd $(FRONTEND_DIR) && $(PNPM) run

# Composite targets (operate on both backend and frontend)
.PHONY: all-install all-lint all-format all-test all-build


help:
	@echo "Makefile targets:"
	@echo "  install           - install backend dependencies into the project's venv (uv sync)"
	@echo "  test              - run backend tests (pytest)"
	@echo "  lint              - run ruff lint checks on backend source"
	@echo "  format            - run ruff to auto-fix lint issues in backend source"
	@echo "  typecheck         - run mypy over backend sources"
	@echo "  frontend-install  - pnpm install in frontend/"
	@echo "  frontend-build    - pnpm run build in frontend/"
	@echo "  frontend-dev      - pnpm run dev in frontend/"
	@echo "  frontend-test     - pnpm run test in frontend/"
	@echo "  all-install       - install backend and frontend dependencies"
	@echo "  all-build         - build backend (if applicable) and frontend"
	@echo "  all-test          - run backend and frontend tests"
	@echo "  all-lint          - lint backend and frontend"
	@echo "  all-format        - format backend and frontend"

install:
	@echo "Installing backend dependencies (uses uv wrapper)"
	cd $(BACKEND_DIR) && UV_PROJECT_ENVIRONMENT=$(UV_PROJECT_ENVIRONMENT) $(UV) sync --group dev --extra dev

test:
	@echo "Running backend tests"
	$(BACKEND_CMD) pytest -q


lint:
	@echo "Running ruff lint checks (using pyproject.toml config)"
	$(BACKEND_CMD) ruff check src/


format:
	@echo "Auto-fixing lintable issues with ruff (using pyproject.toml config)"
	$(BACKEND_CMD) ruff check src/ --fix

typecheck:
	@echo "Running mypy type checker"
	$(BACKEND_CMD) mypy src/app

# Frontend targets
FRONTEND_DIR := frontend
PNPM := pnpm

frontend-install:
	@echo "Installing frontend dependencies (pnpm)"
	cd $(FRONTEND_DIR) && $(PNPM) install

frontend-build:
	@echo "Building frontend for production"
	cd $(FRONTEND_DIR) && $(PNPM) run build

frontend-dev:
	@echo "Starting frontend dev server"
	cd $(FRONTEND_DIR) && $(PNPM) run dev

frontend-test:
	@echo "Running frontend tests"
	cd $(FRONTEND_DIR) && $(PNPM) run test

frontend-lint:
	@echo "Running frontend lint"
	cd $(FRONTEND_DIR) && $(PNPM) run lint

frontend-format:
	@echo "Formatting frontend"
	cd $(FRONTEND_DIR) && $(PNPM) run format

frontend-preview:
	@echo "Preview production frontend build"
	cd $(FRONTEND_DIR) && $(PNPM) run preview

# Composite targets
all-install:
	@echo "Installing backend and frontend dependencies"
	cd $(BACKEND_DIR) && UV_PROJECT_ENVIRONMENT=$(UV_PROJECT_ENVIRONMENT) $(UV) sync --group dev --extra dev
	cd $(FRONTEND_DIR) && $(PNPM) install

all-build:
	@echo "Building frontend (backend has no global build target)"
	cd $(FRONTEND_DIR) && $(PNPM) run build

all-test:
	@echo "Running backend and frontend tests"
	$(BACKEND_CMD) pytest -q
	cd $(FRONTEND_DIR) && $(PNPM) run test

all-lint:
	@echo "Linting backend and frontend"
	$(BACKEND_CMD) ruff check src/
	cd $(FRONTEND_DIR) && $(PNPM) run lint

all-format:
	@echo "Formatting backend and frontend"
	$(BACKEND_CMD) ruff check src/ --fix
	cd $(FRONTEND_DIR) && $(PNPM) run format

# Backend shortcuts (bk-*)
.PHONY: bk-install bk-test bk-lint bk-format bk-typecheck
bk-install: install
bk-test: test
bk-lint: lint
bk-format: format

bk-typecheck: typecheck

# Backend migration shortcut
.PHONY: bk-migration
bk-migration: migration

# Backend migration target
.PHONY: migration
migration:
	@echo "Running Alembic migrations (backend)"
	cd $(BACKEND_DIR)/src && UV_PROJECT_ENVIRONMENT=$(UV_PROJECT_ENVIRONMENT) $(UV) run alembic upgrade head

# Frontend shortcuts (ft-*)
.PHONY: ft-install ft-build ft-dev ft-test ft-lint ft-format ft-preview
ft-install: frontend-install
ft-build: frontend-build
ft-dev: frontend-dev
ft-test: frontend-test
ft-lint: frontend-lint
ft-format: frontend-format
ft-preview: frontend-preview
