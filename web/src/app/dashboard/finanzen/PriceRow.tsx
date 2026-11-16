"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PriceRow({
    id,
    name,
    price,
    canEdit,
}: {
    id: string;
    name: string;
    price: number;
    canEdit: boolean;
}) {
    const router = useRouter();
    const [value, setValue] = useState(String(price ?? 0).replace(".", ","));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const parsed = Number(value.replace(",", "."));
    const valid = value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;
    const changed = valid && parsed !== Number(price);

    async function save() {
        if (!valid) return;
        setBusy(true);
        setError(null);
        setSaved(false);
        const supabase = createClient();
        const { data, error } = await supabase
            .from("services_pricing")
            .update({ default_price: parsed })
            .eq("id", id)
            .select("id");
        setBusy(false);
        if (error) return setError(error.message);
        if (!data || data.length === 0)
            return setError("Keine Berechtigung zum Ändern.");
        setSaved(true);
        router.refresh();
    }

    return (
        <tr className="border-t border-white/10">
            <td className="px-4 py-3 text-sm">{name}</td>
            <td className="px-4 py-3 text-right">
                {canEdit ? (
                    <div className="flex items-center justify-end gap-2">
                        <input
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                setSaved(false);
                            }}
                            inputMode="decimal"
                            className="w-24 rounded border border-white/15 bg-[#171719] px-2 py-1 text-right font-mono text-sm outline-none focus:border-[#ff8800]"
                        />
                        <span className="text-sm text-white/50">€</span>
                        <button
                            onClick={save}
                            disabled={!changed || busy}
                            className="rounded border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-[#ff8800] hover:text-[#ff8800] disabled:opacity-30"
                        >
                            {busy ? "…" : "Speichern"}
                        </button>
                        {saved && <span className="text-xs text-[#79d495]">Gespeichert</span>}
                        {error && <span className="text-xs text-[#ff5c5c]">{error}</span>}
                    </div>
                ) : (
                    <span className="font-mono text-sm">
                        {Number(price).toLocaleString("de-DE", {
                            minimumFractionDigits: 2,
                        })}{" "}
                        €
                    </span>
                )}
            </td>
        </tr>
    );
}
