#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const changeId = process.argv[2];
const repoRoot = process.cwd();

if (!changeId) {
  console.error("CHANGE_ID is required.");
  process.exit(1);
}

const changeDir = path.join(repoRoot, "openspec", "changes", changeId);
const changeSpecsDir = path.join(changeDir, "specs");
const currentSpecsDir = path.join(repoRoot, "openspec", "specs");

if (!fs.existsSync(changeDir)) {
  console.error(`OpenSpec change does not exist: openspec/changes/${changeId}`);
  process.exit(1);
}

if (!fs.existsSync(changeSpecsDir)) {
  console.log("OpenSpec scenario preservation check skipped: no spec deltas.");
  process.exit(0);
}

function walkSpecFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkSpecFiles(absolutePath));
    } else if (entry.isFile() && entry.name === "spec.md") {
      files.push(absolutePath);
    }
  }

  return files;
}

function sectionLines(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const selected = [];
  let active = false;

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (active) {
        break;
      }
      active = line.trim() === heading;
      continue;
    }

    if (active) {
      selected.push(line);
    }
  }

  return selected;
}

function requirementBlocks(lines) {
  const blocks = [];
  let current = null;

  function finishCurrent() {
    if (current) {
      current.text = current.lines.join("\n");
      blocks.push(current);
    }
  }

  lines.forEach((line, index) => {
    const match = line.match(/^### Requirement:\s+(.+?)\s*$/);
    if (match) {
      finishCurrent();
      current = {
        title: match[1].trim(),
        startLine: index + 1,
        lines: [line],
      };
    } else if (current) {
      current.lines.push(line);
    }
  });

  finishCurrent();
  return blocks;
}

function requirementKey(title) {
  const firstToken = title.split(/\s+/)[0];
  if (/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/.test(firstToken)) {
    return firstToken;
  }

  return title;
}

function scenarioHeadings(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/^#### Scenario:\s+(.+?)\s*$/))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function scenarioKey(heading) {
  const firstToken = heading.split(/\s+/)[0];
  if (/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/.test(firstToken)) {
    return firstToken;
  }

  return heading;
}

function allowedScenarioRemovalKeys(text) {
  const keys = new Set();

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/allow-scenario-removal:\s*(.+?)(?:\s*-->)?\s*$/i);
    if (!match) {
      continue;
    }

    for (const value of match[1].split(",")) {
      const trimmed = value.trim();
      if (trimmed) {
        keys.add(scenarioKey(trimmed));
      }
    }
  }

  return keys;
}

function relativeFromRepo(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

const failures = [];

for (const deltaFile of walkSpecFiles(changeSpecsDir)) {
  const relativeSpecPath = path.relative(changeSpecsDir, deltaFile);
  const currentFile = path.join(currentSpecsDir, relativeSpecPath);
  const deltaMarkdown = fs.readFileSync(deltaFile, "utf8");
  const modifiedBlocks = requirementBlocks(
    sectionLines(deltaMarkdown, "## MODIFIED Requirements"),
  );

  if (modifiedBlocks.length === 0) {
    continue;
  }

  if (!fs.existsSync(currentFile)) {
    failures.push(
      `${relativeFromRepo(deltaFile)}: has modified requirements but missing current spec ${relativeFromRepo(currentFile)}`,
    );
    continue;
  }

  const currentMarkdown = fs.readFileSync(currentFile, "utf8");
  const currentRequirementMap = new Map();
  for (const block of requirementBlocks(currentMarkdown.split(/\r?\n/))) {
    currentRequirementMap.set(requirementKey(block.title), block);
  }

  for (const deltaBlock of modifiedBlocks) {
    const key = requirementKey(deltaBlock.title);
    const currentBlock = currentRequirementMap.get(key);
    if (!currentBlock) {
      failures.push(
        `${relativeFromRepo(deltaFile)}: modified requirement not found in current spec: ${deltaBlock.title}`,
      );
      continue;
    }

    const deltaScenarioKeys = new Set(
      scenarioHeadings(deltaBlock.text).map(scenarioKey),
    );
    const allowedRemovalKeys = allowedScenarioRemovalKeys(deltaBlock.text);

    for (const currentScenario of scenarioHeadings(currentBlock.text)) {
      const currentScenarioKey = scenarioKey(currentScenario);
      if (
        !deltaScenarioKeys.has(currentScenarioKey) &&
        !allowedRemovalKeys.has(currentScenarioKey)
      ) {
        failures.push(
          `${relativeFromRepo(deltaFile)}: modified requirement "${deltaBlock.title}" omits existing scenario "${currentScenario}". Include it in the modified requirement, or add "allow-scenario-removal: ${currentScenarioKey}" with the removal reason.`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error("OpenSpec scenario preservation check failed:");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log("OpenSpec scenario preservation check passed.");
