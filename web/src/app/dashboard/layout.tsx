import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // getUser() validates the token with Supabase; don't use getSession() here
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile || !["office", "admin"].includes(profile.role)) {
        await supabase.auth.signOut();
        redirect("/login");
    }

    const userName =
        profile.full_name ||
        [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
        user.email ||
        "Benutzer";

    return (
        <div className="flex min-h-screen bg-[#0d0d0f] text-white print:block print:bg-white print:text-black">
            <Sidebar userName={userName} role={profile.role} />
            <main className="flex-1 overflow-auto p-8 print:overflow-visible print:p-0">{children}</main>
        </div>
    );
}