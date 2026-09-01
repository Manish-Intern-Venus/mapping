# DECISIONS

## 2026-09-01 - Project OS Initialization

Decision:
Initialize this repository under Project OS as NAJAR Digital Logbook.

Reason:
The repository already contains a prototype, but no confirmed `.project-os/PROJECT_DNA.md` existed.

## 2026-09-01 - Product Scope

Decision:
The product is a daily boiler and autoclave meter-photo reading logbook, not a broad industrial inspection platform.

Reason:
The owner confirmed the main goal is making manual daily reading work easier.

## 2026-09-01 - User Roles

Decision:
Use two real roles: User and Admin.

Reason:
The owner confirmed ordinary users only upload photos for assigned units, while Admin manages assignments, reports, and analytics.

## 2026-09-01 - User Experience Direction

Decision:
Ordinary user experience must be simple and direct: upload images, see readings, save row.

Reason:
The owner explicitly said the current landing page and complex flow are not acceptable and the product should be simple.

## 2026-09-01 - Sheet Column Order

Decision:
Use this business column order:
sr. no., date, boiler reading, boiler consumption, autoclave reading, autoclave consumption, sign.

Reason:
The owner specified this order.

## 2026-09-01 - Signature

Decision:
The sign column uses the logged-in user's name.

Reason:
The owner confirmed a drawn or uploaded signature is not required.

## 2026-09-01 - Consumption Formula

Decision:
Use `previous reading - current reading = consumption`.

Reason:
The owner gave the example: yesterday 100, today 50, consumption 50.

## 2026-09-01 - Image Type

Decision:
Uploaded images are meter display photos, not paper log sheet photos.

Reason:
The owner confirmed each image will contain one important number.

## 2026-09-01 - First Implementation Slice

Decision:
Replace the old complex inspection prototype with a simpler client-side logbook flow: profile access, assigned-unit daily upload, signed saved row, admin reports, admin unit assignment, and admin analytics.

Reason:
This matches the confirmed Product DNA and removes the landing/dashboard/inspection-suite complexity that the owner rejected.

Note:
The repository still needs a production OCR provider and durable D1/R2-style storage in a later backend slice. The current frontend flow keeps numbers confirmable and does not claim a real OCR backend exists.
