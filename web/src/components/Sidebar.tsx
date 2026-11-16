"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/dashboard/actions";

const NAV = [
    { label: "Termine", href: "/dashboard/termine", enabled: true },
    { label: "Registrierungen", href: "/dashboard/registrierungen", enabled: true },
    { label: "Fahrschüler", href: "/dashboard/fahrschueler", enabled: true },
    { label: "Prüfungen", href: "/dashboard/pruefungen", enabled: true },
    { label: "Finanzen", href: "/dashboard/finanzen", enabled: true },
    { label: "Nachrichten", href: "/dashboard/nachrichten", enabled: false },
];

export default function Sidebar({
    userName,
    role,
}: {
    userName: string;
    role: string;
}) {
    const pathname = usePathname();

    return (
        <aside className="flex h-screen print:hidden w-60 shrink-0 flex-col border-r border-white/10 bg-[#0d0d0f]">
            <div className="px-5 py-6">
                <div className="font-mono text-xs uppercase tracking-widest text-[#ff8800]">
                    RS Fahrschule
                </div>
                <div className="mt-1 text-sm text-white/50">Büro</div>
            </div>

            <nav className="flex-1 space-y-1 px-3">
                {NAV.map((item) => {
                    const active = pathname.startsWith(item.href);

                    if (!item.enabled) {
                        return (
                            <div
                                key={item.href}
                                className="flex cursor-not-allowed items-center justify-between rounded px-3 py-2 text-sm text-white/25"
                            >
                                {item.label}
                                <span className="font-mono text-[10px] uppercase">bald</span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block rounded px-3 py-2 text-sm transition-colors ${active
                                ? "bg-[#ff8800]/10 text-[#ff8800]"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 p-4">
                <div className="truncate text-sm text-white">{userName}</div>
                <div className="mb-3 font-mono text-xs uppercase text-white/40">
                    {role}
                </div>
                <form action={logout}>
                    <button
                        type="submit"
                        className="w-full rounded border border-white/15 px-3 py-2 text-sm text-white/70 transition-colors hover:border-[#ff8800] hover:text-[#ff8800]"
                    >
                        Abmelden
                    </button>
                </form>
            </div>
        </aside>
    );
}
