# Architecture Docs

Generated solution repos receive reusable architecture guidance from
`delorean_architecture` under `architecture_docs/`.

Reference architecture guidance by document ID and title first. Use file paths
only when a tool needs to load the document.

## Lookup Indexes

Use these generated indexes to resolve an ID to a file:

- `architecture_docs/README.md`: top-level architecture guidance index.
- `architecture_docs/standards/README.md`: `STD-*` standards.
- `architecture_docs/standards/catalog.yml`: machine-readable standards routing index.
- `architecture_docs/patterns/README.md`: `PAT-*` design and implementation patterns.
- `architecture_docs/patterns/catalog.yml`: machine-readable patterns routing index.
- `architecture_docs/controls/README.md`: reusable `GC-WEB-*`, `CDS-WEB-*`, or other control namespaces.
- `architecture_docs/controls/catalog.yml`: machine-readable reusable control registry.
- `architecture_docs/baselines/README.md`: reusable `BAS-*` baseline profiles.
- `architecture_docs/baselines/catalog.yml`: machine-readable baseline profile registry.
- `architecture_docs/templates/README.md`: `TPL-*` reusable templates.
- `architecture_docs/architecture/README.md`: reusable architecture note and ADR guidance.
- `architecture_docs/architecture/reference/catalog.yml`: reusable reference architecture registry.
- `architecture_docs/architecture/adrs/catalog.yml`: reusable architecture decision registry when published.

The ID rules live in `STD-001: Document Identifiers`.

## Routing With Catalogs

When an agent, skill, or script needs to decide which reusable guidance to load:

1. Use `architecture_docs/standards/catalog.yml` for standards.
2. Use `architecture_docs/patterns/catalog.yml` for patterns.
3. Use `architecture_docs/baselines/catalog.yml` and
   `architecture_docs/controls/catalog.yml` when Government of Canada web
   application baseline or control assessment may apply.
4. Use `architecture_docs/architecture/reference/catalog.yml` and
   `architecture_docs/architecture/adrs/catalog.yml` when reusable reference
   architectures or published ADRs may shape the work.
5. Match the task against `categories`, `applies_when`, `use_when`, and
   `do_not_use_when`.
6. Load the matching document by ID and title, plus directly related standards,
   patterns, controls, baselines, templates, or reference architectures when
   they affect the work.
7. Keep the catalog as routing metadata only; the Markdown document remains the
   source for rules, approach, trade-offs, and checks.

If a document ID is already known, resolve it through the catalog or the
corresponding README index and load only that file and any relevant related IDs.

Catalogs are the source of truth for available standards, patterns, baselines,
controls, templates, reference architectures, and ADRs. Skills, prompts, and
agents should not need edits just because `delorean_architecture` adds a new
`STD-*`, `PAT-*`, `BAS-*`, `GC-WEB-*`, or `TPL-*` entry. Update local skills or
agents only when a new document changes routing behavior, required outputs, or
the procedure itself. Otherwise, refresh `architecture_docs/` and let the
catalog matching select the new document.

## Stable Anchor IDs

This list is intentionally not exhaustive. It names common anchors that appear
in starter prompts, agents, skills, and repo guidance. Use the generated
catalogs above for the full current document set.

| ID | Title | Normal Use |
|---|---|---|
| `STD-001` | Document Identifiers | Naming, ID format, and reference rules. |
| `STD-002` | Work Contexts | Local, shared non-production, and production boundaries. |
| `STD-003` | Full-Stack Application Stack | Accepted starter stack and local-safe defaults. |
| `STD-005` | Frontend GC Design System | GC Design System usage expectations. |
| `STD-006` | GC UI Page Layout Rules | Approved page patterns and page shell rules. |
| `STD-008` | Backend FastAPI | Backend starter structure and conventions. |
| `STD-009` | REST API | REST API baseline. |
| `STD-017` | Government of Canada Standards Review | GC standards impact check. |
| `STD-018` | Frontend CSS and Design-System Boundary | GC Design System CSS and custom UI boundary. |
| `STD-019` | Government of Canada Web Application Baseline Governance | Active GC web application baseline governance and gate expectations. |
| `STD-020` | Database Persistence | Relational persistence, database models, migrations, repositories, seed data, and stored business records. |
| `BAS-001` | Government of Canada Web Application Baseline | Active baseline profile for GC web applications. |
| `GC-WEB-001` | Scope And Applicability | Baseline applicability control. |
| `GC-WEB-002` | Canada.ca Design, Federal Identity, And Page Shell | Canada.ca design, FIP, and page shell control. |
| `GC-WEB-003` | Accessibility | Accessibility control. |
| `GC-WEB-004` | Official Languages And Plain Language | Official languages and plain language control. |
| `GC-WEB-005` | Mobile And Responsive Behaviour | Responsive UI control. |
| `GC-WEB-006` | Privacy And Personal Information | Privacy and personal information control. |
| `GC-WEB-007` | Security | Security control. |
| `GC-WEB-008` | Identity And Access | Identity and access control. |
| `GC-WEB-009` | Information Management, Records, And Audit | IM, records, and audit control. |
| `GC-WEB-010` | APIs, Interoperability, And Data Exchange | API and data exchange control. |
| `GC-WEB-011` | Logging, Monitoring, Analytics, And Operational Readiness | Operational readiness control. |
| `PAT-001` | UI Page Patterns | Approved starter page patterns. |
| `PAT-012` | Alembic PostgreSQL Change | PostgreSQL schema change and Alembic migration pattern. |
| `PAT-013` | GC Design System React App Shell | Shared GC Design System React app shell pattern. |
| `PAT-014` | Bilingual Route and I18n | Bilingual route and language-toggle pattern. |
| `PAT-015` | Storybook UI Review Fixture | Repeatable UI state review fixture pattern. |
| `TPL-003` | Standards Impact Template | Standards impact block. |
| `TPL-005` | Architecture Note Template | Architecture note starter. |
| `TPL-006` | ADR Template | Durable decision template. |
| `TPL-007` | Page Pattern Decision Template | User-facing page pattern decision record. |
| `TPL-008` | Design Review Checklist Template | Page shell and design-system review checklist. |
| `TPL-009` | Verification Note Template | UI and verification evidence note. |
| `TPL-010` | Reference Architecture Template | Reusable reference architecture starter. |
| `TPL-011` | GC Web Application Baseline Assessment Template | Release or meaningful change baseline assessment record. |
| `TPL-012` | Control Template | Reusable control starter. |
| `TPL-013` | Baseline Profile Template | Reusable baseline profile starter. |

When adding new guidance in `delorean_architecture`, follow `STD-001` and update
the relevant generated index. Do not add local hard-coded references unless the
new document requires a changed procedure, trigger, output, or review gate.
