# CLAUDE.md

## Project OS

This repository uses Project OS.

Read and follow:

- `/Users/spine/Products/project-os/PROJECT_OS.md`
- `.project-os/PROJECT_DNA.md`
- Relevant local Project OS files for the task.

## Current Product

NAJAR Digital Logbook is a simple daily reading logbook for boiler and autoclave meter display photos.

The confirmed user flow is:
login -> assigned unit -> upload boiler/autoclave photos -> extract one number from each -> calculate consumption -> save signed daily row.

## Product Guardrails

- Keep User screens simple.
- User should not see reports or analytics.
- Admin manages users, units, reports, exports, and analytics.
- The `sign` value is the logged-in user's name.
- Canonical report columns are:
  `sr. no.`, `date`, `boiler reading`, `boiler consumption`, `autoclave reading`, `autoclave consumption`, `sign`.
- Consumption is currently defined as:
  `previous reading - current reading = consumption`.

Do not introduce complex inspection workflows, generic dashboards, or broad industrial intelligence concepts unless the owner approves that direction.
