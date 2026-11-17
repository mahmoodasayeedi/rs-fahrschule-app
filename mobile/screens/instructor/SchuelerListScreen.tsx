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

type Student = { id: string; name: string; licenseClass: string; status: string };

export default function SchuelerListScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        let active = true;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: assignments, error: aErr } = await supabase
                .from('instructor_student_assignments')
                .select('student_id')
                .eq('instructor_id', user.id)
                .eq('is_active', true);

            if (aErr) {
                if (active) { setError('Fahrschüler konnten nicht geladen werden.'); setLoading(false); }
                return;
            }

            const ids = (assignments ?? []).map((a) => a.student_id);
            if (ids.length === 0) {
                if (active) { setStudents([]); setLoading(false); }
                return;
            }

            const [people, records] = await Promise.all([
                supabase.from('profiles').select('id, first_name, last_name').in('id', ids),
                supabase.from('student_records').select('profile_id, license_class, training_status').in('profile_id', ids),
            ]);
            if (!active) return;

            const recById = new Map((records.data ?? []).map((r) => [r.profile_id, r]));
            const list: Student[] = (people.data ?? []).map((p) => {
                const r = recById.get(p.id);
                return {
                    id: p.id,
                    name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || '—',
                    licenseClass: r ? String(r.license_class) : '—',
                    status: r ? String(r.training_status) : '—',
                };
            });
            list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
            setStudents(list);
            setLoading(false);
        })();
        return () => { active = false; };
    }, []);

    return (
        <SafeAreaView style={[styles.safeArea, loading && styles.center]}>
            {loading ? (
                <ActivityIndicator color={ORANGE} />
            ) : (
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => goBack(router, '/instructor/dashboard')}>
                            <Ionicons name="arrow-back" size={22} color="#ffffff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Meine Fahrschüler</Text>
                            <Text style={styles.headerSubtitle}>{students.length} zugewiesen</Text>
                        </View>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {students.length === 0 && !error ? (
                        <View style={styles.card}>
                            <Text style={styles.muted}>Dir sind noch keine Fahrschüler zugewiesen.</Text>
                        </View>
                    ) : (
                        students.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                style={styles.card}
                                onPress={() => router.push(`/instructor/schueler/${s.id}` as any)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.name}>{s.name}</Text>
                                    <Text style={styles.muted}>
                                        Klasse {s.licenseClass} · {TRAINING_LABEL[s.status] ?? s.status}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={22} color="#7d7d82" />
                            </TouchableOpacity>
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
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
    backButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: CARD,
        borderWidth: 1, borderColor: '#3a3a3f', alignItems: 'center', justifyContent: 'center', marginRight: 13,
    },
    headerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
    headerSubtitle: { color: '#8f8f94', fontSize: 13, marginTop: 3 },
    errorText: { color: '#ff5c5c', fontSize: 14, marginBottom: 14 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18,
        padding: 16, marginBottom: 12,
    },
    name: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
    muted: { color: '#8f8f94', fontSize: 13, marginTop: 4 },
});
