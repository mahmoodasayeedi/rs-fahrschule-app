import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function OfficeDashboard() {
    async function handleLogout() {
        await supabase.auth.signOut();
    }

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Büro-Dashboard (folgt)</Text>

            <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Text style={styles.buttonText}>Abmelden</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d0f', alignItems: 'center', justifyContent: 'center', gap: 20 },
    text: { color: '#ffffff', fontSize: 16 },
    button: { height: 50, paddingHorizontal: 28, borderRadius: 25, borderWidth: 2, borderColor: '#ff8800', alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#ff8800', fontSize: 15, fontWeight: '800' },
});