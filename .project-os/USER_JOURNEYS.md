# USER JOURNEYS

## Role: User

### Daily Assigned Unit Reading

Entry:
User opens NAJAR Digital Logbook and logs in.

Context:
The system knows which units are assigned to this user. If one unit is assigned, the user should go directly to that unit's daily upload screen. If multiple units are assigned, the user selects the unit first.

Goal:
Submit today's boiler and autoclave readings without manual sheet work.

Action:
User uploads one boiler meter display photo and one autoclave meter display photo.

System Result:
The system extracts one number from each image, calculates boiler consumption and autoclave consumption using the previous saved record, and shows the daily row.

User Result:
User confirms/saves the row. The row is signed with the logged-in user's name.

Next Action:
User can leave the product or capture readings for another assigned unit.

### User Permission Boundary

Entry:
User logs in.

Context:
User may be assigned to one or more units.

Goal:
Work only on permitted units.

Action:
User attempts to access a unit or daily entry surface.

Result:
Only assigned units are available. Unassigned unit data is not shown or accepted.

Next Action:
If access is missing, Admin must update assignments.

## Role: Admin

### Unit Assignment

Entry:
Admin logs in and opens admin controls.

Context:
Users and units exist in the system.

Goal:
Control which users can submit readings for which units.

Action:
Admin assigns or removes unit access for each user.

Result:
User upload surfaces and record access follow the updated unit assignment.

Next Action:
Admin checks records or continues managing users.

### Reports Check

Entry:
Admin opens the reports/logbook view.

Context:
Daily records have been saved by users.

Goal:
Review all boiler and autoclave reading rows across units.

Action:
Admin filters by date and unit, checks readings, consumption, and signer name.

Result:
Admin can verify daily work and export the logbook.

Next Action:
Admin exports Excel/PDF or corrects flagged records if correction tools exist.

### Analytics Review

Entry:
Admin opens analytics.

Context:
Saved daily records exist.

Goal:
Understand reading and consumption patterns.

Action:
Admin reviews unit-wise or date-wise summaries.

Result:
Admin sees useful patterns from records, without decorative charts.

Next Action:
Admin checks underlying reports when a value looks unusual.

