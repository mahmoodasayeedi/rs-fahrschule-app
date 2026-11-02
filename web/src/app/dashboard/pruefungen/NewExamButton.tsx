"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EMPTY = {
    examType: "theory",
    title: "",
    date: "",
    time: "",
    location: "",
    meetingPoint: "",
    departure: "",
    instructions: "",
};

const inputClass =
    "mt-1 w-full rounded border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm outline-none focus:border-[#ff8800] [color-scheme:dark]";
const labelClass = "mt-4 block text-xs uppercase text-white/40";

export default function NewExamButton() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof typeof EMPTY>(key: K, value: string) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function close() {
        setOpen(false);
        setForm(EMPTY);
        setError(null);
    }

    // Close on Escape.
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") close();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    async function submit() {
        setError(null);

        if (!form.title.trim() || !form.date || !form.time || !form.location.trim()) {
            setError("Bitte Titel, Datum, Uhrzeit und Prüfungsort ausfüllen.");
            return;
        }
        if (form.departure && form.departure >= form.time) {
            setError("Die Abfahrtszeit muss vor der Prüfungszeit liegen.");
            return;
        }

        setBusy(true);
        const supabase = createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setBusy(false);
            setError("Sitzung abgelaufen. Bitte neu anmelden.");
            return;
        }

        const { error: insertError } = await supabase.from("exam_events").insert({
            exam_type: form.examType,
            title: form.title.trim(),
            exam_date: form.date,
            exam_time: form.time,
            exam_location: form.location.trim(),
            meeting_point: form.meetingPoint.trim() || null,
            departure_time: form.departure || null,
            instructions: form.instructions.trim() || null,
            created_by: user.id,
        });

        setBusy(false);

        if (insertError) {
            setError(insertError.message);
            return;
        }

        close();
        router.refresh();
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded bg-[#ff8800] px-4 py-2 text-sm font-medium text-black"
            >
                Neue Prüfung
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={close}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="new-exam-title"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border border-white/15 bg-[#0d0d0f] p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="new-exam-title" className="text-lg font-semibold">
                            Neue Prüfung anlegen
                        </h2>

                        <label className={labelClass}>Art</label>
                        <select
                            value={form.examType}
                            onChange={(e) => set("examType", e.target.value)}
                            className={inputClass}
                        >
                            <option value="theory">Theorieprüfung</option>
                            <option value="practical">Praktische Prüfung</option>
                        </select>

                        <label className={labelClass}>Titel</label>
                        <input
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            placeholder="z. B. Theorieprüfung Schwegenheim"
                            className={inputClass}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Datum</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => set("date", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Prüfungszeit</label>
                                <input
                                    type="time"
                                    value={form.time}
                                    onChange={(e) => set("time", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <label className={labelClass}>Prüfungsort</label>
                        <input
                            value={form.location}
                            onChange={(e) => set("location", e.target.value)}
                            className={inputClass}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Treffpunkt (optional)</label>
                                <input
                                    value={form.meetingPoint}
                                    onChange={(e) => set("meetingPoint", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Abfahrt vom Büro (optional)</label>
                                <input
                                    type="time"
                                    value={form.departure}
                                    onChange={(e) => set("departure", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <label className={labelClass}>Hinweise für Teilnehmer (optional)</label>
                        <textarea
                            value={form.instructions}
                            onChange={(e) => set("instructions", e.target.value)}
                            rows={3}
                            className={inputClass}
                        />

                        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={close}
                                className="rounded border border-white/15 px-4 py-2 text-sm text-white/70"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={busy}
                                className="rounded bg-[#ff8800] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
                            >
                                {busy ? "Speichern…" : "Prüfung anlegen"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}