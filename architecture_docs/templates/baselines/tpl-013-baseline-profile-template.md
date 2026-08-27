# TPL-013: Baseline Profile Template

Type: Template
Status: Active

Use this template for reusable baseline profile documents under
`docs/baselines/`.

## Document Header

```markdown
# BAS-000: <Baseline Name>

Type: Baseline
Status: Draft
Version: YYYY.MM
Governing Standard: <STD link>
```

## Read This When

- <Application type, service context, or release context this baseline applies to.>

## Scope

Describe the app type or service context covered by this baseline.

Name any app types that should use a more specific baseline.

## Control Profile

| Control | Requirement | Applicability |
|---|---|---|
| <CONTROL-ID: Control Name> | required to assess | <Condition or app type.> |

## Machine-Readable Profile

Link to the baseline controls profile YAML.

## Source Instruments

- <Source instrument, standard, program guidance, or policy link.>

## Checks

- [ ] The baseline references reusable controls instead of duplicating control detail.
- [ ] App-type applicability is clear for each referenced control.
- [ ] The baseline is added to `docs/baselines/catalog.yml`.
- [ ] Referenced controls are listed in `docs/controls/catalog.yml`.
