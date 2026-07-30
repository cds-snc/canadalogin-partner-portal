#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
frontend_dir="${repo_root}/frontend"
status=0

if [ ! -d "${frontend_dir}/src" ] || [ ! -f "${frontend_dir}/package.json" ]; then
  echo "No frontend source found. Skipping UI page shell checks."
  exit 0
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
	echo "No frontend UI files found. Skipping UI page shell checks."
	exit 0
fi

check_present() {
	local label="$1"
	local pattern="$2"

	if ! grep -E -q "${pattern}" "${ui_files[@]}"; then
		echo "Missing page shell element: ${label}" >&2
		status=1
	fi
}

check_present "header" "GcdsHeader|<gcds-header|<header([[:space:]>])"
check_present "header language toggle" "langHref=|lang-href=|GcdsLangToggle|<gcds-lang-toggle"
check_present "footer" "GcdsFooter|<gcds-footer|<footer([[:space:]>])"
check_present "main content skip target" "id=[\"']main-content[\"']"
check_present "skip link to main content" "skipToHref=[\"']#main-content[\"']|skip-to-href=[\"']#main-content[\"']|href=[\"']#main-content[\"']"
check_present "main content landmark" "<main([[:space:]>])|tag=[\"']main[\"']"
check_present "h1" "<h1([[:space:]>])|<Heading[^>]*tag=[\"']h1[\"']|<GcdsHeading[^>]*tag=[\"']h1[\"']|<gcds-heading[^>]*tag=[\"']h1[\"']"
check_present "date modified" "GcdsDateModified|<gcds-date-modified"
check_present "shared navigation menu" "slot=[\"']menu[\"']|GcdsTopNav|<gcds-top-nav|GcdsTopicMenu|<gcds-topic-menu|GcdsSideNav|<gcds-side-nav|<nav([[:space:]>])"
check_present "home navigation entry" "slot=[\"']home[\"']|[\"']Home[\"']|>[[:space:]]*Home[[:space:]]*<|aria-label=[\"'][^\"']*Home[^\"']*[\"']"

if [ "${status}" -eq 0 ]; then
	echo "UI page shell checks passed."
else
	echo "UI page shell checks failed. User-facing pages should start from an approved page pattern, keep the required page shell, and keep Home plus relevant pages in the shared menu." >&2
fi

exit "${status}"
