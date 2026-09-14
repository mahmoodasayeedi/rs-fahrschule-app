import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const ORANGE = '#ff8800';
const BACKGROUND = '#0d0d0f';
const CARD = '#171719';
const BORDER = '#3a3a3f';

export default function TerminAnfragenScreen() {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('');
    const [instructor, setInstructor] = useState('');
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [note, setNote] = useState('');

    function handleSubmit() {
        console.log('Appointment request:', {
            date,
            time,
            duration,
            instructor,
            pickup,
            destination,
            note,
        });
    }

    const canSubmit =
        date.trim() &&
        time.trim() &&
        duration.trim() &&
        instructor.trim() &&
        pickup.trim() &&
        destination.trim();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton}>
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

                <Input
                    label="Datum"
                    placeholder="TT.MM.JJJJ"
                    value={date}
                    onChangeText={setDate}
                    icon="calendar-outline"
                    keyboardType="numbers-and-punctuation"
                />

                <Input
                    label="Uhrzeit"
                    placeholder="z. B. 14:30"
                    value={time}
                    onChangeText={setTime}
                    icon="time-outline"
                    keyboardType="numbers-and-punctuation"
                />

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

                <View style={styles.selectBox}>
                    <Ionicons
                        name="person-outline"
                        size={20}
                        color="#999999"
                    />

                    <TextInput
                        value={instructor}
                        onChangeText={setInstructor}
                        placeholder="Fahrlehrer auswählen"
                        placeholderTextColor="#777777"
                        style={styles.input}
                    />

                    <Ionicons
                        name="chevron-down"
                        size={19}
                        color="#777777"
                    />
                </View>

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

                {/* Submit */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        !canSubmit && styles.submitButtonDisabled,
                    ]}
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitButtonText}>
                        Anfrage senden
                    </Text>

                    <Ionicons
                        name="arrow-forward"
                        size={22}
                        color="#ffffff"
                    />
                </TouchableOpacity>

                <Text style={styles.footer}>
                    RS Fahrschule
                </Text>
            </ScrollView>
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
        marginBottom: 24,
    },

    input: {
        flex: 1,
        height: '100%',
        color: '#ffffff',
        fontSize: 15,
        marginLeft: 11,
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
});