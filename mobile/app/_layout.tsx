import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth, UserRole } from '../lib/AuthProvider';

// Which route group each role belongs to. Admin shares the office area for
// now; the real admin/office split comes with the web dashboard (Phase 8).
const GROUP_BY_ROLE: Record<UserRole, string> = {
    student: 'student',
    instructor: 'instructor',
    office: 'office',
    admin: 'office',
};


function RouteGuard() {
    const { session, role, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const currentGroup = segments[0];
        const inProtectedArea =
            currentGroup === 'student' ||
            currentGroup === 'instructor' ||
            currentGroup === 'office';
        // Screens meant for people who are not logged in yet.
        const onAuthScreen = segments.length === 0 || currentGroup === 'register';
        // Logged out: protected areas are off limits.
        if (!session) {
            if (inProtectedArea) router.replace('/');
            return;
        }

        // Logged in, but the role isn't loaded yet: wait.
        if (!role) return;

        const ownGroup = GROUP_BY_ROLE[role];

        // Logged in: skip the login screen, and stay out of other roles' areas.
        if (onAuthScreen || (inProtectedArea && currentGroup !== ownGroup)) {
            router.replace(`/${ownGroup}/dashboard`);
        }
    }, [session, role, loading, segments]);

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: '#0d0d0f',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
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