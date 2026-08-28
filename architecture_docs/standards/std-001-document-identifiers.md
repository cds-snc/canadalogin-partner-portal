# STD-001: Document Identifiers

Type: Standard
Status: Active

## Read This When

Use this for standards, patterns, baselines, controls, reference
architectures, architecture decisions, templates, and schema contracts in this
repo.

Provide stable identifiers for architecture guidance so documents can be referenced without relying only on file paths.

## Rules

- Every reusable guidance document MUST have a stable document ID.
- Document IDs MUST use an uppercase type or control namespace prefix, a
  three-digit sequence, and a short title.
- Markdown guidance filenames MUST use the lowercase ID plus a lowercase slug:
  `<type>-<number>-<slug>.md`.
- Schema contract filenames SHOULD use the lowercase ID plus a lowercase slug:
  `<type>-<number>-<slug>.yml`.
- Headings MUST start with the stable ID: `# STD-001: Document Identifiers`.
- IDs MUST be sequential per document type or control namespace, not per folder.
- IDs MUST NOT be reused after a document is removed, replaced, or deprecated.
- Renaming a document title MUST NOT change its ID.
- Moving a document path SHOULD NOT change its ID.
- Externally referenced documents MUST be deprecated or superseded instead of deleted.
- Deprecated documents SHOULD keep their ID and set `Status: Deprecated` or `Status: Superseded`.
- RFC 2119 keywords such as MUST, SHOULD, and MAY MUST be used only in standards.

## Examples

- Reference documents by ID and title first, path second when needed.
- Use IDs in review notes, architecture notes, ADRs, implementation plans, and issue references.
- Keep IDs short and stable. Put detail in the title and body, not in the ID.
- Use source-specific control namespaces such as `GC-WEB-*` or `CDS-WEB-*` for
  reusable controls.
- Use `BAS-*` for reusable baseline profiles.
- Reserve `REF-*` for reference architectures when that folder exists.
- Use `ARCH-SCHEMA-*` for shared architecture schema contracts.
- Use `TPL-*` only for reusable document shapes, not for example project content.

## Checks

- [ ] New reusable guidance has a document ID.
- [ ] The filename begins with the lowercase document ID.
- [ ] The H1 begins with the stable document ID.
- [ ] The document has `Type` and `Status` metadata.
- [ ] Existing references keep working when the file is renamed or moved.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-001-DOCUMENT-IDENTIFIERS](../schemas/standards/std-001-document-identifiers.schema.yaml)
- Used for: helping agents and reviewers check stable IDs, filenames, headings,
  metadata, and reference stability.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
