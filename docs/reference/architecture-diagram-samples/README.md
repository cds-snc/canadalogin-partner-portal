# Architecture Diagram Samples

These examples test whether PlantUML is a practical default for architecture
diagrams that agents may need to create or maintain.

The current sample scenario is fictional: a partner portal is piloting GC
Sign-In and has an AWS-hosted web application, static web tier, backend runtime,
platform services, an external identity SaaS, and external browser/partner
participants. The AWS topology sample is illustrative only; it is not a
production design. The traffic-flow prompt-test sample uses high-level service
labels supplied in the prompt and omits account IDs, real domains, secrets, and
live AWS discovery.

The C4 partner portal samples use the local
`../gc-signin-partner-portal` repository as source material. They are still
local-only documentation examples: they do not assert production deployment
shape, real secrets, account IDs, or approved target-state architecture.

## Work Context

- Local developer / localhost: yes.
- Shared non-production environment: not used.
- Production: not in scope.

Safe assumption: use fake service names, fake domains, no real secrets, no real
AWS account IDs, and no production identifiers.

## Diagrams

| File | Purpose |
|---|---|
| [01-partner-portal-system-context.c4.puml](plantuml/01-partner-portal-system-context.c4.puml) | C4 Level 1 system context for the partner portal. It shows platform superusers, workspace administrators, workspace members, invited external developers, OIDC, IBM Security Verify, GC Notify, and partner RP applications. |
| [02-partner-portal-containers.c4.puml](plantuml/02-partner-portal-containers.c4.puml) | C4 Level 2 container view for the React/Vite web UI, FastAPI backend API, ARQ worker, PostgreSQL database, Redis, and external OIDC, IBM Security Verify, and GC Notify systems. |
| [03-partner-portal-backend-components.c4.puml](plantuml/03-partner-portal-backend-components.c4.puml) | C4 Level 3 backend component view for the FastAPI backend. It groups application setup, routers, dependencies, auth/OIDC, Casbin, workspace service, supporting services, repositories, models/schemas, exception handling, and worker settings. |
| [04-partner-portal-workspace-code.puml](plantuml/04-partner-portal-workspace-code.puml) | C4 Level 4 code-focused class/module view for the workspace and RP application invitation slice. It shows the FastAPI router, `WorkspaceService`, IBM Verify and GC Notify services, repository adapters, key SQLAlchemy models, and Pydantic schemas. |
| [gc-sign-in-pilot-aws-topology.puml](plantuml/gc-sign-in-pilot-aws-topology.puml) | Structure-only AWS topology based on the uploaded pilot sketch. It preserves source boundaries, omits runtime/OAuth/data-flow lines, uses embedded PlantUML AWS icons, keeps IBM Verify and participants as free-standing external boxes, and keeps hidden links small and layout-only. |
| [gc-sign-in-pilot-aws-topology-dependency-overlay.puml](plantuml/gc-sign-in-pilot-aws-topology-dependency-overlay.puml) | Same topology model with a basic dependency overlay. It draws only short local "who talks to who" arrows, lists long cross-boundary dependencies in the legend, keeps IBM Verify and participants as free-standing external boxes, and omits detailed OAuth redirects, callbacks, logout, profile-update, and data-flow sequences. |
| [canadalogin-aws-traffic-flow.puml](plantuml/canadalogin-aws-traffic-flow.puml) | Prompt-test traffic-flow topology source. It shows the requested app path, static website path, two ECS services, a 3-AZ deployment note without triplicating resources, visible ECS dependencies without extra arrows, and a dashed optional Verify webhook path. |
| [canadalogin-aws-traffic-flow.svg](rendered/canadalogin-aws-traffic-flow.svg) | Coordinate-rendered companion visual for the prompt-test traffic-flow topology. Use it when exact placement matters more than PlantUML's auto-layout. |
| [canadalogin-aws-traffic-flow-actors-v2.puml](plantuml/canadalogin-aws-traffic-flow-actors-v2.puml) | Actor-treatment v2 of the prompt-test traffic-flow topology. It keeps the same AWS service model, but represents human users with PlantUML actor notation and includes browser context in the actor label. |
| [canadalogin-aws-traffic-flow-actors-v2.svg](rendered/canadalogin-aws-traffic-flow-actors-v2.svg) | Coordinate-rendered companion visual for the actor-treatment v2. It shows the external user as an actor/person glyph outside AWS instead of a boxed external system. |
| [canadalogin-aws-traffic-flow-feedback-v3.puml](plantuml/canadalogin-aws-traffic-flow-feedback-v3.puml) | Feedback v3 of the prompt-test traffic-flow topology. It moves static website and AWS webhook processing components inside the Canada Central region, keeps IBM Verify and SIEM external, places WAF as ingress near ALBs before ECS, and marks Valkey subnet placement as needing confirmation. |
| [canadalogin-aws-traffic-flow-feedback-v3.svg](rendered/canadalogin-aws-traffic-flow-feedback-v3.svg) | Coordinate-rendered companion visual for feedback v3. It keeps WAF above/near ALBs so arrows do not cross the runtime area, and avoids asserting a separate Valkey data subnet. |

## Model and Rendering Policy

PlantUML is the maintainable source model, not a fixed-position canvas.
Optimize the model before optimizing placement: boundary fidelity, scope
reduction, shallow nesting, declaration order, engine comparison, then split or
fallback.

Layout-engine variants are renderer comparisons, not separate architecture
truths. If comparing DOT/default, Smetana, or ELK, keep the same topology model
where possible so the renderer is the variable under review. If an engine
requires changing real AWS boundaries, ownership, trust, or network
containment, reject that render instead of changing the architecture.

When precise presentation layout matters, a coordinate-rendered PNG/SVG may be
the canonical visual. PlantUML source may still be the canonical maintainable
model when an approximate auto-layout render is acceptable.

## Rendering

The current topology sample uses PlantUML's embedded AWS library so it does not
depend on remote GitHub icon includes:

```plantuml
!include <awslib/AWSCommon.puml>
```

Render locally only when PlantUML, Java, Graphviz, and any required local
renderer support are already installed. See
[local-verification.md](../local-verification.md) for the optional AWS topology
render matrix.

Example commands, only when the required local tools are already available:

```bash
java -jar plantuml.jar -tpng docs/reference/architecture-diagram-samples/plantuml/gc-sign-in-pilot-aws-topology.puml
java -jar plantuml.jar -Playout=smetana -tpng docs/reference/architecture-diagram-samples/plantuml/gc-sign-in-pilot-aws-topology.puml
java -jar plantuml.jar -Playout=elk -tpng docs/reference/architecture-diagram-samples/plantuml/gc-sign-in-pilot-aws-topology.puml
```

The partner portal C4 files can be rendered with the same local PlantUML setup
by replacing the file name, for example:

```bash
java -jar plantuml.jar -tpng docs/reference/architecture-diagram-samples/plantuml/01-partner-portal-system-context.c4.puml
java -jar plantuml.jar -tpng docs/reference/architecture-diagram-samples/plantuml/02-partner-portal-containers.c4.puml
java -jar plantuml.jar -tpng docs/reference/architecture-diagram-samples/plantuml/03-partner-portal-backend-components.c4.puml
java -jar plantuml.jar -tpng docs/reference/architecture-diagram-samples/plantuml/04-partner-portal-workspace-code.puml
```

The dependency-overlay sample can use the same commands by replacing the file
name with
`docs/reference/architecture-diagram-samples/plantuml/gc-sign-in-pilot-aws-topology-dependency-overlay.puml`.

The prompt-test traffic-flow source can use the same commands by replacing the
file name with
`docs/reference/architecture-diagram-samples/plantuml/canadalogin-aws-traffic-flow.puml`.
The actor-treatment v2 source can use the same commands by replacing the file
name with
`docs/reference/architecture-diagram-samples/plantuml/canadalogin-aws-traffic-flow-actors-v2.puml`.
The feedback v3 source can use the same commands by replacing the file name
with
`docs/reference/architecture-diagram-samples/plantuml/canadalogin-aws-traffic-flow-feedback-v3.puml`.
The companion SVG is already coordinate-rendered and can be opened directly by
an SVG-capable viewer.

Do not accept an engine just because it is different. If all attempted engines
produce vertical towers, sparse boxes, wrong peer orientation, or misleading
boundaries, simplify, split, or use a coordinate-rendered diagram.

The local PlantUML renderer and supporting layout tools were not run or
verified. The prompt-test SVG passed XML parsing and ASCII checks, but PNG
conversion was not produced locally because `sips` could not extract an image
from the SVG.

## Review Questions

- Does the diagram answer one clear topology question?
- For C4 samples, does the diagram stay at the selected C4 level instead of
  mixing context, container, component, code, and deployment details?
- Does it preserve AWS Cloud, region, VPC, subnet, SaaS, partner, and external
  participant boundaries?
- Are unrelated external systems free-standing when a shared external wrapper
  would imply false containment or make PlantUML layout worse?
- Are Route 53, CloudFront, WAF, platform services, SaaS identity providers,
  and external participants outside false VPC or subnet containment?
- Are runtime, OAuth, redirect, callback, logout, profile-update, and data-flow
  stories omitted from this topology view?
- If a dependency overlay is present, are the visible arrows sparse enough that
  topology remains the main thing being reviewed?
- Are long cross-boundary dependencies summarized instead of forcing PlantUML
  to stretch the topology around long edges?
- Are same-level peer groups visually peer-like without forcing a hidden-link
  grid?
- Is the hidden-link budget small enough that the source is still maintainable?
- Are labels readable at the target review format?
- If precise layout is required, should a coordinate-rendered PNG/SVG become
  the canonical visual while PlantUML remains the maintainable source model?
