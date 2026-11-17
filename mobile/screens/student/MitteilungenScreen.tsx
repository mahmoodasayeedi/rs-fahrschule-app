import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { goBack } from '../../lib/goBack';
import { supabase } from '../../lib/supabase';

const ORANGE = '#ff8800';
const BACKGROUND = '#0d0d0f';
const CARD = '#171719';
const BORDER = '#2f2f33';

type Notification = {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    isRead: boolean;
};

function timeAgo(iso: string): string {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `Vor ${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Vor ${days} Tag${days === 1 ? '' : 'en'}`;
    return new Date(iso).toLocaleDateString('de-DE');
}

export default function MitteilungenScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState<Notification[]>([]);

    const load = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('id, title, body, created_at, is_read')
            .eq('recipient_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            setError('Mitteilungen konnten nicht geladen werden.');
            setLoading(false);
            return;
        }

        setItems(
            (data ?? []).map((n) => ({
                id: n.id,
                title: n.title,
                body: n.body,
                createdAt: n.created_at,
                isRead: n.is_read,
            }))
        );
        setError('');
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function markAllRead() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false);
        if (error) {
            setError('Konnte nicht als gelesen markiert werden.');
            return;
        }
        await load();
    }

    const unread = items.filter((i) => !i.isRead).length;

    return (
        <SafeAreaView style={[styles.safeArea, loading && styles.center]}>
            {loading ? (
                <ActivityIndicator color={ORANGE} />
            ) : (
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => goBack(router, '/student/dashboard')}>
                            <Ionicons name="arrow-back" size={22} color="#ffffff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>Mitteilungen</Text>
                            <Text style={styles.headerSubtitle}>
                                {unread > 0 ? `${unread} ungelesen` : 'Alles gelesen'}
                            </Text>
                        </View>
                    </View>

                    {unread > 0 && (
                        <TouchableOpacity style={styles.markButton} onPress={markAllRead}>
                            <Text style={styles.markText}>Alle als gelesen markieren</Text>
                        </TouchableOpacity>
                    )}

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {items.length === 0 ? (
                        <View style={styles.card}>
                            <Text style={styles.body}>Keine Mitteilungen.</Text>
                        </View>
                    ) : (
                        items.map((n) => (
                            <View key={n.id} style={styles.card}>
                                <View style={styles.titleRow}>
                                    {!n.isRead && <View style={styles.dot} />}
                                    <Text style={styles.title}>{n.title}</Text>
                                </View>
                                <Text style={styles.body}>{n.body}</Text>
                                <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BACKGROUND },
    center: { alignItems: 'center', justifyContent: 'center' },
    container: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: CARD,
        borderWidth: 1, borderColor: '#3a3a3f', alignItems: 'center', justifyContent: 'center', marginRight: 13,
    },
    headerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
    headerSubtitle: { color: '#8f8f94', fontSize: 13, marginTop: 3 },
    markButton: { alignSelf: 'flex-end', marginBottom: 14 },
    markText: { color: ORANGE, fontSize: 13, fontWeight: '700' },
    errorText: { color: '#ff5c5c', fontSize: 14, marginBottom: 14 },
    card: {
        backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18,
        padding: 16, marginBottom: 12,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: ORANGE, marginRight: 9 },
    title: { color: '#ffffff', fontSize: 16, fontWeight: '800', flex: 1 },
    body: { color: '#b8b8bd', fontSize: 14, lineHeight: 20 },
    time: { color: '#77777c', fontSize: 12, marginTop: 8 },
});
