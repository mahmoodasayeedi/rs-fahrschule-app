import { Ionicons } from '@expo/vector-icons';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const ORANGE = '#ff8800';
const BACKGROUND = '#0d0d0f';
const CARD = '#171719';
const BORDER = '#303034';

export default function TerminDetailsScreen() {
    // TEMPORARY MOCK DATA
    // Later this appointment will come from Supabase.
    const appointment = {
        date: '18. September 2026',
        time: '14:00 – 15:30 Uhr',
        duration: '90 Minuten',
        instructor: 'Herr Müller',
        pickup: 'RS Fahrschule',
        destination: 'Germersheim Bahnhof',
        status: 'Bestätigt',
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
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

                    <View>
                        <Text style={styles.headerTitle}>
                            Termindetails
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            Fahrstunde
                        </Text>
                    </View>
                </View>

                {/* Status */}
                <View style={styles.statusCard}>
                    <View style={styles.statusIcon}>
                        <Ionicons
                            name="checkmark-circle"
                            size={31}
                            color="#72d792"
                        />
                    </View>

                    <View style={styles.statusContent}>
                        <Text style={styles.statusLabel}>
                            Terminstatus
                        </Text>

                        <Text style={styles.statusValue}>
                            {appointment.status}
                        </Text>
                    </View>
                </View>

                {/* Date */}
                <Text style={styles.sectionTitle}>
                    Termin
                </Text>

                <View style={styles.card}>
                    <DetailRow
                        icon="calendar-outline"
                        label="Datum"
                        value={appointment.date}
                    />

                    <Divider />

                    <DetailRow
                        icon="time-outline"
                        label="Uhrzeit"
                        value={appointment.time}
                    />

                    <Divider />

                    <DetailRow
                        icon="hourglass-outline"
                        label="Dauer"
                        value={appointment.duration}
                    />
                </View>

                {/* Instructor */}
                <Text style={styles.sectionTitle}>
                    Fahrlehrer
                </Text>

                <View style={styles.instructorCard}>
                    <View style={styles.instructorAvatar}>
                        <Ionicons
                            name="person-outline"
                            size={25}
                            color={ORANGE}
                        />
                    </View>

                    <View style={styles.instructorContent}>
                        <Text style={styles.smallLabel}>
                            Dein Fahrlehrer
                        </Text>

                        <Text style={styles.instructorName}>
                            {appointment.instructor}
                        </Text>
                    </View>
                </View>

                {/* Route */}
                <Text style={styles.sectionTitle}>
                    Fahrstrecke
                </Text>

                <View style={styles.routeCard}>
                    <View style={styles.routeGraphic}>
                        <View style={styles.startDot} />
                        <View style={styles.routeLine} />
                        <View style={styles.endDot} />
                    </View>

                    <View style={styles.routeContent}>
                        <View style={styles.routeItem}>
                            <Text style={styles.smallLabel}>
                                Abholung
                            </Text>

                            <Text style={styles.routeValue}>
                                {appointment.pickup}
                            </Text>
                        </View>

                        <View style={styles.routeItem}>
                            <Text style={styles.smallLabel}>
                                Gewünschtes Fahrtende
                            </Text>

                            <Text style={styles.routeValue}>
                                {appointment.destination}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Important information */}
                <View style={styles.noticeCard}>
                    <Ionicons
                        name="information-circle-outline"
                        size={25}
                        color={ORANGE}
                    />

                    <View style={styles.noticeContent}>
                        <Text style={styles.noticeTitle}>
                            Stornierung
                        </Text>

                        <Text style={styles.noticeText}>
                            Für bestätigte Fahrstunden gilt die
                            24-Stunden-Stornierungsregel.
                        </Text>
                    </View>
                </View>

                {/* Cancellation */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name="close-circle-outline"
                        size={21}
                        color="#ff858c"
                    />

                    <Text style={styles.cancelText}>
                        Termin stornieren
                    </Text>
                </TouchableOpacity>

                <Text style={styles.footer}>
                    RS Fahrschule
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({
    icon,
    label,
    value,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
                <Ionicons
                    name={icon}
                    size={21}
                    color={ORANGE}
                />
            </View>

            <View style={styles.detailContent}>
                <Text style={styles.smallLabel}>
                    {label}
                </Text>

                <Text style={styles.detailValue}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

function Divider() {
    return <View style={styles.divider} />;
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
        marginBottom: 27,
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

    headerTitle: {
        color: '#ffffff',
        fontSize: 25,
        fontWeight: '900',
    },

    headerSubtitle: {
        color: '#8c8c91',
        fontSize: 13,
        marginTop: 2,
    },

    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#14251a',
        borderWidth: 1,
        borderColor: '#285738',
        borderRadius: 18,
        padding: 17,
        marginBottom: 28,
    },

    statusIcon: {
        marginRight: 13,
    },

    statusContent: {
        flex: 1,
    },

    statusLabel: {
        color: '#8fa999',
        fontSize: 12,
    },

    statusValue: {
        color: '#79d898',
        fontSize: 18,
        fontWeight: '800',
        marginTop: 2,
    },

    sectionTitle: {
        color: '#ffffff',
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 13,
        marginTop: 9,
    },

    card: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        padding: 16,
        marginBottom: 25,
    },

    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 57,
    },

    detailIcon: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    detailContent: {
        flex: 1,
    },

    smallLabel: {
        color: '#85858a',
        fontSize: 12,
    },

    detailValue: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
        marginTop: 3,
    },

    divider: {
        height: 1,
        backgroundColor: '#29292d',
        marginVertical: 5,
    },

    instructorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        padding: 16,
        marginBottom: 25,
    },

    instructorAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    instructorContent: {
        flex: 1,
    },

    instructorName: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
        marginTop: 3,
    },

    routeCard: {
        flexDirection: 'row',
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        padding: 18,
        marginBottom: 25,
    },

    routeGraphic: {
        width: 25,
        alignItems: 'center',
        paddingTop: 7,
        marginRight: 9,
    },

    startDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: ORANGE,
    },

    routeLine: {
        width: 2,
        height: 52,
        backgroundColor: '#55555a',
    },

    endDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: ORANGE,
    },

    routeContent: {
        flex: 1,
    },

    routeItem: {
        minHeight: 61,
    },

    routeValue: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 4,
    },

    noticeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#1c1814',
        borderWidth: 1,
        borderColor: '#51381f',
        borderRadius: 17,
        padding: 16,
        marginTop: 3,
        marginBottom: 18,
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
        color: '#aaaaaf',
        fontSize: 13,
        lineHeight: 19,
        marginTop: 4,
    },

    cancelButton: {
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#77353a',
        backgroundColor: '#201416',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
    },

    cancelText: {
        color: '#ff858c',
        fontSize: 15,
        fontWeight: '800',
    },

    footer: {
        color: '#68686d',
        textAlign: 'center',
        marginTop: 32,
        fontSize: 12,
    },
});