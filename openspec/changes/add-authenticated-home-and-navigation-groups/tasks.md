# Tasks

## 0. Change Setup And Boundaries

- [ ] 0.1 Confirm this change owns only authenticated Home and shared navigation behavior, while preserving existing deeper routes and role boundaries.
- [ ] 0.2 Confirm any follow-on content or IA refinements stay in this change instead of reopening archived dashboard planning packages.

## 1. Service-Home Route Contract

- [ ] 1.1 Update the access-and-dashboard spec delta so authenticated users land on `/` as the signed-in service home.
- [ ] 1.2 Define `/your-applications` as a dedicated RP application task route rather than the generic authenticated landing page.
- [ ] 1.3 Record the page-pattern decision and primary task navigation paths for the signed-in Home route.

## 2. Grouped Navigation Contract

- [ ] 2.1 Define the required grouped task areas for authenticated navigation, including partner tasks, platform administration, oversight, and support where authorized.
- [ ] 2.2 Define role-aware visibility rules so grouped navigation does not reveal unauthorized route labels.
- [ ] 2.3 Define return paths from primary destinations back to Home or the parent task area.

## 3. Signed-In Home Content Contract

- [ ] 3.1 Define the high-level Home content sections and task links.
- [ ] 3.2 Keep Home focused on orientation and task selection rather than embedded admin tables, review backlogs, or large record lists.
- [ ] 3.3 Define English and French content parity expectations for Home and grouped navigation labels.

## 4. Verification And Follow-Through

- [ ] 4.1 Add focused frontend tests for authenticated redirect behavior, Home task links, and grouped navigation visibility during implementation.
- [ ] 4.2 Capture desktop and mobile screenshots plus accessibility and design-system review evidence when implementation starts.
- [ ] 4.3 Run `make validate-openspec-change CHANGE_ID=add-authenticated-home-and-navigation-groups`.
- [ ] 4.4 Archive this functional change after implementation and verification so `openspec/specs/partner-portal-access-and-dashboard/spec.md` reflects the new signed-in Home and navigation behavior.
