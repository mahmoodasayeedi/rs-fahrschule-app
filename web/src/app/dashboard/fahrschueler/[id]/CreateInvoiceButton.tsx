"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type ServiceOption = { id: string; label: string; price: number };

const eur = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €";

export default function CreateInvoiceButton({
    studentId,
    services,
}: {
    studentId: string;
    services: ServiceOption[];
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [qty, setQty] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lines = services
        .map((s) => ({ ...s, q: Math.floor(Number(qty[s.id] || 0)) }))
        .filter((l) => Number.isFinite(l.q) && l.q > 0);
    const total = lines.reduce((sum, l) => sum + l.q * l.price, 0);

    function close() {
        setOpen(false);
        setQty({});
        setError(null);
    }

    async function submit() {
        if (lines.length === 0) return;
        setBusy(true);
        setError(null);
        const supabase = createClient();
        const { error } = await supabase.rpc("create_invoice", {
            p_student_id: studentId,
            p_items: lines.map((l) => ({ service_id: l.id, quantity: l.q })),
        });
        setBusy(false);
        if (error) return setError(error.message);
        close();
        router.refresh();
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="rounded border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:border-[#ff8800] hover:text-[#ff8800]"
            >
                Rechnung erstellen
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-lg rounded border border-white/10 bg-[#171719] p-6">
                        <h2 className="text-lg font-semibold">Rechnung erstellen</h2>
                        <p className="mt-1 text-sm text-white/50">
                            Menge je Leistung eingeben. Preise werden aus der Preisliste übernommen.
                        </p>

                        <div className="mt-4 max-h-80 space-y-2 overflow-auto">
                            {services.map((s) => (
                                <div key={s.id} className="flex items-center gap-3 text-sm">
                                    <div className="flex-1">{s.label}</div>
                                    <div className="w-24 text-right font-mono text-white/50">
                                        {eur(s.price)}
                                    </div>
                                    <input
                                        value={qty[s.id] ?? ""}
                                        onChange={(e) =>
                                            setQty({ ...qty, [s.id]: e.target.value.replace(/\D/g, "") })
                                        }
                                        inputMode="numeric"
                                        placeholder="0"
                                        className="w-16 rounded border border-white/15 bg-[#0d0d0f] px-2 py-1 text-right font-mono outline-none focus:border-[#ff8800]"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-sm">
                            <span className="text-white/50">Summe</span>
                            <span className="font-mono">{eur(total)}</span>
                        </div>

                        {error && <div className="mt-3 text-sm text-[#ff5c5c]">{error}</div>}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={close}
                                disabled={busy}
                                className="rounded border border-white/15 px-4 py-2 text-sm text-white/70 hover:text-white"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={submit}
                                disabled={busy || lines.length === 0}
                                className="rounded bg-[#ff8800] px-4 py-2 text-sm font-medium text-black disabled:opacity-30"
                            >
                                {busy ? "Wird erstellt…" : "Rechnung erstellen"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
