# ARCHITECTURE

## Current Repository State

Framework/runtime:
- Vinext / Next-style React app.
- React 19.
- Tailwind CSS.
- shadcn-style component registry.
- lucide-react icons.
- OpenAI Sites hosting configuration exists.

Current implementation:
- Single large client component in `app/page.tsx`.
- In-memory mock users, units, equipment, and reports.
- Mock profile selection instead of real authentication.
- Mock report PDF generation in the browser.
- No configured database in `.openai/hosting.json`.
- No configured object storage in `.openai/hosting.json`.
- No backend API layer currently visible in the app source.

## Target Architecture Direction

The production product should separate these concerns:

### Authentication And Roles

- Real login/session management.
- Roles: User and Admin.
- Unit assignments enforced on the server, not only in the UI.

### Data Model

Core entities:
- User
- Unit
- UnitAssignment
- DailyReadingRecord
- UploadedMeterImage

DailyReadingRecord should include:
- id
- sr_no
- date
- unit_id
- boiler_reading
- boiler_consumption
- autoclave_reading
- autoclave_consumption
- sign_user_id
- sign_name
- created_at
- updated_at

UploadedMeterImage should include:
- id
- record_id or draft_id
- unit_id
- equipment_type: boiler or autoclave
- storage_key
- extracted_number
- extraction_status
- extraction_confidence when available
- created_by
- created_at

### OCR / Number Extraction

The image flow should support:
- Upload meter display photo.
- Extract one visible number.
- Show extracted number for confirmation.
- Allow correction if OCR reads the number incorrectly.
- Save confirmed number into the daily row.

The exact OCR provider or model is TBD.

### Consumption Calculation

Use the confirmed rule:

previous reading - current reading = consumption

The calculation should be centralized in shared business logic and tested.

### Reports

Reports should be generated from saved DailyReadingRecord rows.

Admin exports should support:
- Excel-compatible output.
- PDF output.

The canonical column order is:
sr. no., date, boiler reading, boiler consumption, autoclave reading, autoclave consumption, sign.

## Implementation Guidance

- Replace or simplify the current multi-step inspection prototype for User flows.
- Preserve useful existing UI primitives from `components/ui`.
- Avoid adding new dependencies unless needed for OCR, file upload, export, or persistence.
- Keep image storage, OCR, and record persistence behind clear service boundaries.
- Never trust frontend-only role or unit checks in production.

## Open Technical Decisions

- Persistence provider: TBD.
- Image/object storage provider: TBD.
- OCR/extraction provider: TBD.
- Exact export format implementation: TBD.
- Whether one daily row requires both boiler and autoclave photos before save: TBD.

