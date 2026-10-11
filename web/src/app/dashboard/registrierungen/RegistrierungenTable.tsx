"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type PendingRow = {
    profileId: string;
    name: string;
    phone: string;
    status: string;
    deadline: string;
    daysLeft: number;
};

function Countdown({ days }: { days: number }) {
    if (days < 0)
        return <span className="font-mono text-red-400">überfällig ({-days} T.)</span>;
    const urgent = days <= 3;
    return (
        <span className={`font-mono ${urgent ? "text-[#ff8800]" : "text-white/70"}`}>
            {days === 0 ? "heute" : `${days} T.`}
        </span>
    );
}

export default function RegistrierungenTable({ rows }: { rows: PendingRow[] }) {
    const router = useRouter();
    const [confirming, setConfirming] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function confirm(id: string) {
        setBusy(true);
        setError(null);
        const supabase = createClient();
        const { error } = await supabase.rpc("confirm_student_registration", {
            student: id,
        });
        setBusy(false);
        if (error) {
            setError(error.message);
            return;
        }
        setConfirming(null);
        router.refresh();
    }

    return (
        <>
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            <div className="mt-6 overflow-x-auto rounded border border-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 font-mono text-xs uppercase text-white/40">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Telefon</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Frist</th>
                            <th className="px-4 py-3">Verbleibend</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center font-mono text-white/40">
                                    Keine ausstehenden Registrierungen
                                </td>
                            </tr>
                        )}
                        {rows.map((r) => (
                            <tr key={r.profileId} className="border-b border-white/5 hover:bg-white/[0.03]">
                                <td className="px-4 py-3">{r.name}</td>
                                <td className="px-4 py-3 font-mono">{r.phone}</td>
                                <td className="px-4 py-3 font-mono text-xs text-white/60">{r.status}</td>
                                <td className="px-4 py-3 font-mono">{r.deadline}</td>
                                <td className="px-4 py-3">
                                    <Countdown days={r.daysLeft} />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {confirming === r.profileId ? (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="text-xs text-white/50">Persönlich geprüft?</span>
                                            <button
                                                onClick={() => confirm(r.profileId)}
                                                disabled={busy}
                                                className="rounded bg-[#ff8800] px-3 py-1 text-xs font-medium text-black disabled:opacity-40"
                                            >
                                                {busy ? "…" : "Ja, bestätigen"}
                                            </button>
                                            <button
                                                onClick={() => setConfirming(null)}
                                                className="rounded border border-white/15 px-3 py-1 text-xs text-white/70"
                                            >
                                                Abbrechen
                                            </button>
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setConfirming(r.profileId)}
                                            className="rounded border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-[#ff8800] hover:text-[#ff8800]"
                                        >
                                            Bestätigen
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}