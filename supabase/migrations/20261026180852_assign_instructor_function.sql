-- Office/Admin assigns a student to an instructor. Keeps assignment
-- history: the previous active row is deactivated, not deleted.
-- sync_assigned_instructor() then updates student_records automatically.

alter type audit_action add value if not exists 'instructor_assigned';


