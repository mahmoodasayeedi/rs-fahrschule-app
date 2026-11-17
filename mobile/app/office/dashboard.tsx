import { Ionicons } from '@expo/vector-icons';
import { Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../lib/AuthProvider';
import { supabase } from '../../lib/supabase';

const ORANGE = '#ff8800';
const WEB_URL = process.env.EXPO_PUBLIC_OFFICE_WEB_URL;

export default function OfficeDashboard() {
    const { role } = useAuth();

    async function handleLogout() {
        await supabase.auth.signOut();
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.iconCircle}>
                <Ionicons name="desktop-outline" size={34} color={ORANGE} />
            </View>

            <Text style={styles.title}>
                {role === 'admin' ? 'Administrator' : 'Büro'}
            </Text>

            <Text style={styles.text}>
                Die Verwaltung (Termine, Fahrschüler, Prüfungen, Zahlungen und Rechnungen) läuft im
                Web-Dashboard am Computer. Dieses Konto ist hier erfolgreich angemeldet.
            </Text>

            {WEB_URL ? (
                <TouchableOpacity style={styles.primaryButton} onPress={() => Linking.openURL(WEB_URL)}>
                    <Text style={styles.primaryText}>Web-Dashboard öffnen</Text>
                </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Text style={styles.buttonText}>Abmelden</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d0f', alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 32 },
    iconCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#171719', borderWidth: 1, borderColor: '#2f2f33', alignItems: 'center', justifyContent: 'center' },
    title: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
    text: { color: '#9a9a9f', fontSize: 14, lineHeight: 21, textAlign: 'center' },
    primaryButton: { height: 50, paddingHorizontal: 28, borderRadius: 25, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
    primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
    button: { height: 50, paddingHorizontal: 28, borderRadius: 25, borderWidth: 2, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: ORANGE, fontSize: 15, fontWeight: '800' },
});
