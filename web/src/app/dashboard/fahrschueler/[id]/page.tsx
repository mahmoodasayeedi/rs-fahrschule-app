import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AssignInstructorButton from "./AssignInstructorButton";
import TheoryLessonsControl from "./TheoryLessonsControl";
const MIN_KEYS = [
    "theory_lessons_minimum_b",
    "uberland_lessons_minimum_b",
    "autobahn_lessons_minimum_b",
    "night_lessons_minimum_b",
];

const TRAINING_LABEL: Record<string, string> = {
    registered: "Angemeldet",
    theory_phase: "Theoriephase",
    practice_phase: "Praxisphase",
    ready_for_exam: "Prüfungsreif",
    licensed: "Führerschein erteilt",
    paused: "Pausiert",
    withdrawn: "Abgemeldet",
};

const REGISTRATION_LABEL: Record<string, string> = {
    pending: "Ausstehend",
    confirmed: "Bestätigt",
};

const LICENSE_LABEL: Record<string, string> = {
    B: "B – Auto",
    BE: "BE – Auto mit Anhänger",
    B197: "B197 – Automatik-Regelung",
    B196: "B196 – 125er",
    AM: "AM – Mofa/Roller",
    A1: "A1 – Leichtkraftrad",
    A2: "A2 – Motorrad",
};

const EXAM_LABEL: Record<string, string> = {
    not_scheduled: "Nicht angemeldet",
    scheduled: "Angemeldet",
    passed: "Bestanden",
    failed: "Nicht bestanden",
};

const APPOINTMENT_LABEL: Record<string, string> = {
    requested: "Angefragt",
    confirmed: "Bestätigt",
    rejected: "Abgelehnt",
    alternative_proposed: "Alternative vorgeschlagen",
    cancelled: "Storniert",
    completed: "Abgeschlossen",
    no_show: "Nicht erschienen",
};

const LESSON_LABEL: Record<string, string> = {
    normal: "Normal",
    uberland: "Überland",
    autobahn: "Autobahn",
    night: "Nacht",
    special: "Sonderfahrt",
};

function eur(n: number) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(n);
}

function personName(p: any): string {
    if (!p) return "—";
    return [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
}

function ProgressBar({
    label,
    value,
    min,
}: {
    label: string;
    value: number;
    min: number;
}) {
    const percent = min > 0 ? Math.min(100, Math.round((value / min) * 100)) : 0;
    const done = min > 0 && value >= min;

    return (
        <div>
            <div className="flex items-baseline justify-between">
                <span className="text-sm text-white/70">{label}</span>
                <span className="font-mono text-xs">
                    <span className={done ? "text-[#79d495]" : "text-white"}>
                        {value}
                    </span>
                    <span className="text-white/40"> / {min}</span>
                </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded bg-white/10">
                <div
                    className="h-full rounded"
                    style={{
                        width: `${percent}%`,
                        backgroundColor: done ? "#79d495" : "#ff8800",
                    }}
                />
            </div>
        </div>
    );
}

function Card({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded border border-white/10 bg-white/[0.02] p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-white/40">
                {title}
            </h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <div className="font-mono text-[11px] uppercase text-white/40">
                {label}
            </div>
            <div className="mt-0.5 text-sm">{value}</div>
        </div>
    );
}

export default async function FahrschuelerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    // Bad or non-student id -> 404.
    if (!profile || profile.role !== "student") notFound();

    const { data: record } = await supabase
        .from("student_records")
        .select("*")
        .eq("profile_id", id)
        .maybeSingle();

    const { data: progress } = await supabase
        .from("training_progress")
        .select("*")
        .eq("student_id", id)
        .maybeSingle();

    const { data: config } = await supabase
        .from("business_config")
        .select("key, value")
        .in("key", MIN_KEYS);
    const minByKey = new Map((config ?? []).map((c: any) => [c.key, Number(c.value)]));

    const { data: balance } = await supabase
        .from("student_balances")
        .select("*")
        .eq("student_id", id)
        .maybeSingle();

    const { data: appointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("student_id", id)
        .order("requested_date", { ascending: false })
        .order("requested_time", { ascending: false })
        .limit(10);

    const { data: instructor } = record?.assigned_instructor_id
        ? await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .eq("id", record.assigned_instructor_id)
            .maybeSingle()
        : { data: null };

    const name = personName(profile);
    const trainingStatus = record ? String(record.training_status) : "—";
    const registrationStatus = record ? String(record.registration_status) : "—";
    const licenseClass = record ? String(record.license_class) : "—";

    return (
        <div className="max-w-4xl">
            <Link
                href="/dashboard/fahrschueler"
                className="font-mono text-xs uppercase text-white/40 hover:text-[#ff8800]"
            >
                ← Fahrschüler
            </Link>

            <div className="mt-3 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{name}</h1>
                    <p className="mt-1 text-sm text-white/50">
                        Karteikarte und Ausbildungsstand
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span
                        className={`rounded px-2 py-0.5 font-mono text-xs ${registrationStatus === "pending"
                            ? "bg-[#ff8800]/15 text-[#ff8800]"
                            : "bg-white/10 text-white/70"
                            }`}
                    >
                        {REGISTRATION_LABEL[registrationStatus] ?? registrationStatus}
                    </span>
                    <span className="font-mono text-xs text-white/50">
                        {TRAINING_LABEL[trainingStatus] ?? trainingStatus}
                    </span>
                </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Card title="Karteikarte">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Telefon" value={profile.phone ?? "—"} />
                        <Field
                            label="Geburtsdatum"
                            value={
                                record?.date_of_birth
                                    ? new Date(record.date_of_birth).toLocaleDateString("de-DE")
                                    : "—"
                            }
                        />
                        <Field
                            label="Führerscheinklasse"
                            value={LICENSE_LABEL[licenseClass] ?? licenseClass}
                        />
                        <Field
                            label="Anmeldung"
                            value={
                                record?.registration_date
                                    ? new Date(record.registration_date).toLocaleDateString("de-DE")
                                    : "—"
                            }
                        />
                        <Field
    label="Fahrlehrer"
    value={
        <span className="flex items-center gap-3">
            <span>{instructor ? personName(instructor) : "—"}</span>
            <AssignInstructorButton
                studentId={id}
                currentInstructorId={record?.assigned_instructor_id ?? null}
            />
        </span>
    }
/>
                        <Field
                            label="Status"
                            value={record?.is_active ? "Aktiv" : "Inaktiv"}
                        />
                        <div className="col-span-2">
                            <Field label="Adresse" value={record?.address ?? "—"} />
                        </div>
                    </div>
                </Card>

                <Card title="Finanzen">
                    {balance ? (
                        <div className="space-y-3">
                            <Field label="In Rechnung gestellt" value={eur(Number(balance.total_invoiced))} />
                            <Field label="Bezahlt" value={eur(Number(balance.total_paid))} />
                            <div className="border-t border-white/10 pt-3">
                                <Field
                                    label="Offener Betrag"
                                    value={
                                        <span
                                            className={
                                                Number(balance.balance) > 0
                                                    ? "font-mono text-[#ff8800]"
                                                    : "font-mono text-[#79d495]"
                                            }
                                        >
                                            {eur(Number(balance.balance))}
                                        </span>
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-white/40">Keine Finanzdaten.</p>
                    )}
                </Card>

                <Card title="Prüfungen">
                    <div className="grid grid-cols-2 gap-4">
                        <Field
                            label="Theorieprüfung"
                            value={progress ? EXAM_LABEL[String(progress.theory_exam_status)] ?? String(progress.theory_exam_status) : "—"}
                        />
                        <Field
                            label="Praktische Prüfung"
                            value={progress ? EXAM_LABEL[String(progress.practical_exam_status)] ?? String(progress.practical_exam_status) : "—"}
                        />
                    </div>
                </Card>

                <Card title="Fahrstunden">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Praxisstunden" value={progress?.practical_lessons_count ?? 0} />
                        <Field label="Sonderfahrten" value={progress?.special_lessons_count ?? 0} />
                        <div className="col-span-2 text-xs text-white/40">
                            Sonderfahrten zählen zusätzlich zu Überland, Autobahn und Nacht.
                        </div>
                    </div>
                </Card>
            </div>

            <div className="mt-4">
                <Card title="Ausbildungsfortschritt (gesetzliche Mindestwerte Klasse B)">
                    <div className="space-y-5">
                        <ProgressBar
                            label="Theoriestunden"
                            value={progress?.theory_lessons_completed ?? 0}
                            min={minByKey.get("theory_lessons_minimum_b") ?? 0}
                        />
                        <TheoryLessonsControl
                            studentId={id}
                            current={progress?.theory_lessons_completed ?? 0}
                        />
                        <ProgressBar
                            label="Überlandfahrten"
                            value={progress?.uberland_lessons_count ?? 0}
                            min={minByKey.get("uberland_lessons_minimum_b") ?? 0}
                        />
                        <ProgressBar
                            label="Autobahnfahrten"
                            value={progress?.autobahn_lessons_count ?? 0}
                            min={minByKey.get("autobahn_lessons_minimum_b") ?? 0}
                        />
                        <ProgressBar
                            label="Nachtfahrten"
                            value={progress?.night_lessons_count ?? 0}
                            min={minByKey.get("night_lessons_minimum_b") ?? 0}
                        />
                    </div>
                </Card>
            </div>

            <div className="mt-4">
                <Card title="Letzte Termine">
                    {(appointments ?? []).length === 0 ? (
                        <p className="text-sm text-white/40">Keine Termine.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="font-mono text-xs uppercase text-white/40">
                                    <tr>
                                        <th className="py-2 pr-4">Datum</th>
                                        <th className="py-2 pr-4">Zeit</th>
                                        <th className="py-2 pr-4">Art</th>
                                        <th className="py-2 pr-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(appointments ?? []).map((a: any) => (
                                        <tr key={a.id} className="border-t border-white/5">
                                            <td className="py-2 pr-4 font-mono">{a.requested_date}</td>
                                            <td className="py-2 pr-4 font-mono">
                                                {String(a.requested_time).slice(0, 5)}
                                            </td>
                                            <td className="py-2 pr-4 text-white/70">
                                                {LESSON_LABEL[String(a.lesson_type)] ?? String(a.lesson_type)}
                                            </td>
                                            <td className="py-2 pr-4 font-mono text-xs text-white/70">
                                                {APPOINTMENT_LABEL[String(a.status)] ?? String(a.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
