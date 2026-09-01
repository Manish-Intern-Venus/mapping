# PROJECT DNA

## Product

NAJAR Digital Logbook is a simple daily reading capture system for boiler and autoclave meter displays.

The product exists to reduce manual plant logbook work. A user uploads meter display photos, the system extracts the visible number from each photo, calculates daily consumption against the previous record, and saves the row with the logged-in user's name as the signature.

## Core Problem

Plant staff currently do repetitive manual daily reading work. The software should make that work faster and less error-prone by turning meter photos into a structured daily log row.

The first goal is operational ease, not a broad compliance platform, not an advanced inspection suite, and not a complex analytics product for ordinary users.

## Domain

- Industrial plant utility readings.
- Boiler meter reading.
- Autoclave meter reading.
- Daily unit-wise record keeping.
- Excel/PDF-style logs with user sign-off.

## Users And Roles

### User

The User performs daily reading capture.

They can:
- Log in.
- Work only on assigned unit(s).
- Select a unit if more than one unit is assigned.
- Upload one boiler meter display photo.
- Upload one autoclave meter display photo.
- See the extracted readings and calculated consumption for today's row.
- Submit/save the daily row.

They cannot:
- See global reports.
- See analytics.
- Manage users.
- Access unassigned units.

### Admin

The Admin manages the logbook system.

They can:
- Assign users to units.
- See all unit records.
- Check reports.
- Export Excel/PDF-style reports.
- View analytics.
- Review and correct operational records when required.

## Primary Workflow

User logs in
-> assigned unit context is resolved
-> user uploads boiler and autoclave meter photos
-> system extracts one number from each image
-> system compares each reading with the previous record
-> daily consumption is calculated
-> row is saved with the user's name as sign
-> user sees the saved result

## Canonical Sheet Columns

Use this exact business order unless the owner changes it:

1. sr. no.
2. date
3. boiler reading
4. boiler consumption
5. autoclave reading
6. autoclave consumption
7. sign

## Consumption Rule

Based on the confirmed example:

previous reading - current reading = consumption

Example:

- Yesterday boiler reading: 100
- Today boiler reading: 50
- Boiler consumption: 50

If future real meters use cumulative increasing readings, the owner must explicitly approve changing the formula.

## Product Experience

The product should feel very simple and direct.

For ordinary users:
- No complex landing page.
- No multi-step inspection wizard.
- No general dashboard.
- No reports or analytics.
- No extra equipment parameters.
- The first useful screen should be daily upload for assigned unit context.

For admins:
- Admin screens can be denser, but should still remain practical and clear.
- Reports and analytics should answer operational questions, not decorate the UI.

## Visual Identity

The current industrial direction is too complex and should be simplified.

The visual world should feel like a clean plant log station:
- A daily sheet.
- A meter panel.
- A simple upload surface.
- Clear extracted readings.
- A trustworthy signed row.

Avoid:
- Generic SaaS dashboards.
- Four random KPI cards.
- Heavy landing pages.
- Decorative charts.
- Complex inspection language.
- Overly cinematic industrial visuals.
- Multi-color gradients as the main identity.

## Product Metaphor

Primary metaphor: plant log station.

The interface should feel like replacing a physical daily reading sheet beside plant equipment:
- Unit context is the plant area.
- Photo upload is the meter capture action.
- The saved row is the signed daily log entry.
- Admin reports are the collected logbook.

## Data Principles

- Readings are operational records and must be trustworthy.
- OCR/extracted values should be confirmable before save.
- Each saved row must preserve date, unit, readings, consumption values, and signer name.
- User unit assignment is a permission boundary.
- Frontend hiding is not sufficient authorization for production.

## Current Code Alignment

The repository currently contains a richer prototype with landing, mock login, unit selection, multi-step inspections, result generation, reports, analytics, and admin assignment.

Future implementation should simplify and redirect the product toward the confirmed daily meter-photo logbook workflow.

