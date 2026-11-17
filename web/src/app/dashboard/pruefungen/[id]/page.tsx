import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { AddParticipant, RemoveParticipantButton, ResultButtons } from "./ParticipantActions";

const TYPE_LABEL: Record<string, string> = {
    theory: "Theorieprüfung",
    practical: "Praktische Prüfung",
};

const TRAVEL_LABEL: Record<string, string> = {
    self: "Fährt selbst",
    with_fahrschule: "Mitfahrt",
};

const RESULT_LABEL: Record<string, string> = {
    pending: "Offen",
    passed: "Bestanden",
    failed: "Nicht bestanden",
    no_show: "Nicht erschienen",
};

function formatDate(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
}

function hhmm(t: string | null) {
    return t ? String(t).slice(0, 5) : "—";
}

function personName(p: any): string {
    if (!p) return "Unbekannt";
    return [p.first_name, p.last_name].filter(Boolean).join(" ") || "Ohne Namen";
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <div className="font-mono text-[11px] uppercase text-white/40">{label}</div>
            <div className="mt-0.5 text-sm">{value}</div>
        </div>
    );
}

export default async function PruefungDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: event } = await supabase
        .from("exam_events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    // Unknown or malformed id -> 404.
    if (!event) notFound();
        // German calendar date, so results can be entered from the exam day onward.
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
    const started = event.exam_date <= today;

    const { data: participantRows } = await supabase
        .from("exam_participants")
        .select("id, student_id, travel_choice, result")
        .eq("exam_event_id", id)
        .order("created_at", { ascending: true });
    const participants = participantRows ?? [];

    const { data: confirmed } = await supabase
        .from("student_records")
        .select("profile_id")
        .eq("registration_status", "confirmed")
        .eq("is_active", true);

    const takenIds = new Set(participants.map((p) => p.student_id));
    const candidateIds = (confirmed ?? [])
        .map((r) => r.profile_id as string)
        .filter((pid) => !takenIds.has(pid));

    const allIds = Array.from(new Set([...takenIds, ...candidateIds]));
    const { data: people } = allIds.length
        ? await supabase
            .from("profiles")
            .select("id, first_name, last_name,role")
            .in("id", allIds)
        : { data: [] as any[] };
    const byId = new Map((people ?? []).map((p: any) => [p.id, p]));

        const candidates = candidateIds
        .filter((pid) => byId.get(pid)?.role === "student")
        .map((pid) => ({ id: pid, name: personName(byId.get(pid)) }))
        .sort((a, b) => a.name.localeCompare(b.name, "de"));
        
    const rideCount = participants.filter((p) => p.travel_choice === "with_fahrschule").length;
    const openCount = participants.filter((p) => p.travel_choice === null && p.result === "pending").length;

    return (
        <div className="max-w-4xl">
            <Link
                href="/dashboard/pruefungen"
                className="font-mono text-xs uppercase text-white/40 hover:text-[#ff8800]"
            >
                ← Prüfungen
            </Link>

            <h1 className="mt-3 text-2xl font-semibold">{event.title}</h1>
            <p className="mt-1 text-sm text-white/50">
                {TYPE_LABEL[String(event.exam_type)] ?? String(event.exam_type)}
            </p>

            <section className="mt-6 rounded border border-white/10 bg-white/[0.02] p-5">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <Field
                        label="Datum"
                        value={`${formatDate(event.exam_date)}, ${hhmm(event.exam_time)} Uhr`}
                    />
                    <Field label="Prüfungsort" value={event.exam_location} />
                    <Field label="Treffpunkt" value={event.meeting_point ?? "—"} />
                    <Field label="Abfahrt vom Büro" value={event.departure_time ? `${hhmm(event.departure_time)} Uhr` : "—"} />
                    <div className="col-span-2">
                        <Field label="Hinweise" value={event.instructions ?? "—"} />
                    </div>
                </div>
            </section>

            <section className="mt-4 rounded border border-white/10 bg-white/[0.02] p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-sm font-medium">Teilnehmer</h2>
                    <span className="font-mono text-xs text-white/50">
                        {participants.length} Teilnehmer · {rideCount} Mitfahrer
                        {openCount > 0 ? ` · ${openCount} noch offen` : ""}
                    </span>
                </div>

                {participants.length === 0 ? (
                    <p className="mt-4 text-sm text-white/40">Noch keine Teilnehmer.</p>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="font-mono text-xs uppercase text-white/40">
                                <tr>
                                    <th className="py-2 pr-4">Fahrschüler</th>
                                    <th className="py-2 pr-4">Anreise</th>
                                    <th className="py-2 pr-4">Ergebnis</th>
                                    <th className="py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((p) => {
                                    const name = personName(byId.get(p.student_id));
                                    return (
                                        <tr key={p.id} className="border-t border-white/5">
                                            <td className="py-2 pr-4">{name}</td>
                                            <td className="py-2 pr-4 text-white/70">
                                                {p.travel_choice
                                                    ? TRAVEL_LABEL[String(p.travel_choice)]
                                                    : "noch offen"}
                                            </td>
                                            <td className="py-2 pr-4 font-mono text-xs text-white/70">
                                                {RESULT_LABEL[String(p.result)] ?? String(p.result)}
                                            </td>
                                            <td className="whitespace-nowrap py-2 text-right">
    {p.result === "pending" &&
        (started ? (
            <ResultButtons participantId={p.id} name={name} />
        ) : (
            <RemoveParticipantButton participantId={p.id} name={name} />
        ))}
</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 border-t border-white/10 pt-5">
                    <h3 className="mb-3 text-xs uppercase text-white/40">
                        Fahrschüler hinzufügen
                    </h3>
                    <AddParticipant eventId={id} candidates={candidates} />
                </div>
            </section>
        </div>
    );
}