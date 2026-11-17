"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CancelInvoiceButton({
    invoiceId,
    invoiceNumber,
}: {
    invoiceId: string;
    invoiceNumber: string;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function cancel() {
        if (
            !window.confirm(
                `Rechnung ${invoiceNumber} wirklich stornieren? Die Rechnungsnummer bleibt vergeben.`
            )
        )
            return;
        setBusy(true);
        setError(null);
        const supabase = createClient();
        const { error } = await supabase.rpc("cancel_invoice", { p_invoice_id: invoiceId });
        setBusy(false);
        if (error) return setError(error.message);
        router.refresh();
    }

    return (
        <span className="inline-flex flex-col items-end">
            <button
                onClick={cancel}
                disabled={busy}
                className="text-xs text-white/50 hover:text-red-400 disabled:opacity-40"
            >
                {busy ? "…" : "Stornieren"}
            </button>
            {error && <span className="mt-1 max-w-[220px] text-right text-xs text-red-400">{error}</span>}
        </span>
    );
}
