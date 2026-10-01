import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type UserRole = 'admin' | 'office' | 'instructor' | 'student';
export type RegistrationStatus = 'pending' | 'confirmed' | null;

type AuthState = {
    session: Session | null;
    role: UserRole | null;
    registrationStatus: RegistrationStatus;
    registrationDeadline: string | null;
    loading: boolean;
};

const AuthContext = createContext<AuthState>({
    session: null,
    role: null,
    registrationStatus: null,
    registrationDeadline: null,
    loading: true,
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>(null);
    const [registrationDeadline, setRegistrationDeadline] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadProfile(currentSession: Session) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentSession.user.id)
                .single();

            if (!active) return;
            const userRole = (profile?.role as UserRole) ?? null;
            setRole(userRole);

            // Only students have a student_records row. maybeSingle() is used
            // deliberately here, since other roles having zero rows is normal,
            // not an error.
            if (userRole === 'student') {
                const { data: record } = await supabase
                    .from('student_records')
                    .select('registration_status, registration_deadline')
                    .eq('profile_id', currentSession.user.id)
                    .maybeSingle();

                if (!active) return;

                // A missing record for a student would itself be a bug elsewhere,
                // not a reason to lock someone out — default to confirmed so a
                // data issue doesn't block someone who should have access.
                setRegistrationStatus((record?.registration_status as RegistrationStatus) ?? 'confirmed');
                setRegistrationDeadline(record?.registration_deadline ?? null);
            } else {
                setRegistrationStatus(null);
                setRegistrationDeadline(null);
            }
        }

        const { data: listener } = supabase.auth.onAuthStateChange(
            (event, newSession) => {
                setSession(newSession);

                if (!newSession) {
                    setRole(null);
                    setRegistrationStatus(null);
                    setRegistrationDeadline(null);
                    setLoading(false);
                    return;
                }

                if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                    setTimeout(async () => {
                        await loadProfile(newSession);
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
        <AuthContext.Provider
            value={{ session, role, registrationStatus, registrationDeadline, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
}