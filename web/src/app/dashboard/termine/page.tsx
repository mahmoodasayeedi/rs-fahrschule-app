import { createClient } from "@/lib/supabase/server";
import TermineTable, { type Row, type Instructor } from "./TermineTable";

function displayName(p: any): string {
    if (!p) return "—";
    return (
        p.full_name ||
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        p.email ||
        "—"
    );
}

export default async function TerminePage() {
    const supabase = await createClient();

    const { data: appts, error } = await supabase
        .from("appointments")
        .select("*")
        .order("requested_date", { ascending: true })
        .order("requested_time", { ascending: true });

    if (error) {
        return (
            <div className="font-mono text-sm text-red-400">
                Fehler beim Laden: {error.message}
            </div>
        );
    }

    const ids = Array.from(
        new Set((appts ?? []).flatMap((a) => [a.student_id, a.instructor_id]).filter(Boolean))
    );

    const { data: people } = ids.length
        ? await supabase.from("profiles").select("*").in("id", ids)
        : { data: [] as any[] };
    const byId = new Map((people ?? []).map((p: any) => [p.id, p]));

    const { data: instructorRows } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "instructor")
        .eq("is_active", true);

    const rows: Row[] = (appts ?? []).map((a) => ({
        id: a.id,
        status: String(a.status),
        date: a.requested_date,
        time: String(a.requested_time).slice(0, 5),
        duration: a.duration_minutes,
        lessonType: String(a.lesson_type),
        pickup: a.pickup_location,
        studentName: displayName(byId.get(a.student_id)),
        instructorId: a.instructor_id,
        instructorName: a.instructor_id ? displayName(byId.get(a.instructor_id)) : "—",
        studentNote: a.student_note,
    }));

    const instructors: Instructor[] = (instructorRows ?? []).map((p: any) => ({
        id: p.id,
        name: displayName(p),
    }));

    return (
        <div>
            <h1 className="text-2xl font-semibold">Termine</h1>
            <p className="mt-1 text-sm text-white/50">
                Alle Terminanfragen aller Fahrlehrer
            </p>
            <TermineTable rows={rows} instructors={instructors} />
        </div>
    );
}