import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth, UserRole } from '../lib/AuthProvider';

const GROUP_BY_ROLE: Record<UserRole, string> = {
    student: 'student',
    instructor: 'instructor',
    office: 'office',
    admin: 'office',
};

const PROTECTED_GROUPS = ['student', 'instructor', 'office', 'pending'];

function RouteGuard() {
    const { session, role, registrationStatus, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const currentGroup = segments[0];
        const inProtectedArea = PROTECTED_GROUPS.includes(currentGroup);
        const onAuthScreen = segments.length === 0 || currentGroup === 'register';

        if (!session) {
            if (inProtectedArea) router.replace('/');
            return;
        }

        if (!role) return;

        // A pending student's "own group" is the pending screen, not their
        // dashboard — overrides the normal role-based destination.
        const ownGroup =
            role === 'student' && registrationStatus === 'pending'
                ? 'pending'
                : GROUP_BY_ROLE[role];

        if (onAuthScreen || (inProtectedArea && currentGroup !== ownGroup)) {
            router.replace(`/${ownGroup}/dashboard` === '/pending/dashboard' ? '/pending' : `/${ownGroup}/dashboard`);
        }
    }, [session, role, registrationStatus, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0d0d0f', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#ff8800" />
            </View>
        );
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RouteGuard />
        </AuthProvider>
    );
}