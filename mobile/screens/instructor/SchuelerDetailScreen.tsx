import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

const KEYS = [
    'theory_lessons_minimum_b',
    'uberland_lessons_minimum_b',
    'autobahn_lessons_minimum_b',
    'night_lessons_minimum_b',
];

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
    not_scheduled: 'Nicht angemeldet',
    scheduled: 'Angemeldet',
    passed: 'Bestanden',
    failed: 'Nicht bestanden',
};

type Item = { label: string; done: number; required: number };
type Note = { id: string; content: string; createdAt: string };

function Bar({ item }: { item: Item }) {
    const complete = item.required > 0 && item.done >= item.required;
    const pct = item.required > 0 ? Math.min(100, Math.round((item.done / item.required) * 100)) : 0;
    return (
        <View style={{ marginBottom: 14 }}>
            <View style={styles.barTop}>
                <Text style={styles.body}>{item.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700' }}>
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

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('de-DE', {
        timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

export default function SchuelerDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState<string | null>(null);
    const [licenseClass, setLicenseClass] = useState('—');
    const [status, setStatus] = useState('—');
    const [items, setItems] = useState<Item[]>([]);
    const [practical, setPractical] = useState(0);
    const [theoryExam, setTheoryExam] = useState('not_scheduled');
    const [practicalExam, setPracticalExam] = useState('not_scheduled');
    const [notes, setNotes] = useState<Note[]>([]);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [noteError, setNoteError] = useState('');

    const loadNotes = useCallback(async () => {
        const { data, error } = await supabase
            .from('student_notes')
            .select('id, content, created_at')
            .eq('student_id', id)
            .eq('category', 'training')
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) {
            setNoteError('Notizen konnten nicht geladen werden.');
            return;
        }
        setNotes((data ?? []).map((n) => ({ id: n.id, content: n.content, createdAt: n.created_at })));
    }, [id]);

    useEffect(() => {
        let active = true;
        (async () => {
            const [profile, rec, prog, cfg] = await Promise.all([
                supabase.from('profiles').select('first_name, last_name, phone').eq('id', id).maybeSingle(),
                supabase.from('student_records').select('license_class, training_status').eq('profile_id', id).maybeSingle(),
                supabase.from('training_progress').select('*').eq('student_id', id).maybeSingle(),
                supabase.from('business_config').select('key, value').in('key', KEYS),
            ]);
            if (!active) return;

            if (!profile.data) {
                setError('Fahrschüler nicht gefunden oder nicht zugewiesen.');
                setLoading(false);
                return;
            }

            const min = Object.fromEntries((cfg.data ?? []).map((c) => [c.key, Number(c.value)]));
            const p: any = prog.data ?? {};
            setName(`${profile.data.first_name ?? ''} ${profile.data.last_name ?? ''}`.trim() || '—');
            setPhone(profile.data.phone);
            setLicenseClass(rec.data ? String(rec.data.license_class) : '—');
            setStatus(rec.data ? String(rec.data.training_status) : '—');
            setItems([
                { label: 'Theorieunterricht', done: p.theory_lessons_completed ?? 0, required: min.theory_lessons_minimum_b ?? 0 },
                { label: 'Überlandfahrten', done: p.uberland_lessons_count ?? 0, required: min.uberland_lessons_minimum_b ?? 0 },
                { label: 'Autobahnfahrten', done: p.autobahn_lessons_count ?? 0, required: min.autobahn_lessons_minimum_b ?? 0 },
                { label: 'Nachtfahrten', done: p.night_lessons_count ?? 0, required: min.night_lessons_minimum_b ?? 0 },
            ]);
            setPractical(p.practical_lessons_count ?? 0);
            setTheoryExam(String(p.theory_exam_status ?? 'not_scheduled'));
            setPracticalExam(String(p.practical_exam_status ?? 'not_scheduled'));
            await loadNotes();
            if (active) setLoading(false);
        })();
        return () => { active = false; };
    }, [id, loadNotes]);

    async function addNote() {
        const text = draft.trim();
        if (!text) return;
        setSaving(true);
        setNoteError('');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSaving(false); return; }
        const { error } = await supabase.from('student_notes').insert({
            student_id: id,
            author_id: user.id,
            category: 'training',
            content: text,
        });
        setSaving(false);
        if (error) {
            setNoteError('Notiz konnte nicht gespeichert werden.');
            return;
        }
        setDraft('');
        await loadNotes();
    }

    return (
        <SafeAreaView style={[styles.safeArea, loading && styles.center]}>
            {loading ? (
                <ActivityIndicator color={ORANGE} />
            ) : (
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => goBack(router, '/instructor/schueler')}>
                            <Ionicons name="arrow-back" size={22} color="#ffffff" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>{name || 'Fahrschüler'}</Text>
                            <Text style={styles.headerSubtitle}>
                                Klasse {licenseClass} · {TRAINING_LABEL[status] ?? status}
                            </Text>
                        </View>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {!error && (
                        <>
                            {phone ? (
                                <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(`tel:${phone}`)}>
                                    <Text style={styles.label}>Telefon</Text>
                                    <Text style={[styles.value, { color: ORANGE }]}>{phone}</Text>
                                </TouchableOpacity>
                            ) : null}

                            <Text style={styles.sectionTitle}>Ausbildungsstand</Text>
                            <View style={styles.card2}>
                                {items.map((i) => <Bar key={i.label} item={i} />)}
                                <View style={styles.row}>
                                    <Text style={styles.body}>Übungsstunden gesamt</Text>
                                    <Text style={styles.valueSmall}>{practical}</Text>
                                </View>
                                <View style={[styles.row, { marginTop: 10 }]}>
                                    <Text style={styles.body}>Theorieprüfung</Text>
                                    <Text style={styles.valueSmall}>{EXAM_LABEL[theoryExam] ?? theoryExam}</Text>
                                </View>
                                <View style={[styles.row, { marginTop: 10 }]}>
                                    <Text style={styles.body}>Praktische Prüfung</Text>
                                    <Text style={styles.valueSmall}>{EXAM_LABEL[practicalExam] ?? practicalExam}</Text>
                                </View>
                            </View>

                            <Text style={styles.sectionTitle}>Ausbildungsnotizen</Text>
                            <View style={styles.card2}>
                                <TextInput
                                    style={styles.input}
                                    value={draft}
                                    onChangeText={setDraft}
                                    placeholder="Neue Notiz, z. B. Schaltvorgang üben"
                                    placeholderTextColor="#6b6b70"
                                    multiline
                                />
                                {noteError ? <Text style={styles.errorText}>{noteError}</Text> : null}
                                <TouchableOpacity
                                    style={[styles.saveButton, (!draft.trim() || saving) && { opacity: 0.4 }]}
                                    onPress={addNote}
                                    disabled={!draft.trim() || saving}
                                >
                                    <Text style={styles.saveText}>{saving ? 'Speichern…' : 'Notiz speichern'}</Text>
                                </TouchableOpacity>
                            </View>

                            {notes.length === 0 ? (
                                <Text style={styles.muted}>Noch keine Notizen.</Text>
                            ) : (
                                notes.map((n) => (
                                    <View key={n.id} style={styles.card2}>
                                        <Text style={styles.body}>{n.content}</Text>
                                        <Text style={styles.time}>{formatDateTime(n.createdAt)}</Text>
                                    </View>
                                ))
                            )}
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BACKGROUND },
    center: { alignItems: 'center', justifyContent: 'center' },
    container: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
    backButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: CARD,
        borderWidth: 1, borderColor: '#3a3a3f', alignItems: 'center', justifyContent: 'center', marginRight: 13,
    },
    headerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
    headerSubtitle: { color: '#8f8f94', fontSize: 13, marginTop: 3 },
    sectionTitle: { color: '#ffffff', fontSize: 19, fontWeight: '800', marginTop: 12, marginBottom: 13 },
    errorText: { color: '#ff5c5c', fontSize: 14, marginBottom: 12 },
    card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 16, marginBottom: 12 },
    card2: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 16, marginBottom: 12 },
    label: { color: '#8f8f94', fontSize: 12, marginBottom: 4 },
    value: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
    valueSmall: { color: '#d0d0d4', fontSize: 14, fontWeight: '700' },
    body: { color: '#ffffff', fontSize: 14, lineHeight: 20 },
    muted: { color: '#8f8f94', fontSize: 14 },
    time: { color: '#77777c', fontSize: 12, marginTop: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    barTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    track: { height: 8, borderRadius: 4, backgroundColor: '#2a2a2e', overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4 },
    input: {
        minHeight: 70, color: '#ffffff', fontSize: 14, borderWidth: 1, borderColor: '#3a3a3f',
        borderRadius: 12, padding: 12, textAlignVertical: 'top', backgroundColor: BACKGROUND,
    },
    saveButton: { marginTop: 12, backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    saveText: { color: '#000000', fontWeight: '800', fontSize: 14 },
});
