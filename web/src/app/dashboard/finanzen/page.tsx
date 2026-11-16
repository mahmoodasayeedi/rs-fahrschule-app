import { createClient } from "@/lib/supabase/server";
import PriceRow from "./PriceRow";

function eur(n: number) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

export default async function FinanzenPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    const { data: me } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).single()
        : { data: null };
    const isAdmin = me?.role === "admin";

    const { data: services, error } = await supabase
        .from("services_pricing")
        .select("id, label, default_price, is_active")
        .eq("is_active", true)
        .order("label");

    if (error) {
        return (
            <div className="font-mono text-sm text-red-400">
                Fehler beim Laden: {error.message}
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold">Finanzen</h1>
            <p className="mt-1 text-sm text-white/50">Preisliste für Rechnungen</p>

            <section className="mt-6 rounded border border-white/10 bg-white/[0.02] p-5">
                <h2 className="font-mono text-xs uppercase tracking-widest text-white/40">
                    Leistungen und Preise
                </h2>

                {!isAdmin && (
                    <p className="mt-3 text-sm text-white/50">
                        Preise können nur von Administratoren geändert werden.
                    </p>
                )}

                {(services ?? []).length === 0 ? (
                    <p className="mt-4 text-sm text-white/40">Keine Leistungen vorhanden.</p>
                ) : (
                    <table className="mt-4 w-full text-left text-sm">
                        <thead className="font-mono text-xs uppercase text-white/40">
                            <tr>
                                <th className="py-2 pr-4">Leistung</th>
                                <th className="py-2 pr-4">Preis</th>
                                <th className="py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {(services ?? []).map((s: any) =>
                                isAdmin ? (
                                    <PriceRow
                                        key={s.id}
                                        id={s.id}
                                        label={s.label}
                                        price={Number(s.default_price)}
                                    />
                                ) : (
                                    <tr key={s.id} className="border-t border-white/5">
                                        <td className="py-2 pr-4">{s.label}</td>
                                        <td className="py-2 pr-4 font-mono">
                                            {eur(Number(s.default_price))}
                                        </td>
                                        <td />
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}