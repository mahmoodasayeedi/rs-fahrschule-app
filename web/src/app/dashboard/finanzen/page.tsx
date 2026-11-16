import { createClient } from "@/lib/supabase/server";
import PriceRow from "./PriceRow";

export default async function FinanzenPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    const { data: me } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .single();
    const isAdmin = me?.role === "admin";

    const { data: services, error } = await supabase
        .from("services_pricing")
        .select("*")
        .order("label", { ascending: true });

    if (error) {
        return (
            <div className="font-mono text-sm text-red-400">
                Fehler beim Laden: {error.message}
            </div>
        );
    }

    const active = (services ?? []).filter((s: any) => s.is_active !== false);

    return (
        <div>
            <h1 className="text-2xl font-semibold">Finanzen</h1>
            <p className="mt-1 text-sm text-white/50">
                Preisliste {isAdmin ? "(bearbeitbar als Administrator)" : "(nur Ansicht)"}
            </p>

            <div className="mt-6 max-w-2xl overflow-hidden rounded border border-white/10 bg-[#171719]">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs text-white/40">
                            <th className="px-4 py-3 font-normal">Leistung</th>
                            <th className="px-4 py-3 text-right font-normal">Preis</th>
                        </tr>
                    </thead>
                    <tbody>
                        {active.map((s: any) => (
                            <PriceRow
                                key={s.id}
                                id={s.id}
                                name={s.name ?? s.label ?? s.service_name ?? "—"}
                                price={Number(s.default_price ?? 0)}
                                canEdit={isAdmin}
                            />
                        ))}
                        {active.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-4 py-6 text-sm text-white/50">
                                    Keine Leistungen vorhanden.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
