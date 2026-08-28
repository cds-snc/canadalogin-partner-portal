#!/usr/bin/env bash

set -u

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
venv_dir="${VENV_DIR:-.venv}"
case "${venv_dir}" in
  /*)
    default_python="${venv_dir}/bin/python"
    ;;
  *)
    default_python="${repo_root}/${venv_dir}/bin/python"
    ;;
esac
python_command="${PYTHON:-${default_python}}"
python_bootstrap="${PYTHON_BOOTSTRAP:-python3.12}"

ok_count=0
warn_count=0
action_count=0

section() {
  printf '\n==> %s\n' "$1"
}

ok() {
  ok_count=$((ok_count + 1))
  printf 'ok: %s\n' "$1"
}

warn() {
  warn_count=$((warn_count + 1))
  printf 'warn: %s\n' "$1"
}

action() {
  action_count=$((action_count + 1))
  printf 'action: %s\n' "$1"
}

version_at_least() {
  local current="$1"
  local minimum="$2"

  awk -v current="${current#v}" -v minimum="${minimum#v}" '
    BEGIN {
      split(current, c, ".")
      split(minimum, m, ".")
      for (i = 1; i <= 3; i++) {
        cv = c[i] + 0
        mv = m[i] + 0
        if (cv > mv) {
          exit 0
        }
        if (cv < mv) {
          exit 1
        }
      }
      exit 0
    }
  '
}

command_version() {
  local command_name="$1"
  shift

  if command -v "${command_name}" >/dev/null 2>&1; then
    "$@" 2>/dev/null | head -n 1
  else
    printf 'missing'
  fi
}

read_adoption_level() {
  local config_path="${repo_root}/delorean/config.yaml"

  if [ ! -f "${config_path}" ]; then
    printf 'unknown'
    return 0
  fi

  awk -F ':' '
    $1 == "adoptionLevel" {
      gsub(/[[:space:]]/, "", $2)
      print $2
      found = 1
      exit
    }
    END {
      if (!found) {
        print "unknown"
      }
    }
  ' "${config_path}"
}

check_file() {
  local path="$1"
  local label="$2"

  if [ -f "${repo_root}/${path}" ]; then
    ok "${label}: ${path}"
  else
    action "${label} missing: ${path}"
  fi
}

check_dir() {
  local path="$1"
  local label="$2"

  if [ -d "${repo_root}/${path}" ]; then
    ok "${label}: ${path}"
  else
    action "${label} missing: ${path}"
  fi
}

section "Repository"
printf 'root: %s\n' "${repo_root}"

if git -C "${repo_root}" rev-parse --show-toplevel >/dev/null 2>&1; then
  ok "Git repo detected"
else
  warn "No Git repo detected"
fi

adoption_level="$(read_adoption_level)"
case "${adoption_level}" in
  2 | 3 | 4)
    ok "Delorean adoption level ${adoption_level}"
    ;;
  *)
    action "Delorean adoption level is missing or unsupported"
    ;;
esac

section "Generated Agent Paths"
check_file "scripts/delorean/select-openspec-change.sh" "OpenSpec active change picker"
if [ -d "${repo_root}/agent-configs" ]; then
  check_file "agent-configs/vscode/vscode/extensions.json" "VS Code extensions source"
  check_file "agent-configs/vscode/vscode/launch.json" "VS Code launch source"
  check_file "agent-configs/vscode/vscode/settings.json" "VS Code settings source"
  check_file "agent-configs/vscode/vscode/tasks.json" "VS Code tasks source"
else
  check_file ".vscode/extensions.json" "VS Code extension recommendations"
  check_file ".vscode/launch.json" "VS Code launch config"
  check_file ".vscode/settings.json" "VS Code settings"
  check_file ".vscode/tasks.json" "VS Code tasks"
  check_dir ".github/agents" "VS Code agents"
  check_dir ".github/prompts" "VS Code prompts"
  check_dir ".github/skills" "Shared skills"
fi

section "Node And Frontend"
node_minimum="${NODE_MIN_VERSION:-20.19.0}"
if command -v node >/dev/null 2>&1; then
  node_version="$(node -v)"
  if version_at_least "${node_version}" "${node_minimum}"; then
    ok "Node.js ${node_version} satisfies minimum ${node_minimum}"
  else
    action "Node.js ${node_version} is below minimum ${node_minimum}"
  fi
else
  action "Node.js is missing"
fi

if command -v npm >/dev/null 2>&1; then
  ok "npm $(npm -v)"
else
  action "npm is missing"
fi

if [ -f "${repo_root}/frontend/package.json" ]; then
  if [ -d "${repo_root}/frontend/node_modules" ]; then
    ok "frontend dependencies appear installed"
  else
    action "frontend dependencies are missing; run make install-frontend-deps"
  fi
else
  warn "frontend/package.json not present"
fi

section "Python And Backend"
python_available=0
if [ -f "${repo_root}/.python-version" ]; then
  ok ".python-version $(cat "${repo_root}/.python-version")"
else
  action ".python-version is missing; template repos should pin Python 3.12"
fi

if command -v "${python_command}" >/dev/null 2>&1; then
  python_available=1
  python_version_output="$("${python_command}" --version 2>&1)"
  ok "${python_version_output}"
  case "${python_version_output}" in
    *" 3.12" | *" 3.12."*)
      ;;
    *)
      action "expected Python 3.12 for the starter backend; recreate ${venv_dir} with make install-dev-python or override PYTHON intentionally"
      ;;
  esac
else
  action "${python_command} is missing"
  if command -v "${python_bootstrap}" >/dev/null 2>&1; then
    ok "Python bootstrap $(${python_bootstrap} --version 2>&1)"
  else
    action "Python 3.12 bootstrap is missing; install Python 3.12 or set PYTHON_BOOTSTRAP"
  fi
fi

if [ -d "${repo_root}/backend" ]; then
  if [ "${python_available}" -ne 1 ]; then
    action "backend checks need ${python_command}; run make install-dev-python after Python is available"
  elif "${python_command}" -c "import fastapi, uvicorn" >/dev/null 2>&1; then
    ok "backend runtime dependencies are importable"
  else
    action "backend runtime dependencies are missing; run make install-dev-python"
  fi
  if [ "${python_available}" -ne 1 ]; then
    warn "backend test and lint dependencies were not checked"
  elif "${python_command}" -c "import pytest, black, flake8" >/dev/null 2>&1; then
    ok "backend test and lint dependencies are importable"
  else
    warn "backend test or lint dependencies are not fully importable"
  fi
else
  warn "backend/ not present"
fi

section "OpenSpec"
if command -v openspec >/dev/null 2>&1; then
  ok "OpenSpec CLI $(command_version openspec openspec --version)"
else
  warn "OpenSpec CLI is missing; run make install-openspec-cli when official CLI validation is needed"
fi

if [ -d "${repo_root}/openspec/changes" ]; then
  change_count="$(find "${repo_root}/openspec/changes" -mindepth 1 -maxdepth 1 -type d ! -name example-change | wc -l | tr -d '[:space:]')"
  ok "active change folders found: ${change_count}"
else
  action "openspec/changes is missing"
fi

if [ -d "${repo_root}/delorean/evidence" ]; then
  state_count="$(find "${repo_root}/delorean/evidence" -mindepth 2 -maxdepth 2 -name change-state.yaml | wc -l | tr -d '[:space:]')"
  ok "change-state files found: ${state_count}"
else
  warn "delorean/evidence is not present"
fi

section "Docker"
if command -v docker >/dev/null 2>&1; then
  ok "Docker CLI $(docker --version 2>/dev/null | head -n 1)"
  if docker ps >/dev/null 2>&1; then
    ok "Docker-compatible runtime is reachable"
  else
    warn "Docker CLI is installed, but the runtime is not reachable"
  fi
else
  warn "Docker CLI is missing; only needed for container checks"
fi

section "Optional Tools"
if command -v shellcheck >/dev/null 2>&1; then
  ok "ShellCheck $(shellcheck --version 2>/dev/null | awk -F ': ' '$1 == "version" {print $2; exit}')"
else
  warn "ShellCheck is missing; shell checks will be skipped locally"
fi

if command -v gitleaks >/dev/null 2>&1; then
  ok "gitleaks $(gitleaks version 2>/dev/null | head -n 1)"
else
  warn "gitleaks is missing; optional secret content scan will be skipped"
fi

section "Recommended Next Checks"
printf 'run: scripts/delorean/run-structure-checks.sh\n'
printf 'run: scripts/delorean/run-local-verification.sh\n'
if [ -n "${CHANGE_ID:-}" ]; then
  printf 'run: make validate-openspec-change CHANGE_ID=%s\n' "${CHANGE_ID}"
fi

section "Summary"
printf 'ok: %s\n' "${ok_count}"
printf 'warnings: %s\n' "${warn_count}"
printf 'actions: %s\n' "${action_count}"
printf 'Doctor is diagnostic only and does not install dependencies, start services, or change files.\n'
