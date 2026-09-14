# Open Questions & Current Assumptions

Status: DRAFT — pending client confirmation from RS Fahrschule
Last updated: 2026-09-11

Each item below is a decision made WITHOUT explicit client confirmation.
When RS Fahrschule answers, update this file AND the linked code/schema in the same commit.

---

## 1. Instructor appointment confirmation authority
**Question:** Can instructors confirm/reject/modify appointments themselves, or only Office has final say?
**Current assumption:** Instructors CAN confirm/reject/modify appointments for their own assigned students. Office and Admin can do so for anyone.
**Affects:** RLS policy on `appointments` table (UPDATE permission for instructor role).

## 2. Internal notes visibility to instructors
**Question:** Do instructors see all internal notes on their assigned students, or a filtered subset (e.g. excluding payment remarks)?
**Current assumption:** Instructors see notes tagged `training`-related only. Notes tagged `financial` or `office` are Office/Admin only.
**Affects:** `student_notes` table — will need a `visibility` or `category` column.

## 3. Student profile edit rights
**Question:** Can students edit their own profile (phone/email/address) directly, or is it office-managed with a "request change" flow?
**Current assumption:** Students can edit phone/email directly. Address/name changes go through a "request change" flow reviewed by Office.
**Affects:** RLS UPDATE policy on `student_records`, and whether we need a `profile_change_requests` table in MVP.

## 4. Data retention policy
**Question:** How long is a former/inactive student's data kept? (GDPR — needs legal input, not just our decision.)
**Current assumption:** No automated deletion in MVP. Data is retained indefinitely until RS Fahrschule provides a written retention policy. Manual deletion by Admin only.
**Affects:** No cron/deletion job in MVP. Flagged as a compliance gap RS Fahrschule must resolve before go-live.

## 5. App UI language(s) for MVP
**Question:** What language(s) should the app itself use? (Theory exam is offered in 13 languages per rs-fahrschule.de, but that's for the official exam, not necessarily this app.)
**Current assumption:** German only for MVP. Localization architecture (i18n-ready strings) is built in from day one so additional languages can be added later without refactoring, but no second language ships at MVP.
**Affects:** All user-facing string handling — use a translation-key system, not hardcoded German strings.

## 6. Document visibility to students
**Question:** Are uploaded documents (Dokumente in the Karteikarte) visible to the student who owns them, or internal-only?
**Current assumption:** Not applicable yet — document upload is a POSTPONED feature (Phase 13+ per PDF section 13), not in MVP. Will be decided before that phase starts.

## 7. Special lesson sub-types
**Question:** Are Überland, Autobahn, and Nachtfahrten the only "Sonderfahrten" sub-types needed for MVP progress tracking?
**Current assumption:** Yes — only those three, matching what's explicitly named in the PDF (section 3).
**Affects:** `training_progress` table's lesson-type enum.

## 8. 24-hour rule configuration
**Question:** Is the 24h cancellation cutoff measured from lesson start time, fixed platform-wide, or could it vary per lesson type in future?
**Current assumption:** Measured from lesson start time. Stored as a single configurable value (not hardcoded), so RS Fahrschule (Admin role) could change it later without a code deploy — but only one global value in MVP, not per-lesson-type.
**Affects:** A `business_config` table with a `cancellation_window_hours` value, read by both frontend and RLS/server logic.

---

## How to use this file
- New assumption discovered mid-build? Add it here immediately, don't just code around it silently.
- Client answers a question? Move it to a "RESOLVED" section below with the date and source (email/call/etc.), and update the linked code in the same PR/commit.


Update ASSUMPTIONS.md — log that we corrected the region assumption from Ireland to Frankfurt, with today's date, so this is documented rather than just fixed silentl