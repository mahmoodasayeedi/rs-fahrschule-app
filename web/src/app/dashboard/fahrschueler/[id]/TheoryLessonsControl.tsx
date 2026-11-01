"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TheoryLessonsControl({
    studentId,
    current,
}: {
    studentId: string;
    current: number;
}) {
    const router = useRouter();
    const [value, setValue] = useState(current);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const changed = value !== current;

    async function save() {
        setBusy(true);
        setError("");

        const supabase = createClient();
        const { error: rpcError } = await supabase.rpc("set_theory_lessons", {
            p_student_id: studentId,
            p_count: value,
        });

        setBusy(false);

        if (rpcError) {
            setError(rpcError.message);
            return;
        }

        router.refresh();
    }

    return (
        <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-white/50">Theoriestunden anpassen</span>

            <button
                type="button"
                onClick={() => setValue((v) => Math.max(0, v - 1))}
                className="h-7 w-7 rounded border border-white/15 hover:border-[#ff8800]"
                aria-label="Eine Theoriestunde weniger"
            >
                −
            </button>

            <span className="w-8 text-center font-mono">{value}</span>

            <button
                type="button"
                onClick={() => setValue((v) => Math.min(99, v + 1))}
                className="h-7 w-7 rounded border border-white/15 hover:border-[#ff8800]"
                aria-label="Eine Theoriestunde mehr"
            >
                +
            </button>

            <button
                type="button"
                onClick={save}
                disabled={!changed || busy}
                className="rounded bg-[#ff8800] px-3 py-1 text-xs font-bold text-black disabled:opacity-40"
            >
                {busy ? "Speichern…" : "Speichern"}
            </button>

            {error && <span className="text-[#ff5c5c]">{error}</span>}
        </div>
    );
}