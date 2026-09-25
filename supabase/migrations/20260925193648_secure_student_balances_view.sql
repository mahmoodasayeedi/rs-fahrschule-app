-- Make the view execute with the QUERYING user's permissions, not the
-- view owner's — closes a real RLS-bypass gap on the one dataset the
-- client is most explicit about (payment/balance info, student-facing: never).
alter view student_balances set (security_invoker = true);