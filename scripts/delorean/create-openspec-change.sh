#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

change_id="${CHANGE_ID:-}"
capability="${CAPABILITY:-}"
title="${TITLE:-}"
summary="${SUMMARY:-}"
work_context="${WORK_CONTEXT:-local}"
force=0
create_delorean_state=1

read_adoption_level() {
  local config_path="${repo_root}/delorean/config.yaml"

  if [ ! -f "${config_path}" ]; then
    echo "2"
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
        print "2"
      }
    }
  ' "${config_path}"
}

usage() {
  cat <<'USAGE'
Usage: create-openspec-change.sh --change-id ID --capability NAME [options]

Create a local-first OpenSpec change package without needing the official OpenSpec CLI.

Options:
  --change-id ID          Change folder name, for example self-service-portal-mvp.
  --capability NAME       Capability folder under specs/, for example portal.
  --title TEXT            Human-readable title. Defaults to the change ID.
  --summary TEXT          One-sentence summary for proposal.md.
  --work-context VALUE    local, nonprod, or production. Defaults to local.
  --skip-delorean-state  Do not create delorean/evidence/<change-id>/change-state.yaml.
  --force                 Replace starter files if they already exist.
  -h, --help              Show this help.

Environment variables with the same names also work:
CHANGE_ID, CAPABILITY, TITLE, SUMMARY, WORK_CONTEXT.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --change-id)
      change_id="${2:?Missing value for --change-id}"
      shift 2
      ;;
    --capability)
      capability="${2:?Missing value for --capability}"
      shift 2
      ;;
    --title)
      title="${2:?Missing value for --title}"
      shift 2
      ;;
    --summary)
      summary="${2:?Missing value for --summary}"
      shift 2
      ;;
    --work-context)
      work_context="${2:?Missing value for --work-context}"
      shift 2
      ;;
    --skip-delorean-state)
      create_delorean_state=0
      shift
      ;;
    --force)
      force=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "${change_id}" ] || [ -z "${capability}" ]; then
  echo "Both --change-id and --capability are required." >&2
  usage >&2
  exit 2
fi

if ! printf '%s' "${change_id}" | grep -Eq '^[a-z0-9][a-z0-9._-]*$'; then
  echo "Change ID must use lowercase letters, numbers, dots, underscores, or hyphens, and start with a letter or number." >&2
  exit 2
fi

if ! printf '%s' "${capability}" | grep -Eq '^[a-z0-9][a-z0-9._-]*$'; then
  echo "Capability must use lowercase letters, numbers, dots, underscores, or hyphens, and start with a letter or number." >&2
  exit 2
fi

case "${work_context}" in
  local | localhost)
    work_context_label="Local developer / localhost"
    nonprod_line="Shared non-production environment: not used yet unless a target is named."
    production_line="Production: not in scope unless explicitly approved."
    ;;
  nonprod | non-production | shared)
    work_context_label="Shared non-production environment"
    nonprod_line="Shared non-production environment: target must be named before deployment or changes."
    production_line="Production: not in scope unless explicitly approved."
    ;;
  production | prod)
    work_context_label="Production readiness only"
    nonprod_line="Shared non-production environment: confirm whether a rehearsal environment is required."
    production_line="Production: blocked until human approval, target, rollback, monitoring, and evidence expectations are recorded."
    ;;
  *)
    echo "Unknown work context: ${work_context}. Use local, nonprod, or production." >&2
    exit 2
    ;;
esac

if [ -z "${title}" ]; then
  title="$(printf '%s' "${change_id}" | tr '-_' '  ' | awk '{for (i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')"
fi

if [ -z "${summary}" ]; then
  summary="Describe the intended behavior and the user or system outcome."
fi

adoption_level="$(read_adoption_level)"
adoption_level="${adoption_level//\"/}"
adoption_level="${adoption_level//\'/}"
baseline_gate_level="block_with_exception"
baseline_gate_notes="At Level 3 or 4 this gate blocks before release-ready unless waived."

if [ "${adoption_level}" = "2" ]; then
  baseline_gate_level="warn"
  baseline_gate_notes="At Level 2 this gate is advisory unless full release-readiness artifacts are requested."
fi

change_dir="${repo_root}/openspec/changes/${change_id}"
spec_dir="${change_dir}/specs/${capability}"
mkdir -p "${spec_dir}"
delorean_evidence_dir="${repo_root}/delorean/evidence/${change_id}"

write_file() {
  local path="$1"
  local content="$2"
  if [ -e "${path}" ] && [ "${force}" -ne 1 ]; then
    echo "Keeping existing file: ${path#"${repo_root}"/}"
    return 0
  fi
  printf '%s\n' "${content}" > "${path}"
  echo "Wrote ${path#"${repo_root}"/}"
}

write_file "${change_dir}/proposal.md" "# Proposal: ${title}

## Summary

${summary}

## Problem or opportunity

Describe the problem, opportunity, or user outcome in plain language.

## Work context

- Local developer / localhost: yes by default unless the request says otherwise.
- ${nonprod_line}
- ${production_line}

Selected starting context: ${work_context_label}.

## Safe assumptions

- Build and verify locally first.
- Use fake, fixture, or test-only data.
- Do not use real secrets or production identifiers.
- Keep external integrations stubbed or described until a target environment is named.
- Name reusable artifacts for the real domain concept or intended environment path, not for localhost. Keep local-only names for disposable fixtures, local config values, and examples that will not be promoted.

## Naming for reuse

- Reusable code, API, database, queue, feature flag, service, environment variable, documentation, and evidence identifiers: TBD
- Disposable local fixture or example identifiers: TBD
- Environment-specific values that stay in config, .env.local, fixtures, or deployment parameters: TBD
- Names that must wait for a named shared environment or production decision: TBD

## Suggested options

Recommended option:

- Build the local contract, implementation slice, tests, and evidence inputs first.

Other options:

- Prepare a shared non-production plan after the target environment, access path, data rules, and rollback or cleanup path are known.
- Prepare a production-readiness checklist only. Do not perform production work until approval, target, rollback, monitoring, and evidence expectations are known.

## Scope

- Add or update the OpenSpec delta for ${capability}.
- Identify likely implementation, test, documentation, and evidence impacts.

## Out of scope

- Production deployment unless explicitly approved.
- Real secrets, real production data, or external system changes unless explicitly approved.

## Requirements or scenarios affected

- Current spec: openspec/specs/${capability}/spec.md
- Delta spec: openspec/changes/${change_id}/specs/${capability}/spec.md
- Requirement: TBD
- Scenario: TBD

## Risks

- Missing environment details could block non-local work. Continue locally and record what is needed before shared-environment or production work.

## Links

- Work context standard: STD-002: Work Contexts
- OpenSpec lifecycle: docs/reference/openspec-lifecycle.md
- Evidence template: docs/templates/evidence-bundle-template.md"

write_file "${change_dir}/design.md" "# Design: ${title}

## Technical approach

Describe the simplest local-first approach.

## Work context impact

Local developer / localhost:

- Build and verify on the developer machine using fake, fixture, or test-only data.
- Use durable names for artifacts that may be reused outside localhost.

Shared non-production environment:

- Name the target environment, access path, secret source, data rules, and rollback or cleanup path before deployment or changes.

Production:

- Keep production out of scope until human approval, target, rollback, monitoring, and evidence expectations are recorded.

## Impacted artifacts

- OpenSpec delta: openspec/changes/${change_id}/specs/${capability}/spec.md
- Current spec after archive: openspec/specs/${capability}/spec.md
- API or OpenAPI contract: TBD
- Frontend: TBD
- Backend: TBD
- Tests: TBD
- Evidence: TBD
- Baseline assessment: TBD
- Affected GC-WEB controls: TBD

## Standards and patterns impact

Applicable guidance:

- STD-*:
- PAT-*:
- BAS-*:
- GC-WEB-*:
- TPL-*:

Selected page or implementation pattern, when applicable:

- Pattern:
- Reason:
- Custom UI or implementation exceptions:
- Evidence to collect:

## Suggested implementation path

Recommended first slice:

- Implement the smallest local-first path that proves the scenario.

Possible later slices:

- Shared non-production integration after target and access are known.
- Production readiness after explicit approval and release planning.

## Security, privacy, accessibility, and operations notes

- Security: keep real secrets and production identifiers out of code, tests, logs, prompts, and evidence.
- Privacy: use fake or test-only data until data rules are known.
- Accessibility: include UI checks when user-facing UI changes.
- Operations: record any monitoring, rollback, or support impacts before non-local work.
- GC web application baseline: identify whether BAS-001 applies and which controls need evidence, deferred-control notes, exceptions, ADRs, or release owner decisions.

## Open questions that block non-local work

- Target shared environment:
- Access owner:
- Secret source:
- Data classification:
- Rollback or cleanup path:
- Production approval path, if production is ever in scope:"

write_file "${change_dir}/tasks.md" "# Tasks: ${title}

## OpenSpec setup

- [ ] Review the proposal, design, tasks, and spec delta.
- [ ] Confirm the work context: local-only, shared non-production, or production.
- [ ] Classify new names as reusable artifacts, disposable local fixtures, or environment-specific config values.
- [ ] Classify the work as a new requirement, requirement adjustment, requirement bug, technical bug against an existing requirement, or non-functional change.
- [ ] Add or update requirement and scenario deltas for every behavior change or missing regression scenario.
- [ ] Identify applicable STD-*, PAT-*, BAS-*, GC-WEB-*, and TPL-* guidance.
- [ ] Record standards and patterns impact in \`design.md\` when guidance shapes the work.
- [ ] Record the selected UI page pattern and any custom UI exceptions when user-facing UI changes.
- [ ] Create or update \`delorean/evidence/${change_id}/change-state.yaml\` when configured by adoption level or requested.
- [ ] Confirm relevant gates from \`delorean/gates/gate-catalog.yaml\` when gate tracking is in scope.
- [ ] Keep the proposal, design, tasks, and spec delta current if scope or expected behavior changes.
- [ ] Update current specs only during lightweight developer readiness or release-readiness archive, and do not call a functional change complete while current specs are stale.

## Local implementation

- [ ] Build the smallest local-first slice.
- [ ] Use fake, fixture, or test-only data.
- [ ] Keep real secrets and production identifiers out of code, tests, logs, prompts, and evidence.
- [ ] Use durable domain or environment-path names for artifacts that may be reused outside localhost; keep local, test, fake, or demo names only for disposable fixtures, local config values, and examples that will not be promoted.

## Shared non-production readiness

- [ ] Name the target environment before deployment or changes.
- [ ] Confirm access path, secret source, data rules, and rollback or cleanup path.

## Production readiness

- [ ] Keep production out of scope until there is explicit human approval.
- [ ] Record approval, change owner, rollback, monitoring, and evidence expectations before production work.

## Review and verification

- [ ] Add or update tests for the scenarios.
- [ ] Confirm tests map to the updated OpenSpec scenarios or to the existing current spec for a technical bug.
- [ ] Validate the active change with \`openspec validate ${change_id} --strict\` when the official CLI is enabled.
- [ ] Run relevant local checks from docs/reference/local-verification.md.
- [ ] Run holistic QA review after implementation tasks are complete; resolve
  findings or record them as non-blocking before moving to developer readiness,
  release-readiness, or the next change.
- [ ] Run relevant standards, design-system, page-shell, accessibility, or API checks.
- [ ] Record skipped checks and reasons.
- [ ] Assess BAS-001 and affected GC-WEB controls when the change is a meaningful Government of Canada web application release or service change.
- [ ] Update gate statuses in \`delorean/evidence/${change_id}/change-state.yaml\` when change-state and gate tracking are in scope.

## Evidence and approval

- [ ] Record verification in an Evidence Bundle when needed.
- [ ] Link Evidence Bundle coverage back to the OpenSpec scenario.
- [ ] Link baseline assessment evidence, deferred controls, exceptions, reference architecture decisions, and ADRs when BAS-001 applies.
- [ ] Link approvals, waivers, skipped checks, and remaining risks from the change state when needed.
- [ ] Route approval or waiver decisions through Delorean templates when needed.

## Archive follow-through

- [ ] Confirm implementation, review, and verification are complete before archive.
- [ ] Archive with \`openspec archive ${change_id} --yes\` when the official CLI is enabled; do not use \`--skip-specs\` for functional deltas.
- [ ] For each \`## MODIFIED Requirements\` delta, confirm the full target requirement includes existing scenarios to preserve plus the new or changed scenarios.
- [ ] Confirm \`openspec/specs/${capability}/spec.md\` was created or updated from the delta.
- [ ] Confirm existing scenarios under modified requirements remain present unless the change intentionally removed them.
- [ ] Confirm the current spec now matches the implemented and verified behavior.
- [ ] Confirm the completed package moved to \`openspec/changes/archive/<date>-${change_id}/\` and the active change folder was removed.
- [ ] Update \`delorean/evidence/${change_id}/change-state.yaml\` archive fields when change-state is in scope, or record why archive is deferred."

write_file "${spec_dir}/spec.md" "# Delta for ${title}

## ADDED Requirements

### Requirement: TBD ${title}

Describe the required behavior in one or two testable sentences.

#### Scenario: TBD Local path works

- GIVEN the solution is running locally with test-only data
- WHEN the user or system performs the intended action
- THEN the expected local result is shown or returned
- AND no real secrets, production identifiers, or production data are used"

if [ "${create_delorean_state}" -eq 1 ]; then
  mkdir -p "${delorean_evidence_dir}"
  write_file "${delorean_evidence_dir}/change-state.yaml" "version: 1

change:
  id: \"${change_id}\"
  title: \"${title}\"
  summary: \"${summary}\"
  workContext: \"${work_context}\"
  currentPhase: \"spec\"
  decisionState: \"draft\"
  owner: \"\"

openspec:
  inScope: true
  lifecycleState: \"draft active change\"
  activeChangeId: \"${change_id}\"
  activeChangePath: \"openspec/changes/${change_id}\"
  currentSpecRefs:
    - \"openspec/specs/${capability}/spec.md\"
  proposalPath: \"openspec/changes/${change_id}/proposal.md\"
  designPath: \"openspec/changes/${change_id}/design.md\"
  tasksPath: \"openspec/changes/${change_id}/tasks.md\"
  deltaSpecPaths:
    - \"openspec/changes/${change_id}/specs/${capability}/spec.md\"
  validation:
    status: \"not_started\"
    command: \"make validate-openspec-change CHANGE_ID=${change_id}\"
    resultLink: \"\"
    skippedReason: \"\"
  archive:
    required: \"unknown\"
    status: \"not_started\"
    archivePath: \"\"
    reasonIfNotArchived: \"\"

controlBoundary:
  required: true
  status: \"pending\"
  permissionProfile: \"local-agent-standard\"
  allowedTools:
    - \"repo read\"
    - \"repo-scoped edits for this change\"
    - \"local verification commands\"
  allowedFileScope:
    - \"openspec/changes/${change_id}/\"
    - \"delorean/evidence/${change_id}/\"
    - \"implementation, test, docs, and contract files needed for this change\"
  allowedApis: []
  allowedMcpServers: []
  deniedScope:
    - \"production\"
    - \"real secrets\"
    - \"real production data\"
    - \"deployment\"
    - \"external system changes\"
  sensitiveDataClassification: \"none expected\"
  sensitiveDataHandling: \"Use fake, fixture, or test-only data. Do not use real secrets, production identifiers, or production data.\"
  namingPosture: \"Use durable domain or environment-path names for reusable artifacts; keep local/test/fake/demo names only for disposable fixtures, local config values, and examples that will not be promoted.\"
  requiredApprovals: []
  exceptions: []
  auditLinks: []

baselineAssessment:
  required: \"unknown\"
  status: \"not_started\"
  baselineId: \"BAS-001\"
  baselineVersion: \"\"
  governingStandard: \"STD-019\"
  baselineCatalogPath: \"architecture_docs/baselines/catalog.yml\"
  controlCatalogPath: \"architecture_docs/controls/catalog.yml\"
  controlsProfilePath: \"architecture_docs/baselines/bas-001-government-of-canada-web-application-baseline.controls.yml\"
  assessmentTemplate: \"TPL-011: GC Web Application Baseline Assessment Template\"
  assessmentPath: \"\"
  referenceArchitectureId: \"\"
  referenceArchitectureRelation: \"\"
  affectedControls: []
  controlStatusValues:
    - \"applies\"
    - \"not_applicable\"
    - \"deferred\"
    - \"exception\"
  controlStatuses: {}
  deferredControls: []
  exceptions: []
  evidence: []
  notes: \"Assess when this is a meaningful Government of Canada web application release or service change.\"

gates:
  work-context:
    level: \"block_with_exception\"
    status: \"pending\"
    evidence:
      - \"openspec/changes/${change_id}/proposal.md\"
    notes: \"Confirm before non-local work.\"
  openspec-change-package:
    level: \"block_with_exception\"
    status: \"pending\"
    evidence:
      - \"openspec/changes/${change_id}/proposal.md\"
      - \"openspec/changes/${change_id}/design.md\"
      - \"openspec/changes/${change_id}/tasks.md\"
      - \"openspec/changes/${change_id}/specs/${capability}/spec.md\"
    notes: \"\"
  control-boundary:
    level: \"block_with_exception\"
    status: \"pending\"
    evidence:
      - \"delorean/evidence/${change_id}/change-state.yaml\"
    notes: \"\"
  implementation-tasks:
    level: \"block_with_exception\"
    status: \"not_started\"
    evidence:
      - \"openspec/changes/${change_id}/tasks.md\"
    notes: \"\"
  openspec-validation:
    level: \"block_with_exception\"
    status: \"not_started\"
    evidence: []
    notes: \"Run when official OpenSpec CLI is enabled.\"
  local-quality-checks:
    level: \"block_with_exception\"
    status: \"not_started\"
    evidence: []
    notes: \"\"
  baseline-assessment:
    level: \"${baseline_gate_level}\"
    status: \"not_started\"
    evidence: []
    notes: \"${baseline_gate_notes}\"
  evidence-bundle:
    level: \"block_with_exception\"
    status: \"not_started\"
    evidence:
      - \"delorean/evidence/${change_id}/evidence-bundle.md\"
    notes: \"Create when the change is meaningful enough for review.\"
  approval-or-waiver:
    level: \"block\"
    status: \"not_applicable\"
    evidence: []
    notes: \"\"
  openspec-archive:
    level: \"block_with_exception\"
    status: \"not_started\"
    evidence: []
    notes: \"Archive during lightweight developer readiness or release-readiness after implementation and verification are complete.\"

evidence:
  evidenceBundlePath: \"delorean/evidence/${change_id}/evidence-bundle.md\"
  approvalResponsePath: \"\"
  waiverPath: \"\"
  agentRunLinks: []
  testResultLinks: []
  screenshotLinks: []
  openFindings: []
  skippedChecks: []
  remainingRisk: []

reentry:
  needed: false
  phase: \"\"
  reasonCode: \"\"
  notes: \"\"
  owner: \"\""
fi

echo

echo "Created OpenSpec change package: openspec/changes/${change_id}"
if [ "${create_delorean_state}" -eq 1 ]; then
  echo "Created Delorean change state: delorean/evidence/${change_id}/change-state.yaml"
fi
echo "Next: review proposal.md, design.md, tasks.md, and specs/${capability}/spec.md before implementation."
