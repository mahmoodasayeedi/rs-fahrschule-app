import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
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

export default function RegisterScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState('');

    const [street, setStreet] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');

    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const [licenceClass, setLicenceClass] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

    function handleRegister() {
        // Supabase connection will be added later.
        console.log('Student registration');
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* TOP */}
                    <View style={styles.topRow}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.languageButton}>
                            <Ionicons name="globe-outline" size={19} color="#fff" />
                            <Text style={styles.languageText}>Deutsch</Text>
                            <Ionicons name="chevron-down" size={15} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* HEADER */}
                    <View style={styles.header}>
                        <View style={styles.studentIcon}>
                            <Ionicons
                                name="person-add-outline"
                                size={32}
                                color={ORANGE}
                            />
                        </View>

                        <Text style={styles.title}>Konto erstellen</Text>

                        <Text style={styles.subtitle}>
                            Registrieren Sie sich als Fahrschüler bei RS Fahrschule.
                        </Text>
                    </View>

                    {/* PERSONAL DATA */}
                    <SectionTitle
                        icon="person-outline"
                        title="Persönliche Daten"
                    />

                    <Input
                        label="Vorname"
                        placeholder="Vorname"
                        value={firstName}
                        onChangeText={setFirstName}
                        icon="person-outline"
                    />

                    <Input
                        label="Nachname"
                        placeholder="Nachname"
                        value={lastName}
                        onChangeText={setLastName}
                        icon="person-outline"
                    />

                    <Input
                        label="Geburtsdatum"
                        placeholder="TT.MM.JJJJ"
                        value={birthDate}
                        onChangeText={setBirthDate}
                        icon="calendar-outline"
                        keyboardType="numbers-and-punctuation"
                    />

                    <Input
                        label="Telefonnummer"
                        placeholder="+49 ..."
                        value={phone}
                        onChangeText={setPhone}
                        icon="call-outline"
                        keyboardType="phone-pad"
                    />

                    {/* ADDRESS */}
                    <SectionTitle
                        icon="location-outline"
                        title="Adresse"
                    />

                    <Input
                        label="Straße und Hausnummer"
                        placeholder="Musterstraße 10"
                        value={street}
                        onChangeText={setStreet}
                        icon="home-outline"
                    />

                    <Input
                        label="PLZ"
                        placeholder="76726"
                        value={postalCode}
                        onChangeText={setPostalCode}
                        icon="location-outline"
                        keyboardType="number-pad"
                    />

                    <Input
                        label="Ort"
                        placeholder="Germersheim"
                        value={city}
                        onChangeText={setCity}
                        icon="business-outline"
                    />

                    {/* LICENCE */}
                    <SectionTitle
                        icon="car-sport-outline"
                        title="Führerschein"
                    />

                    <Text style={styles.label}>Führerscheinklasse</Text>

                    <View style={styles.classContainer}>
                        {['B', 'BE', 'B197', 'AM', 'A1', 'A2', 'B196'].map(
                            (item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.classButton,
                                        licenceClass === item &&
                                        styles.classButtonSelected,
                                    ]}
                                    onPress={() => setLicenceClass(item)}
                                >
                                    <Text
                                        style={[
                                            styles.classText,
                                            licenceClass === item &&
                                            styles.classTextSelected,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>

                    {/* LOGIN DETAILS */}
                    <SectionTitle
                        icon="key-outline"
                        title="Zugangsdaten"
                    />

                    <Input
                        label="E-Mail"
                        placeholder="name@beispiel.de"
                        value={email}
                        onChangeText={setEmail}
                        icon="mail-outline"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Passwort</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#999"
                        />

                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Passwort erstellen"
                            placeholderTextColor="#777"
                            secureTextEntry={!showPassword}
                            style={styles.input}
                        />

                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={
                                    showPassword
                                        ? 'eye-outline'
                                        : 'eye-off-outline'
                                }
                                size={21}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>

                    <Input
                        label="Passwort bestätigen"
                        placeholder="Passwort wiederholen"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        icon="shield-checkmark-outline"
                        secureTextEntry={!showPassword}
                    />

                    {/* PRIVACY */}
                    <TouchableOpacity
                        style={styles.privacyRow}
                        onPress={() =>
                            setAcceptedPrivacy(!acceptedPrivacy)
                        }
                    >
                        <View
                            style={[
                                styles.checkbox,
                                acceptedPrivacy && styles.checkboxSelected,
                            ]}
                        >
                            {acceptedPrivacy && (
                                <Ionicons
                                    name="checkmark"
                                    size={16}
                                    color="#fff"
                                />
                            )}
                        </View>

                        <Text style={styles.privacyText}>
                            Ich habe die Datenschutzerklärung gelesen und
                            akzeptiere sie.
                        </Text>
                    </TouchableOpacity>

                    {/* REGISTER */}
                    <TouchableOpacity
                        style={[
                            styles.registerButton,
                            !acceptedPrivacy &&
                            styles.registerButtonDisabled,
                        ]}
                        disabled={!acceptedPrivacy}
                        onPress={handleRegister}
                    >
                        <Text style={styles.registerButtonText}>
                            Konto erstellen
                        </Text>

                        <Ionicons
                            name="arrow-forward"
                            size={22}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <View style={styles.loginRow}>
                        <Text style={styles.loginQuestion}>
                            Bereits registriert?
                        </Text>

                        <TouchableOpacity>
                            <Text style={styles.loginLink}>
                                Anmelden
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footer}>
                        Sicher. Gemeinsam. In die Zukunft.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

/* ---------- Reusable components ---------- */

function SectionTitle({
    title,
    icon,
}: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
}) {
    return (
        <View style={styles.sectionTitle}>
            <Ionicons name={icon} size={21} color={ORANGE} />

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
            <Text style={styles.label}>{label}</Text>

            <View style={styles.inputContainer}>
                <Ionicons
                    name={icon}
                    size={20}
                    color="#999"
                />

                <TextInput
                    {...props}
                    placeholderTextColor="#777"
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
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 40,
    },

    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },

    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#171719',
        borderWidth: 1,
        borderColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
    },

    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: '#171719',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 24,
        paddingHorizontal: 14,
    },

    languageText: {
        color: '#fff',
        fontWeight: '600',
    },

    header: {
        alignItems: 'center',
        marginBottom: 30,
    },

    studentIcon: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#1c1a17',
        borderWidth: 1,
        borderColor: '#4c3520',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    title: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '900',
    },

    subtitle: {
        color: '#aaa',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginTop: 9,
    },

    sectionTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        marginTop: 14,
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#29292d',
    },

    sectionTitleText: {
        color: '#fff',
        fontSize: 19,
        fontWeight: '800',
    },

    label: {
        color: '#eee',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },

    inputContainer: {
        height: 57,
        borderWidth: 1,
        borderColor: '#414145',
        borderRadius: 16,
        backgroundColor: '#171719',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 19,
    },

    input: {
        flex: 1,
        height: '100%',
        marginLeft: 11,
        color: '#fff',
        fontSize: 16,
    },

    classContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 28,
    },

    classButton: {
        minWidth: 65,
        height: 45,
        paddingHorizontal: 15,
        borderRadius: 23,
        borderWidth: 1,
        borderColor: '#49494d',
        backgroundColor: '#171719',
        alignItems: 'center',
        justifyContent: 'center',
    },

    classButtonSelected: {
        backgroundColor: ORANGE,
        borderColor: ORANGE,
    },

    classText: {
        color: '#bbb',
        fontWeight: '700',
    },

    classTextSelected: {
        color: '#fff',
    },

    privacyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 5,
        marginBottom: 25,
    },

    checkbox: {
        width: 23,
        height: 23,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#666',
        marginRight: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkboxSelected: {
        backgroundColor: ORANGE,
        borderColor: ORANGE,
    },

    privacyText: {
        flex: 1,
        color: '#aaa',
        fontSize: 13,
        lineHeight: 19,
    },

    registerButton: {
        height: 58,
        borderRadius: 30,
        backgroundColor: ORANGE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },

    registerButtonDisabled: {
        opacity: 0.45,
    },

    registerButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },

    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 27,
    },

    loginQuestion: {
        color: '#aaa',
        fontSize: 14,
    },

    loginLink: {
        color: ORANGE,
        fontWeight: '700',
        marginLeft: 6,
    },

    footer: {
        color: '#777',
        textAlign: 'center',
        fontSize: 13,
        marginTop: 35,
    },
});