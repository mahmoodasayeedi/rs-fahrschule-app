import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type UserRole = 'admin' | 'office' | 'instructor' | 'student';

type AuthState = {
    session: Session | null;
    role: UserRole | null;
    loading: boolean;
};

const AuthContext = createContext<AuthState>({
    session: null,
    role: null,
    loading: true,
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadRole(currentSession: Session) {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentSession.user.id)
                .single();

            if (active) {
                setRole((data?.role as UserRole) ?? null);
            }
        }

        const { data: listener } = supabase.auth.onAuthStateChange(
            (event, newSession) => {
                setSession(newSession);

                if (!newSession) {
                    setRole(null);
                    setLoading(false);
                    return;
                }

                if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                    // Deferred on purpose: Supabase advises against awaiting
                    // its own calls directly inside this callback.
                    setTimeout(async () => {
                        await loadRole(newSession);
                        if (active) setLoading(false);
                    }, 0);
                }
            }
        );

        return () => {
            active = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
}