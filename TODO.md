# Nzinga Talent OS — Remaining To-Do Items

Items from the original to-do list that have NOT yet been implemented.

---

## Page 1

- [x] **Create Email Template Dropdown & Email Integration**
  - Dropdown to select from pre-built email templates when sending communications
  - Mailjet integration via Supabase Edge Function (replaced EmailJS)
  - General email compose with template selection in TalentRecord History tab

- [x] **Add Phone VoIP & History**
  - Click-to-call via RingCentral (per-user OAuth account pairing)
  - SMS integration via RingCentral
  - Call history log per talent record with duration, direction, recording links
  - Inbound call matching via webhook
  - Settings page for RingCentral account connection

- [ ] **On "Send Back", person can see task details (for staff)**
  - When a record is sent back to a previous stage, the receiving staff member should see the reason/task details

- [ ] **CRM — For Minors, have parental info**
  - Add parent/guardian fields to the application and talent record for minors

- [ ] **Import prospect data with CSV**
  - Bulk import talent/prospect data from a CSV file

---

## Page 2

- [ ] **Adjust Missing Fields Entry & Highlights to be role-based**
  - Only show missing field alerts relevant to the current user's role/stage

- [ ] **Delete Alerts — only alert for unopened notes (History tab)**
  - Remove blanket "missing fields" alerts on History tab; only notify for unread notes

- [ ] **Add alert for director if someone's pipeline has been empty for more than 24 hrs**
  - Director notification/badge when a stage in their team's pipeline goes idle

- [ ] **Remove Talent Login on Employee Dash — Add it to Website-main**
  - Move the talent/prospect portal link to the public website instead of employee dashboard

- [ ] **Make Client Login Email & Pass**
  - Client (company/brand) portal with separate auth flow

- [ ] **Two Setting (Backend Reset)**
  - Admin ability to reset backend state / environment toggle

- [ ] **Each Staff Own Login**
  - ✅ Partially done (Supabase Auth per user exists). Needs password reset flow for invited users.

- [ ] **Editable Workspace/Dash**
  - Let users customize their dashboard layout or workspace widgets

---

## Page 3 — OS To-Do

- [ ] **Make sure team leads have defined roles with Claude**
  - Document/enforce team lead permissions and workflows clearly

### Prospect Side

- [ ] **Make Agreement side have readable PDFs with consent box on scroll-down**
  - Display agreement PDFs inline with a scroll-to-bottom consent checkbox before signing

### Server Side

- [ ] **KPI Calculator on prospect panel**
  - Analytics/KPI metrics displayed on the prospect/applications panel

### Holding Entry

- [ ] **Merge Manual Entry & Send Application**
  - Combine the "New Holding Entry" form and "Send Application" into one unified flow

---

## Already Completed ✅

| Item | Notes |
|------|-------|
| See who created an entry | `created_by` field + display in TalentRecord |
| "Send App" only email send | Removed in-person/link modes |
| Score must be green before send-up | Disabled button when < 3.5 |
| Add header to pipeline tab ("Prospects") | Added heading above pipeline |
| Remove Talent Login on Employee Dash | Was already not present |
| Can only submit one app per email | Duplicate email validation |
| Operations/Scouts can replace documents | Already supported by permission logic |
| Fix "staff upload" on documents tab | Changed to "Prospect Upload" |
| Niche only shows 4 options | Model, Actor, Influencer, Athlete |
| Applicants auto-promoted at 100% | Already working in saveApp flow |
| Remove "required fields missing" prompt | Red alert removed, yellow kept |
| Holding Entry required fields | Name, Phone, Email, City, State |
| Add delete profiles or Mark Lost | "Mark Lost" action added |
| Each Staff Own Login | Supabase Auth per user |
