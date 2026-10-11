"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type StudentRow = {
    id: string;
    name: string;
    phone: string;
    licenseClass: string;
    trainingStatus: string;
    registrationStatus: string;
    instructorName: string;
};

const TRAINING_LABEL: Record<string, string> = {
    registered: "Angemeldet",
    theory_phase: "Theoriephase",
    practice_phase: "Praxisphase",
    ready_for_exam: "Prüfungsreif",
    licensed: "Führerschein erteilt",
    paused: "Pausiert",
    withdrawn: "Abgemeldet",
};

const REGISTRATION_LABEL: Record<string, string> = {
    pending: "Ausstehend",
    confirmed: "Bestätigt",
};

const FILTERS = [
    { key: "all", label: "Alle" },
    { key: "pending", label: "Ausstehend" },
    { key: "confirmed", label: "Bestätigt" },
];

export default function FahrschuelerTable({ rows }: { rows: StudentRow[] }) {
    const [filter, setFilter] = useState("all");
    const [query, setQuery] = useState("");

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((r) => {
            if (filter !== "all" && r.registrationStatus !== filter) return false;
            if (!q) return true;
            return (
                r.name.toLowerCase().includes(q) ||
                r.phone.toLowerCase().includes(q)
            );
        });
    }, [rows, filter, query]);

    return (
        <>
            <div className="mt-6 flex flex-wrap items-center gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`rounded border px-3 py-1.5 text-sm transition-colors ${filter === f.key
                            ? "border-[#ff8800] bg-[#ff8800]/10 text-[#ff8800]"
                            : "border-white/15 text-white/60 hover:text-white"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}

                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Suche nach Name oder Telefon…"
                    className="ml-auto w-64 rounded border border-white/15 bg-[#0d0d0f] px-3 py-1.5 text-sm placeholder:text-white/30"
                />
            </div>

            <div className="mt-4 overflow-x-auto rounded border border-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 font-mono text-xs uppercase text-white/40">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Telefon</th>
                            <th className="px-4 py-3">Klasse</th>
                            <th className="px-4 py-3">Ausbildung</th>
                            <th className="px-4 py-3">Anmeldung</th>
                            <th className="px-4 py-3">Fahrlehrer</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center font-mono text-white/40">
                                    Keine Fahrschüler
                                </td>
                            </tr>
                        )}
                        {visible.map((r) => (
                            <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/dashboard/fahrschueler/${r.id}`}
                                        className="text-white hover:text-[#ff8800]"
                                    >
                                        {r.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 font-mono">{r.phone}</td>
                                <td className="px-4 py-3 font-mono">{r.licenseClass}</td>
                                <td className="px-4 py-3 text-white/70">
                                    {TRAINING_LABEL[r.trainingStatus] ?? r.trainingStatus}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded px-2 py-0.5 font-mono text-xs ${r.registrationStatus === "pending"
                                            ? "bg-[#ff8800]/15 text-[#ff8800]"
                                            : "bg-white/10 text-white/70"
                                            }`}
                                    >
                                        {REGISTRATION_LABEL[r.registrationStatus] ?? r.registrationStatus}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{r.instructorName}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/dashboard/fahrschueler/${r.id}`}
                                        className="rounded border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-[#ff8800] hover:text-[#ff8800]"
                                    >
                                        Öffnen
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="mt-3 font-mono text-xs text-white/40">
                {visible.length} von {rows.length} Fahrschülern
            </p>
        </>
    );
}
