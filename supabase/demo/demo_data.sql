-- =====================================================================
-- DEMO-DATEN für die Kundenvorführung (RS Fahrschule)
-- KEINE Migration! Nur manuell im Supabase SQL Editor ausführen,
-- und NUR solange noch keine echten Produktivdaten existieren.
--
-- Was das Skript macht (alles in einer Transaktion: bei einem Fehler
-- wird nichts verändert):
--   1. löscht alle Test-Termine, Benachrichtigungen, Prüfungen,
--      Rechnungen, Zahlungen und Notizen
--   2. benennt die vorhandenen Testkonten in glaubwürdige Demo-Personen um
--   3. legt Fahrschüler-Akten, Ausbildungsfortschritt, Termine in allen
--      Status, Prüfungen, Notizen, Rechnungen und Zahlungen an
--   4. (optional, v_set_prices) setzt DEMO-Preise – NICHT die echten Preise!
--
-- Voraussetzung: Im Supabase-Dashboard (Authentication > Users >
-- Add user > Create new user, "Auto Confirm User" aktiv) existieren
-- diese drei Konten (gleiches Demo-Passwort ist okay):
--   sophie.wagner@example.com
--   jonas.hoffmann@example.com
--   emma.becker@example.com
-- =====================================================================

do $demo$
declare
  v_set_prices boolean := true;   -- false = vorhandene Preise nicht anfassen

  v_today date := (now() at time zone 'Europe/Berlin')::date;
  v_year  int  := extract(year from (now() at time zone 'Europe/Berlin'))::int;

  v_admin uuid := '733ecf66-4e54-4c90-bba2-6105c58c316c';
  v_hans  uuid := '58ec389a-1c60-4163-959d-6e2b7b350f77';  -- Fahrlehrer Hans Müller
  v_klaus uuid := '1d9c299d-12de-4efc-8abd-68ca15f2b40d';  -- bisher Areeba Ghani (Fahrlehrer)
  v_lena  uuid := 'cd0d4a23-a56a-4ca4-9245-46bc87d5cbb5';  -- bisher "example s"
  v_max   uuid := '02c87113-486f-4497-9f5c-0be41bfc4ac5';  -- bisher Sarafraz Ghani
  v_sophie uuid;
  v_jonas  uuid;
  v_emma   uuid;

  v_ev_past uuid; v_ev_theory uuid; v_ev_prac uuid;
  v_appt uuid; v_inv uuid;
  s_base uuid; s_normal uuid; s_uber uuid; s_auto uuid; s_night uuid; s_theo uuid; s_prac uuid;
  r record;
begin
  ---------------------------------------------------------------
  -- 0. Voraussetzungen prüfen
  ---------------------------------------------------------------
  select id into v_sophie from auth.users where email = 'sophie.wagner@example.com';
  select id into v_jonas  from auth.users where email = 'jonas.hoffmann@example.com';
  select id into v_emma   from auth.users where email = 'emma.becker@example.com';
  if v_sophie is null or v_jonas is null or v_emma is null then
    raise exception 'Mindestens eines der drei Demo-Konten (sophie.wagner / jonas.hoffmann / emma.becker @example.com) fehlt. Bitte zuerst im Dashboard anlegen.';
  end if;
  if not exists (select 1 from profiles where id = v_admin and role = 'admin') then
    raise exception 'Admin-Profil % nicht gefunden.', v_admin;
  end if;
  if (select count(*) from profiles where id in (v_hans, v_klaus) and role = 'instructor') <> 2 then
    raise exception 'Die beiden Fahrlehrer-Konten wurden nicht gefunden.';
  end if;
  if (select count(*) from profiles where id in (v_lena, v_max) and role = 'student') <> 2 then
    raise exception 'Die beiden bestehenden Fahrschüler-Konten wurden nicht gefunden.';
  end if;

  ---------------------------------------------------------------
  -- 1. Testdaten löschen
  ---------------------------------------------------------------
  delete from notifications where true;
  delete from alternative_proposals where true;
  delete from appointments where true;
  delete from exam_participants where true;
  delete from exam_events where true;
  delete from invoice_items where true;
  delete from invoices where true;
  delete from payments where true;
  delete from student_notes where true;
  delete from invoice_counters where true;
  delete from invoice_number_counters where true;
  delete from instructor_student_assignments where true;

  ---------------------------------------------------------------
  -- 2. Personen und Akten
  ---------------------------------------------------------------
  update profiles set first_name = 'Hans',  last_name = 'Müller',  phone = '+49 170 0000101', is_active = true where id = v_hans;
  update profiles set first_name = 'Klaus', last_name = 'Richter', phone = '+49 170 0000102', is_active = true where id = v_klaus;

  for r in
    select * from (values
      (v_lena,   'Lena',   'Fischer',  '+49 170 0000001', 'Musterstraße 12, 67229 Beispielstadt', date '2007-03-14', v_today - 100, 'practice_phase'::training_status, v_hans),
      (v_max,    'Max',    'Weber',    '+49 170 0000002', 'Beispielweg 5, 67229 Beispielstadt',   date '2006-11-02', v_today - 40,  'theory_phase',  v_klaus),
      (v_sophie, 'Sophie', 'Wagner',   '+49 170 0000003', 'Gartenstraße 8, 67229 Beispielstadt',  date '2006-07-21', v_today - 150, 'ready_for_exam', v_klaus),
      (v_jonas,  'Jonas',  'Hoffmann', '+49 170 0000004', 'Lindenallee 3, 67229 Beispielstadt',   date '2007-01-30', v_today - 3,   'registered',    v_hans),
      (v_emma,   'Emma',   'Becker',   '+49 170 0000005', 'Schulstraße 21, 67229 Beispielstadt',  date '2006-09-09', v_today - 55,  'theory_phase',  v_hans)
    ) as t(id, fn, ln, phone, addr, dob, reg, tstatus, instr)
  loop
    update profiles set first_name = r.fn, last_name = r.ln, phone = r.phone, is_active = true where id = r.id;

    update student_records
       set address = r.addr, date_of_birth = r.dob, license_class = 'B',
           registration_date = r.reg, registration_status = 'confirmed',
           registration_deadline = null, training_status = r.tstatus, is_active = true
     where profile_id = r.id;

    insert into instructor_student_assignments (instructor_id, student_id, is_active)
    values (r.instr, r.id, true);
  end loop;

  ---------------------------------------------------------------
  -- 3. Termine in allen Status
  ---------------------------------------------------------------
  insert into appointments
    (student_id, instructor_id, status, requested_date, requested_time, duration_minutes,
     pickup_location, end_location, lesson_type, cancellation_reason, student_facing_reason)
  values
    -- bestätigt (Zukunft)
    (v_jonas,  v_hans,  'confirmed', v_today + 1, '08:00', 45, 'Lindenallee 3',      null, 'normal',   null, null),
    (v_lena,   v_hans,  'confirmed', v_today + 1, '15:00', 90, 'Bahnhof',            null, 'normal',   null, null),
    (v_sophie, v_klaus, 'confirmed', v_today + 3, '19:30', 90, 'Gartenstraße 8',     null, 'night',    null, null),
    (v_lena,   v_hans,  'confirmed', v_today + 8, '10:00', 90, 'Bahnhof',            null, 'uberland', null, null),
    -- abgeschlossen (Vergangenheit)
    (v_lena,   v_hans,  'completed', v_today - 2, '10:00', 45, 'Bahnhof',            null, 'normal',   null, null),
    (v_lena,   v_hans,  'completed', v_today - 5, '14:00', 90, 'Bahnhof',            null, 'uberland', null, null),
    (v_sophie, v_klaus, 'completed', v_today - 3, '09:00', 90, 'Gartenstraße 8',     null, 'autobahn', null, null),
    (v_sophie, v_klaus, 'completed', v_today - 8, '15:00', 45, 'Gartenstraße 8',     null, 'normal',   null, null),
    -- nicht erschienen / kurzfristig abgesagt / rechtzeitig abgesagt
    (v_lena,   v_hans,  'no_show',   v_today - 7, '16:00', 45, 'Bahnhof',            null, 'normal',   'no_show',      null),
    (v_sophie, v_klaus, 'cancelled', v_today - 6, '11:00', 45, 'Gartenstraße 8',     null, 'normal',   'short_notice', null),
    (v_lena,   v_hans,  'cancelled', v_today + 3, '11:00', 45, 'Bahnhof',            null, 'normal',   'on_time',      null),
    -- vom Fahrlehrer abgesagt
    (v_sophie, v_klaus, 'cancelled', v_today + 2, '10:00', 45, 'Gartenstraße 8',     null, 'normal',   'instructor',
       'Der Fahrlehrer ist krankheitsbedingt verhindert. Bitte beantrage einen neuen Termin.'),
    -- abgelehnt
    (v_jonas,  v_hans,  'rejected',  v_today + 2, '12:00', 45, 'Lindenallee 3',      null, 'normal',   null,
       'An diesem Tag ist leider kein Fahrlehrer verfügbar. Bitte wähle einen anderen Termin.');

  -- angefragt (löst Benachrichtigungen an Büro/Admin aus)
  insert into appointments
    (student_id, instructor_id, status, requested_date, requested_time, duration_minutes,
     pickup_location, end_location, lesson_type)
  values
    (v_max,  v_klaus, 'requested', v_today + 4, '16:00', 45, 'Beispielweg 5', null, 'normal'),
    (v_lena, null,    'requested', v_today + 5, '17:00', 90, 'Bahnhof',       null, 'uberland');

  -- Alternativen vorgeschlagen
  insert into appointments
    (student_id, instructor_id, status, requested_date, requested_time, duration_minutes,
     pickup_location, end_location, lesson_type)
  values
    (v_emma, v_hans, 'alternative_proposed', v_today + 6, '16:00', 45, 'Schulstraße 21', null, 'normal')
  returning id into v_appt;

  insert into alternative_proposals (original_appointment_id, proposed_date, proposed_time, proposed_instructor_id)
  values (v_appt, v_today + 6, '17:00', v_hans),
         (v_appt, v_today + 7, '16:00', v_hans);

  -- Benachrichtigungen für die Schüler-Ansicht
  insert into notifications (recipient_id, type, title, body, related_appointment_id)
  select a.student_id, 'appointment_confirmed', 'Termin bestätigt',
         'Dein Termin am ' || to_char(a.requested_date, 'DD.MM.YYYY') || ' um ' || to_char(a.requested_time, 'HH24:MI') || ' Uhr wurde bestätigt.',
         a.id
    from appointments a
   where a.status = 'confirmed' and a.student_id in (v_lena, v_jonas, v_sophie) and a.requested_date > v_today;

  insert into notifications (recipient_id, type, title, body, related_appointment_id)
  select a.student_id, 'appointment_rejected', 'Terminanfrage abgelehnt', a.student_facing_reason, a.id
    from appointments a where a.status = 'rejected' and a.student_id = v_jonas;

  insert into notifications (recipient_id, type, title, body, related_appointment_id)
  values (v_emma, 'alternative_proposed', 'Alternativtermine vorgeschlagen',
          'Für deine Anfrage gibt es zwei Alternativen. Bitte wähle einen Termin in der App.', v_appt);

  insert into notifications (recipient_id, type, title, body, related_appointment_id)
  select a.student_id, 'appointment_changed', 'Termin abgesagt', a.student_facing_reason, a.id
    from appointments a where a.cancellation_reason = 'instructor' and a.student_id = v_sophie;

  ---------------------------------------------------------------
  -- 4. Prüfungen
  ---------------------------------------------------------------
  insert into exam_events (exam_type, title, exam_date, exam_time, exam_location, meeting_point, departure_time, instructions, created_by)
  values ('theory', 'Theorieprüfung Schwegenheim', v_today - 35, '08:30', 'Prüfstelle Schwegenheim', 'Fahrschule (Büro)', '07:45',
          'Bitte Personalausweis mitbringen.', v_admin)
  returning id into v_ev_past;

  insert into exam_events (exam_type, title, exam_date, exam_time, exam_location, meeting_point, departure_time, instructions, created_by)
  values ('theory', 'Theorieprüfung Schwegenheim', v_today + 9, '08:30', 'Prüfstelle Schwegenheim', 'Fahrschule (Büro)', '07:45',
          'Bitte Personalausweis mitbringen und pünktlich sein.', v_admin)
  returning id into v_ev_theory;

  insert into exam_events (exam_type, title, exam_date, exam_time, exam_location, meeting_point, departure_time, instructions, created_by)
  values ('practical', 'Praktische Prüfung', v_today + 14, '10:00', 'Prüfstelle laut Ladung', 'Fahrschule (Büro)', '09:00',
          'Bitte Personalausweis und Brille (falls nötig) mitbringen.', v_admin)
  returning id into v_ev_prac;

  insert into exam_participants (exam_event_id, student_id, travel_choice, result) values
    (v_ev_past,   v_lena,   'with_fahrschule', 'passed'),
    (v_ev_past,   v_sophie, 'self',            'passed'),
    (v_ev_theory, v_max,    'with_fahrschule', 'pending'),
    (v_ev_theory, v_emma,   'self',            'pending'),
    (v_ev_prac,   v_sophie, 'with_fahrschule', 'pending');

  ---------------------------------------------------------------
  -- 5. Interne Notizen
  ---------------------------------------------------------------
  insert into student_notes (student_id, author_id, category, content) values
    (v_lena,   v_hans,  'training',  'Spurwechsel und Schulterblick werden sicherer. Als Nächstes Überland und Autobahn vertiefen.'),
    (v_max,    v_admin, 'office',    'Wünscht Termine möglichst am Nachmittag.'),
    (v_sophie, v_admin, 'financial', 'Ratenzahlung vereinbart, zuletzt bar beglichen.'),
    (v_emma,   v_klaus, 'training',  'Theorie abgeschlossen, erste Fahrstunden sind geplant.');

  ---------------------------------------------------------------
  -- 6. Ausbildungsfortschritt (strukturierte Werte)
  ---------------------------------------------------------------
  for r in
    select * from (values
      (v_lena,   14, 'passed'::exam_status,        12, 3, 2, 1, 0, 'not_scheduled'::exam_status),
      (v_max,     8, 'scheduled',                   0, 0, 0, 0, 0, 'not_scheduled'),
      (v_sophie, 14, 'passed',                     22, 5, 4, 3, 0, 'scheduled'),
      (v_jonas,   0, 'not_scheduled',               0, 0, 0, 0, 0, 'not_scheduled'),
      (v_emma,   14, 'scheduled',                   0, 0, 0, 0, 0, 'not_scheduled')
    ) as t(sid, theory, theory_exam, prac, uber, auto, night, special, prac_exam)
  loop
    insert into training_progress
      (student_id, theory_lessons_completed, theory_exam_status, practical_lessons_count,
       uberland_lessons_count, autobahn_lessons_count, night_lessons_count,
       special_lessons_count, practical_exam_status, updated_at)
    values
      (r.sid, r.theory, r.theory_exam, r.prac, r.uber, r.auto, r.night, r.special, r.prac_exam, now())
    on conflict (student_id) do update set
      theory_lessons_completed = excluded.theory_lessons_completed,
      theory_exam_status       = excluded.theory_exam_status,
      practical_lessons_count  = excluded.practical_lessons_count,
      uberland_lessons_count   = excluded.uberland_lessons_count,
      autobahn_lessons_count   = excluded.autobahn_lessons_count,
      night_lessons_count      = excluded.night_lessons_count,
      special_lessons_count    = excluded.special_lessons_count,
      practical_exam_status    = excluded.practical_exam_status,
      updated_at               = now();
  end loop;

  ---------------------------------------------------------------
  -- 7. Preise (nur DEMO-Werte!) und Rechnungen/Zahlungen
  ---------------------------------------------------------------
  if v_set_prices then
    update services_pricing set default_price = 350.00 where service_code = 'base_fee';
    update services_pricing set default_price =  55.00 where service_code = 'normal_lesson';
    update services_pricing set default_price =  65.00 where service_code in ('special_lesson','uberland_lesson','autobahn_lesson','night_lesson');
    update services_pricing set default_price =  90.00 where service_code = 'theory_exam_fee';
    update services_pricing set default_price = 180.00 where service_code = 'practical_exam_fee';
  end if;

  select id into s_base   from services_pricing where service_code = 'base_fee'           and is_active order by updated_at desc limit 1;
  select id into s_normal from services_pricing where service_code = 'normal_lesson'      and is_active order by updated_at desc limit 1;
  select id into s_uber   from services_pricing where service_code = 'uberland_lesson'    and is_active order by updated_at desc limit 1;
  select id into s_auto   from services_pricing where service_code = 'autobahn_lesson'    and is_active order by updated_at desc limit 1;
  select id into s_night  from services_pricing where service_code = 'night_lesson'       and is_active order by updated_at desc limit 1;
  select id into s_theo   from services_pricing where service_code = 'theory_exam_fee'    and is_active order by updated_at desc limit 1;
  if s_base is null or s_normal is null or s_uber is null or s_auto is null or s_night is null or s_theo is null then
    raise exception 'Mindestens eine aktive Leistung fehlt in services_pricing (base_fee, normal_lesson, uberland_lesson, autobahn_lesson, night_lesson, theory_exam_fee).';
  end if;

  -- Lena: 1.400 EUR, 1.000 EUR bezahlt
  insert into invoices (student_id, invoice_number, issue_date, status, created_by)
  values (v_lena, v_year::text || '-0001', v_today - 60, 'partially_paid', v_admin) returning id into v_inv;
  insert into invoice_items (invoice_id, service_id, description, quantity, unit_price)
  select v_inv, s.id, s.label, x.q, s.default_price
    from (values (s_base, 1), (s_normal, 12), (s_uber, 3), (s_auto, 2), (s_night, 1)) as x(sid, q)
    join services_pricing s on s.id = x.sid;

  -- Sophie: 2.430 EUR, komplett bezahlt
  insert into invoices (student_id, invoice_number, issue_date, status, created_by)
  values (v_sophie, v_year::text || '-0002', v_today - 90, 'paid', v_admin) returning id into v_inv;
  insert into invoice_items (invoice_id, service_id, description, quantity, unit_price)
  select v_inv, s.id, s.label, x.q, s.default_price
    from (values (s_base, 1), (s_normal, 22), (s_uber, 5), (s_auto, 4), (s_night, 3), (s_theo, 1)) as x(sid, q)
    join services_pricing s on s.id = x.sid;

  -- Max: nur Grundbetrag, teilweise offen
  insert into invoices (student_id, invoice_number, issue_date, status, created_by)
  values (v_max, v_year::text || '-0003', v_today - 38, 'issued', v_admin) returning id into v_inv;
  insert into invoice_items (invoice_id, service_id, description, quantity, unit_price)
  select v_inv, s.id, s.label, x.q, s.default_price
    from (values (s_base, 1)) as x(sid, q) join services_pricing s on s.id = x.sid;

  -- Emma: Grundbetrag + Theorieprüfung, bezahlt
  insert into invoices (student_id, invoice_number, issue_date, status, created_by)
  values (v_emma, v_year::text || '-0004', v_today - 50, 'paid', v_admin) returning id into v_inv;
  insert into invoice_items (invoice_id, service_id, description, quantity, unit_price)
  select v_inv, s.id, s.label, x.q, s.default_price
    from (values (s_base, 1), (s_theo, 1)) as x(sid, q) join services_pricing s on s.id = x.sid;

  insert into invoice_counters (year, last_number) values (v_year, 4);

  insert into payments (student_id, amount, payment_date, payment_method, internal_remarks, recorded_by) values
    (v_lena,   600.00, v_today - 58, 'bank_transfer', 'Anzahlung',                 v_admin),
    (v_lena,   400.00, v_today - 20, 'cash',          'Teilzahlung',               v_admin),
    (v_sophie, 1500.00, v_today - 85, 'bank_transfer', 'Überweisung',              v_admin),
    (v_sophie,  930.00, v_today - 30, 'cash',          'Restbetrag bar',           v_admin),
    (v_max,     150.00, v_today - 36, 'cash',          'Anzahlung',                v_admin),
    (v_emma,    440.00, v_today - 48, 'card',          'Kartenzahlung im Büro',    v_admin);

  raise notice 'Demo-Daten wurden angelegt.';
end
$demo$;

-- Kontrolle: Wer ist wer? (Konten zum Anmelden)
select p.role, p.first_name, p.last_name, u.email
from profiles p join auth.users u on u.id = p.id
where p.is_active
order by p.role, p.last_name;
