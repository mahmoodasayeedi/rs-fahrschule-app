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

export default function AusbildungsfortschrittScreen() {
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
                            Ausbildungsfortschritt
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            Dein aktueller Ausbildungsstand
                        </Text>
                    </View>
                </View>

                {/* Current status */}
                <View style={styles.statusCard}>
                    <View style={styles.statusIcon}>
                        <Ionicons
                            name="car-sport-outline"
                            size={32}
                            color={ORANGE}
                        />
                    </View>

                    <View style={styles.statusContent}>
                        <Text style={styles.statusLabel}>
                            Aktueller Status
                        </Text>

                        <Text style={styles.statusValue}>
                            Praxisphase
                        </Text>

                        <Text style={styles.statusText}>
                            Du hast die Theoriephase abgeschlossen und befindest
                            dich aktuell in der praktischen Ausbildung.
                        </Text>
                    </View>
                </View>

                {/* Overall progress */}
                <View style={styles.progressCard}>
                    <View style={styles.progressTop}>
                        <View>
                            <Text style={styles.progressLabel}>
                                Gesamtfortschritt
                            </Text>

                            <Text style={styles.progressValue}>
                                65%
                            </Text>
                        </View>

                        <View style={styles.percentCircle}>
                            <Text style={styles.percentText}>65%</Text>
                        </View>
                    </View>

                    <View style={styles.progressBackground}>
                        <View style={styles.progressFill} />
                    </View>
                </View>

                {/* Theory */}
                <Text style={styles.sectionTitle}>
                    Theorie
                </Text>

                <ProgressItem
                    icon="book-outline"
                    title="Theorieunterricht"
                    value="14 von 14"
                    completed
                />

                <ProgressItem
                    icon="school-outline"
                    title="Theorieprüfung"
                    value="Bestanden"
                    completed
                />

                {/* Practice */}
                <Text style={styles.sectionTitle}>
                    Praxis
                </Text>

                <ProgressItem
                    icon="car-outline"
                    title="Praktische Fahrstunden"
                    value="18 absolviert"
                />

                <ProgressItem
                    icon="map-outline"
                    title="Überlandfahrten"
                    value="3 von 5"
                />

                <ProgressItem
                    icon="speedometer-outline"
                    title="Autobahnfahrten"
                    value="2 von 4"
                />

                <ProgressItem
                    icon="moon-outline"
                    title="Nachtfahrten"
                    value="1 von 3"
                />

                {/* Exams */}
                <Text style={styles.sectionTitle}>
                    Prüfungen
                </Text>

                <ProgressItem
                    icon="checkmark-circle-outline"
                    title="Theorieprüfung"
                    value="Bestanden"
                    completed
                />

                <ProgressItem
                    icon="clipboard-outline"
                    title="Praktische Prüfung"
                    value="Noch nicht geplant"
                />

                {/* Next steps */}
                <Text style={styles.sectionTitle}>
                    Was kommt als Nächstes?
                </Text>

                <View style={styles.nextCard}>
                    <View style={styles.nextIcon}>
                        <Ionicons
                            name="navigate-outline"
                            size={25}
                            color={ORANGE}
                        />
                    </View>

                    <View style={styles.nextContent}>
                        <Text style={styles.nextTitle}>
                            Weitere Pflichtfahrten
                        </Text>

                        <Text style={styles.nextText}>
                            Als Nächstes fehlen dir noch weitere Überland-,
                            Autobahn- und Nachtfahrten. Danach kann die praktische
                            Prüfung vorbereitet werden.
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

function ProgressItem({
    icon,
    title,
    value,
    completed = false,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string;
    completed?: boolean;
}) {
    return (
        <View style={styles.itemCard}>
            <View style={styles.itemIcon}>
                <Ionicons
                    name={icon}
                    size={23}
                    color={completed ? '#71d694' : ORANGE}
                />
            </View>

            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>
                    {title}
                </Text>

                <Text
                    style={[
                        styles.itemValue,
                        completed && styles.itemValueCompleted,
                    ]}
                >
                    {value}
                </Text>
            </View>

            {completed ? (
                <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#71d694"
                />
            ) : (
                <Ionicons
                    name="chevron-forward"
                    size={21}
                    color="#77777c"
                />
            )}
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
        marginBottom: 25,
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
        fontSize: 24,
        fontWeight: '900',
    },

    headerSubtitle: {
        color: '#8c8c91',
        fontSize: 13,
        marginTop: 3,
    },

    statusCard: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: '#49331d',
        borderRadius: 19,
        padding: 18,
        flexDirection: 'row',
        marginBottom: 18,
    },

    statusIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    statusContent: {
        flex: 1,
    },

    statusLabel: {
        color: '#8c8c91',
        fontSize: 12,
    },

    statusValue: {
        color: '#ffffff',
        fontSize: 21,
        fontWeight: '900',
        marginTop: 3,
    },

    statusText: {
        color: '#9f9fa4',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 7,
    },

    progressCard: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        padding: 18,
        marginBottom: 28,
    },

    progressTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    progressLabel: {
        color: '#929297',
        fontSize: 13,
    },

    progressValue: {
        color: '#ffffff',
        fontSize: 21,
        fontWeight: '900',
        marginTop: 3,
    },

    percentCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 2,
        borderColor: ORANGE,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
    },

    percentText: {
        color: ORANGE,
        fontSize: 15,
        fontWeight: '900',
    },

    progressBackground: {
        height: 8,
        backgroundColor: '#303034',
        borderRadius: 5,
        marginTop: 18,
        overflow: 'hidden',
    },

    progressFill: {
        width: '65%',
        height: '100%',
        backgroundColor: ORANGE,
        borderRadius: 5,
    },

    sectionTitle: {
        color: '#ffffff',
        fontSize: 19,
        fontWeight: '800',
        marginTop: 22,
        marginBottom: 12,
    },

    itemCard: {
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 17,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 11,
    },

    itemIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    itemContent: {
        flex: 1,
    },

    itemTitle: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '800',
    },

    itemValue: {
        color: '#aaaab0',
        fontSize: 12,
        marginTop: 4,
    },

    itemValueCompleted: {
        color: '#71d694',
    },

    nextCard: {
        backgroundColor: '#1c1814',
        borderWidth: 1,
        borderColor: '#4f371f',
        borderRadius: 18,
        padding: 17,
        flexDirection: 'row',
    },

    nextIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#261c13',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    nextContent: {
        flex: 1,
    },

    nextTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '800',
    },

    nextText: {
        color: '#a4a4a9',
        fontSize: 13,
        lineHeight: 19,
        marginTop: 5,
    },

    footer: {
        color: '#68686d',
        textAlign: 'center',
        marginTop: 32,
        fontSize: 12,
    },
});