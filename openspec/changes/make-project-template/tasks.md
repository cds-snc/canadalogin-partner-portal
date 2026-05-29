## 1. Define template core boundaries

- [ ] 1.1 Inventory backend and frontend capabilities and classify each as template core or archived demo according to the approved core-boundary spec.
- [ ] 1.2 Identify the backend and frontend assets that must remain in core for auth/session scaffolding, access control, shared utilities, and department-list support.
- [ ] 1.3 Identify product-specific routes, services, pages, tests, migrations, seeds, and docs that must move to `demo/` and note any cross-layer dependencies that require coordinated relocation.

## 2. Preserve core functionality in main applications

- [ ] 2.1 Update backend core surfaces so retained infrastructure and department-list functionality operate without depending on archived demo-only business workflows.
- [ ] 2.2 Update frontend core routes and navigation so the main app exposes only retained template capabilities after demo features are removed from the primary path.
- [ ] 2.3 Adjust tests and bootstrap assets in the main apps so template core behavior remains coherent and independently runnable.

## 3. Archive partner-portal business features into demo

- [ ] 3.1 Move backend business workflows, supporting services, and related tests/docs into `demo/backend/` by feature boundary rather than by isolated file type.
- [ ] 3.2 Move frontend business routes, pages, fetch logic, and related tests/docs into `demo/frontend/` by feature boundary while preserving demo coherence.
- [ ] 3.3 Reclassify demo-specific migrations, seeds, and bootstrap scripts so template users can distinguish required core setup from archived demo assets.

## 4. Document template versus demo usage

- [ ] 4.1 Update top-level and app-level documentation to explain the template core boundary, including why access control and the department list remain in core.
- [ ] 4.2 Document how to run the main template applications and the archived demo surfaces, including any different setup or navigation expectations.
- [ ] 4.3 Document how future adopters should extend the template with new business logic without reintroducing archived demo assumptions into core.

## 5. Verify the converted repository

- [ ] 5.1 Run focused backend and frontend checks to confirm the main template surfaces boot and the retained core capabilities still work.
- [ ] 5.2 Run focused demo checks to confirm archived business features remain a coherent reference implementation after relocation.
- [ ] 5.3 Review the final repository structure and docs to confirm the template core and archived demo boundaries are explicit and consistent.