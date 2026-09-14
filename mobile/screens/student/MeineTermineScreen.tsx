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

type AppointmentStatus =
    | 'angefragt'
    | 'bestätigt'
    | 'alternative'
    | 'abgelehnt'
    | 'storniert'
    | 'durchgeführt'
    | 'nicht_erschienen';

type Appointment = {
    id: number;
    day: string;
    month: string;
    dateText: string;
    time: string;
    duration: string;
    instructor: string;
    pickup: string;
    destination: string;
    status: AppointmentStatus;
};

const appointments: Appointment[] = [
    {
        id: 1,
        day: '18',
        month: 'SEP',
        dateText: '18. September 2026',
        time: '14:00 – 15:30 Uhr',
        duration: '90 Min.',
        instructor: 'Herr Müller',
        pickup: 'RS Fahrschule',
        destination: 'Germersheim Bahnhof',
        status: 'bestätigt',
    },
    {
        id: 2,
        day: '22',
        month: 'SEP',
        dateText: '22. September 2026',
        time: '10:00 – 11:30 Uhr',
        duration: '90 Min.',
        instructor: 'Frau Schneider',
        pickup: 'Germersheim Bahnhof',
        destination: 'RS Fahrschule',
        status: 'angefragt',
    },
    {
        id: 3,
        day: '25',
        month: 'SEP',
        dateText: '25. September 2026',
        time: '16:00 – 17:30 Uhr',
        duration: '90 Min.',
        instructor: 'Herr Müller',
        pickup: 'RS Fahrschule',
        destination: 'Bellheim',
        status: 'alternative',
    },
];

export default function MeineTermineScreen() {
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

                    <View style={styles.headerText}>
                        <Text style={styles.title}>
                            Meine Termine
                        </Text>

                        <Text style={styles.subtitle}>
                            Fahrstunden und Terminanfragen
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.addButton}>
                        <Ionicons
                            name="add"
                            size={25}
                            color="#ffffff"
                        />
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={styles.infoCard}>
                    <Ionicons
                        name="information-circle-outline"
                        size={24}
                        color={ORANGE}
                    />

                    <Text style={styles.infoText}>
                        Angefragte Termine sind erst verbindlich, nachdem die
                        Fahrschule sie bestätigt hat.
                    </Text>
                </View>

                {/* Upcoming */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Kommende Termine
                    </Text>

                    <Text style={styles.count}>
                        {appointments.length}
                    </Text>
                </View>

                {appointments.map((appointment) => (
                    <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                    />
                ))}

                {/* Past */}
                <Text style={styles.sectionTitlePast}>
                    Vergangene Termine
                </Text>

                <AppointmentCard
                    appointment={{
                        id: 4,
                        day: '10',
                        month: 'SEP',
                        dateText: '10. September 2026',
                        time: '13:00 – 14:30 Uhr',
                        duration: '90 Min.',
                        instructor: 'Herr Müller',
                        pickup: 'RS Fahrschule',
                        destination: 'Speyer',
                        status: 'durchgeführt',
                    }}
                />

                <AppointmentCard
                    appointment={{
                        id: 5,
                        day: '05',
                        month: 'SEP',
                        dateText: '5. September 2026',
                        time: '09:00 – 10:30 Uhr',
                        duration: '90 Min.',
                        instructor: 'Frau Schneider',
                        pickup: 'Germersheim Bahnhof',
                        destination: 'RS Fahrschule',
                        status: 'storniert',
                    }}
                />

                <Text style={styles.footer}>
                    RS Fahrschule
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function AppointmentCard({
    appointment,
}: {
    appointment: Appointment;
}) {
    return (
        <TouchableOpacity
            style={styles.appointmentCard}
            activeOpacity={0.85}
        >
            <View style={styles.cardTop}>
                <View style={styles.dateBox}>
                    <Text style={styles.day}>
                        {appointment.day}
                    </Text>

                    <Text style={styles.month}>
                        {appointment.month}
                    </Text>
                </View>

                <View style={styles.mainContent}>
                    <View style={styles.titleRow}>
                        <Text style={styles.lessonTitle}>
                            Fahrstunde
                        </Text>

                        <StatusBadge status={appointment.status} />
                    </View>

                    <Text style={styles.dateFull}>
                        {appointment.dateText}
                    </Text>

                    <InfoRow
                        icon="time-outline"
                        text={appointment.time}
                    />

                    <InfoRow
                        icon="hourglass-outline"
                        text={appointment.duration}
                    />

                    <InfoRow
                        icon="person-outline"
                        text={appointment.instructor}
                    />
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.routeRow}>
                <View style={styles.routeIconColumn}>
                    <View style={styles.routeDotStart} />
                    <View style={styles.routeLine} />
                    <View style={styles.routeDotEnd} />
                </View>

                <View style={styles.routeContent}>
                    <View style={styles.routeItem}>
                        <Text style={styles.routeLabel}>
                            Abholung
                        </Text>

                        <Text style={styles.routeValue}>
                            {appointment.pickup}
                        </Text>
                    </View>

                    <View style={styles.routeItem}>
                        <Text style={styles.routeLabel}>
                            Fahrtende
                        </Text>

                        <Text style={styles.routeValue}>
                            {appointment.destination}
                        </Text>
                    </View>
                </View>
            </View>

            {appointment.status === 'alternative' && (
                <View style={styles.alternativeBox}>
                    <Ionicons
                        name="swap-horizontal-outline"
                        size={20}
                        color={ORANGE}
                    />

                    <View style={styles.alternativeContent}>
                        <Text style={styles.alternativeTitle}>
                            Alternative vorgeschlagen
                        </Text>

                        <Text style={styles.alternativeText}>
                            Die Fahrschule hat einen anderen Termin vorgeschlagen.
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={21}
                        color="#999999"
                    />
                </View>
            )}

            <View style={styles.cardFooter}>
                <Text style={styles.detailsText}>
                    Details anzeigen
                </Text>

                <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={ORANGE}
                />
            </View>
        </TouchableOpacity>
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
                size={15}
                color="#96969b"
            />

            <Text style={styles.infoValue}>
                {text}
            </Text>
        </View>
    );
}

function StatusBadge({
    status,
}: {
    status: AppointmentStatus;
}) {
    const config = {
        angefragt: {
            text: 'Angefragt',
            background: '#3b2a14',
            color: '#ffb44c',
        },

        bestätigt: {
            text: 'Bestätigt',
            background: '#173821',
            color: '#7bdc99',
        },

        alternative: {
            text: 'Alternative',
            background: '#33244a',
            color: '#b998ff',
        },

        abgelehnt: {
            text: 'Abgelehnt',
            background: '#451d20',
            color: '#ff8c92',
        },

        storniert: {
            text: 'Storniert',
            background: '#333336',
            color: '#b5b5ba',
        },

        durchgeführt: {
            text: 'Durchgeführt',
            background: '#17352f',
            color: '#74d8bd',
        },

        nicht_erschienen: {
            text: 'Nicht erschienen',
            background: '#451d20',
            color: '#ff8c92',
        },
    };

    const item = config[status];

    return (
        <View
            style={[
                styles.statusBadge,
                {
                    backgroundColor: item.background,
                },
            ]}
        >
            <Text
                style={[
                    styles.statusText,
                    {
                        color: item.color,
                    },
                ]}
            >
                {item.text}
            </Text>
        </View>
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
        marginBottom: 24,
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
    },

    headerText: {
        flex: 1,
        marginLeft: 13,
    },

    title: {
        color: '#ffffff',
        fontSize: 25,
        fontWeight: '900',
    },

    subtitle: {
        color: '#8d8d92',
        fontSize: 13,
        marginTop: 3,
    },

    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: ORANGE,
        alignItems: 'center',
        justifyContent: 'center',
    },

    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#1c1814',
        borderWidth: 1,
        borderColor: '#4c351e',
        borderRadius: 16,
        padding: 15,
        marginBottom: 28,
        gap: 10,
    },

    infoText: {
        flex: 1,
        color: '#aaaaaf',
        fontSize: 13,
        lineHeight: 19,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },

    sectionTitle: {
        color: '#ffffff',
        fontSize: 19,
        fontWeight: '800',
    },

    count: {
        marginLeft: 9,
        color: ORANGE,
        fontSize: 13,
        fontWeight: '800',
        backgroundColor: '#211a13',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 12,
    },

    sectionTitlePast: {
        color: '#ffffff',
        fontSize: 19,
        fontWeight: '800',
        marginTop: 30,
        marginBottom: 14,
    },

    appointmentCard: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 19,
        padding: 16,
        marginBottom: 14,
    },

    cardTop: {
        flexDirection: 'row',
    },

    dateBox: {
        width: 60,
        height: 68,
        borderRadius: 15,
        backgroundColor: '#211a13',
        borderWidth: 1,
        borderColor: '#51361b',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    day: {
        color: ORANGE,
        fontSize: 25,
        fontWeight: '900',
    },

    month: {
        color: '#d0d0d3',
        fontSize: 11,
        fontWeight: '700',
    },

    mainContent: {
        flex: 1,
    },

    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
    },

    lessonTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
    },

    dateFull: {
        color: '#a0a0a5',
        fontSize: 12,
        marginTop: 3,
        marginBottom: 9,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 5,
    },

    infoValue: {
        color: '#a0a0a5',
        fontSize: 12,
        flex: 1,
    },

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 13,
    },

    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },

    divider: {
        height: 1,
        backgroundColor: '#29292d',
        marginVertical: 15,
    },

    routeRow: {
        flexDirection: 'row',
    },

    routeIconColumn: {
        width: 20,
        alignItems: 'center',
        paddingTop: 5,
        marginRight: 8,
    },

    routeDotStart: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: ORANGE,
    },

    routeLine: {
        width: 2,
        height: 34,
        backgroundColor: '#4c4c51',
    },

    routeDotEnd: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: ORANGE,
    },

    routeContent: {
        flex: 1,
    },

    routeItem: {
        marginBottom: 12,
    },

    routeLabel: {
        color: '#77777d',
        fontSize: 11,
    },

    routeValue: {
        color: '#dddddf',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },

    alternativeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#201a26',
        borderWidth: 1,
        borderColor: '#46345a',
        borderRadius: 13,
        padding: 12,
        marginTop: 5,
    },

    alternativeContent: {
        flex: 1,
        marginLeft: 9,
    },

    alternativeTitle: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '800',
    },

    alternativeText: {
        color: '#99999f',
        fontSize: 11,
        marginTop: 3,
    },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 5,
        marginTop: 13,
    },

    detailsText: {
        color: ORANGE,
        fontSize: 12,
        fontWeight: '700',
    },

    footer: {
        color: '#68686d',
        textAlign: 'center',
        marginTop: 28,
        fontSize: 12,
    },
});