# Todo Implementation Log

This document records what was implemented from `dist/todo.txt`, how it was implemented, and what was already covered by existing behavior.

## Implemented Items

### 1) Add header to pipeline tab ("Prospects")
- **Status:** Implemented
- **File:** `src/components/pipeline/Pipeline.tsx`
- **Implementation:** Added a top-level `Prospects` heading above the stage-grouped pipeline tables to make the tab intent explicit.

### 2) Restrict prospect niches to four options
- **Status:** Implemented
- **Files:** `src/constants/app-sections.ts`, `src/components/talent/TalentRecord.tsx`
- **Implementation:** Reduced `APP_SECTIONS` talent `niches` options to:
  - `Model`
  - `Actor`
  - `Influencer`
  - `Athlete`
- Updated the scout-side holding-entry niche checkbox list to match the same four options.

### 3) "Send App" should only support email send
- **Status:** Implemented
- **File:** `src/components/application/ApplicationModals.tsx`
- **Implementation:** Removed in-person and copy-link delivery modes from `SendApplicationModal`; kept email-only flow and simplified CTA labels accordingly.

### 4) Remove red "Application has required fields missing" prompt
- **Status:** Implemented
- **File:** `src/components/talent/TalentRecord.tsx`
- **Implementation:** Removed the red warning block in the Documents tab while keeping the broader yellow incomplete-app alerts and navigation prompts elsewhere.

### 5) Show who created each entry
- **Status:** Implemented
- **Files:** `src/types/talent.ts`, `src/components/talent/NewEntry.tsx`, `src/context/AppDataContext.tsx`, `src/constants/app-sections.ts`, `src/components/talent/TalentRecord.tsx`
- **Implementation:**
  - Added optional `created_by` to `Talent` type.
  - Manual entries now store `created_by: currentUser.id`.
  - Prospect-origin records (stub + `talentFromApp`) store `created_by: null`.
  - Talent Details now show `Created By` as either:
    - role/name format (for staff-created records), or
    - `Prospect` (for portal-created records).

### 6) One submitted application per email
- **Status:** Implemented
- **File:** `src/components/application/ProspectPortal.tsx`
- **Implementation:**
  - Added duplicate-submitted-email check when starting a new application.
  - Added duplicate-submitted-email check at final submit time in `ApplicationForm` (excluding current app ID).
  - Added user-facing validation messages when a duplicate submission is detected.

### 7) Score must be green before send-up
- **Status:** Implemented
- **File:** `src/components/talent/TalentRecord.tsx`
- **Implementation:**
  - Existing logic enforcement in `scoutSubmit()` remains in place.
  - Added visual gating by disabling `Submit Packet → Team 1 Review` when `jordan_score < 3.5`.
  - Added tooltip guidance on the disabled button.

### 8) Fix upload source attribution
- **Status:** Implemented
- **File:** `src/components/talent/TalentRecord.tsx`
- **Implementation:** Updated label from `Application Upload` to `Prospect Upload` for clarity while preserving current source-priority behavior (`Staff Upload` when staff file exists, otherwise prospect upload).

### 9) Holding Entry required fields (Full Name, Phone, Email, City, State)
- **Status:** Implemented
- **File:** `src/components/talent/NewEntry.tsx`
- **Implementation:**
  - Added fields to local form state: `phone`, `email`, `city`, `state`.
  - Manual creation now requires all five required fields before save.
  - `location` is now derived from `city` + `state`.
  - Updated manual and send-app entry forms to include the new inputs.

### 10) Add "Mark Lost" profile action
- **Status:** Implemented
- **File:** `src/components/talent/TalentRecord.tsx`
- **Implementation:**
  - Added `markLost()` action that moves talent to `not_viable` and logs `Marked Lost`.
  - Added `Mark Lost` button in scout holding-entry actions.
  - Added `Mark Lost` button in director executive-review actions.

## Already Covered Before Implementation

### Remove Talent Login on Employee Dash
- **Status:** Already true before this implementation.
- **Notes:** No talent-login section was present in the employee dashboard flow.

### Operations/Scouts can replace documents
- **Status:** Already true before this implementation.
- **Notes:** Existing `canUploadDocs` permission logic already allowed relevant roles to upload/replace docs.

### Auto-promote to pipeline when app is 100% complete
- **Status:** Already true before this implementation.
- **Notes:** Existing `saveApp` flow in `AppDataContext` already auto-upgraded/auto-imported complete submitted applications.

## Verification

- Ran lint diagnostics on all modified files.
- Result: no linter errors reported.
