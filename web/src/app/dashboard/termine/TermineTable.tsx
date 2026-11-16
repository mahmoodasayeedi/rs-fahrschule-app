"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type Row = {
    id: string;
    status: string;
    date: string;
    time: string;
    duration: number;
    lessonType: string;
    pickup: string;
    studentName: string;
    instructorId: string | null;
    instructorName: string;
    studentNote: string | null;
};
export type Instructor = { id: string; name: string };

const STATUS_LABEL: Record<string, string> = {
    requested: "Angefragt",
    confirmed: "Bestätigt",
    rejected: "Abgelehnt",
    alternative_proposed: "Alternative vorgeschlagen",
    cancelled: "Storniert",
    completed: "Abgeschlossen",
    no_show: "Nicht erschienen",
};
const REASSIGNABLE = ["requested", "confirmed"];
const OUTCOMES = [
    { key: "completed", label: "Durchgeführt", hint: "Zählt für den Ausbildungsfortschritt." },
    { key: "no_show", label: "Nicht erschienen", hint: "Zählt nicht als Fahrstunde." },
    { key: "excused", label: "Entschuldigt", hint: "Wird als entschuldigte Stornierung erfasst und zählt nicht als Fahrstunde." },
];

// Same rule the database enforces: only lessons that already started can be closed.
function hasStarted(r: Row) {
    return new Date(`${r.date}T${r.time.slice(0, 5)}`) <= new Date();
}
const FILTERS = [
    { key: "all", label: "Alle" },
    { key: "requested", label: "Angefragt" },
    { key: "confirmed", label: "Bestätigt" },
    { key: "alternative_proposed", label: "Alternative" },
    { key: "cancelled", label: "Storniert" },
    { key: "completed", label: "Abgeschlossen" },
];

export default function TermineTable({
    rows,
    instructors,
}: {
    rows: Row[];
    instructors: Instructor[];
}) {
    const router = useRouter();
    const [filter, setFilter] = useState("requested");
    const [target, setTarget] = useState<Row | null>(null);
    const [newInstructor, setNewInstructor] = useState("");
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [closeTarget, setCloseTarget] = useState<Row | null>(null);
    const [outcome, setOutcome] = useState("");
    const [closeBusy, setCloseBusy] = useState(false);
    const [closeError, setCloseError] = useState<string | null>(null);
    const [rejectTarget, setRejectTarget] = useState<Row | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [decideBusy, setDecideBusy] = useState(false);
    const [decideError, setDecideError] = useState<string | null>(null);

    const visible = useMemo(() => {
        const list = filter === "all" ? rows : rows.filter((r) => r.status === filter);
        return [...list].sort((a, b) => {
            const pa = a.status === "requested" ? 0 : 1;
            const pb = b.status === "requested" ? 0 : 1;
            if (pa !== pb) return pa - pb;
            return (a.date + a.time).localeCompare(b.date + b.time);
        });
    }, [rows, filter]);

    function open(r: Row) {
        setTarget(r);
        setNewInstructor("");
        setReason("");
        setError(null);
    }

    async function submit() {
        if (!target || !newInstructor) return;
        setBusy(true);
        setError(null);
        const supabase = createClient();
        const { error } = await supabase.rpc("reassign_appointment", {
            p_appointment_id: target.id,
            p_new_instructor_id: newInstructor,
            p_reason: reason || null,
        });
        setBusy(false);
        if (error) {
            setError(error.message);
            return;
        }
        setTarget(null);
        router.refresh();
    }
        function openClose(r: Row) {
        setCloseTarget(r);
        setOutcome("");
        setCloseError(null);
    }

    async function submitClose() {
        if (!closeTarget || !outcome) return;
        setCloseBusy(true);
        setCloseError(null);
        const supabase = createClient();
        const { error } = await supabase.rpc("finish_appointment", {
            p_appointment_id: closeTarget.id,
            p_outcome: outcome,
        });
        setCloseBusy(false);
        if (error) {
            setCloseError(error.message);
            return;
        }
        setCloseTarget(null);
        router.refresh();
    }
    async function confirmRequest(r: Row) {
        if (!r.instructorId) {
            setDecideError("Bitte zuerst einen Fahrlehrer zuweisen.");
            return;
        }
        if (!window.confirm(`${r.studentName}, ${r.date} ${r.time}: Termin bestätigen?`)) return;

        setDecideBusy(true);
        setDecideError(null);
        const supabase = createClient();
        const { data, error } = await supabase
            .from("appointments")
            .update({ status: "confirmed" })
            .eq("id", r.id)
            .eq("status", "requested")
            .select("id");
        setDecideBusy(false);

        if (error) {
            setDecideError(error.message);
            return;
        }
        if (!data || data.length === 0) {
            setDecideError("Diese Anfrage wurde bereits bearbeitet.");
        }
        router.refresh();
    }

    async function submitReject() {
        if (!rejectTarget) return;
        setDecideBusy(true);
        setDecideError(null);
        const supabase = createClient();
        const { data, error } = await supabase
            .from("appointments")
            .update({
                status: "rejected",
                student_facing_reason: rejectReason.trim() || null,
            })
            .eq("id", rejectTarget.id)
            .eq("status", "requested")
            .select("id");
        setDecideBusy(false);

        if (error) {
            setDecideError(error.message);
            return;
        }
        if (!data || data.length === 0) {
            setDecideError("Diese Anfrage wurde bereits bearbeitet.");
        }
        setRejectTarget(null);
        setRejectReason("");
        router.refresh();
    }
    return (
        <>
            <div className="mt-6 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`rounded border px-3 py-1.5 text-sm transition-colors ${filter === f.key
                            ? "border-[#ff8800] bg-[#ff8800]/10 text-[#ff8800]"
                            : "border-white/15 text-white/60 hover:text-white"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
                {decideError && <p className="mt-4 text-sm text-red-400">{decideError}</p>}
            <div className="mt-4 overflow-x-auto rounded border border-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 font-mono text-xs uppercase text-white/40">
                        <tr>
                            <th className="px-4 py-3">Datum</th>
                            <th className="px-4 py-3">Zeit</th>
                            <th className="px-4 py-3">Fahrschüler</th>
                            <th className="px-4 py-3">Fahrlehrer</th>
                            <th className="px-4 py-3">Art</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center font-mono text-white/40">
                                    Keine Termine
                                </td>
                            </tr>
                        )}
                        {visible.map((r) => (
                            <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                <td className="px-4 py-3 font-mono">{r.date}</td>
                                <td className="px-4 py-3 font-mono">
                                    {r.time} <span className="text-white/40">({r.duration} min)</span>
                                </td>
                                <td className="px-4 py-3">{r.studentName}</td>
                                <td className="px-4 py-3">{r.instructorName}</td>
                                <td className="px-4 py-3 text-white/70">{r.lessonType}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded px-2 py-0.5 font-mono text-xs ${r.status === "requested"
                                            ? "bg-[#ff8800]/15 text-[#ff8800]"
                                            : "bg-white/10 text-white/70"
                                            }`}
                                    >
                                        {STATUS_LABEL[r.status] ?? r.status}
                                    </span>
                                </td>
                                                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        {r.status === "requested" && (
    <>
        <button
            onClick={() => confirmRequest(r)}
            disabled={decideBusy}
            className="rounded bg-[#ff8800] px-3 py-1 text-xs font-medium text-black disabled:opacity-40"
        >
            Bestätigen
        </button>
        <button
            onClick={() => {
                setRejectTarget(r);
                setRejectReason("");
                setDecideError(null);
            }}
            disabled={decideBusy}
            className="rounded border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-red-400 hover:text-red-400 disabled:opacity-40"
        >
            Ablehnen
        </button>
    </>
)}

                                        {r.status === "confirmed" && hasStarted(r) && (
                                            <button
                                                onClick={() => openClose(r)}
                                                className="rounded border border-[#ff8800]/60 px-3 py-1 text-xs text-[#ff8800] hover:bg-[#ff8800]/10"
                                            >
                                                Abschluss
                                            </button>
                                        )}
                                        {REASSIGNABLE.includes(r.status) && (
                                            <button
                                                onClick={() => open(r)}
                                                className="rounded border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-[#ff8800] hover:text-[#ff8800]"
                                            >
                                                Neu zuweisen
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {target && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded border border-white/15 bg-[#0d0d0f] p-6">
                        <h2 className="text-lg font-semibold">Termin neu zuweisen</h2>
                        <p className="mt-1 text-sm text-white/50">
                            {target.studentName} · {target.date} · {target.time}
                        </p>

                        <label className="mt-5 block text-xs uppercase text-white/40">
                            Neuer Fahrlehrer
                        </label>
                        <select
                            value={newInstructor}
                            onChange={(e) => setNewInstructor(e.target.value)}
                            className="mt-1 w-full rounded border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm"
                        >
                            <option value="">Bitte wählen…</option>
                            {instructors
                                .filter((i) => i.id !== target.instructorId)
                                .map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.name}
                                    </option>
                                ))}
                        </select>

                        <label className="mt-4 block text-xs uppercase text-white/40">
                            Grund (intern, optional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                            className="mt-1 w-full rounded border border-white/15 bg-transparent px-3 py-2 text-sm"
                        />

                        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setTarget(null)}
                                className="rounded border border-white/15 px-4 py-2 text-sm text-white/70"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={submit}
                                disabled={!newInstructor || busy}
                                className="rounded bg-[#ff8800] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
                            >
                                {busy ? "Speichern…" : "Zuweisen"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
                        {closeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded border border-white/15 bg-[#0d0d0f] p-6">
                        <h2 className="text-lg font-semibold">Fahrstunde abschließen</h2>
                        <p className="mt-1 text-sm text-white/50">
                            {closeTarget.studentName} · {closeTarget.date} · {closeTarget.time}
                        </p>

                        <div className="mt-5 space-y-2">
                            {OUTCOMES.map((o) => (
                                <label
                                    key={o.key}
                                    className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2 text-sm ${outcome === o.key
                                        ? "border-[#ff8800] bg-[#ff8800]/10"
                                        : "border-white/15 hover:border-white/30"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="outcome"
                                        value={o.key}
                                        checked={outcome === o.key}
                                        onChange={() => setOutcome(o.key)}
                                        className="mt-1 accent-[#ff8800]"
                                    />
                                    <span>
                                        <span className="block font-medium">{o.label}</span>
                                        <span className="block text-xs text-white/50">{o.hint}</span>
                                    </span>
                                </label>
                            ))}
                        </div>

                        <p className="mt-4 text-xs text-white/40">
                            Das lässt sich hier nicht rückgängig machen.
                        </p>

                        {closeError && <p className="mt-3 text-sm text-red-400">{closeError}</p>}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setCloseTarget(null)}
                                className="rounded border border-white/15 px-4 py-2 text-sm text-white/70"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={submitClose}
                                disabled={!outcome || closeBusy}
                                className="rounded bg-[#ff8800] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
                            >
                                {closeBusy ? "Speichern…" : "Abschließen"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {rejectTarget && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md rounded border border-white/15 bg-[#0d0d0f] p-6">
            <h2 className="text-lg font-semibold">Anfrage ablehnen</h2>
            <p className="mt-1 text-sm text-white/50">
                {rejectTarget.studentName} · {rejectTarget.date} · {rejectTarget.time}
            </p>

            <label className="mt-5 block text-xs uppercase text-white/40">
                Begründung (sieht der Fahrschüler, optional)
            </label>
            <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="z. B. Termin bereits vergeben"
                className="mt-1 w-full rounded border border-white/15 bg-transparent px-3 py-2 text-sm"
            />

            <div className="mt-6 flex justify-end gap-2">
                <button
                    onClick={() => setRejectTarget(null)}
                    className="rounded border border-white/15 px-4 py-2 text-sm text-white/70"
                >
                    Abbrechen
                </button>
                <button
                    onClick={submitReject}
                    disabled={decideBusy}
                    className="rounded bg-[#ff8800] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
                >
                    {decideBusy ? "Speichern…" : "Ablehnen"}
                </button>
            </div>
        </div>
    </div>
)}
        </>
    );
}