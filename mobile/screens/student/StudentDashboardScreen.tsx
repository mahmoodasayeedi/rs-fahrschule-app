import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
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

const TRAINING_STATUS_LABELS: Record<string, string> = {
    registered: 'Anmeldung',
    theory_phase: 'Theoriephase',
    practice_phase: 'Praxisphase',
    ready_for_exam: 'Prüfungsreif',
    licensed: 'Führerschein erhalten',
    paused: 'Pausiert',
    withdrawn: 'Abgemeldet',
};

const GERMAN_MONTHS = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];

function formatLessonDate(isoDate: string): { day: string; month: string } {
    const date = new Date(`${isoDate}T00:00:00`);
    return {
        day: date.getDate().toString().padStart(2, '0'),
        month: GERMAN_MONTHS[date.getMonth()],
    };
}

function formatTimeRange(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date(2000, 0, 1, hours, minutes);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())} Uhr`;
}

type NextLesson = {
    day: string;
    month: string;
    timeRange: string;
    instructorName: string;
    pickupLocation: string;
};

export default function StudentDashboardScreen() {
    const [menuVisible, setMenuVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [trainingStatus, setTrainingStatus] = useState<string | null>(null);
    const [progressPercent, setProgressPercent] = useState(0);
    const [nextStepsText, setNextStepsText] = useState('');
    const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);

    async function handleLogout() {
        setMenuVisible(false);
        await supabase.auth.signOut();
    }

    useEffect(() => {
        let active = true;

        async function loadDashboardData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date().toISOString().slice(0, 10);

            const [profileResult, recordResult, progressResult, configResult, appointmentResult] = await Promise.all([
                supabase.from('profiles').select('first_name').eq('id', user.id).single(),
                supabase.from('student_records').select('training_status').eq('profile_id', user.id).single(),
                supabase.from('training_progress').select('*').eq('student_id', user.id).single(),
                supabase.from('business_config').select('key, value').in('key', [
                    'theory_lessons_minimum_b',
                    'uberland_lessons_minimum_b',
                    'autobahn_lessons_minimum_b',
                    'night_lessons_minimum_b',
                ]),
                supabase
                    .from('appointments')
                    .select('requested_date, requested_time, duration_minutes, pickup_location, instructor_id')
                    .eq('student_id', user.id)
                    .eq('status', 'confirmed')
                    .gte('requested_date', today)
                    .order('requested_date', { ascending: true })
                    .order('requested_time', { ascending: true })
                    .limit(1)
                    .maybeSingle(),
            ]);

            if (!active) return;

            setFirstName(profileResult.data?.first_name ?? '');
            setTrainingStatus(recordResult.data?.training_status ?? null);

            const progress = progressResult.data;
            const config = configResult.data;

            if (progress && config) {
                const thresholds = Object.fromEntries(config.map((c) => [c.key, Number(c.value)]));

                const categories = [
                    { done: progress.theory_lessons_completed, required: thresholds.theory_lessons_minimum_b || 14, label: 'Theorieunterricht' },
                    { done: progress.uberland_lessons_count, required: thresholds.uberland_lessons_minimum_b || 5, label: 'Überlandfahrten' },
                    { done: progress.autobahn_lessons_count, required: thresholds.autobahn_lessons_minimum_b || 4, label: 'Autobahnfahrten' },
                    { done: progress.night_lessons_count, required: thresholds.night_lessons_minimum_b || 3, label: 'Nachtfahrten' },
                ];

                const percentPerCategory = categories.map((c) => Math.min(c.done / c.required, 1));
                const overallPercent = Math.round(
                    (percentPerCategory.reduce((sum, p) => sum + p, 0) / categories.length) * 100
                );
                setProgressPercent(overallPercent);

                const remaining = categories.filter((c) => c.done < c.required);
                setNextStepsText(
                    remaining.length === 0
                        ? 'Alle Pflichtfahrten sind abgeschlossen. Als Nächstes steht die praktische Prüfung an.'
                        : `Als Nächstes fehlen noch: ${remaining.map((c) => `${c.label} (${c.done}/${c.required})`).join(', ')}.`
                );
            }

            const appointment = appointmentResult.data;
            if (appointment) {
                let instructorName = 'Noch nicht zugewiesen';

                if (appointment.instructor_id) {
                    const { data: instructorProfile } = await supabase
                        .from('profiles')
                        .select('first_name, last_name')
                        .eq('id', appointment.instructor_id)
                        .single();

                    if (instructorProfile) {
                        instructorName = `${instructorProfile.first_name} ${instructorProfile.last_name}`.trim();
                    }
                }

                if (active) {
                    const { day, month } = formatLessonDate(appointment.requested_date);
                    setNextLesson({
                        day,
                        month,
                        timeRange: formatTimeRange(appointment.requested_time, appointment.duration_minutes),
                        instructorName,
                        pickupLocation: appointment.pickup_location,
                    });
                }
            }

            setLoading(false);
        }

        loadDashboardData();
        return () => { active = false; };
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color={ORANGE} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.smallText}>Guten Tag</Text>
                        <Text style={styles.name}>{firstName || '...'}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => setMenuVisible(true)}
                    >
                        <Ionicons name="person-outline" size={22} color="#ffffff" />
                    </TouchableOpacity>

                    <Modal
                        visible={menuVisible}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setMenuVisible(false)}
                    >
                        <Pressable
                            style={styles.menuOverlay}
                            onPress={() => setMenuVisible(false)}
                        >
                            <View style={styles.menuCard}>
                                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                                    <Ionicons name="log-out-outline" size={20} color="#ff8800" />
                                    <Text style={styles.menuItemText}>Abmelden</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Modal>
                </View>

                {/* Welcome card */}
                <View style={styles.welcomeCard}>
                    <View style={styles.welcomeIcon}>
                        <Ionicons
                            name="car-sport-outline"
                            size={34}
                            color={ORANGE}
                        />
                    </View>

                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeTitle}>
                            Deine Fahrausbildung
                        </Text>

                        <Text style={styles.welcomeText}>
                            Behalte deine Termine, deinen Fortschritt und deine
                            Prüfungen im Blick.
                        </Text>
                    </View>
                </View>

                {/* Next lesson */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Nächste Fahrstunde
                    </Text>

                    <TouchableOpacity>
                        <Text style={styles.sectionLink}>
                            Alle Termine
                        </Text>
                    </TouchableOpacity>
                </View>

                {nextLesson ? (
                    <View style={styles.lessonCard}>
                        <View style={styles.lessonDate}>
                            <Text style={styles.lessonDay}>{nextLesson.day}</Text>
                            <Text style={styles.lessonMonth}>{nextLesson.month}</Text>
                        </View>

                        <View style={styles.lessonInfo}>
                            <Text style={styles.lessonTitle}>
                                Praktische Fahrstunde
                            </Text>

                            <InfoRow
                                icon="time-outline"
                                text={nextLesson.timeRange}
                            />

                            <InfoRow
                                icon="person-outline"
                                text={`Fahrlehrer: ${nextLesson.instructorName}`}
                            />

                            <InfoRow
                                icon="location-outline"
                                text={`Abholung: ${nextLesson.pickupLocation}`}
                            />
                        </View>

                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                                Bestätigt
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.lessonCard}>
                        <View style={styles.lessonInfo}>
                            <Text style={styles.lessonTitle}>
                                Keine bestätigte Fahrstunde
                            </Text>

                            <Text style={styles.infoText}>
                                Du hast aktuell keinen bestätigten Termin. Fordere
                                jetzt einen neuen Termin an.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Main action */}
                <TouchableOpacity style={styles.primaryButton}>
                    <Ionicons
                        name="calendar-outline"
                        size={22}
                        color="#ffffff"
                    />

                    <Text style={styles.primaryButtonText}>
                        Termin anfragen
                    </Text>

                    <Ionicons
                        name="arrow-forward"
                        size={21}
                        color="#ffffff"
                    />
                </TouchableOpacity>

                {/* Progress */}
                <Text style={styles.sectionTitleStandalone}>
                    Ausbildungsfortschritt
                </Text>

                <View style={styles.progressCard}>
                    <View style={styles.progressTop}>
                        <View>
                            <Text style={styles.progressLabel}>
                                Dein aktueller Stand
                            </Text>

                            <Text style={styles.progressStatus}>
                                {trainingStatus ? TRAINING_STATUS_LABELS[trainingStatus] : '...'}
                            </Text>
                        </View>

                        <View style={styles.progressPercentCircle}>
                            <Text style={styles.progressPercent}>
                                {progressPercent}%
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressBackground}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>

                    <Text style={styles.progressHint}>
                        {nextStepsText}
                    </Text>
                </View>

                {/* Quick actions */}
                <Text style={styles.sectionTitleStandalone}>
                    Schnellzugriff
                </Text>

                <View style={styles.grid}>
                    <DashboardTile
                        icon="calendar-outline"
                        title="Meine Termine"
                        subtitle="Termine ansehen"
                    />

                    <DashboardTile
                        icon="stats-chart-outline"
                        title="Fortschritt"
                        subtitle="Ausbildungsstand"
                    />

                    <DashboardTile
                        icon="school-outline"
                        title="Prüfungen"
                        subtitle="Termine & Status"
                    />

                    <DashboardTile
                        icon="notifications-outline"
                        title="Mitteilungen"
                        subtitle="Neuigkeiten"
                    />
                </View>

                {/* Exam info */}
                <Text style={styles.sectionTitleStandalone}>
                    Prüfung
                </Text>

                <View style={styles.examCard}>
                    <View style={styles.examIcon}>
                        <Ionicons
                            name="school-outline"
                            size={26}
                            color={ORANGE}
                        />
                    </View>

                    <View style={styles.examContent}>
                        <Text style={styles.examType}>
                            Theorieprüfung
                        </Text>

                        <Text style={styles.examText}>
                            Noch kein Prüfungstermin eingetragen.
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="#7d7d82"
                    />
                </View>

                {/* Notifications */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Mitteilungen
                    </Text>

                    <TouchableOpacity>
                        <Text style={styles.sectionLink}>
                            Alle anzeigen
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.notificationCard}>
                    <View style={styles.notificationDot} />

                    <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>
                            Termin bestätigt
                        </Text>

                        <Text style={styles.notificationText}>
                            Deine Fahrstunde am 18. September wurde bestätigt.
                        </Text>

                        <Text style={styles.notificationTime}>
                            Vor 2 Stunden
                        </Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    RS Fahrschule
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({
    icon,
    text,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
}) {
    return (
        <View style={styles.infoRow}>
            <Ionicons
                name={icon}
                size={16}
                color="#99999f"
            />

            <Text style={styles.infoText}>
                {text}
            </Text>
        </View>
    );
}

function DashboardTile({
    icon,
    title,
    subtitle,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
}) {
    return (
        <TouchableOpacity style={styles.tile}>
            <View style={styles.tileIcon}>
                <Ionicons
                    name={icon}
                    size={24}
                    color={ORANGE}
                />
            </View>

            <Text style={styles.tileTitle}>
                {title}
            </Text>

            <Text style={styles.tileSubtitle}>
                {subtitle}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BACKGROUND,
    },

    container: {
        paddingHorizontal: 22,
        paddingTop: 20,
        paddingBottom: 40,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },

    smallText: {
        color: '#8c8c91',
        fontSize: 14,
    },

    name: {
        color: '#ffffff',
        fontSize: 27,
        fontWeight: '900',
        marginTop: 2,
    },

    profileButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: '#3a3a3f',
        alignItems: 'center',
        justifyContent: 'center',
    },

    welcomeCard: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: '#3a2c1d',
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },

    welcomeIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    welcomeContent: {
        flex: 1,
    },

    welcomeTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 5,
    },

    welcomeText: {
        color: '#a3a3a8',
        fontSize: 13,
        lineHeight: 19,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 13,
    },

    sectionTitle: {
        color: '#ffffff',
        fontSize: 19,
        fontWeight: '800',
    },

    sectionTitleStandalone: {
        color: '#ffffff',
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 13,
        marginTop: 29,
    },

    sectionLink: {
        color: ORANGE,
        fontSize: 13,
        fontWeight: '700',
    },

    lessonCard: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        position: 'relative',
    },

    lessonDate: {
        width: 58,
        height: 67,
        borderRadius: 14,
        backgroundColor: '#221b14',
        borderWidth: 1,
        borderColor: '#543617',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    lessonDay: {
        color: ORANGE,
        fontSize: 25,
        fontWeight: '900',
    },

    lessonMonth: {
        color: '#d0d0d3',
        fontSize: 11,
        fontWeight: '700',
    },

    lessonInfo: {
        flex: 1,
        paddingRight: 5,
    },

    lessonTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 9,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        gap: 6,
    },

    infoText: {
        color: '#a5a5aa',
        fontSize: 12,
        flex: 1,
    },

    statusBadge: {
        position: 'absolute',
        right: 12,
        top: 12,
        backgroundColor: '#153821',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 15,
    },

    statusText: {
        color: '#79d495',
        fontSize: 10,
        fontWeight: '700',
    },

    primaryButton: {
        height: 58,
        borderRadius: 30,
        backgroundColor: ORANGE,
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },

    primaryButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
    },

    progressCard: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        padding: 18,
    },

    progressTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    progressLabel: {
        color: '#99999f',
        fontSize: 13,
    },

    progressStatus: {
        color: '#ffffff',
        fontSize: 21,
        fontWeight: '900',
        marginTop: 4,
    },

    progressPercentCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#211a13',
        borderWidth: 2,
        borderColor: ORANGE,
        alignItems: 'center',
        justifyContent: 'center',
    },

    progressPercent: {
        color: ORANGE,
        fontSize: 15,
        fontWeight: '900',
    },

    progressBackground: {
        height: 8,
        borderRadius: 5,
        backgroundColor: '#303034',
        marginTop: 18,
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        borderRadius: 5,
        backgroundColor: ORANGE,
    },

    progressHint: {
        color: '#939398',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 13,
    },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },

    tile: {
        width: '48%',
        minHeight: 135,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        padding: 16,
    },

    tileIcon: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 13,
    },

    tileTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '800',
    },

    tileSubtitle: {
        color: '#8e8e93',
        fontSize: 12,
        marginTop: 5,
    },

    examCard: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },

    examIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    examContent: {
        flex: 1,
    },

    examType: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '800',
    },

    examText: {
        color: '#929297',
        fontSize: 12,
        marginTop: 5,
    },

    notificationCard: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
    },

    notificationDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: ORANGE,
        marginTop: 5,
        marginRight: 12,
    },

    notificationContent: {
        flex: 1,
    },

    notificationTitle: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '800',
    },

    notificationText: {
        color: '#9b9ba0',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 5,
    },

    notificationTime: {
        color: '#67676c',
        fontSize: 11,
        marginTop: 8,
    },

    footer: {
        color: '#68686d',
        textAlign: 'center',
        fontSize: 12,
        marginTop: 35,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 70,
        paddingRight: 20,
    },

    menuCard: {
        backgroundColor: '#171719',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2a2a2e',
        paddingVertical: 6,
        minWidth: 180,
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },

    menuItemText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
});