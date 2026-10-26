"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Instructor = { id: string; name: string };

export default function AssignInstructorButton({
    studentId,
    currentInstructorId,
}: {
    studentId: string;
    currentInstructorId: string | null;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Load active instructors when the dialog opens.
    useEffect(() => {
        if (!open) return;
        let active = true;

        async function load() {
            const supabase = createClient();
            const { data } = await supabase
                .from("profiles")
                .select("id, first_name, last_name")
                .eq("role", "instructor")
                .eq("is_active", true)
                .order("last_name");

            if (!active || !data) return;
            setInstructors(
                data.map((i) => ({
                    id: i.id,
                    name: `${i.first_name} ${i.last_name}`.trim() || "Ohne Namen",
                }))
            );
        }

        load();
        return () => {
            active = false;
        };
    }, [open]);

    // Close on Escape.
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") close();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    function close() {
        setOpen(false);
        setSelectedId("");
        setReason("");
        setError("");
    }

    async function submit() {
        if (!selectedId) {
            setError("Bitte einen Fahrlehrer auswählen.");
            return;
        }

        setSaving(true);
        setError("");

        const supabase = createClient();
        const { error: rpcError } = await supabase.rpc("assign_instructor", {
            p_student_id: studentId,
            p_instructor_id: selectedId,
            p_reason: reason.trim() || null,
        });

        setSaving(false);

        if (rpcError) {
            setError(rpcError.message);
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
                className="rounded border border-white/15 px-2 py-1 text-xs hover:border-[#ff8800] hover:text-[#ff8800]"
            >
                {currentInstructorId ? "Ändern" : "Zuweisen"}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={close}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="assign-title"
                        className="w-full max-w-md rounded border border-white/10 bg-[#171719] p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="assign-title" className="text-lg font-bold">
                            Fahrlehrer zuweisen
                        </h2>
                        <p className="mt-1 text-sm text-white/50">
                            Der Fahrlehrer erhält Zugriff auf Karteikarte und
                            Ausbildungsstand dieses Fahrschülers.
                        </p>

                        <div className="mt-5 space-y-2">
                            {instructors.length === 0 ? (
                                <p className="text-sm text-white/50">
                                    Keine aktiven Fahrlehrer gefunden.
                                </p>
                            ) : (
                                instructors.map((i) => (
                                    <label
                                        key={i.id}
                                        className="flex cursor-pointer items-center gap-3 rounded border border-white/10 px-3 py-2 text-sm hover:border-white/30"
                                    >
                                        <input
                                            type="radio"
                                            name="instructor"
                                            value={i.id}
                                            checked={selectedId === i.id}
                                            onChange={() => setSelectedId(i.id)}
                                            className="accent-[#ff8800]"
                                        />
                                        <span>{i.name}</span>
                                        {i.id === currentInstructorId && (
                                            <span className="ml-auto font-mono text-[11px] text-white/40">
                                                aktuell
                                            </span>
                                        )}
                                    </label>
                                ))
                            )}
                        </div>

                        <label className="mt-5 block text-sm text-white/70">
                            Grund (optional)
                        </label>
                        <input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1 w-full rounded border border-white/10 bg-[#0d0d0f] px-3 py-2 text-sm outline-none focus:border-[#ff8800]"
                        />

                        {error && (
                            <p className="mt-4 text-sm text-[#ff5c5c]">{error}</p>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={close}
                                className="rounded border border-white/15 px-4 py-2 text-sm"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={saving}
                                className="rounded bg-[#ff8800] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                            >
                                {saving ? "Wird gespeichert…" : "Zuweisen"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}