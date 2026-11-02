import { createClient } from "@/lib/supabase/server";

const TYPE_LABEL: Record<string, string> = {
    theory: "Theorieprüfung",
    practical: "Praktische Prüfung",
};

type Event = {
    id: string;
    exam_type: string;
    title: string;
    exam_date: string;
    exam_time: string;
    exam_location: string;
    meeting_point: string | null;
    departure_time: string | null;
    instructions: string | null;
};

type Participant = {
    exam_event_id: string;
    travel_choice: string | null;
    result: string;
};

function formatDate(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
}

function hhmm(t: string | null) {
    return t ? String(t).slice(0, 5) : "—";
}

function countLine(list: Participant[]) {
    if (list.length === 0) return "Noch keine Teilnehmer";

    const ride = list.filter((p) => p.travel_choice === "with_fahrschule").length;
    const open = list.filter((p) => p.travel_choice === null).length;

    const parts = [
        `${list.length} ${list.length === 1 ? "Teilnehmer" : "Teilnehmer"}`,
        `${ride} ${ride === 1 ? "Mitfahrer" : "Mitfahrer"}`,
    ];
    if (open > 0) parts.push(`${open} noch offen`);
    return parts.join(" · ");
}

function EventTable({
    events,
    participants,
    empty,
}: {
    events: Event[];
    participants: Participant[];
    empty: string;
}) {
    return (
        <div className="overflow-x-auto rounded border border-white/10">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 font-mono text-xs uppercase text-white/40">
                    <tr>
                        <th className="px-4 py-3">Datum</th>
                        <th className="px-4 py-3">Prüfung</th>
                        <th className="px-4 py-3">Ort</th>
                        <th className="px-4 py-3">Treffpunkt</th>
                        <th className="px-4 py-3">Teilnehmer</th>
                    </tr>
                </thead>
                <tbody>
                    {events.length === 0 && (
                        <tr>
                            <td
                                colSpan={5}
                                className="px-4 py-10 text-center font-mono text-white/40"
                            >
                                {empty}
                            </td>
                        </tr>
                    )}
                    {events.map((e) => {
                        const mine = participants.filter((p) => p.exam_event_id === e.id);
                        return (
                            <tr
                                key={e.id}
                                className="border-b border-white/5 hover:bg-white/[0.03]"
                            >
                                <td className="whitespace-nowrap px-4 py-3 font-mono">
                                    {formatDate(e.exam_date)}
                                    <span className="block text-xs text-white/40">
                                        {hhmm(e.exam_time)} Uhr
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="block">{e.title}</span>
                                    <span className="block text-xs text-white/40">
                                        {TYPE_LABEL[e.exam_type] ?? e.exam_type}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{e.exam_location}</td>
                                <td className="px-4 py-3 text-white/70">
                                    {e.meeting_point ?? "—"}
                                    {e.departure_time && (
                                        <span className="block text-xs text-white/40">
                                            Abfahrt {hhmm(e.departure_time)} Uhr
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">{countLine(mine)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default async function PruefungenPage() {
    const supabase = await createClient();

    const { data: events, error } = await supabase
        .from("exam_events")
        .select(
            "id, exam_type, title, exam_date, exam_time, exam_location, meeting_point, departure_time, instructions"
        )
        .order("exam_date", { ascending: true })
        .order("exam_time", { ascending: true });

    if (error) {
        return (
            <div className="font-mono text-sm text-red-400">
                Fehler beim Laden: {error.message}
            </div>
        );
    }

    const { data: participants } = await supabase
        .from("exam_participants")
        .select("exam_event_id, travel_choice, result");

    // German calendar date, so a late-evening exam day isn't mixed up with UTC.
    const today = new Date().toLocaleDateString("sv-SE", {
        timeZone: "Europe/Berlin",
    });

    const all = (events ?? []) as Event[];
    const upcoming = all.filter((e) => e.exam_date >= today);
    const past = all
        .filter((e) => e.exam_date < today)
        .sort((a, b) => b.exam_date.localeCompare(a.exam_date));

    return (
        <div>
            <h1 className="text-2xl font-semibold">Prüfungen</h1>
            <p className="mt-1 text-sm text-white/50">
                Prüfungstermine mit Teilnehmern und Mitfahrern
            </p>

            <h2 className="mt-8 mb-3 text-sm font-medium text-white/70">
                Bevorstehend
            </h2>
            <EventTable
                events={upcoming}
                participants={(participants ?? []) as Participant[]}
                empty="Keine bevorstehenden Prüfungen"
            />

            <h2 className="mt-10 mb-3 text-sm font-medium text-white/70">
                Vergangen
            </h2>
            <EventTable
                events={past}
                participants={(participants ?? []) as Participant[]}
                empty="Keine vergangenen Prüfungen"
            />
        </div>
    );
}