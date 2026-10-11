import { createClient } from "@/lib/supabase/server";
import RegistrierungenTable, { type PendingRow } from "./RegistrierungenTable";

export default async function RegistrierungenPage() {
    const supabase = await createClient();

    const { data: records, error } = await supabase
        .from("student_records")
        .select("*")
        .not("registration_deadline", "is", null)
        .order("registration_deadline", { ascending: true });

    if (error) {
        return (
            <div className="font-mono text-sm text-red-400">
                Fehler beim Laden: {error.message}
            </div>
        );
    }

    const ids = (records ?? []).map((r: any) => r.profile_id);
    const { data: people } = ids.length
        ? await supabase.from("profiles").select("*").in("id", ids)
        : { data: [] as any[] };
    const byId = new Map((people ?? []).map((p: any) => [p.id, p]));

    const now = Date.now();
    const rows: PendingRow[] = (records ?? []).map((r: any) => {
        const p: any = byId.get(r.profile_id);
        const deadline = new Date(r.registration_deadline);
        return {
            profileId: r.profile_id,
            name: p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "—" : "—",
            phone: p?.phone ?? "—",
            status: String(r.registration_status),
            deadline: deadline.toLocaleDateString("de-DE"),
            daysLeft: Math.ceil((deadline.getTime() - now) / 86_400_000),
        };
    });

    return (
        <div>
            <h1 className="text-2xl font-semibold">Registrierungen</h1>
            <p className="mt-1 text-sm text-white/50">
                Ausstehende Selbstregistrierungen. Persönliche Bestätigung im Büro erforderlich.
            </p>
            <RegistrierungenTable rows={rows} />
        </div>
    );
}