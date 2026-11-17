import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
const GREEN = '#79d495';
const BACKGROUND = '#0d0d0f';
const CARD = '#171719';
const BORDER = '#2f2f33';

const TRAINING_LABEL: Record<string, string> = {
    registered: 'Angemeldet',
    theory_phase: 'Theoriephase',
    practice_phase: 'Praxisphase',
    ready_for_exam: 'Prüfungsreif',
    licensed: 'Führerschein erteilt',
    paused: 'Pausiert',
    withdrawn: 'Abgemeldet',
};

const EXAM_LABEL: Record<string, string> = {
    not_scheduled: 'Noch nicht angemeldet',
    scheduled: 'Angemeldet',
    passed: 'Bestanden',
    failed: 'Nicht bestanden',
};

const KEYS = [
    'theory_lessons_minimum_b',
    'uberland_lessons_minimum_b',
    'autobahn_lessons_minimum_b',
    'night_lessons_minimum_b',
];

type Item = { label: string; done: number; required: number };

function Bar({ item }: { item: Item }) {
    const complete = item.required > 0 && item.done >= item.required;
    const pct = item.required > 0 ? Math.min(100, Math.round((item.done / item.required) * 100)) : 0;
    return (
        <View style={styles.barBlock}>
            <View style={styles.barTop}>
                <Text style={styles.barLabel}>{item.label}</Text>
                <Text style={styles.barValue}>
                    <Text style={{ color: complete ? GREEN : '#ffffff' }}>{item.done}</Text>
                    <Text style={{ color: '#8f8f94' }}> / {item.required}</Text>
                </Text>
            </View>
            <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: complete ? GREEN : ORANGE }]} />
            </View>
        </View>
    );
}

export default function AusbildungsfortschrittScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [practical, setPractical] = useState(0);
    const [theoryExam, setTheoryExam] = useState('not_scheduled');
    const [practicalExam, setPracticalExam] = useState('not_scheduled');

    useEffect(() => {
        let active = true;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [rec, prog, cfg] = await Promise.all([
                supabase.from('student_records').select('training_status').eq('profile_id', user.id).maybeSingle(),
                supabase.from('training_progress').select('*').eq('student_id', user.id).maybeSingle(),
                supabase.from('business_config').select('key, value').in('key', KEYS),
            ]);
            if (!active) return;

            if (prog.error || cfg.error) {
                setError('Fortschritt konnte nicht geladen werden.');
                setLoading(false);
                return;
            }

            const min = Object.fromEntries((cfg.data ?? []).map((c) => [c.key, Number(c.value)]));
            const p: any = prog.data ?? {};
            setStatus(rec.data?.training_status ? String(rec.data.training_status) : null);
            setItems([
                { label: 'Theorieunterricht', done: p.theory_lessons_completed ?? 0, required: min.theory_lessons_minimum_b ?? 0 },
                { label: 'Überlandfahrten', done: p.uberland_lessons_count ?? 0, required: min.uberland_lessons_minimum_b ?? 0 },
                { label: 'Autobahnfahrten', done: p.autobahn_lessons_count ?? 0, required: min.autobahn_lessons_minimum_b ?? 0 },
                { label: 'Nachtfahrten', done: p.night_lessons_count ?? 0, required: min.night_lessons_minimum_b ?? 0 },
            ]);
            setPractical(p.practical_lessons_count ?? 0);
            setTheoryExam(String(p.theory_exam_status ?? 'not_scheduled'));
            setPracticalExam(String(p.practical_exam_status ?? 'not_scheduled'));
            setLoading(false);
        })();
        return () => { active = false; };
    }, []);

    const open = items.filter((i) => i.done < i.required);
    const nextStep =
        theoryExam !== 'passed' && open.some((i) => i.label === 'Theorieunterricht')
            ? 'Besuche weiter den Theorieunterricht.'
            : theoryExam !== 'passed'
                ? 'Als Nächstes steht die Theorieprüfung an. Frage im Büro nach einem Termin.'
                : open.length > 0
                    ? `Noch offen: ${open.filter((i) => i.label !== 'Theorieunterricht').map((i) => `${i.label} (${i.done}/${i.required})`).join(', ')}.`
                    : practicalExam === 'passed'
                        ? 'Glückwunsch! Du hast die praktische Prüfung bestanden.'
                        : 'Alle Pflichtfahrten sind erledigt. Als Nächstes steht die praktische Prüfung an.';

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
                        <View>
                            <Text style={styles.headerTitle}>Ausbildungsfortschritt</Text>
                            <Text style={styles.headerSubtitle}>Dein aktueller Ausbildungsstand</Text>
                        </View>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Aktueller Status</Text>
                        <Text style={styles.statusText}>{status ? TRAINING_LABEL[status] ?? status : '—'}</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Nächster Schritt</Text>
                        <Text style={styles.bodyText}>{nextStep}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Pflichtstunden (Klasse B)</Text>
                    <View style={styles.card}>
                        {items.map((i) => <Bar key={i.label} item={i} />)}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Übungsstunden gesamt</Text>
                        <Text style={styles.statusText}>{practical}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Prüfungen</Text>
                    <View style={styles.card}>
                        <View style={styles.examRow}>
                            <Text style={styles.bodyText}>Theorieprüfung</Text>
                            <Text style={[styles.examValue, theoryExam === 'passed' && { color: GREEN }, theoryExam === 'failed' && { color: '#ff5c5c' }]}>
                                {EXAM_LABEL[theoryExam] ?? theoryExam}
                            </Text>
                        </View>
                        <View style={[styles.examRow, { marginTop: 12 }]}>
                            <Text style={styles.bodyText}>Praktische Prüfung</Text>
                            <Text style={[styles.examValue, practicalExam === 'passed' && { color: GREEN }, practicalExam === 'failed' && { color: '#ff5c5c' }]}>
                                {EXAM_LABEL[practicalExam] ?? practicalExam}
                            </Text>
                        </View>
                    </View>
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
    sectionTitle: { color: '#ffffff', fontSize: 19, fontWeight: '800', marginTop: 10, marginBottom: 13 },
    errorText: { color: '#ff5c5c', fontSize: 14, marginBottom: 14 },
    card: {
        backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18,
        padding: 16, marginBottom: 14,
    },
    cardLabel: { color: '#8f8f94', fontSize: 12, marginBottom: 6 },
    statusText: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
    bodyText: { color: '#ffffff', fontSize: 14, lineHeight: 20 },
    barBlock: { marginBottom: 16 },
    barTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    barLabel: { color: '#d0d0d4', fontSize: 14 },
    barValue: { fontSize: 13, fontWeight: '700' },
    track: { height: 8, borderRadius: 4, backgroundColor: '#2a2a2e', overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4 },
    examRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    examValue: { color: '#d0d0d4', fontSize: 14, fontWeight: '700' },
});
