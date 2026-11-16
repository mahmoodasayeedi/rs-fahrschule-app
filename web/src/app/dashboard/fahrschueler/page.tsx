import { createClient } from "@/lib/supabase/server";
import FahrschuelerTable, { type StudentRow } from "./FahrschuelerTable";


function personName(p: any): string {
    if (!p) return "—";
    return [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
}

export default async function FahrschuelerPage() {
    const supabase = await createClient();

    // Staff accounts also own a student_records row (they self-registered and
    // were promoted), so exclude everything that is not role = 'student'.
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

    if (error) {
        return (
            <div className="font-mono text-sm text-red-400">
                Fehler beim Laden: {error.message}
            </div>
        );
    }

    const ids = (profiles ?? []).map((p: any) => p.id);

    const { data: records } = ids.length
        ? await supabase.from("student_records").select("*").in("profile_id", ids)
        : { data: [] as any[] };
    const recordByStudent = new Map(
        (records ?? []).map((r: any) => [r.profile_id, r])
    );

    const { data: instructors } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("role", "instructor");
    const instructorById = new Map(
        (instructors ?? []).map((p: any) => [p.id, p])
    );

    const rows: StudentRow[] = (profiles ?? []).map((p: any) => {
        const r: any = recordByStudent.get(p.id);
        return {
            id: p.id,
            name: personName(p),
            phone: p.phone ?? "—",
            licenseClass: r ? String(r.license_class) : "—",
            trainingStatus: r ? String(r.training_status) : "—",
            registrationStatus: r ? String(r.registration_status) : "—",
            instructorName: r?.assigned_instructor_id
                ? personName(instructorById.get(r.assigned_instructor_id))
                : "—",
        };
    });

    return (
        <div>
            <h1 className="text-2xl font-semibold">Fahrschüler</h1>
            <p className="mt-1 text-sm text-white/50">
                Alle Fahrschüler. Karteikarte, Fortschritt und Kontostand öffnen.
            </p>
            <FahrschuelerTable rows={rows} />
        </div>
    );
}
