"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const METHODS = [
    { key: "cash", label: "Bar" },
    { key: "bank_transfer", label: "Überweisung" },
    { key: "card", label: "Karte" },
    { key: "other", label: "Sonstiges" },
];

const inputClass =
    "mt-1 w-full rounded border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm outline-none focus:border-[#ff8800] [color-scheme:dark]";
const labelClass = "mt-4 block text-xs uppercase text-white/40";

function today() {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
}

export default function RecordPaymentButton({ studentId }: { studentId: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("cash");
    const [date, setDate] = useState(today());
    const [remarks, setRemarks] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function close() {
        setOpen(false);
        setAmount("");
        setMethod("cash");
        setDate(today());
        setRemarks("");
        setError(null);
    }

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

        // Accept "50,00" and "50.00".
        const value = Math.round(Number(amount.replace(",", ".")) * 100) / 100;
        if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
            setError("Bitte einen Betrag größer als 0 eingeben.");
            return;
        }
        if (value > 99999) {
            setError("Der Betrag ist zu hoch. Bitte prüfen.");
            return;
        }
        if (!date) {
            setError("Bitte ein Zahlungsdatum wählen.");
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

        const { error: insertError } = await supabase.from("payments").insert({
            student_id: studentId,
            amount: value,
            payment_date: date,
            payment_method: method,
            internal_remarks: remarks.trim() || null,
            recorded_by: user.id,
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
                className="rounded bg-[#ff8800] px-3 py-1.5 text-xs font-bold text-black"
            >
                Zahlung erfassen
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={close}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="w-full max-w-md rounded border border-white/15 bg-[#0d0d0f] p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold">Zahlung erfassen</h2>

                        <label className={labelClass}>Betrag in Euro</label>
                        <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputMode="decimal"
                            placeholder="z. B. 50,00"
                            className={inputClass}
                        />

                        <label className={labelClass}>Zahlungsart</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className={inputClass}
                        >
                            {METHODS.map((m) => (
                                <option key={m.key} value={m.key}>
                                    {m.label}
                                </option>
                            ))}
                        </select>

                        <label className={labelClass}>Zahlungsdatum</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={inputClass}
                        />

                        <label className={labelClass}>Interne Bemerkung (optional)</label>
                        <input
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
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
                                {busy ? "Speichern…" : "Speichern"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}