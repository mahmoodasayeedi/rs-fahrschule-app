import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CreateInvoiceButton from "./CreateInvoiceButton";
import CancelInvoiceButton from "./CancelInvoiceButton";

const STATUS_LABEL: Record<string, string> = {
    draft: "Entwurf",
    issued: "Ausgestellt",
    paid: "Bezahlt",
    partially_paid: "Teilweise bezahlt",
    cancelled: "Storniert",
};

const eur = (n: number) =>
    Number(n).toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €";

export default async function InvoicesCard({ studentId }: { studentId: string }) {
    const supabase = await createClient();

    const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, issue_date, total_amount, status")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);

    const { data: svc } = await supabase
        .from("services_pricing")
        .select("id, label, default_price, is_active")
        .eq("is_active", true)
        .order("label", { ascending: true });

    const services = (svc ?? []).map((s: any) => ({
        id: s.id as string,
        label: s.label as string,
        price: Number(s.default_price),
    }));

    return (
        <div className="rounded border border-white/10 bg-[#171719] p-5">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Rechnungen</h2>
                <CreateInvoiceButton studentId={studentId} services={services} />
            </div>

            {(invoices ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-white/50">Noch keine Rechnungen.</p>
            ) : (
                <table className="mt-4 w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-white/40">
                            <th className="py-2 font-normal">Nummer</th>
                            <th className="py-2 font-normal">Datum</th>
                            <th className="py-2 font-normal">Status</th>
                            <th className="py-2 text-right font-normal">Betrag</th>
                            <th className="py-2 pl-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(invoices ?? []).map((i: any) => (
                            <tr key={i.id} className="border-t border-white/10">
                                <td className="py-2 font-mono">{i.invoice_number}</td>
                                <td className="py-2">
                                    {new Date(i.issue_date).toLocaleDateString("de-DE")}
                                </td>
                                <td className="py-2">{STATUS_LABEL[i.status] ?? i.status}</td>
                                <td className="py-2 text-right font-mono">{eur(i.total_amount)}</td>
                                <td className="py-2 pl-4 text-right">
                                    <span className="inline-flex items-start gap-4">
                                        <Link href={`/dashboard/rechnungen/${i.id}`} className="text-xs text-[#ff8800] hover:underline">PDF</Link>
                                        {(i.status === "issued" || i.status === "draft") && (
                                            <CancelInvoiceButton invoiceId={i.id} invoiceNumber={i.invoice_number} />
                                        )}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
