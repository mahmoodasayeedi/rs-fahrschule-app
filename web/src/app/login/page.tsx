'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage('');

        if (!email.trim() || !password) {
            setErrorMessage('Bitte E-Mail und Passwort eingeben.');
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (error) {
            setLoading(false);
            setErrorMessage('Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        setLoading(false);

        if (!profile || (profile.role !== 'office' && profile.role !== 'admin')) {
            await supabase.auth.signOut();
            setErrorMessage('Dieser Zugang ist nur für Büro- und Administratorkonten vorgesehen.');
            return;
        }

        router.push('/dashboard');
        router.refresh();
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <form
                onSubmit={handleLogin}
                className="w-full max-w-sm rounded-2xl border p-8"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
                <h1 className="mb-1 text-2xl font-bold">RS Fahrschule</h1>
                <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Büro-Anmeldung
                </p>

                <label className="mb-2 block text-sm font-medium">E-Mail</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="mb-5 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                />

                <label className="mb-2 block text-sm font-medium">Passwort</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="mb-6 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                />

                {errorMessage && (
                    <p className="mb-4 text-sm" style={{ color: 'var(--danger)' }}>
                        {errorMessage}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
                    style={{ backgroundColor: 'var(--accent)' }}
                >
                    {loading ? 'Wird angemeldet…' : 'Anmelden'}
                </button>
            </form>
        </div>
    );
}