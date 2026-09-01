# AGENTS.md

## Local Project OS Instructions

This repository is governed by Project OS.

Before meaningful product or code changes, read:

- `.project-os/PROJECT_DNA.md`
- Relevant local Project OS files for the task:
  - `.project-os/USER_JOURNEYS.md`
  - `.project-os/DESIGN_LANGUAGE.md`
  - `.project-os/PRODUCT_MAP.md`
  - `.project-os/ARCHITECTURE.md`
  - `.project-os/DECISIONS.md`

Also follow the global Project OS orchestrator at:
`/Users/spine/Products/project-os/PROJECT_OS.md`

## Product Direction

NAJAR Digital Logbook is a simple daily boiler and autoclave meter-photo reading logbook.

Do not push this project back toward a complex generic industrial dashboard or multi-step inspection suite unless the owner explicitly changes the product direction.

## Role Boundaries

User:

- Uploads boiler and autoclave meter display photos.
- Works only on assigned units.
- Sees extracted readings and saved row.
- Does not see reports or analytics.

Admin:

- Assigns units.
- Checks reports.
- Exports Excel/PDF.
- Views analytics.

## Implementation Rules

- Preserve the canonical sheet columns:
  `sr. no.`, `date`, `boiler reading`, `boiler consumption`, `autoclave reading`, `autoclave consumption`, `sign`.
- Use the confirmed consumption formula:
  `previous reading - current reading = consumption`.
- Use logged-in user name for `sign`.
- Treat unit assignment as an authorization boundary.
- Keep ordinary user UI simple and task-first.
- Avoid generic SaaS dashboards, heavy landing pages, decorative charts, and unnecessary workflow steps.
