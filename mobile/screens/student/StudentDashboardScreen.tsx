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
const BORDER = '#2f2f33';

export default function StudentDashboardScreen() {
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
                        <Text style={styles.name}>Mahmooda</Text>
                    </View>

                    <TouchableOpacity style={styles.profileButton}>
                        <Ionicons
                            name="person-outline"
                            size={22}
                            color="#ffffff"
                        />
                    </TouchableOpacity>
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

                <View style={styles.lessonCard}>
                    <View style={styles.lessonDate}>
                        <Text style={styles.lessonDay}>18</Text>
                        <Text style={styles.lessonMonth}>SEP</Text>
                    </View>

                    <View style={styles.lessonInfo}>
                        <Text style={styles.lessonTitle}>
                            Praktische Fahrstunde
                        </Text>

                        <InfoRow
                            icon="time-outline"
                            text="14:00 – 15:30 Uhr"
                        />

                        <InfoRow
                            icon="person-outline"
                            text="Fahrlehrer: Herr Müller"
                        />

                        <InfoRow
                            icon="location-outline"
                            text="Abholung: RS Fahrschule"
                        />
                    </View>

                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            Bestätigt
                        </Text>
                    </View>
                </View>

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
                                Praxisphase
                            </Text>
                        </View>

                        <View style={styles.progressPercentCircle}>
                            <Text style={styles.progressPercent}>
                                65%
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressBackground}>
                        <View style={styles.progressFill} />
                    </View>

                    <Text style={styles.progressHint}>
                        Du bist auf einem guten Weg. Als Nächstes fehlen noch
                        Pflichtfahrten und die praktische Prüfung.
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
        width: '65%',
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
});