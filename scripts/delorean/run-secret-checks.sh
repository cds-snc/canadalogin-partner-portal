#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
status=0

allowed_env_examples='(^|/)\.env\.(example|template|sample)$'
tracked_env_files=()
tracked_key_files=()

is_allowed_env_template() {
  local path="$1"

  case "${path}" in
    backend/.env.dockercompose)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_excluded_path() {
  local path="$1"

  case "${path}" in
    .git/* | */.git/* | node_modules/* | */node_modules/* | dist/* | */dist/* | build/* | */build/* | coverage/* | */coverage/* | __MACOSX/* | */__MACOSX/* | __pycache__/* | */__pycache__/* | .pytest_cache/* | */.pytest_cache/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if git -C "${repo_root}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  while IFS= read -r file; do
    if is_excluded_path "${file}"; then
      continue
    fi

    if [[ "${file}" =~ (^|/)\.env($|\.) ]] && [[ ! "${file}" =~ ${allowed_env_examples} ]] && ! is_allowed_env_template "${file}"; then
      tracked_env_files+=("${file}")
    fi

    if [[ "${file}" =~ (^|/).*\.pem$ ]] ||
      [[ "${file}" =~ (^|/).*\.key$ ]] ||
      [[ "${file}" = "backend/certs/cert.pem" ]] ||
      [[ "${file}" = "backend/certs/key.pem" ]]; then
      tracked_key_files+=("${file}")
    fi
  done < <(git -C "${repo_root}" ls-files)
fi

if [ "${#tracked_env_files[@]}" -gt 0 ]; then
  echo "Tracked local environment files are not allowed:" >&2
  printf '  %s\n' "${tracked_env_files[@]}" >&2
  echo "Use .env.example, .env.sample, .env.template, or another reviewed placeholder env template with safe placeholder values only." >&2
  status=1
fi

if [ "${#tracked_key_files[@]}" -gt 0 ]; then
  echo "Tracked certificate or private key files are not allowed:" >&2
  printf '  %s\n' "${tracked_key_files[@]}" >&2
  echo "Use safe placeholders or setup docs instead of committing real certs or keys." >&2
  status=1
fi

for local_env in "backend/.env" "frontend/.env" ".env"; do
  if git -C "${repo_root}" ls-files --error-unmatch "${local_env}" >/dev/null 2>&1; then
    echo "Tracked local environment file is not allowed: ${local_env}" >&2
    status=1
  fi
done

if command -v gitleaks >/dev/null 2>&1; then
  echo "Running gitleaks secret scan with redacted output..."
  gitleaks_args=(detect --source "${repo_root}" --redact)

  if ! gitleaks "${gitleaks_args[@]}"; then
    status=1
  fi
else
  echo "gitleaks is not installed. Skipping optional secret content scan."
fi

echo "Secret checks do not print secret values."
echo "Enable secret scanning or push protection where available for real solution repos."

exit "${status}"
