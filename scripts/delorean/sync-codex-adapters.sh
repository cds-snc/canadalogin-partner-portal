#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/delorean/sync-codex-adapters.sh --write|--check

Regenerate Codex agent and prompt adapters from the VS Code source files.

Options:
  --write   Rewrite agent-configs/codex/agents and agent-configs/codex/prompts.
  --check   Verify committed Codex adapters match generated output.
  -h, --help
            Show this help.
EOF
}

if [ "$#" -ne 1 ]; then
  usage >&2
  exit 2
fi

mode="$1"
case "${mode}" in
  --write | --check)
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
codex_root="${repo_root}/agent-configs/codex"

if [ ! -d "${repo_root}/agent-configs/vscode/agents" ] ||
  [ ! -d "${repo_root}/agent-configs/vscode/prompts" ]; then
  echo "VS Code agent and prompt source folders are required under agent-configs/vscode/." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to sync Codex adapters from VS Code sources." >&2
  exit 1
fi

tmp_dir=""
cleanup() {
  if [ -n "${tmp_dir}" ]; then
    rm -rf -- "${tmp_dir}"
  fi
}
trap cleanup EXIT

out_root="${codex_root}"
if [ "${mode}" = "--check" ]; then
  tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/delorean-codex-sync.XXXXXX")"
  out_root="${tmp_dir}/codex"
fi

node - "${repo_root}" "${out_root}" <<'NODE'
const fs = require("fs");
const path = require("path");

const repoRoot = process.argv[2];
const outRoot = process.argv[3];

const vscodeAgentDir = path.join(repoRoot, "agent-configs/vscode/agents");
const vscodePromptDir = path.join(repoRoot, "agent-configs/vscode/prompts");
const outAgentDir = path.join(outRoot, "agents");
const outPromptDir = path.join(outRoot, "prompts");

const agentSlugByName = new Map([
  ["Coordinator", "coordinator"],
  ["Spec Author", "spec-author"],
  ["Delivery Planner", "delivery-planner"],
  ["Builder General", "builder-general"],
  ["QA Support", "qa-support"],
  ["Release Readiness", "release-readiness"],
]);

function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error(`Missing YAML frontmatter: ${filePath}`);
  }

  const frontmatter = match[1];
  const body = raw.slice(match[0].length).replace(/^\s+/, "");
  const pick = (key) => {
    const line = frontmatter.split("\n").find((item) => item.startsWith(`${key}:`));
    if (!line) return "";
    return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
  };

  return {
    frontmatter,
    body,
    name: pick("name"),
    id: pick("id"),
    description: pick("description"),
    agent: pick("agent"),
  };
}

function transformCommon(markdown) {
  return markdown
    .replace(/\.github\/agents\/([a-z0-9-]+)\.agent\.md/g, ".codex/agents/$1.md")
    .replace(/\.github\/prompts\/([a-z0-9-]+)\.prompt\.md/g, ".codex/prompts/$1.md")
    .replace(/\.github\/skills\//g, ".agents/skills/")
    .replace(/\.github\/agents/g, ".codex/agents")
    .replace(/\.github\/prompts/g, ".codex/prompts")
    .replace(/\]\(\.\.\/agents\/([^)]+?)\.agent\.md\)/g, "](../agents/$1.md)")
    .replace(/\]\(\.\.\/prompts\/([^)]+?)\.prompt\.md\)/g, "](../prompts/$1.md)")
    .replace(/\]\(\.\.\/skills\//g, "](../../.agents/skills/")
    .replace(/\.agent\.md/g, ".md")
    .replace(/\.prompt\.md/g, ".md")
    .replace(/`agent\/runSubagent`/g, "Codex subagent delegation")
    .replace(/agent\/runSubagent/g, "Codex subagent delegation")
    .replace(/GitHub Copilot for VS Code/g, "Codex")
    .replace(/frontmatter handoffs/g, "the target Codex role file")
    .replace(/frontmatter handoff/g, "the target Codex role file")
    .replace(/If subagent invocation is unavailable,\s*use the target Codex role file or ask the user to switch to the target agent\./g, "If subagent delegation is unavailable, read the target role file and continue in the current Codex session.")
    .replace(/If subagent invocation is unavailable,\s*use [^.]+\./g, "If subagent delegation is unavailable, read the target role file and continue in the current Codex session.");
}

function demoteHeadings(markdown) {
  return markdown.replace(/^(#{1,5})\s/gm, "$1# ");
}

function generatedNotice(sourcePath) {
  return `<!-- delorean-template:codex-generated from ${sourcePath}; run scripts/delorean/sync-codex-adapters.sh --write -->`;
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

function slugFromAgentFile(fileName) {
  return fileName.replace(/\.agent\.md$/, "");
}

function slugFromPromptFile(fileName) {
  return fileName.replace(/\.prompt\.md$/, "");
}

function renderAgent(fileName) {
  const sourceRel = `agent-configs/vscode/agents/${fileName}`;
  const sourcePath = path.join(repoRoot, sourceRel);
  const parsed = parseFrontmatter(sourcePath);
  const slug = slugFromAgentFile(fileName);
  const title = parsed.name || slug;
  const body = demoteHeadings(transformCommon(parsed.body).trim());

  return {
    slug,
    title,
    description: parsed.description || "",
    content: `# ${title}

${generatedNotice(sourceRel)}

This Codex adapter is generated from the VS Code agent source. Edit \`${sourceRel}\`, then run \`scripts/delorean/sync-codex-adapters.sh --write\`.

${body}
`,
  };
}

function renderPrompt(fileName) {
  const sourceRel = `agent-configs/vscode/prompts/${fileName}`;
  const sourcePath = path.join(repoRoot, sourceRel);
  const parsed = parseFrontmatter(sourcePath);
  const id = parsed.id || slugFromPromptFile(fileName);
  const agentName = parsed.agent || "Coordinator";
  const agentSlug = agentSlugByName.get(agentName) || "coordinator";
  let body = transformCommon(parsed.body).trim();
  const intro = `
${generatedNotice(sourceRel)}

Codex prompt adapter generated from \`${sourceRel}\`.

Recommended role: [${agentName}](../agents/${agentSlug}.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.
`;

  if (/^#\s+.+\n/.test(body)) {
    body = body.replace(/^#\s+.+\n/, (heading) => `${heading}${intro}\n`);
  } else {
    body = `# ${id}\n${intro}\n\n${body}`;
  }

  return {
    id,
    agentName,
    agentSlug,
    description: parsed.description || "",
    content: `${body.trim()}\n`,
  };
}

function renderAgentReadme(agents) {
  const rows = agents
    .map((agent) => `| [${agent.title}](${agent.slug}.md) | ${agent.description.replace(/\|/g, "\\|")} |`)
    .join("\n");

  return `# Codex Agent Adapters

${generatedNotice("agent-configs/vscode/agents/*.agent.md")}

These Codex role adapters are generated from the VS Code agent catalog. Edit the VS Code source files under \`agent-configs/vscode/agents/\`, then run \`scripts/delorean/sync-codex-adapters.sh --write\`.

Use these files as the role source for Codex subagents when the runtime exposes multi-agent delegation. If subagent delegation is not available, read the target file and continue in the current Codex session using that role contract.

## Agents

| Role | Description |
|---|---|
${rows}

## Adapter Rules

- Do not edit these generated Codex adapters directly in the template.
- Do not add VS Code frontmatter or VS Code-specific tool names.
- Keep portable skills under \`.agents/skills/\`.
`;
}

function renderPromptReadme(prompts) {
  const rows = prompts
    .map((prompt) => `| [${prompt.id}.md](${prompt.id}.md) | [${prompt.agentName}](../agents/${prompt.agentSlug}.md) | ${prompt.description.replace(/\|/g, "\\|")} |`)
    .join("\n");

  return `# Codex Prompt Adapters

${generatedNotice("agent-configs/vscode/prompts/*.prompt.md")}

These Codex prompt adapters are generated from the VS Code prompt catalog. Edit the VS Code source files under \`agent-configs/vscode/prompts/\`, then run \`scripts/delorean/sync-codex-adapters.sh --write\`.

Use a prompt by asking Codex to follow the file, for example \`Follow .codex/prompts/dl-dev-continue.md\`. When Codex subagent tooling is available, pair the prompt with the recommended role in \`.codex/agents/\`; otherwise, read the role file and run the prompt in the current session.

## Prompt Catalog

| Prompt | Recommended role | Purpose |
|---|---|---|
${rows}

## Adapter Rules

- Do not edit these generated Codex adapters directly in the template.
- Do not add VS Code frontmatter or VS Code-specific tool names.
- Use \`../agents/*.md\` for Codex role links and \`../../.agents/skills/*/SKILL.md\` for generated skill links.
`;
}

function assertNoForbiddenCodexSyntax(filePath, content) {
  const forbidden = [
    /^---$/m,
    /^tools:/m,
    /^handoffs:/m,
    /agent\/runSubagent/,
  ];

  for (const pattern of forbidden) {
    if (pattern.test(content)) {
      throw new Error(`Generated Codex adapter contains forbidden VS Code syntax: ${filePath}`);
    }
  }
}

fs.rmSync(outAgentDir, { recursive: true, force: true });
fs.rmSync(outPromptDir, { recursive: true, force: true });
fs.mkdirSync(outAgentDir, { recursive: true });
fs.mkdirSync(outPromptDir, { recursive: true });

const agentFiles = fs.readdirSync(vscodeAgentDir).filter((file) => file.endsWith(".agent.md")).sort();
const promptFiles = fs.readdirSync(vscodePromptDir).filter((file) => file.endsWith(".prompt.md")).sort();

const agents = agentFiles.map(renderAgent);
for (const agent of agents) {
  const filePath = path.join(outAgentDir, `${agent.slug}.md`);
  assertNoForbiddenCodexSyntax(filePath, agent.content);
  writeFile(filePath, agent.content);
}
writeFile(path.join(outAgentDir, "README.md"), renderAgentReadme(agents));

const prompts = promptFiles.map(renderPrompt);
for (const prompt of prompts) {
  const filePath = path.join(outPromptDir, `${prompt.id}.md`);
  assertNoForbiddenCodexSyntax(filePath, prompt.content);
  writeFile(filePath, prompt.content);
}
writeFile(path.join(outPromptDir, "README.md"), renderPromptReadme(prompts));

console.log(`Generated ${agents.length} Codex agent adapters and ${prompts.length} Codex prompt adapters.`);
NODE

if [ "${mode}" = "--check" ]; then
  status=0
  if ! diff -ru "${out_root}/agents" "${codex_root}/agents"; then
    status=1
  fi
  if ! diff -ru "${out_root}/prompts" "${codex_root}/prompts"; then
    status=1
  fi

  if [ "${status}" -ne 0 ]; then
    echo "Codex adapters are out of sync with VS Code sources." >&2
    echo "Run: scripts/delorean/sync-codex-adapters.sh --write" >&2
    exit "${status}"
  fi

  echo "Codex adapters are in sync with VS Code sources."
fi
