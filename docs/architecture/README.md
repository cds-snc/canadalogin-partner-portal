# Solution Architecture

Type: Solution Architecture Index
Status: Active
Last reviewed: 2026-07-28

This directory is the durable home for architecture material specific to the
CanadaLogin Partner Portal.

## Current Architecture

- [Codebase architecture](codebase.md) describes the implemented system
  boundary, component responsibilities, dependency direction, runtime services,
  and known design drift.

## Architecture Decisions

- [ADR index](adrs/README.md)

An accepted ADR records a decision the project intends to preserve. A proposed
ADR records a direction or unresolved choice and is not yet an implementation
rule. ADR identifiers are never renumbered or reused.

## Historical Planning Material

The files under [`docs/plans/`](../plans/) remain useful inputs for product
scope, data flows, infrastructure, and prior design intent. They may describe
planned behaviour or earlier code and should be checked against
[codebase.md](codebase.md) and the implementation before being treated as
current.

## Generated Architecture Guidance

When Delorean is materialized, shared standards and patterns are generated
under `architecture_docs/`. Do not place local decisions in that directory.
Reference generated guidance by stable ID and title from local notes and ADRs.

## Updating These Documents

Update the codebase note when component boundaries or runtime topology change.
Create or supersede an ADR when a durable cross-cutting choice, material
trade-off, trust boundary, or variation from shared guidance changes.
