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

type TravelChoice = 'self' | 'with_fahrschule' | null;

type Exam = {
    participantId: string;
    travelChoice: TravelChoice;
    result: string;
    title: string;
    examType: string;
    date: string; // yyyy-mm-dd
    time: string;
    location: string;
    meetingPoint: string | null;
    departure: string | null;
    instructions: string | null;
};

const TYPE_LABEL: Record<string, string> = {
    theory: 'Theorieprüfung',
    practical: 'Praktische Prüfung',
};

const RESULT_LABEL: Record<string, { text: string; color: string }> = {
    passed: { text: 'Bestanden', color: '#79d495' },
    failed: { text: 'Nicht bestanden', color: '#ff5c5c' },
    no_show: { text: 'Nicht erschienen', color: '#ff5c5c' },
};

function formatGermanDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
}

function hhmm(value: string | null): string {
    return value ? String(value).slice(0, 5) : '';
}

// Today's date in Germany as yyyy-mm-dd.
function germanToday(): string {
    try {
        return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
    } catch {
        const d = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
}

export default function PruefungenScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [exams, setExams] = useState<Exam[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [saveError, setSaveError] = useState('');

    const load = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: participations, error } = await supabase
            .from('exam_participants')
            .select('id, exam_event_id, travel_choice, result')
            .eq('student_id', user.id);

        if (error) {
            setLoadError('Prüfungen konnten nicht geladen werden.');
            setLoading(false);
            return;
        }

        const list = participations ?? [];
        if (list.length === 0) {
            setExams([]);
            setLoading(false);
            return;
        }

        const { data: events, error: eventsError } = await supabase
            .from('exam_events')
            .select('id, exam_type, title, exam_date, exam_time, exam_location, meeting_point, departure_time, instructions')
            .in('id', list.map((p) => p.exam_event_id));

        if (eventsError || !events) {
            setLoadError('Prüfungen konnten nicht geladen werden.');
            setLoading(false);
            return;
        }

        const byId = new Map(events.map((e) => [e.id, e]));
        const merged: Exam[] = [];

        for (const p of list) {
            const e = byId.get(p.exam_event_id);
            if (!e) continue;
            merged.push({
                participantId: p.id,
                travelChoice: p.travel_choice as TravelChoice,
                result: String(p.result),
                title: e.title,
                examType: String(e.exam_type),
                date: e.exam_date,
                time: hhmm(e.exam_time),
                location: e.exam_location,
                meetingPoint: e.meeting_point,
                departure: hhmm(e.departure_time) || null,
                instructions: e.instructions,
            });
        }

        setExams(merged);
        setLoadError('');
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function chooseTravel(exam: Exam, choice: 'self' | 'with_fahrschule') {
        if (exam.travelChoice === choice) return;

        setSaveError('');
        setSavingId(exam.participantId);

        const { data, error } = await supabase
            .from('exam_participants')
            .update({ travel_choice: choice })
            .eq('id', exam.participantId)
            .select('id');

        setSavingId(null);

        if (error || !data || data.length === 0) {
            setSaveError('Auswahl konnte nicht gespeichert werden. Bitte später erneut versuchen.');
            return;
        }

        await load();
    }

    function goBack() {
        if (router.canGoBack()) router.back();
        else router.replace('/student/dashboard');
    }

    const today = germanToday();
    const upcoming = exams
        .filter((e) => e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));
    const past = exams
        .filter((e) => e.date < today)
        .sort((a, b) => b.date.localeCompare(a.date));

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.center]}>
                <ActivityIndicator color={ORANGE} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={goBack}>
                        <Ionicons name="arrow-back" size={22} color="#ffffff" />
                    </TouchableOpacity>

                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Prüfungen</Text>
                        <Text style={styles.headerSubtitle}>Termine, Anreise und Ergebnisse</Text>
                    </View>
                </View>

                {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
                {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

                {/* Upcoming */}
                <Text style={styles.sectionTitle}>Bevorstehend</Text>

                {upcoming.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>
                            Aktuell bist du für keine Prüfung angemeldet. Die Fahrschule trägt dich
                            ein, sobald ein Termin feststeht.
                        </Text>
                    </View>
                ) : (
                    upcoming.map((exam) => (
                        <ExamCard
                            key={exam.participantId}
                            exam={exam}
                            editable={exam.result === 'pending' && exam.date > today}
                            saving={savingId === exam.participantId}
                            onChoose={(choice) => chooseTravel(exam, choice)}
                        />
                    ))
                )}

                {/* Past */}
                {past.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Vergangen</Text>
                        {past.map((exam) => (
                            <ExamCard
                                key={exam.participantId}
                                exam={exam}
                                editable={false}
                                saving={false}
                                onChoose={() => { }}
                            />
                        ))}
                    </>
                )}

                <Text style={styles.footer}>RS Fahrschule</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function ExamCard({
    exam,
    editable,
    saving,
    onChoose,
}: {
    exam: Exam;
    editable: boolean;
    saving: boolean;
    onChoose: (choice: 'self' | 'with_fahrschule') => void;
}) {
    const result = RESULT_LABEL[exam.result];

    return (
        <View style={styles.examCard}>
            <View style={styles.examTop}>
                <View style={styles.examIcon}>
                    <Ionicons name="school-outline" size={24} color={ORANGE} />
                </View>

                <View style={styles.examTopText}>
                    <Text style={styles.examTitle}>{exam.title}</Text>
                    <Text style={styles.examType}>{TYPE_LABEL[exam.examType] ?? exam.examType}</Text>
                </View>

                {result && (
                    <View style={[styles.resultBadge, { borderColor: result.color }]}>
                        <Text style={[styles.resultBadgeText, { color: result.color }]}>{result.text}</Text>
                    </View>
                )}
            </View>

            <InfoRow icon="calendar-outline" text={`${formatGermanDate(exam.date)}, ${exam.time} Uhr`} />
            <InfoRow icon="location-outline" text={`Prüfungsort: ${exam.location}`} />
            {exam.meetingPoint ? <InfoRow icon="flag-outline" text={`Treffpunkt: ${exam.meetingPoint}`} /> : null}
            {exam.departure ? <InfoRow icon="car-outline" text={`Abfahrt vom Büro: ${exam.departure} Uhr`} /> : null}
            {exam.instructions ? <InfoRow icon="information-circle-outline" text={exam.instructions} /> : null}

            {exam.result === 'pending' && (
                <View style={styles.travelBlock}>
                    <Text style={styles.travelLabel}>Wie reist du an?</Text>

                    <TravelOption
                        label="Ich fahre selbst zur Prüfung"
                        selected={exam.travelChoice === 'self'}
                        disabled={!editable || saving}
                        onPress={() => onChoose('self')}
                    />
                    <TravelOption
                        label="Ich möchte von der Fahrschule mitgenommen werden"
                        selected={exam.travelChoice === 'with_fahrschule'}
                        disabled={!editable || saving}
                        onPress={() => onChoose('with_fahrschule')}
                    />

                    {exam.travelChoice === null && editable && (
                        <Text style={styles.hintText}>Bitte wähle eine Option, damit die Fahrschule planen kann.</Text>
                    )}
                    {!editable && (
                        <Text style={styles.hintText}>
                            Die Anreise kann am Prüfungstag nicht mehr geändert werden. Bitte wende dich an das Büro.
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

function TravelOption({
    label,
    selected,
    disabled,
    onPress,
}: {
    label: string;
    selected: boolean;
    disabled: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.travelOption, selected && styles.travelOptionSelected, disabled && !selected && { opacity: 0.5 }]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.85}
        >
            <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
            </View>
            <Text style={[styles.travelOptionText, selected && { color: '#ffffff' }]}>{label}</Text>
        </TouchableOpacity>
    );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={16} color="#99999f" />
            <Text style={styles.infoText}>{text}</Text>
        </View>
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
    headerText: { flex: 1 },
    headerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
    headerSubtitle: { color: '#8f8f94', fontSize: 13, marginTop: 3 },

    sectionTitle: { color: '#ffffff', fontSize: 19, fontWeight: '800', marginBottom: 13 },

    emptyCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 18 },
    emptyText: { color: '#8c8c91', fontSize: 14, lineHeight: 20 },

    errorText: { color: '#ff5c5c', fontSize: 14, marginBottom: 14 },

    examCard: {
        backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18,
        padding: 16, marginBottom: 14,
    },
    examTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    examIcon: {
        width: 48, height: 48, borderRadius: 14, backgroundColor: '#211a13',
        alignItems: 'center', justifyContent: 'center', marginRight: 13,
    },
    examTopText: { flex: 1 },
    examTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
    examType: { color: '#929297', fontSize: 12, marginTop: 3 },

    resultBadge: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 4, marginLeft: 8 },
    resultBadgeText: { fontSize: 11, fontWeight: '700' },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
    infoText: { color: '#a5a5aa', fontSize: 13, flex: 1, lineHeight: 18 },

    travelBlock: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: BORDER },
    travelLabel: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 10 },
    travelOption: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: BACKGROUND,
        borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 13, marginBottom: 8,
    },
    travelOptionSelected: { borderColor: ORANGE, backgroundColor: '#1c1814' },
    travelOptionText: { color: '#b2b2b7', fontSize: 14, flex: 1, lineHeight: 19 },
    radio: {
        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#66666b',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    radioSelected: { borderColor: ORANGE },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
    hintText: { color: '#8c8c91', fontSize: 12, lineHeight: 17, marginTop: 4 },

    footer: { color: '#68686d', textAlign: 'center', fontSize: 12, marginTop: 35 },
});