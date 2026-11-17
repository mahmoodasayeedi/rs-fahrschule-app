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
import { useRouter } from 'expo-router';

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
const router = useRouter();
const EXAM_TYPE_LABELS: Record<string, string> = {
    theory: 'Theorieprüfung',
    practical: 'Praktische Prüfung',
};

const NOTIFICATION_TITLES: Record<string, string> = {
    request_received: 'Terminanfrage eingegangen',
    appointment_confirmed: 'Termin bestätigt',
    appointment_rejected: 'Termin abgelehnt',
    alternative_proposed: 'Alternativtermin vorgeschlagen',
    lesson_reminder_48h: 'Erinnerung: Fahrstunde in 48 Stunden',
    lesson_reminder_24h: 'Erinnerung: Fahrstunde in 24 Stunden',
    theory_exam_reminder: 'Erinnerung: Theorieprüfung',
    practical_exam_reminder: 'Erinnerung: Praktische Prüfung',
    appointment_changed: 'Termin geändert',
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

function formatGermanDate(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00`);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function formatRelativeGerman(isoTimestamp: string): string {
    const diffMs = Date.now() - new Date(isoTimestamp).getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `Vor ${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Vor ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `Vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;

    return formatGermanDate(isoTimestamp.slice(0, 10));
}

type NextLesson = {
    id: string;
    day: string;
    month: string;
    timeRange: string;
    instructorName: string;
    pickupLocation: string;
};

type UpcomingExam = {
    typeLabel: string;
    dateText: string;
    locationText: string;
};
type ProposedAlternative = {
    id: string;
    dateText: string;
    timeText: string;
};
type LatestNotification = {
    title: string;
    body: string;
    timeText: string;
};

export default function StudentDashboardScreen() {
    const [menuVisible, setMenuVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [trainingStatus, setTrainingStatus] = useState<string | null>(null);
    const [progressPercent, setProgressPercent] = useState(0);
    const [nextStepsText, setNextStepsText] = useState('');
    const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);
    const [upcomingExam, setUpcomingExam] = useState<UpcomingExam | null>(null);
    const [latestNotification, setLatestNotification] = useState<LatestNotification | null>(null);

    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const router = useRouter();
    const [alternativeAppointmentId, setAlternativeAppointmentId] = useState<string | null>(null);
    const [proposedAlternatives, setProposedAlternatives] = useState<ProposedAlternative[]>([]);
    const [selectingProposalId, setSelectingProposalId] = useState<string | null>(null);

    async function handleLogout() {
        setMenuVisible(false);
        await supabase.auth.signOut();
    }
    async function handleCancel() {
        if (!nextLesson) return;
        const confirmed = window.confirm('Fahrstunde wirklich stornieren?');
        if (!confirmed) return;

        setCancelling(true);
        setCancelError('');
        const { error } = await supabase.rpc('cancel_appointment', { appointment_id: nextLesson.id });
        setCancelling(false);

        if (error) {
            setCancelError(error.message);
            return;
        }

        location.reload();
    }
    async function handleSelectAlternative(proposalId: string) {
        setSelectingProposalId(proposalId);
        const { error } = await supabase.rpc('select_alternative_proposal', { proposal_id: proposalId });
        setSelectingProposalId(null);

        if (!error) {
            setAlternativeAppointmentId(null);
            setProposedAlternatives([]);
            // Simplest reliable way to refresh every card after confirming.
            location.reload();
        }
    }
    useEffect(() => {
        let active = true;

        async function loadDashboardData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date().toISOString().slice(0, 10);

            const [
                profileResult,
                recordResult,
                progressResult,
                configResult,
                appointmentResult,
                alternativeAppointmentResult,
                examParticipationResult,
                notificationResult,
            ] = await Promise.all([
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
                    .select('id,requested_date, requested_time, duration_minutes, pickup_location, instructor_id')
                    .eq('student_id', user.id)
                    .eq('status', 'confirmed')
                    .gte('requested_date', today)
                    .order('requested_date', { ascending: true })
                    .order('requested_time', { ascending: true })
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from('appointments')
                    .select('id')
                    .eq('student_id', user.id)
                    .eq('status', 'alternative_proposed')
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from('exam_participants')
                    .select('exam_event_id, result')
                    .eq('student_id', user.id),
                supabase
                    .from('notifications')
                    .select('type, title, body, created_at')
                    .eq('recipient_id', user.id)
                    .order('created_at', { ascending: false })
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
                        id: appointment.id,
                        day,
                        month,
                        timeRange: formatTimeRange(appointment.requested_time, appointment.duration_minutes),
                        instructorName,
                        pickupLocation: appointment.pickup_location,
                    });
                }
            }

            const altAppointment = alternativeAppointmentResult.data;
            if (altAppointment) {
                const { data: proposals } = await supabase
                    .from('alternative_proposals')
                    .select('id, proposed_date, proposed_time')
                    .eq('original_appointment_id', altAppointment.id)
                    .eq('selected', false);

                if (active && proposals) {
                    setAlternativeAppointmentId(altAppointment.id);
                    setProposedAlternatives(
                        proposals.map((p) => ({
                            id: p.id,
                            dateText: formatGermanDate(p.proposed_date),
                            timeText: p.proposed_time.slice(0, 5),
                        }))
                    );
                }
            }

            // Exam card: fetch the student's exam events separately, then
            // join and pick the nearest upcoming one in plain JS — avoids
            // relying on Supabase's embedded-join/filter syntax for a
            // relationship this simple.
            const participations = examParticipationResult.data ?? [];
            if (participations.length > 0) {
                const eventIds = participations.map((p) => p.exam_event_id);
                const { data: events } = await supabase
                    .from('exam_events')
                    .select('id, exam_type, exam_date, exam_location')
                    .in('id', eventIds);

                if (active && events) {
                    const upcoming = events
                        .filter((e) => e.exam_date >= today)
                        .sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0];

                    if (upcoming) {
                        setUpcomingExam({
                            typeLabel: EXAM_TYPE_LABELS[upcoming.exam_type] ?? upcoming.exam_type,
                            dateText: formatGermanDate(upcoming.exam_date),
                            locationText: upcoming.exam_location,
                        });
                    }
                }
            }

            const notification = notificationResult.data;
            if (notification) {
                setLatestNotification({
                    title: NOTIFICATION_TITLES[notification.type] ?? notification.title,
                    body: notification.body,
                    timeText: formatRelativeGerman(notification.created_at),
                });
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

                    <TouchableOpacity onPress={() => router.push('/student/meine-termine')}>
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
                            {cancelError ? <Text style={styles.cancelErrorText}>{cancelError}</Text> : null}

                            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={cancelling}>
                                <Text style={styles.cancelButtonText}>
                                    {cancelling ? 'Wird storniert…' : 'Stornieren'}
                                </Text>
                            </TouchableOpacity>
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
                {alternativeAppointmentId && proposedAlternatives.length > 0 && (
                    <View style={styles.alternativeCard}>
                        <Text style={styles.alternativeTitle}>Alternativtermine vorgeschlagen</Text>
                        <Text style={styles.alternativeSubtitle}>
                            Die Fahrschule hat folgende Alternativen vorgeschlagen. Bitte wähle einen Termin:
                        </Text>

                        {proposedAlternatives.map((alt) => (
                            <TouchableOpacity
                                key={alt.id}
                                style={styles.alternativeOption}
                                onPress={() => handleSelectAlternative(alt.id)}
                                disabled={selectingProposalId === alt.id}
                            >
                                <View>
                                    <Text style={styles.alternativeOptionDate}>{alt.dateText}</Text>
                                    <Text style={styles.alternativeOptionTime}>{alt.timeText} Uhr</Text>
                                </View>

                                <Text style={styles.alternativeSelectText}>
                                    {selectingProposalId === alt.id ? '…' : 'Wählen'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Main action */}
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/student/termin-anfragen')}>
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
                        href="/student/meine-termine"
                    />

                    <DashboardTile
                        icon="stats-chart-outline"
                        title="Fortschritt"
                        subtitle="Ausbildungsstand"
                        href="/student/fortschritt"
                    />

                    <DashboardTile
                        icon="school-outline"
                        title="Prüfungen"
                        subtitle="Termine & Status"
                        href="/student/pruefungen"
                    />

                    <DashboardTile
                        icon="notifications-outline"
                        title="Mitteilungen"
                        subtitle="Neuigkeiten"
                        href="/student/mitteilungen"
                    />
                </View>

                {/* Exam info */}
                <Text style={styles.sectionTitleStandalone}>
                    Prüfung
                </Text>

                <TouchableOpacity style={styles.examCard} onPress={() => router.push('/student/pruefungen')}>
                    <View style={styles.examIcon}>
                        <Ionicons
                            name="school-outline"
                            size={26}
                            color={ORANGE}
                        />
                    </View>

                    <View style={styles.examContent}>
                        <Text style={styles.examType}>
                            {upcomingExam ? upcomingExam.typeLabel : 'Theorieprüfung'}
                        </Text>

                        <Text style={styles.examText}>
                            {upcomingExam
                                ? `${upcomingExam.dateText} · ${upcomingExam.locationText}`
                                : 'Noch kein Prüfungstermin eingetragen.'}
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="#7d7d82"
                    />
                </TouchableOpacity>

                {/* Notifications */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Mitteilungen
                    </Text>

                    <TouchableOpacity onPress={() => router.push('/student/mitteilungen')}>
                        <Text style={styles.sectionLink}>
                            Alle anzeigen
                        </Text>
                    </TouchableOpacity>
                </View>

                {latestNotification ? (
                    <View style={styles.notificationCard}>
                        <View style={styles.notificationDot} />

                        <View style={styles.notificationContent}>
                            <Text style={styles.notificationTitle}>
                                {latestNotification.title}
                            </Text>

                            <Text style={styles.notificationText}>
                                {latestNotification.body}
                            </Text>

                            <Text style={styles.notificationTime}>
                                {latestNotification.timeText}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.notificationCard}>
                        <View style={styles.notificationContent}>
                            <Text style={styles.notificationText}>
                                Keine neuen Mitteilungen.
                            </Text>
                        </View>
                    </View>
                )}

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
    href,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    href?: string;
}) {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.tile}
            onPress={href ? () => router.push(href as any) : undefined}
        >
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
    cancelButton: { marginTop: 14, alignSelf: 'flex-start' },
    cancelButtonText: { color: '#ff5c5c', fontSize: 13, fontWeight: '700' },
    cancelErrorText: { color: '#ff5c5c', fontSize: 12, marginTop: 10 },
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
    alternativeCard: {
        backgroundColor: CARD, borderWidth: 1, borderColor: '#49331d', borderRadius: 18,
        padding: 16, marginTop: 12,
    },
    alternativeTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
    alternativeSubtitle: { color: '#a3a3a8', fontSize: 12, lineHeight: 17, marginBottom: 14 },
    alternativeOption: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#0d0d0f', borderWidth: 1, borderColor: BORDER, borderRadius: 14,
        padding: 12, marginBottom: 8,
    },
    alternativeOptionDate: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
    alternativeOptionTime: { color: '#9c9ca1', fontSize: 12, marginTop: 2 },
    alternativeSelectText: { color: ORANGE, fontSize: 13, fontWeight: '800' },
});