# GC-WEB-006: Privacy And Personal Information

Type: Control
Status: Active
Source: Government of Canada

## Intent

Identify and protect personal information across collection, use, disclosure,
retention, logging, export, and deletion.

## Required Outcome

The application identifies and protects personal information before it is
collected, used, disclosed, retained, logged, exported, or deleted.

## Assessment

Confirm the application:

- identifies personal information and sensitive personal information
- confirms collection authority, purpose, use, disclosure, and retention
  expectations with the appropriate privacy path when needed
- collects only what is needed for the service purpose
- provides required privacy notices and consent or notification flows
- avoids exposing personal information in URLs, client errors, logs, analytics,
  screenshots, fixtures, or test data
- assesses whether a Privacy Impact Assessment or privacy protocol is required
- documents retention and disposition expectations for personal information

## Evidence Examples

- sensitive data handling record
- privacy review note
- PIA decision or referral note
- privacy notice review
- retention and disposition note

## Related Standards

- [STD-013: Security and Privacy Basics](../../standards/std-013-security-and-privacy-basics.md)

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-GC-WEB-006-PRIVACY-PERSONAL-INFORMATION](../../schemas/controls/gc-web-006-privacy-and-personal-information.schema.yaml)
- Used for: helping agents and reviewers check privacy control assessment
  evidence, personal information handling, PIA decisions, retention, exposure
  paths, and residual risk.
- Notes: The schema contract supports this control. It does not replace this
  control as the source of truth.
