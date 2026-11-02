"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Candidate = { id: string; name: string };

const OUTCOMES = [
    { key: "passed", label: "Bestanden" },
    { key: "failed", label: "Nicht bestanden" },
    { key: "no_show", label: "Nicht erschienen" },
];

export function AddParticipant({
    eventId,
    candidates,
}: {
    eventId: string;
    candidates: Candidate[];
}) {
    const router = useRouter();
    const [studentId, setStudentId] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function add() {
        if (!studentId) return;
        setBusy(true);
        setError(null);

        const supabase = createClient();
        const { error: insertError } = await supabase
            .from("exam_participants")
            .insert({ exam_event_id: eventId, student_id: studentId });

        setBusy(false);

        if (insertError) {
            setError(
                insertError.code === "23505"
                    ? "Dieser Fahrschüler ist bereits angemeldet."
                    : insertError.message
            );
            return;
        }

        setStudentId("");
        router.refresh();
    }

    if (candidates.length === 0) {
        return (
            <p className="text-sm text-white/40">
                Keine weiteren bestätigten Fahrschüler verfügbar.
            </p>
        );
    }

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="rounded border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm"
                >
                    <option value="">Fahrschüler wählen…</option>
                    {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={add}
                    disabled={!studentId || busy}
                    className="rounded bg-[#ff8800] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
                >
                    {busy ? "Speichern…" : "Hinzufügen"}
                </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
    );
}

export function RemoveParticipantButton({
    participantId,
    name,
}: {
    participantId: string;
    name: string;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function remove() {
        if (!window.confirm(`${name} von dieser Prüfung entfernen?`)) return;

        setBusy(true);
        setError(null);

        const supabase = createClient();
        const { error: deleteError } = await supabase
            .from("exam_participants")
            .delete()
            .eq("id", participantId);

        setBusy(false);

        if (deleteError) {
            setError(deleteError.message);
            return;
        }
        router.refresh();
    }

    return (
        <>
            <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-red-400 hover:text-red-400 disabled:opacity-40"
            >
                Entfernen
            </button>
            {error && <span className="ml-2 text-xs text-red-400">{error}</span>}
        </>
    );
}

export function ResultButtons({
    participantId,
    name,
}: {
    participantId: string;
    name: string;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function record(key: string, label: string) {
        if (
            !window.confirm(
                `${name}: „${label}“ eintragen? Das lässt sich hier nicht rückgängig machen.`
            )
        )
            return;

        setBusy(true);
        setError(null);

        const supabase = createClient();
        const { data, error: updateError } = await supabase
            .from("exam_participants")
            .update({ result: key })
            .eq("id", participantId)
            .eq("result", "pending")
            .select("id");

        setBusy(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }
        if (!data || data.length === 0) {
            setError("Das Ergebnis wurde bereits eingetragen.");
            router.refresh();
            return;
        }
        router.refresh();
    }

    return (
        <div className="flex flex-wrap justify-end gap-1">
            {OUTCOMES.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    onClick={() => record(o.key, o.label)}
                    disabled={busy}
                    className="rounded border border-white/15 px-2 py-1 text-xs text-white/70 hover:border-[#ff8800] hover:text-[#ff8800] disabled:opacity-40"
                >
                    {o.label}
                </button>
            ))}
            {error && <span className="w-full text-right text-xs text-red-400">{error}</span>}
        </div>
    );
}