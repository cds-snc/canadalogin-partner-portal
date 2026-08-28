---
name: select-ui-page-pattern
description: Select an approved page pattern and page shell before user-facing UI page implementation starts.
---

# Purpose

Select the approved page pattern, approved template, page shell, home or service-home entry point, shared menu, task branching, navigation model, form pattern, and evidence needed for a user-facing page.

Use this before implementation for new pages and meaningful page shell, layout, navigation, form, multi-step flow, header, footer, menu, breadcrumb, or language toggle changes.

# Inputs

- Issue, scenario, task, OpenSpec change, design package, or ADR reference.
- Page type and target stack.
- Known approved page pattern or approved template, if any.
- Number of distinct user goals or task flows.
- Navigation, form, content, bilingual, accessibility, and evidence needs.
- Current or proposed home page or service home route.
- Pages or task areas that must be added to the shared menu.
- Visible or interactive UI needs that require GC Design System components.
- Current frontend stack and whether the repo keeps the starter `frontend/` folder.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load only the references that match the target stack and page type.

# Procedure

1. Identify the page type and user goal.
2. Identify whether the page is a service home/task hub, task page, form page, multi-step flow page, admin page, reporting page, or help page.
3. Identify the home page or service home route. For a new solution or feature area, make the service home the orienting entry point unless the decision records a single-task rationale.
4. If the work has multiple user goals, choose a service home or task hub pattern and name the separate task pages or routes. Do not plan to put all workflows on one page.
5. Confirm the target stack without forcing a framework change.
6. Choose the closest approved page pattern from `architecture_docs/patterns/catalog.yml`, starting with PAT-001: UI Page Patterns and then loading any related `PAT-*` documents whose `use_when` metadata matches the page, task flow, data display, status, navigation, or form need.
7. If no approved page pattern fits, mark an exception as required and identify the human review path before implementation starts.
8. Name the required page shell elements: header, footer, main content, skip link, H1, and date modified when the page type needs it.
9. Name the shared menu update: include `Home` and the new page or parent task area, choose the navigation component, and record an exclusion reason if the page should not be in primary navigation.
10. Name the primary task navigation paths from `Home` or service home to each destination route, including how people return to the service home or parent task area.
11. Name navigation needs: breadcrumbs, header-provided language toggle, search, theme or topic menu, top navigation, and side navigation.
12. Confirm language-toggle behavior: use the header or `gcds-header` `lang-href` support where available, link to the equivalent page in the other official language when bilingual routes exist, and do not add a second standalone toggle in the page body.
13. Inventory visible and interactive UI needs, then map each to the GC Design System component to use. For the React starter, prefer `GcdsButton`, `GcdsInput`, `GcdsTextarea`, `GcdsSelect`, `GcdsCheckboxes`, `GcdsRadios`, `GcdsDateInput`, `GcdsFileUploader`, `GcdsErrorSummary`, `GcdsErrorMessage`, `GcdsAlert`, `GcdsNotice`, `GcdsLink`, `GcdsNavLink`, `GcdsTopNav`, `GcdsSideNav`, `GcdsHeader`, and `GcdsFooter` where they fit.
14. Treat raw HTML controls as exceptions. Record a custom UI exception before implementation for any planned raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, `<header>`, `<footer>`, `<nav>`, `<label>`, `<fieldset>`, `<legend>`, or `role="alert"` usage.
15. Name form needs and the approved template or component pattern to use.
16. Name required evidence: desktop screenshot, mobile screenshot, accessibility result, and design-system checklist.
17. Write the decision into the local page pattern decision template before implementation starts.

# Output Format

```yaml
ui_page_pattern_decision:
  page_role:
  page_type:
  selected_pattern:
  source_reference:
  target_stack:
  task_structure:
    multiple_user_goals:
    entry_page:
    destination_routes:
    home_page_or_service_home:
    single_page_rationale:
  required_shell:
    header:
    footer:
    main_content:
    skip_link:
    h1:
    date_modified:
  navigation:
    primary_task_paths:
      - task:
        entry_route:
        navigation_elements:
        destination_routes:
        return_path:
    shared_menu:
      provided:
      component:
      home_link:
      new_page_or_parent_task_link:
      exclusion_reason:
    breadcrumbs:
    language_toggle:
      provided_by_header:
      equivalent_language_route:
      standalone_toggle_in_body:
    search:
    theme_topic_menu:
    top_navigation:
    side_navigation:
  forms:
    required:
    pattern:
  component_plan:
    page_shell:
      - need:
        gc_component:
        custom_exception:
    navigation:
      - need:
        gc_component:
        custom_exception:
    actions_and_forms:
      - need:
        gc_component:
        custom_exception:
    status_and_content:
      - need:
        gc_component:
        custom_exception:
  evidence_required:
    desktop_screenshot:
    mobile_screenshot:
    accessibility_result:
    design_system_checklist:
  exceptions:
    required:
    approval_status:
    notes:
```

# Escalation

Escalate before implementation when a user-facing page would start from a blank custom layout, skip the required page shell, bypass an approved template without a clear reason, put several distinct workflows on one page without a strong rationale, omit `Home` or the new page from the shared menu without a recorded reason, rely on breadcrumbs, direct URLs, or browser history as the main navigation path, add a duplicate body language toggle when the header provides one, use raw HTML controls without a recorded custom UI exception, or need a custom navigation or form pattern.

# Source And Ownership

This is a local starter skill. Keep it thin and aligned to official GC Design System, Canada.ca, GCWeb/WET, and Delorean guidance.
