import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { openCall, openMaps, openWhatsApp } from '../../lib/contact';
import { confirmAction } from '../../lib/confirm';
import { supabase } from '../../lib/supabase';

const ORANGE = '#ff8800';
const BACKGROUND = '#0d0d0f';
const CARD = '#171719';
const BORDER = '#2f2f33';

function formatGermanDate(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00`);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function formatTimeRange(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date(2000, 0, 1, hours, minutes);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())} Uhr`;
}

// "TT.MM.JJJJ" -> "JJJJ-MM-TT", or null if not a real, future date.
function parseGermanDate(input: string): string | null {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(input.trim());
    if (!match) return null;

    const [, dd, mm, yyyy] = match;
    const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const isRealDate =
        date.getUTCFullYear() === Number(yyyy) &&
        date.getUTCMonth() === Number(mm) - 1 &&
        date.getUTCDate() === Number(dd);

    if (!isRealDate || date < today) return null;
    return `${yyyy}-${mm}-${dd}`;
}

function parseGermanTime(input: string): string | null {
    // Accept either a colon or a period as the separator — some keyboards/
    // browsers auto-convert ':' to '.' in number-like fields.
    const normalized = input.trim().replace('.', ':');
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(normalized);
    return match ? `${match[1]}:${match[2]}:00` : null;
}

type AppointmentRow = {
    id: string;
    requested_date: string;
    requested_time: string;
    duration_minutes: number;
    pickup_location: string;
    end_location: string | null;
    lesson_type: string;
    student_note: string | null;
    student_id: string;
    studentName: string;
    studentPhone: string | null;
};

type AlternativeSlot = { date: string; time: string };

export default function InstructorDashboardScreen() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [pendingRequests, setPendingRequests] = useState<AppointmentRow[]>([]);
    const [confirmedLessons, setConfirmedLessons] = useState<AppointmentRow[]>([]);
    const [actioningId, setActioningId] = useState<string | null>(null);

    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectingAppointment, setRejectingAppointment] = useState<AppointmentRow | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const [proposeModalVisible, setProposeModalVisible] = useState(false);
    const [proposingAppointment, setProposingAppointment] = useState<AppointmentRow | null>(null);
    const [proposalSlots, setProposalSlots] = useState<AlternativeSlot[]>([{ date: '', time: '' }]);
    const [proposeError, setProposeError] = useState('');
    const [proposeSubmitting, setProposeSubmitting] = useState(false);

    const [finishableLessons, setFinishableLessons] = useState<AppointmentRow[]>([]);
    const [finishError, setFinishError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [cancelTarget, setCancelTarget] = useState<AppointmentRow | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelBusy, setCancelBusy] = useState(false);
    const [cancelError, setCancelError] = useState('');

    async function handleLogout() {
        setMenuVisible(false);
        await supabase.auth.signOut();
    }

    async function loadDashboard() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [profileResult, requestedResult, confirmedResult] = await Promise.all([
            supabase.from('profiles').select('first_name').eq('id', user.id).single(),
            supabase
                .from('appointments')
                .select('id, requested_date, requested_time, duration_minutes, pickup_location, end_location, lesson_type, student_note, student_id')
                .eq('instructor_id', user.id)
                .eq('status', 'requested')
                .order('requested_date', { ascending: true }),
            supabase
                .from('appointments')
                .select('id, requested_date, requested_time, duration_minutes, pickup_location, end_location, lesson_type, student_note, student_id')
                .eq('instructor_id', user.id)
                .eq('status', 'confirmed')
                .gte('requested_date', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
                .order('requested_date', { ascending: true })
                .limit(50),
        ]);

        setFirstName(profileResult.data?.first_name ?? '');

        const allRows = [...(requestedResult.data ?? []), ...(confirmedResult.data ?? [])];
        const studentIds = [...new Set(allRows.map((r) => r.student_id))];

        let namesById: Record<string, string> = {};
        let phonesById: Record<string, string | null> = {};
        if (studentIds.length > 0) {
            const { data: students } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, phone')
                .in('id', studentIds);

            if (students) {
                phonesById = Object.fromEntries(students.map((s) => [s.id, s.phone ?? null]));
                namesById = Object.fromEntries(
                    students.map((s) => [s.id, `${s.first_name} ${s.last_name}`.trim() || 'Unbekannt'])
                );
            }
        }

        const withNames = (rows: typeof allRows) =>
            rows.map((r) => ({
                ...r,
                studentName: namesById[r.student_id] ?? 'Unbekannt',
                studentPhone: phonesById[r.student_id] ?? null,
            }));

        setPendingRequests(withNames(requestedResult.data ?? []));
        const confirmedWithNames = withNames(confirmedResult.data ?? []);
const now = new Date();
const hasStarted = (r: AppointmentRow) =>
    new Date(`${r.requested_date}T${r.requested_time}`) <= now;

setFinishableLessons(confirmedWithNames.filter(hasStarted));
setConfirmedLessons(confirmedWithNames.filter((r) => !hasStarted(r)).slice(0, 10));
        setLoading(false);
    }

    useEffect(() => {
        loadDashboard();
    }, []);

    async function handleConfirm(appointmentId: string) {
        setConfirmError('');
        setActioningId(appointmentId);
        const { error } = await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', appointmentId);
        if (error) setConfirmError(error.message);
        await loadDashboard();
        setActioningId(null);
    }

    async function handleFinish(appointmentId: string, outcome: 'completed' | 'no_show' | 'excused') {
    setFinishError('');
    setActioningId(appointmentId);
    const { error } = await supabase.rpc('finish_appointment', {
        p_appointment_id: appointmentId,
        p_outcome: outcome,
    });
    if (error) setFinishError(error.message);
    await loadDashboard();
    setActioningId(null);
}

    function openRejectModal(appointment: AppointmentRow) {
        setRejectingAppointment(appointment);
        setRejectReason('');
        setRejectModalVisible(true);
    }

    async function submitReject() {
        if (!rejectingAppointment) return;
        setActioningId(rejectingAppointment.id);
        await supabase
            .from('appointments')
            .update({ status: 'rejected', student_facing_reason: rejectReason.trim() || null })
            .eq('id', rejectingAppointment.id);
        setRejectModalVisible(false);
        setRejectingAppointment(null);
        await loadDashboard();
        setActioningId(null);
    }

    async function submitCancelLesson() {
        if (!cancelTarget) return;
        const ok = await confirmAction(
            `Fahrstunde mit ${cancelTarget.studentName} wirklich absagen? Der Fahrschüler wird benachrichtigt.`,
            'Absagen'
        );
        if (!ok) return;
        setCancelBusy(true);
        setCancelError('');
        const { error } = await supabase.rpc('instructor_cancel_appointment', {
            p_appointment_id: cancelTarget.id,
            p_reason: cancelReason.trim() || null,
        });
        setCancelBusy(false);
        if (error) {
            setCancelError(error.message);
            return;
        }
        setCancelTarget(null);
        setCancelReason('');
        await loadDashboard();
    }

    function openProposeModal(appointment: AppointmentRow) {
        setProposingAppointment(appointment);
        setProposalSlots([{ date: '', time: '' }]);
        setProposeError('');
        setProposeModalVisible(true);
    }

    function updateSlot(index: number, field: 'date' | 'time', value: string) {
        setProposalSlots((slots) => slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    }

    async function submitProposals() {
        if (!proposingAppointment) return;
        setProposeError('');

        const filled = proposalSlots.filter((s) => s.date.trim() || s.time.trim());
        if (filled.length === 0) {
            setProposeError('Bitte mindestens einen Terminvorschlag ausfüllen.');
            return;
        }

        const parsed: { date: string; time: string }[] = [];
        for (const slot of filled) {
            const isoDate = parseGermanDate(slot.date);
            const isoTime = parseGermanTime(slot.time);
            if (!isoDate || !isoTime) {
                setProposeError('Bitte Datum (TT.MM.JJJJ) und Uhrzeit (HH:MM) für jeden ausgefüllten Vorschlag korrekt angeben.');
                return;
            }
            parsed.push({ date: isoDate, time: isoTime });
        }

        setProposeSubmitting(true);

        const { error: proposeRpcError } = await supabase.rpc('propose_alternatives', {
            p_appointment_id: proposingAppointment.id,
            p_slots: parsed.map((p) => ({ date: p.date, time: p.time })),
        });

        if (proposeRpcError) {
            setProposeSubmitting(false);
            setProposeError(proposeRpcError.message);
            return;
        }

        setProposeSubmitting(false);
        setProposeModalVisible(false);
        setProposingAppointment(null);
        await loadDashboard();
    }

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color={ORANGE} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.smallText}>Guten Tag</Text>
                        <Text style={styles.name}>{firstName || '...'}</Text>
                    </View>

                    <TouchableOpacity style={styles.profileButton} onPress={() => setMenuVisible(true)}>
                        <Ionicons name="person-outline" size={22} color="#ffffff" />
                    </TouchableOpacity>

                    <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
                            <View style={styles.menuCard}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setMenuVisible(false);
                                        router.push('/instructor/schueler' as any);
                                    }}
                                >
                                    <Ionicons name="people-outline" size={20} color={ORANGE} />
                                    <Text style={styles.menuItemText}>Meine Fahrschüler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                                    <Ionicons name="log-out-outline" size={20} color={ORANGE} />
                                    <Text style={styles.menuItemText}>Abmelden</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Modal>
                </View>

                {/* Pending requests */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Offene Anfragen</Text>
                    {pendingRequests.length > 0 && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{pendingRequests.length}</Text>
                        </View>
                    )}
                </View>

                {confirmError ? <Text style={styles.proposeErrorText}>{confirmError}</Text> : null}

                {pendingRequests.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Keine offenen Terminanfragen.</Text>
                    </View>
                ) : (
                    pendingRequests.map((req) => (
                        <View key={req.id} style={styles.requestCard}>
                            <Text style={styles.studentName}>{req.studentName}</Text>

                            <InfoRow icon="calendar-outline" text={formatGermanDate(req.requested_date)} />
                            <InfoRow icon="time-outline" text={formatTimeRange(req.requested_time, req.duration_minutes)} />
                            <InfoRow icon="location-outline" text={`Abholung: ${req.pickup_location}`} />
                            {req.end_location && <InfoRow icon="flag-outline" text={`Ziel: ${req.end_location}`} />}
                            {req.student_note && <InfoRow icon="chatbubble-outline" text={req.student_note} />}

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => openRejectModal(req)}
                                    disabled={actioningId === req.id}
                                >
                                    <Text style={styles.rejectButtonText}>Ablehnen</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.proposeButton]}
                                    onPress={() => openProposeModal(req)}
                                    disabled={actioningId === req.id}
                                >
                                    <Text style={styles.proposeButtonText}>Alternative</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.confirmButton]}
                                    onPress={() => handleConfirm(req.id)}
                                    disabled={actioningId === req.id}
                                >
                                    <Text style={styles.confirmButtonText}>
                                        {actioningId === req.id ? '…' : 'Bestätigen'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
                {/* Lessons waiting to be closed out */}
{finishableLessons.length > 0 && (
    <>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleStandalone}>Abschluss ausstehend</Text>
            <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{finishableLessons.length}</Text>
            </View>
        </View>

        {finishError ? <Text style={styles.proposeErrorText}>{finishError}</Text> : null}

        {finishableLessons.map((lesson) => (
            <View key={lesson.id} style={styles.requestCard}>
                <Text style={styles.studentName}>{lesson.studentName}</Text>
                <InfoRow icon="calendar-outline" text={formatGermanDate(lesson.requested_date)} />
                <InfoRow icon="time-outline" text={formatTimeRange(lesson.requested_time, lesson.duration_minutes)} />

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleFinish(lesson.id, 'no_show')}
                        disabled={actioningId === lesson.id}
                    >
                        <Text style={styles.rejectButtonText}>Nicht erschienen</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.proposeButton]}
                        onPress={() => handleFinish(lesson.id, 'excused')}
                        disabled={actioningId === lesson.id}
                    >
                        <Text style={styles.proposeButtonText}>Entschuldigt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => handleFinish(lesson.id, 'completed')}
                        disabled={actioningId === lesson.id}
                    >
                        <Text style={styles.confirmButtonText}>
                            {actioningId === lesson.id ? '…' : 'Durchgeführt'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        ))}
    </>
)}
                {/* Confirmed upcoming lessons */}
                <Text style={styles.sectionTitleStandalone}>Bestätigte Termine</Text>

                {confirmedLessons.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Keine bevorstehenden bestätigten Termine.</Text>
                    </View>
                ) : (
                    confirmedLessons.map((lesson) => (
                        <View key={lesson.id} style={styles.lessonCard}>
                            <Text style={styles.studentName}>{lesson.studentName}</Text>
                            <InfoRow icon="calendar-outline" text={formatGermanDate(lesson.requested_date)} />
                            <InfoRow icon="time-outline" text={formatTimeRange(lesson.requested_time, lesson.duration_minutes)} />
                            <InfoRow icon="location-outline" text={`Abholung: ${lesson.pickup_location}`} />

                            <View style={styles.contactRow}>
                                {lesson.studentPhone ? (
                                    <>
                                        <TouchableOpacity style={styles.contactButton} onPress={() => openCall(lesson.studentPhone!)}>
                                            <Ionicons name="call-outline" size={16} color={ORANGE} />
                                            <Text style={styles.contactText}>Anrufen</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.contactButton} onPress={() => openWhatsApp(lesson.studentPhone!)}>
                                            <Ionicons name="logo-whatsapp" size={16} color={ORANGE} />
                                            <Text style={styles.contactText}>WhatsApp</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : null}
                                <TouchableOpacity style={styles.contactButton} onPress={() => openMaps(lesson.pickup_location)}>
                                    <Ionicons name="navigate-outline" size={16} color={ORANGE} />
                                    <Text style={styles.contactText}>Navigation</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.cancelLessonButton}
                                onPress={() => {
                                    setCancelTarget(lesson);
                                    setCancelReason('');
                                    setCancelError('');
                                }}
                            >
                                <Text style={styles.cancelLessonText}>Termin absagen</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                <Text style={styles.footer}>RS Fahrschule</Text>
            </ScrollView>

            {/* Cancel lesson modal */}
            <Modal visible={cancelTarget !== null} transparent animationType="fade" onRequestClose={() => setCancelTarget(null)}>
                <Pressable style={styles.modalOverlay} onPress={() => setCancelTarget(null)}>
                    <Pressable style={styles.formModalCard} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Fahrstunde absagen</Text>

                        <Text style={styles.modalLabel}>
                            {cancelTarget?.studentName} · {cancelTarget ? formatGermanDate(cancelTarget.requested_date) : ''}. Der Fahrschüler wird automatisch benachrichtigt. Grund (optional, sieht der Fahrschüler):
                        </Text>

                        <TextInput
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            placeholder="z. B. Krankheit"
                            placeholderTextColor="#777777"
                            multiline
                            maxLength={300}
                            style={styles.modalTextArea}
                        />

                        {cancelError ? <Text style={styles.proposeErrorText}>{cancelError}</Text> : null}

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setCancelTarget(null)}>
                                <Text style={styles.modalCancelText}>Zurück</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.modalSubmitButton} onPress={submitCancelLesson} disabled={cancelBusy}>
                                <Text style={styles.modalSubmitText}>{cancelBusy ? '…' : 'Absagen'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Reject modal */}
            <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setRejectModalVisible(false)}>
                    <Pressable style={styles.formModalCard} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Anfrage ablehnen</Text>

                        <Text style={styles.modalLabel}>
                            Begründung für {rejectingAppointment?.studentName} (optional, wird dem Fahrschüler angezeigt)
                        </Text>

                        <TextInput
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            placeholder="z. B. Termin bereits vergeben..."
                            placeholderTextColor="#777777"
                            multiline
                            style={styles.modalTextArea}
                        />

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setRejectModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Abbrechen</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.modalSubmitButton} onPress={submitReject}>
                                <Text style={styles.modalSubmitText}>Ablehnen</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Propose alternatives modal */}
            <Modal visible={proposeModalVisible} transparent animationType="fade" onRequestClose={() => setProposeModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setProposeModalVisible(false)}>
                    <Pressable style={styles.formModalCard} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Alternativtermine vorschlagen</Text>

                        <Text style={styles.modalLabel}>
                            Für {proposingAppointment?.studentName} — bis zu 3 Vorschläge
                        </Text>

                        {proposalSlots.map((slot, index) => (
                            <View key={index} style={styles.slotRow}>
                                <TextInput
                                    value={slot.date}
                                    onChangeText={(v) => updateSlot(index, 'date', v)}
                                    placeholder="TT.MM.JJJJ"
                                    placeholderTextColor="#777777"
                                    style={styles.slotInput}
                                />
                                <TextInput
                                    value={slot.time}
                                    onChangeText={(v) => updateSlot(index, 'time', v)}
                                    placeholder="HH:MM"
                                    placeholderTextColor="#777777"
                                    style={styles.slotInput}
                                />
                            </View>
                        ))}

                        {proposalSlots.length < 3 && (
                            <TouchableOpacity
                                style={styles.addSlotButton}
                                onPress={() => setProposalSlots((s) => [...s, { date: '', time: '' }])}
                            >
                                <Ionicons name="add" size={18} color={ORANGE} />
                                <Text style={styles.addSlotText}>Weiteren Vorschlag hinzufügen</Text>
                            </TouchableOpacity>
                        )}

                        {proposeError ? <Text style={styles.proposeErrorText}>{proposeError}</Text> : null}

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setProposeModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Abbrechen</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalSubmitButton}
                                onPress={submitProposals}
                                disabled={proposeSubmitting}
                            >
                                <Text style={styles.modalSubmitText}>
                                    {proposeSubmitting ? 'Wird gesendet…' : 'Vorschläge senden'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={15} color="#99999f" />
            <Text style={styles.infoText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BACKGROUND },
    container: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 40 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    smallText: { color: '#8c8c91', fontSize: 14 },
    name: { color: '#ffffff', fontSize: 27, fontWeight: '900', marginTop: 2 },

    profileButton: {
        width: 46, height: 46, borderRadius: 23, backgroundColor: CARD,
        borderWidth: 1, borderColor: '#3a3a3f', alignItems: 'center', justifyContent: 'center',
    },

    menuOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start',
        alignItems: 'flex-end', paddingTop: 70, paddingRight: 20,
    },
    menuCard: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: '#2a2a2e', paddingVertical: 6, minWidth: 180 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16 },
    menuItemText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 },
    sectionTitle: { color: '#ffffff', fontSize: 19, fontWeight: '800' },
    sectionTitleStandalone: { color: '#ffffff', fontSize: 19, fontWeight: '800', marginBottom: 13, marginTop: 29 },

    countBadge: { backgroundColor: ORANGE, borderRadius: 11, paddingHorizontal: 8, paddingVertical: 2 },
    countBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },

    emptyCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 18 },
    emptyText: { color: '#8c8c91', fontSize: 14, textAlign: 'center' },

    requestCard: {
        backgroundColor: CARD, borderWidth: 1, borderColor: '#49331d', borderRadius: 18,
        padding: 16, marginBottom: 12,
    },
    lessonCard: {
        backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 18,
        padding: 16, marginBottom: 12,
    },

    studentName: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginBottom: 9 },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 6 },
    infoText: { color: '#a5a5aa', fontSize: 12, flex: 1 },

    actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    contactButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#3a3a3f', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
    contactText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
    cancelLessonButton: { marginTop: 12, alignSelf: 'flex-start' },
    cancelLessonText: { color: '#ff5c5c', fontSize: 13, fontWeight: '800' },
    actionButton: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },

    rejectButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#ff5c5c' },
    rejectButtonText: { color: '#ff5c5c', fontSize: 13, fontWeight: '800' },

    proposeButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: ORANGE },
    proposeButtonText: { color: ORANGE, fontSize: 13, fontWeight: '800' },

    confirmButton: { backgroundColor: ORANGE },
    confirmButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

    footer: { color: '#68686d', textAlign: 'center', fontSize: 12, marginTop: 35 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    formModalCard: { width: '100%', maxWidth: 400, backgroundColor: CARD, borderRadius: 20, padding: 20 },
    modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
    modalLabel: { color: '#a5a5aa', fontSize: 13, marginBottom: 14, lineHeight: 18 },

    modalTextArea: {
        minHeight: 90, backgroundColor: '#0d0d0f', borderWidth: 1, borderColor: BORDER,
        borderRadius: 14, color: '#ffffff', fontSize: 14, padding: 12, textAlignVertical: 'top', marginBottom: 16,
    },

    slotRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    slotInput: {
        flex: 1, height: 48, backgroundColor: '#0d0d0f', borderWidth: 1, borderColor: BORDER,
        borderRadius: 12, color: '#ffffff', fontSize: 14, paddingHorizontal: 14,
    },

    addSlotButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 10 },
    addSlotText: { color: ORANGE, fontSize: 13, fontWeight: '700' },

    proposeErrorText: { color: '#ff5c5c', fontSize: 13, marginBottom: 10 },

    modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    modalCancelButton: { flex: 1, height: 48, borderRadius: 24, borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
    modalCancelText: { color: '#a5a5aa', fontSize: 14, fontWeight: '700' },
    modalSubmitButton: { flex: 1, height: 48, borderRadius: 24, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
    modalSubmitText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});