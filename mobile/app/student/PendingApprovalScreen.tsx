import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../lib/AuthProvider';
import { supabase } from '../../lib/supabase';

const ORANGE = '#ff8800';
const BACKGROUND = '#0d0d0f';

function formatGermanDate(isoString: string | null): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PendingApprovalScreen() {
    const { registrationDeadline } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        setLoggingOut(true);
        await supabase.auth.signOut();
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.iconCircle}>
                    <Ionicons name="time-outline" size={48} color={ORANGE} />
                </View>

                <Text style={styles.title}>Registrierung eingegangen</Text>

                <Text style={styles.text}>
                    Vielen Dank für Ihre Registrierung bei RS Fahrschule. Um Ihr
                    Konto zu aktivieren, besuchen Sie uns bitte persönlich im
                    Büro{registrationDeadline ? ` bis zum ${formatGermanDate(registrationDeadline)}` : ''}.
                </Text>

                <Text style={styles.subtext}>
                    Ohne Bestätigung im Büro wird die Registrierung nach Ablauf
                    dieser Frist automatisch gelöscht.
                </Text>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
                    <Text style={styles.logoutButtonText}>
                        {loggingOut ? 'Wird abgemeldet…' : 'Abmelden'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BACKGROUND },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    iconCircle: {
        width: 96, height: 96, borderRadius: 48, backgroundColor: '#211a13',
        borderWidth: 1, borderColor: '#4c3520', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    title: { color: '#ffffff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
    text: { color: '#cfcfd2', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 16 },
    subtext: { color: '#8c8c91', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 32 },
    logoutButton: { height: 52, paddingHorizontal: 32, borderRadius: 26, borderWidth: 2, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
    logoutButtonText: { color: ORANGE, fontSize: 15, fontWeight: '800' },
});