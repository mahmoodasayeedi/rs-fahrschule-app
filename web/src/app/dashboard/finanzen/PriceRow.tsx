"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PriceRow({
    id,
    label,
    price,
}: {
    id: string;
    label: string;
    price: number;
}) {
    const router = useRouter();
    const [value, setValue] = useState(price.toFixed(2).replace(".", ","));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parsed = Math.round(Number(value.replace(",", ".")) * 100) / 100;
    const changed = Number.isFinite(parsed) && parsed !== price;

    async function save() {
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 99999) {
            setError("Ungültiger Preis.");
            return;
        }
        setBusy(true);
        setError(null);

        const supabase = createClient();
        const { data, error: updateError } = await supabase
            .from("services_pricing")
            .update({ default_price: parsed, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select("id");

        setBusy(false);

        if (updateError || !data || data.length === 0) {
            setError("Nicht gespeichert. Nur Administratoren dürfen Preise ändern.");
            return;
        }
        router.refresh();
    }

    return (
        <tr className="border-t border-white/5">
            <td className="py-2 pr-4">{label}</td>
            <td className="py-2 pr-4">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    inputMode="decimal"
                    className="w-28 rounded border border-white/15 bg-[#0d0d0f] px-2 py-1 text-right font-mono text-sm outline-none focus:border-[#ff8800]"
                />{" "}
                €
            </td>
            <td className="py-2 text-right">
                <button
                    type="button"
                    onClick={save}
                    disabled={!changed || busy}
                    className="rounded bg-[#ff8800] px-3 py-1 text-xs font-bold text-black disabled:opacity-40"
                >
                    {busy ? "Speichern…" : "Speichern"}
                </button>
                {error && <span className="ml-2 text-xs text-red-400">{error}</span>}
            </td>
        </tr>
    );
}