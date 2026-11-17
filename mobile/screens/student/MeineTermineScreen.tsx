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
import { supabase } from '../../lib/supabase';

const ORANGE = '#ff8800';
const BACKGROUND = '#0d0d0f';
const CARD = '#171719';
const BORDER = '#2f2f33';

const STATUS: Record<string, { text: string; color: string }> = {
    requested: { text: 'Angefragt', color: '#ff8800' },
    confirmed: { text: 'Bestätigt', color: '#79d495' },
    rejected: { text: 'Abgelehnt', color: '#ff5c5c' },
    alternative_proposed: { text: 'Alternative vorgeschlagen', color: '#ff8800' },
    cancelled: { text: 'Storniert', color: '#8f8f94' },
    completed: { text: 'Durchgeführt', color: '#79d495' },
    no_show: { text: 'Nicht erschienen', color: '#ff5c5c' },
};

const LESSON: Record<string, string> = {
    normal: 'Übungsstunde',
    uberland: 'Überlandfahrt',
    autobahn: 'Autobahnfahrt',
    night: 'Nachtfahrt',
    special: 'Sonderfahrt',
};

type Appt = {
    id: string;
    date: string;
    time: string;
    duration: number;
    lessonType: string;
    status: string;
    pickup: string | null;
    instructorId: string | null;
    instructorName: string;
};

const hhmm = (v: string | null) => (v ? String(v).slice(0, 5) : '');
const germanDate = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
};

function endTime(start: string, minutes: number): string {
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

function germanToday(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}

export default function MeineTermineScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [appts, setAppts] = useState<Appt[]>([]);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState('');

    const load = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('appointments')
            .select('id, requested_date, requested_time, duration_minutes, lesson_type, status, pickup_location, instructor_id')
            .eq('student_id', user.id)
            .order('requested_date', { ascending: false })
            .order('requested_time', { ascending: false })
            .limit(100);

        if (error) {
            setLoadError('Termine konnten nicht geladen werden.');
            setLoading(false);
            return;
        }

        const rows = data ?? [];
        const ids = Array.from(new Set(rows.map((r) => r.instructor_id).filter(Boolean))) as string[];
        const names = new Map<string, string>();
        if (ids.length > 0) {
            const { data: people } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', ids);
            (people ?? []).forEach((p) =>
                names.set(p.id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim())
            );
        }

        setAppts(
            rows.map((r) => ({
                id: r.id,
                date: r.requested_date,
                time: hhmm(r.requested_time),
                duration: r.duration_minutes,
                lessonType: String(r.lesson_type),
                status: String(r.status),
                pickup: r.pickup_location,
                instructorId: r.instructor_id,
                instructorName: r.instructor_id ? names.get(r.instructor_id) || '—' : 'Noch nicht zugewiesen',
            }))
        );
        setLoadError('');
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function cancel(a: Appt) {
        setCancellingId(a.id);
        setCancelError('');
        const { error } = await supabase.rpc('cancel_appointment', { appointment_id: a.id });
        setCancellingId(null);
        if (error) {
            setCancelError(error.message);
            return;
        }
        await load();
    }

    const today = germanToday();
    const upcoming = appts
        .filter((a) => a.date >= today && !['cancelled', 'rejected', 'completed', 'no_show'].includes(a.status))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const past = appts.filter((a) => !upcoming.includes(a));

    function renderCard(a: Appt, canCancel: boolean) {
        const s = STATUS[a.status] ?? { text: a.status, color: '#8f8f94' };
        return (
            <View key={a.id} style={styles.card}>
                <View style={styles.cardTop}>
                    <Text style={styles.cardDate}>{germanDate(a.date)}</Text>
                    <Text style={[styles.badge, { color: s.color, borderColor: s.color }]}>{s.text}</Text>
                </View>
                <Text style={styles.cardLine}>
                    {a.time} – {endTime(a.time, a.duration)} Uhr · {a.duration} Min.
                </Text>
                <Text style={styles.cardLine}>{LESSON[a.lessonType] ?? a.lessonType}</Text>
                <Text style={styles.cardMuted}>Fahrlehrer: {a.instructorName}</Text>
                {a.pickup ? <Text style={styles.cardMuted}>Abholort: {a.pickup}</Text> : null}
                {a.status === 'alternative_proposed' && (
                    <Text style={styles.hint}>
                        Die Fahrschule hat Alternativen vorgeschlagen. Bitte auf der Startseite auswählen.
                    </Text>
                )}
                {canCancel && a.status === 'confirmed' && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => cancel(a)}
                        disabled={cancellingId === a.id}
                    >
                        <Text style={styles.cancelText}>
                            {cancellingId === a.id ? 'Wird storniert…' : 'Termin stornieren'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, loading && styles.center]}>
            {loading ? (
                <ActivityIndicator color={ORANGE} />
            ) : (
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#ffffff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Meine Termine</Text>
                            <Text style={styles.headerSubtitle}>Deine Fahrstunden und Anfragen</Text>
                        </View>
                    </View>

                    {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
                    {cancelError ? <Text style={styles.errorText}>{cancelError}</Text> : null}

                    <Text style={styles.sectionTitle}>Anstehend</Text>
                    {upcoming.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Keine anstehenden Termine.</Text>
                        </View>
                    ) : (
                        upcoming.map((a) => renderCard(a, true))
                    )}

                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Vergangen</Text>
                    {past.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Noch keine vergangenen Termine.</Text>
                        </View>
                    ) : (
                        past.map((a) => renderCard(a, false))
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
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
    backButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: CARD,
        borderWidth: 1, borderColor: '#3a3a3f', alignItems: 'center', justifyContent: 'center', marginRight: 13,
    },
    headerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
    headerSubtitle: { color: '#8f8f94', fontSize: 13, marginTop: 3 },
    sectionTitle: { color: '#ffffff', fontSize: 19, fontWeight: '800', marginBottom: 13 },
    emptyCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 18 },
    emptyText: { color: '#8c8c91', fontSize: 14, lineHeight: 20 },
    errorText: { color: '#ff5c5c', fontSize: 14, marginBottom: 14 },
    card: {
        backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18,
        padding: 16, marginBottom: 14,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardDate: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
    badge: {
        fontSize: 11, fontWeight: '700', borderWidth: 1, borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden',
    },
    cardLine: { color: '#ffffff', fontSize: 14, marginTop: 2 },
    cardMuted: { color: '#8f8f94', fontSize: 13, marginTop: 4 },
    hint: { color: ORANGE, fontSize: 13, marginTop: 10, lineHeight: 18 },
    cancelButton: {
        marginTop: 14, borderWidth: 1, borderColor: '#ff5c5c', borderRadius: 12,
        paddingVertical: 11, alignItems: 'center',
    },
    cancelText: { color: '#ff5c5c', fontWeight: '700', fontSize: 14 },
});
