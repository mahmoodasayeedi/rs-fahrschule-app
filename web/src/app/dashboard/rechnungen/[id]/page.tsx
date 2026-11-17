import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COMPANY } from "@/lib/company";
import PrintButton from "./PrintButton";

const eur = (n: number) =>
    Number(n).toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €";

export default async function InvoicePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: invoice } = await supabase
        .from("invoices")
        .select("id, invoice_number, issue_date, total_amount, status, student_id")
        .eq("id", id)
        .maybeSingle();
    if (!invoice) notFound();

    const { data: items } = await supabase
        .from("invoice_items")
        .select("id, description, quantity, unit_price, line_total")
        .eq("invoice_id", id)
        .order("description", { ascending: true });

    const { data: student } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", invoice.student_id)
        .maybeSingle();

    const { data: record } = await supabase
        .from("student_records")
        .select("address")
        .eq("profile_id", invoice.student_id)
        .maybeSingle();

    const studentName =
        [student?.first_name, student?.last_name].filter(Boolean).join(" ") || "—";

    return (
        <div>
            <div className="mb-6 flex items-center justify-between print:hidden">
                <Link
                    href={`/dashboard/fahrschueler/${invoice.student_id}`}
                    className="font-mono text-xs uppercase text-white/40 hover:text-[#ff8800]"
                >
                    ← Zurück zum Fahrschüler
                </Link>
                <PrintButton />
            </div>

            {invoice.status === "cancelled" && (
                <div className="mb-4 rounded border border-[#ff5c5c]/40 p-3 text-sm font-semibold text-[#ff5c5c] print:border-red-600 print:text-red-600">
                    STORNIERT – diese Rechnung ist nicht mehr gültig.
                </div>
            )}

            <article className="mx-auto max-w-[210mm] bg-white p-12 text-sm leading-relaxed text-black shadow print:max-w-none print:p-0 print:shadow-none">
                <header className="flex justify-between">
                    <div>
                        <div className="text-xl font-semibold">{COMPANY.name}</div>
                        <div className="mt-1 text-xs text-neutral-600">
                            {COMPANY.owner}
                            <br />
                            {COMPANY.street}
                            <br />
                            {COMPANY.city}
                            <br />
                            {COMPANY.phone} · {COMPANY.email}
                        </div>
                    </div>
                    <div className="text-right text-xs text-neutral-600">
                        {COMPANY.taxNumber}
                    </div>
                </header>

                <section className="mt-12">
                    <div className="text-xs text-neutral-500">Rechnungsempfänger</div>
                    <div className="mt-1">
                        {studentName}
                        <br />
                        {record?.address ?? ""}
                    </div>
                </section>

                <section className="mt-10 flex items-end justify-between">
                    <h1 className="text-lg font-semibold">
                        Rechnung Nr. {invoice.invoice_number}
                    </h1>
                    <div className="text-right text-xs text-neutral-600">
                        Rechnungsdatum:{" "}
                        {new Date(invoice.issue_date).toLocaleDateString("de-DE")}
                    </div>
                </section>

                <table className="mt-6 w-full text-left">
                    <thead>
                        <tr className="border-b border-black text-xs">
                            <th className="py-2 pr-2 font-semibold">Leistung</th>
                            <th className="py-2 pr-2 text-right font-semibold">Menge</th>
                            <th className="py-2 pr-2 text-right font-semibold">Einzelpreis</th>
                            <th className="py-2 text-right font-semibold">Betrag</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(items ?? []).map((it: any) => (
                            <tr key={it.id} className="border-b border-neutral-200">
                                <td className="py-2 pr-2">{it.description}</td>
                                <td className="py-2 pr-2 text-right">{it.quantity}</td>
                                <td className="py-2 pr-2 text-right">{eur(it.unit_price)}</td>
                                <td className="py-2 text-right">{eur(it.line_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={3} className="pt-4 text-right font-semibold">
                                Gesamtbetrag
                            </td>
                            <td className="pt-4 text-right font-semibold">
                                {eur(invoice.total_amount)}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <p className="mt-6 text-xs text-neutral-600">{COMPANY.vatNote}</p>
                <p className="mt-6">{COMPANY.paymentNote}</p>

                <footer className="mt-12 border-t border-neutral-300 pt-3 text-xs text-neutral-600">
                    {COMPANY.bankName} · IBAN {COMPANY.iban} · BIC {COMPANY.bic}
                </footer>
            </article>
        </div>
    );
}
