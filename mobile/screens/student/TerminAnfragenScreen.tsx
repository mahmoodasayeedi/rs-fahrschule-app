import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
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
import { supabase } from '../../lib/supabase';

const ORANGE = '#ff8800';
const BACKGROUND = '#0d0d0f';
const CARD = '#171719';
const BORDER = '#3a3a3f';

const DURATION_MINUTES: Record<string, number> = {
    '45 Min.': 45,
    '90 Min.': 90,
    '135 Min.': 135,
};

function buildDateOptions(days: number): Date[] {
    const options: Date[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < days; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        options.push(d);
    }
    return options;
}

function formatDateOption(d: Date): string {
    return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isoDateFromDate(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 30-minute slots, 07:00–20:00. A reasonable default working range —
// not confirmed by RS Fahrschule, adjustable later (see ASSUMPTIONS.md).
function buildTimeOptions(): string[] {
    const options: string[] = [];
    for (let totalMinutes = 7 * 60; totalMinutes <= 20 * 60; totalMinutes += 30) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
    return options;
}

const DATE_OPTIONS = buildDateOptions(60);
const TIME_OPTIONS = buildTimeOptions();

type Instructor = {
    id: string;
    name: string;
};

export default function TerminAnfragenScreen() {
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);

    const [duration, setDuration] = useState('');
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [note, setNote] = useState('');

    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
    const [instructorModalVisible, setInstructorModalVisible] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadInstructors() {
            const { data } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .eq('role', 'instructor')
                .eq('is_active', true);

            if (active && data) {
                setInstructors(data.map((i) => ({ id: i.id, name: `${i.first_name} ${i.last_name}`.trim() })));
            }
        }

        loadInstructors();
        return () => { active = false; };
    }, []);

    const canSubmit =
        selectedDate && selectedTime && duration.trim() &&
        selectedInstructor && pickup.trim() && destination.trim();

    async function handleSubmit() {
        setErrorMessage('');

        if (!selectedDate || !selectedTime || !selectedInstructor) {
            setErrorMessage('Bitte alle erforderlichen Felder ausfüllen.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setErrorMessage('Sitzung abgelaufen. Bitte erneut anmelden.');
            return;
        }

        setSubmitting(true);
        const { error } = await supabase.from('appointments').insert({
            student_id: user.id,
            instructor_id: selectedInstructor.id,
            status: 'requested',
            requested_date: isoDateFromDate(selectedDate),
            requested_time: `${selectedTime}:00`,
            duration_minutes: DURATION_MINUTES[duration],
            pickup_location: pickup.trim(),
            end_location: destination.trim(),
            lesson_type: 'normal',
            student_note: note.trim() || null,
        });
        setSubmitting(false);

        if (error) {
            setErrorMessage('Anfrage konnte nicht gesendet werden. Bitte später erneut versuchen.');
            return;
        }

        setSubmitted(true);
    }

    if (submitted) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark" size={40} color="#ffffff" />
                    </View>

                    <Text style={styles.successTitle}>Anfrage gesendet</Text>

                    <Text style={styles.successText}>
                        Deine Terminanfrage wurde an die Fahrschule übermittelt.
                        Du erhältst eine Benachrichtigung, sobald sie bearbeitet wurde.
                    </Text>

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => router.replace('/student/dashboard')}
                    >
                        <Text style={styles.submitButtonText}>Zum Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons
                            name="arrow-back"
                            size={22}
                            color="#ffffff"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>
                            Fahrstunde anfragen
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            Wunschtermin senden
                        </Text>
                    </View>
                </View>

                {/* Intro card */}
                <View style={styles.introCard}>
                    <View style={styles.introIcon}>
                        <Ionicons
                            name="calendar-outline"
                            size={28}
                            color={ORANGE}
                        />
                    </View>

                    <View style={styles.introContent}>
                        <Text style={styles.introTitle}>
                            Neue Terminanfrage
                        </Text>

                        <Text style={styles.introText}>
                            Wählen Sie Ihren gewünschten Termin und die
                            Fahrstundeninformationen aus.
                        </Text>
                    </View>
                </View>

                {/* Desired appointment */}
                <SectionTitle
                    icon="time-outline"
                    title="Wunschtermin"
                />

                <Text style={styles.label}>Datum</Text>

                <TouchableOpacity style={styles.selectBox} onPress={() => setDateModalVisible(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#999999" />

                    <Text style={[styles.input, !selectedDate && styles.placeholderText]}>
                        {selectedDate ? formatDateOption(selectedDate) : 'Datum auswählen'}
                    </Text>

                    <Ionicons name="chevron-down" size={19} color="#777777" />
                </TouchableOpacity>

                <Text style={styles.label}>Uhrzeit</Text>

                <TouchableOpacity style={styles.selectBox} onPress={() => setTimeModalVisible(true)}>
                    <Ionicons name="time-outline" size={20} color="#999999" />

                    <Text style={[styles.input, !selectedTime && styles.placeholderText]}>
                        {selectedTime ? `${selectedTime} Uhr` : 'Uhrzeit auswählen'}
                    </Text>

                    <Ionicons name="chevron-down" size={19} color="#777777" />
                </TouchableOpacity>

                <Text style={styles.label}>
                    Dauer
                </Text>

                <View style={styles.optionRow}>
                    {['45 Min.', '90 Min.', '135 Min.'].map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.optionButton,
                                duration === item && styles.optionButtonSelected,
                            ]}
                            onPress={() => setDuration(item)}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    duration === item && styles.optionTextSelected,
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Instructor */}
                <SectionTitle
                    icon="person-outline"
                    title="Fahrlehrer"
                />

                <Text style={styles.label}>
                    Gewünschter Fahrlehrer
                </Text>

                <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => setInstructorModalVisible(true)}
                >
                    <Ionicons
                        name="person-outline"
                        size={20}
                        color="#999999"
                    />

                    <Text style={[styles.input, !selectedInstructor && styles.placeholderText]}>
                        {selectedInstructor ? selectedInstructor.name : 'Fahrlehrer auswählen'}
                    </Text>

                    <Ionicons
                        name="chevron-down"
                        size={19}
                        color="#777777"
                    />
                </TouchableOpacity>

                {/* Route */}
                <SectionTitle
                    icon="navigate-outline"
                    title="Fahrstrecke"
                />

                <Input
                    label="Abholort"
                    placeholder="z. B. RS Fahrschule"
                    value={pickup}
                    onChangeText={setPickup}
                    icon="location-outline"
                />

                <Input
                    label="Gewünschtes Fahrtende"
                    placeholder="Zielort eingeben"
                    value={destination}
                    onChangeText={setDestination}
                    icon="flag-outline"
                />

                {/* Note */}
                <Text style={styles.label}>
                    Hinweis an die Fahrschule
                </Text>

                <View style={styles.noteContainer}>
                    <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color="#999999"
                        style={styles.noteIcon}
                    />

                    <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="Optionaler Hinweis..."
                        placeholderTextColor="#777777"
                        multiline
                        textAlignVertical="top"
                        style={styles.noteInput}
                    />
                </View>

                {/* Important booking notice */}
                <View style={styles.noticeCard}>
                    <Ionicons
                        name="information-circle-outline"
                        size={25}
                        color={ORANGE}
                    />

                    <View style={styles.noticeContent}>
                        <Text style={styles.noticeTitle}>
                            Noch keine feste Buchung
                        </Text>

                        <Text style={styles.noticeText}>
                            Dies ist zunächst eine Terminanfrage. Der Termin ist
                            erst verbindlich, nachdem die Fahrschule ihn bestätigt
                            hat.
                        </Text>
                    </View>
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                {/* Submit */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!canSubmit || submitting) && styles.submitButtonDisabled,
                    ]}
                    disabled={!canSubmit || submitting}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? 'Wird gesendet…' : 'Anfrage senden'}
                    </Text>

                    {!submitting && (
                        <Ionicons
                            name="arrow-forward"
                            size={22}
                            color="#ffffff"
                        />
                    )}
                </TouchableOpacity>

                <Text style={styles.footer}>
                    RS Fahrschule
                </Text>
            </ScrollView>

            {/* Date modal */}
            <Modal
                visible={dateModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDateModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setDateModalVisible(false)}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Datum wählen</Text>

                        <FlatList
                            data={DATE_OPTIONS}
                            keyExtractor={(item) => item.toISOString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.instructorOption}
                                    onPress={() => {
                                        setSelectedDate(item);
                                        setDateModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.instructorOptionText}>{formatDateOption(item)}</Text>

                                    {selectedDate?.getTime() === item.getTime() && (
                                        <Ionicons name="checkmark" size={20} color={ORANGE} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>

            {/* Time modal */}
            <Modal
                visible={timeModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setTimeModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setTimeModalVisible(false)}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Uhrzeit wählen</Text>

                        <FlatList
                            data={TIME_OPTIONS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.instructorOption}
                                    onPress={() => {
                                        setSelectedTime(item);
                                        setTimeModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.instructorOptionText}>{item} Uhr</Text>

                                    {selectedTime === item && (
                                        <Ionicons name="checkmark" size={20} color={ORANGE} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>

            {/* Instructor selection modal */}
            <Modal
                visible={instructorModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setInstructorModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setInstructorModalVisible(false)}
                >
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Fahrlehrer wählen</Text>

                        {instructors.length === 0 ? (
                            <Text style={styles.modalEmptyText}>
                                Aktuell sind keine Fahrlehrer verfügbar.
                            </Text>
                        ) : (
                            <FlatList
                                data={instructors}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.instructorOption}
                                        onPress={() => {
                                            setSelectedInstructor(item);
                                            setInstructorModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.instructorOptionText}>{item.name}</Text>

                                        {selectedInstructor?.id === item.id && (
                                            <Ionicons name="checkmark" size={20} color={ORANGE} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

function SectionTitle({
    icon,
    title,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
}) {
    return (
        <View style={styles.sectionTitle}>
            <Ionicons
                name={icon}
                size={21}
                color={ORANGE}
            />

            <Text style={styles.sectionTitleText}>
                {title}
            </Text>
        </View>
    );
}

function Input({
    label,
    icon,
    ...props
}: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
} & React.ComponentProps<typeof TextInput>) {
    return (
        <>
            <Text style={styles.label}>
                {label}
            </Text>

            <View style={styles.inputContainer}>
                <Ionicons
                    name={icon}
                    size={20}
                    color="#999999"
                />

                <TextInput
                    {...props}
                    placeholderTextColor="#777777"
                    style={styles.input}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BACKGROUND,
    },

    container: {
        paddingHorizontal: 22,
        paddingTop: 18,
        paddingBottom: 40,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 26,
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    headerTextContainer: {
        flex: 1,
    },

    headerTitle: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '900',
    },

    headerSubtitle: {
        color: '#8f8f94',
        fontSize: 13,
        marginTop: 3,
    },

    introCard: {
        backgroundColor: CARD,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#49331d',
        padding: 17,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
    },

    introIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    introContent: {
        flex: 1,
    },

    introTitle: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 4,
    },

    introText: {
        color: '#9c9ca1',
        fontSize: 13,
        lineHeight: 18,
    },

    sectionTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        marginBottom: 18,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#29292d',
    },

    sectionTitleText: {
        color: '#ffffff',
        fontSize: 19,
        fontWeight: '800',
    },

    label: {
        color: '#eeeeee',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },

    inputContainer: {
        height: 57,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: '#414145',
        borderRadius: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 19,
    },

    selectBox: {
        height: 57,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: '#414145',
        borderRadius: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 19,
    },

    input: {
        flex: 1,
        height: '100%',
        color: '#ffffff',
        fontSize: 15,
        marginLeft: 11,
        textAlignVertical: 'center',
    },

    placeholderText: {
        color: '#777777',
    },

    optionRow: {
        flexDirection: 'row',
        gap: 9,
        marginBottom: 26,
    },

    optionButton: {
        flex: 1,
        height: 47,
        borderRadius: 24,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: '#49494d',
        alignItems: 'center',
        justifyContent: 'center',
    },

    optionButtonSelected: {
        backgroundColor: ORANGE,
        borderColor: ORANGE,
    },

    optionText: {
        color: '#b2b2b7',
        fontSize: 13,
        fontWeight: '700',
    },

    optionTextSelected: {
        color: '#ffffff',
    },

    noteContainer: {
        minHeight: 110,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: '#414145',
        borderRadius: 16,
        flexDirection: 'row',
        padding: 15,
        marginBottom: 24,
    },

    noteIcon: {
        marginTop: 2,
        marginRight: 10,
    },

    noteInput: {
        flex: 1,
        minHeight: 80,
        color: '#ffffff',
        fontSize: 15,
    },

    noticeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#1c1814',
        borderWidth: 1,
        borderColor: '#51381f',
        borderRadius: 17,
        padding: 16,
        marginBottom: 24,
    },

    noticeContent: {
        flex: 1,
        marginLeft: 11,
    },

    noticeTitle: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '800',
    },

    noticeText: {
        color: '#a8a8ad',
        fontSize: 13,
        lineHeight: 19,
        marginTop: 5,
    },

    errorText: {
        color: '#ff5c5c',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 14,
    },

    submitButton: {
        height: 58,
        backgroundColor: ORANGE,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },

    submitButtonDisabled: {
        opacity: 0.4,
    },

    submitButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
    },

    footer: {
        color: '#69696e',
        textAlign: 'center',
        marginTop: 32,
        fontSize: 12,
    },

    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },

    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#153821',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },

    successTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },

    successText: {
        color: '#a8a8ad',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        marginBottom: 32,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalCard: {
        width: '85%',
        maxWidth: 360,
        maxHeight: '70%',
        backgroundColor: CARD,
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 8,
    },

    modalTitle: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
        paddingHorizontal: 12,
    },

    modalEmptyText: {
        color: '#9c9ca1',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },

    instructorOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#26262a',
    },

    instructorOptionText: {
        color: '#ffffff',
        fontSize: 15,
    },
});