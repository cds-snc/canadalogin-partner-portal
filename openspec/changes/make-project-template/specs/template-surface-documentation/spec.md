## ADDED Requirements

### Requirement: Document Template And Demo Boundaries
Repository documentation MUST explain which capabilities belong to the reusable template core and which capabilities are preserved only in the archived demo, including the rationale for keeping infrastructure, access control, and the department list in core.

#### Scenario: Read the top-level template description
- **WHEN** a reader opens the repository documentation after the template conversion
- **THEN** the reader can identify the template core boundary and understand why some portal workflows were archived into `demo/`

#### Scenario: Review a preserved core exception
- **WHEN** a reader checks why department data remains in the main applications
- **THEN** the documentation explains that the department list is an intentional retained dataset in the template core

---

### Requirement: Document How To Run Core And Demo Surfaces
Repository documentation MUST describe how to run the main template applications and the archived demo surfaces, including any environment, setup, or navigation differences that adopters need to understand.

#### Scenario: Run the main template applications
- **WHEN** a new adopter follows the documented setup for the main applications
- **THEN** the adopter can start the template core without relying on undocumented demo-specific steps

#### Scenario: Run the archived demo reference implementation
- **WHEN** a maintainer or evaluator wants to inspect the archived partner-portal behavior
- **THEN** the documentation shows how to access the demo surfaces and what additional setup they require, if any

---

### Requirement: Document Extension Expectations For Template Users
Repository documentation MUST describe how template adopters are expected to add or replace business features after the conversion, including where new domain logic belongs and how to use the archived demo as a reference rather than as required core behavior.

#### Scenario: Add a new business feature to the template
- **WHEN** a team uses the repository as a starter for a new product workflow
- **THEN** the documentation explains where to build new domain features and how to avoid reintroducing archived demo assumptions into the template core

#### Scenario: Use demo code as an example
- **WHEN** a template adopter reviews archived demo features for implementation guidance
- **THEN** the documentation frames the demo as a reference implementation rather than as mandatory core structure