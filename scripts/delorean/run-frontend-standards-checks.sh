#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
frontend_dir="${repo_root}/frontend"
status=0

if [ ! -d "${frontend_dir}/src" ] || [ ! -f "${frontend_dir}/package.json" ]; then
  echo "No frontend source found. Skipping frontend standards checks."
  exit 0
fi

if ! grep -q '"@gcds-core/components"' "${frontend_dir}/package.json"; then
  echo "frontend/package.json does not include @gcds-core/components." >&2
  status=1
fi

if ! grep -q '"@gcds-core/components-react"' "${frontend_dir}/package.json"; then
  echo "frontend/package.json does not include @gcds-core/components-react." >&2
  status=1
fi

if ! grep -R -E -q "@gcds-core/components-react/gcds\.css|@gcds-core/components/dist/gcds/gcds\.css"   "${frontend_dir}/src" "${frontend_dir}/index.html" 2>/dev/null; then
  echo "GC Design System CSS import was not found in frontend source." >&2
  status=1
fi

ui_files=()
while IFS= read -r -d '' file_path; do
  ui_files+=("${file_path}")
done < <(
  find "${frontend_dir}/src" -type f \
    \( -name '*.tsx' -o -name '*.jsx' -o -name '*.ts' -o -name '*.js' \) \
    ! -name '*.test.*' \
    ! -name '*.spec.*' \
    ! -path '*/__tests__/*' \
    ! -path '*/test/*' \
    ! -path '*/tests/*' \
    -print0
)

if [ "${#ui_files[@]}" -eq 0 ]; then
  echo "No frontend UI files found. Skipping GC Design System usage check."
  exit "${status}"
fi

if ! grep -E -q "@gcds-core/components-react|@gcds-core/components|<Gcds[A-Za-z]|<gcds-" "${ui_files[@]}"; then
  echo "No GC Design System component usage found in frontend UI source." >&2
  echo "Use GC Design System components first, or document a standards exception." >&2
  status=1
fi

custom_matches="$(grep -E -n '<(a|button|input|select|textarea|label|fieldset|legend|header|footer|nav)([[:space:]>])|role=["'\'']alert["'\'']' "${ui_files[@]}" || true)"
if [ -n "${custom_matches}" ]; then
  echo "Potential custom UI elements found. These fail by default because GC Design System components should be used where they fit." >&2
  echo "Use components such as GcdsButton, GcdsInput, GcdsTextarea, GcdsSelect, GcdsLink, GcdsAlert, GcdsHeader, GcdsFooter, GcdsTopNav, GcdsNavLink, or record a custom UI exception." >&2
  echo "${custom_matches}"
  if [ "${GCDS_CUSTOM_UI_POLICY:-fail}" = "warn" ]; then
    echo "GCDS_CUSTOM_UI_POLICY=warn is set, so potential custom UI elements are reported but do not fail this check." >&2
  else
    echo "Set GCDS_CUSTOM_UI_POLICY=warn only for a temporary migration or reviewed exception path." >&2
    status=1
  fi
fi

if [ "${status}" -eq 0 ]; then
  echo "Frontend GC Design System checks passed."
fi

exit "${status}"
