import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Image,
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

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    function handleLogin() {
        // Backend connection comes later.
        console.log('Anmelden', { email });
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Language selector */}
                    <View style={styles.languageRow}>
                        <TouchableOpacity style={styles.languageButton}>
                            <Ionicons
                                name="globe-outline"
                                size={21}
                                color="#ffffff"
                            />

                            <Text style={styles.languageText}>
                                Deutsch
                            </Text>

                            <Ionicons
                                name="chevron-down"
                                size={17}
                                color="#ffffff"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Decorative illustration */}
                    <View style={styles.illustration}>
                        <View style={styles.mapShape}>
                            <View style={[styles.routeLine, styles.routeLineOne]} />
                            <View style={[styles.routeLine, styles.routeLineTwo]} />

                            <View style={[styles.marker, styles.markerOne]}>
                                <Ionicons
                                    name="location"
                                    size={22}
                                    color="#ffffff"
                                />
                            </View>

                            <View style={[styles.marker, styles.markerTwo]}>
                                <Ionicons
                                    name="car-sport"
                                    size={21}
                                    color="#ffffff"
                                />
                            </View>

                            <View style={[styles.marker, styles.markerThree]}>
                                <Ionicons
                                    name="school"
                                    size={21}
                                    color="#ffffff"
                                />
                            </View>

                            <View style={styles.successCard}>
                                <Ionicons
                                    name="checkmark"
                                    size={34}
                                    color="#111111"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Heading */}
                    <View style={styles.headingContainer}>
                        <Text style={styles.heading}>
                            Willkommen bei
                        </Text>

                        <Text style={styles.headingAccent}>
                            RS Fahrschule
                        </Text>

                        <Text style={styles.subtitle}>
                            Termine, Ausbildungsfortschritt und Prüfungen –
                            einfach an einem Ort.
                        </Text>
                    </View>

                    {/* Email */}
                    <Text style={styles.label}>E-Mail</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={21}
                            color="#9b9b9b"
                        />

                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="name@beispiel.de"
                            placeholderTextColor="#777777"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.input}
                        />
                    </View>

                    {/* Password */}
                    <Text style={styles.label}>Passwort</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={21}
                            color="#9b9b9b"
                        />

                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Passwort eingeben"
                            placeholderTextColor="#777777"
                            secureTextEntry={!showPassword}
                            style={styles.input}
                        />

                        <TouchableOpacity
                            onPress={() => setShowPassword((current) => !current)}
                        >
                            <Ionicons
                                name={
                                    showPassword
                                        ? 'eye-outline'
                                        : 'eye-off-outline'
                                }
                                size={22}
                                color="#9b9b9b"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Forgot password */}
                    <TouchableOpacity style={styles.forgotButton}>
                        <Text style={styles.forgotText}>
                            Passwort vergessen?
                        </Text>
                    </TouchableOpacity>

                    {/* Login */}
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.loginButtonText}>
                            Anmelden
                        </Text>

                        <Ionicons
                            name="arrow-forward"
                            size={23}
                            color="#ffffff"
                        />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />

                        <Text style={styles.dividerText}>
                            oder
                        </Text>

                        <View style={styles.divider} />
                    </View>

                    {/* Registration */}
                    <Text style={styles.noAccountText}>
                        Noch kein Konto?
                    </Text>

                    <TouchableOpacity
                        style={styles.registerButton}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.registerButtonText}>
                            Als Fahrschüler registrieren
                        </Text>
                    </TouchableOpacity>

                    {/* Footer */}
                    <Text style={styles.footer}>
                        Sicher. Gemeinsam. In die Zukunft.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const ORANGE = '#ff8800';
const BACKGROUND = '#0d0d0f';

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },


    safeArea: {
        flex: 1,
        backgroundColor: BACKGROUND,
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 38,
    },

    languageRow: {
        alignItems: 'flex-end',
        marginBottom: 18,
    },

    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#555555',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#151517',
    },

    languageText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },

    illustration: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 190,
        marginBottom: 8,
    },

    mapShape: {
        width: 210,
        height: 145,
        borderRadius: 45,
        backgroundColor: '#f4f4f4',
        transform: [{ rotate: '-5deg' }],
        position: 'relative',

        shadowColor: ORANGE,
        shadowOpacity: 0.18,
        shadowRadius: 28,
        shadowOffset: {
            width: 0,
            height: 5,
        },

        elevation: 6,
    },

    routeLine: {
        position: 'absolute',
        height: 3,
        backgroundColor: '#ffb14a',
        borderRadius: 10,
    },

    routeLineOne: {
        width: 105,
        left: 37,
        top: 60,
        transform: [{ rotate: '13deg' }],
    },

    routeLineTwo: {
        width: 75,
        left: 92,
        top: 94,
        transform: [{ rotate: '-20deg' }],
    },

    marker: {
        position: 'absolute',
        width: 43,
        height: 43,
        borderRadius: 22,
        backgroundColor: ORANGE,
        alignItems: 'center',
        justifyContent: 'center',
    },

    markerOne: {
        left: 22,
        top: 25,
    },

    markerTwo: {
        right: 34,
        top: 18,
    },

    markerThree: {
        left: 80,
        bottom: 17,
    },

    successCard: {
        position: 'absolute',
        right: -15,
        bottom: 12,
        width: 55,
        height: 67,
        borderRadius: 10,
        backgroundColor: '#ffae00',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headingContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },

    heading: {
        color: '#ffffff',
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
    },

    headingAccent: {
        color: ORANGE,
        fontSize: 34,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 2,
    },

    subtitle: {
        color: '#b7b7b7',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        maxWidth: 330,
        marginTop: 12,
    },

    label: {
        color: '#f4f4f4',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8,
    },

    inputContainer: {
        height: 58,
        borderWidth: 1,
        borderColor: '#414145',
        borderRadius: 16,
        backgroundColor: '#171719',

        flexDirection: 'row',
        alignItems: 'center',

        paddingHorizontal: 16,
        marginBottom: 20,
    },

    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 12,
        height: '100%',
    },

    forgotButton: {
        alignSelf: 'flex-end',
        marginTop: -4,
        marginBottom: 24,
    },

    forgotText: {
        color: ORANGE,
        fontSize: 14,
        fontWeight: '600',
    },

    loginButton: {
        height: 58,
        backgroundColor: ORANGE,
        borderRadius: 30,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        position: 'relative',
    },

    loginButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 26,
    },

    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#3e3e42',
    },

    dividerText: {
        color: '#8f8f93',
        marginHorizontal: 14,
        fontSize: 14,
    },

    noAccountText: {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 15,
        marginBottom: 12,
    },

    registerButton: {
        height: 56,
        borderWidth: 2,
        borderColor: ORANGE,
        borderRadius: 30,

        alignItems: 'center',
        justifyContent: 'center',
    },

    registerButtonText: {
        color: ORANGE,
        fontSize: 16,
        fontWeight: '800',
    },

    footer: {
        color: '#888888',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 34,
    },
});