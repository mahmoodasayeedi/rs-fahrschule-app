# Release Checklist – RS Fahrschule App

Work through the sections in order. Items marked **(client)** need information or accounts from RS Fahrschule.

## 1. Before anything goes live (content and data)

- [ ] Real prices in Finanzen (Admin) **(client)**
- [ ] Invoice header complete in `web/src/lib/company.ts`: owner confirmed, tax number / USt-IdNr., bank, IBAN, BIC, VAT wording, service-date wording **(client / tax advisor)**
- [ ] Invoice layout and numbering format approved by the tax advisor **(client)**
- [ ] Privacy policy (from `docs/DATENSCHUTZ_ENTWURF.md`) completed and legally reviewed **(client / lawyer)**
- [ ] Impressum and privacy policy linked in the app and on the web login **(client)**
- [ ] Retention rules and deletion process agreed **(client)**
- [ ] Answers to `docs/Fragen_Nachtrag_Kundengespraech.md` recorded in `ASSUMPTIONS.md`, with the code changed where an answer differs from the current assumption

## 2. Clean the database

- [ ] Delete all test data: test students and instructors (`example s`, Sarafraz Ghani, Areeba/Hans if not real), test appointments, notifications, exam events, payments
- [ ] Delete test invoices and reset numbering:
  ```sql
  delete from public.invoice_items;
  delete from public.invoices;
  delete from public.invoice_counters;
  ```
- [ ] Create the real Admin and Office accounts, then set roles; remove the test Büro account
- [ ] Confirm `business_config` values (24h cancellation, 14 registration days, legal minimums) with the client
- [ ] Decide: separate production Supabase project, or keep the current one after cleaning

## 3. Supabase production settings

- [ ] Custom SMTP sender (real domain, SPF/DKIM) **(client: domain)**
- [ ] Email confirmation ON; confirmation and password-reset email templates in German
- [ ] Password rules and leaked-password protection ON
- [ ] Site URL and redirect URLs set to the real addresses
- [ ] Backups enabled (daily); know how to restore
- [ ] Verify no function runs without a pinned `search_path` (query in the project notes)
- [ ] Re-test RLS with simulated roles after cleaning: student cannot read other students, payments, invoices, internal notes; instructor sees only assigned students and `training` notes
- [ ] `pg_cron` jobs present: `send-lesson-reminders`, `delete-expired-pending-registrations`

## 4. Web dashboard (Next.js)

- [ ] `npm run build` passes in `web/` (passes as of 17 Nov 2026)
- [ ] Deploy (for example Vercel); environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` only. **Never** the service-role key
- [ ] HTTPS only; custom subdomain (for example `buero.rs-fahrschule.de`)
- [ ] Test login with real Office and Admin accounts; a student account must be refused
- [ ] Print an invoice to PDF and check the layout

## 5. Android app (Expo)

- [ ] `npx tsc --noEmit` clean in `mobile/`
- [ ] App name, icon, splash, package name (for example `de.rsfahrschule.app`) set in `app.json`; light/dark theme decision (currently `userInterfaceStyle: light` with a dark UI)
- [ ] Production `.env` values set through EAS secrets, not committed
- [ ] Google Play developer account (one-time 25 USD), owned by the client **(client)**
- [ ] EAS build (`.aab`), internal test track first with a few real users
- [ ] Store listing: description (German), screenshots, privacy policy URL, data-safety form
- [ ] Optional later: Firebase + `expo-notifications` for push

## 6. Final tests with real accounts (all four roles)

- [ ] Student: register, wait for confirmation, request lesson, get alternative, choose, cancel > 24 h, cancel < 24 h refused, see reminders, exam travel choice
- [ ] Instructor: confirm, reject with reason, propose alternatives, close out lesson, add training note
- [ ] Office: confirm registration, assign instructor, reassign, propose alternatives, create exam, record payment, create and cancel invoice
- [ ] Admin: edit prices; Office cannot
- [ ] Overlapping confirmation is refused

## 7. After launch

- [ ] Monitor Supabase logs and auth errors for the first weeks
- [ ] Review who has Admin rights every quarter
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Keep `PROJECT_STATUS.md` and `ASSUMPTIONS.md` current
