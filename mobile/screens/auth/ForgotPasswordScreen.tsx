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

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');

    function handleResetPassword() {
        // Supabase password reset will be connected later.
        console.log('Password reset requested for:', email);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Top row */}
                    <View style={styles.topRow}>
                        <TouchableOpacity style={styles.backButton}>
                            <Ionicons
                                name="arrow-back"
                                size={22}
                                color="#ffffff"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.languageButton}>
                            <Ionicons
                                name="globe-outline"
                                size={19}
                                color="#ffffff"
                            />

                            <Text style={styles.languageText}>
                                Deutsch
                            </Text>

                            <Ionicons
                                name="chevron-down"
                                size={15}
                                color="#ffffff"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Illustration */}
                    <View style={styles.illustrationContainer}>
                        <View style={styles.circleOuter}>
                            <View style={styles.circleInner}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={48}
                                    color={ORANGE}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Heading */}
                    <Text style={styles.title}>
                        Passwort vergessen?
                    </Text>

                    <Text style={styles.subtitle}>
                        Kein Problem. Geben Sie Ihre E-Mail-Adresse ein.
                        Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
                    </Text>

                    {/* Email */}
                    <Text style={styles.label}>
                        E-Mail
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={21}
                            color="#999999"
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

                    {/* Send button */}
                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            !email.trim() && styles.primaryButtonDisabled,
                        ]}
                        onPress={handleResetPassword}
                        disabled={!email.trim()}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>
                            Link senden
                        </Text>

                        <Ionicons
                            name="arrow-forward"
                            size={22}
                            color="#ffffff"
                        />
                    </TouchableOpacity>

                    {/* Info card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoIcon}>
                            <Ionicons
                                name="information-circle-outline"
                                size={23}
                                color={ORANGE}
                            />
                        </View>

                        <Text style={styles.infoText}>
                            Prüfen Sie nach dem Absenden auch Ihren Spam-Ordner,
                            falls die E-Mail nicht im Posteingang erscheint.
                        </Text>
                    </View>

                    {/* Back to login */}
                    <TouchableOpacity style={styles.loginButton}>
                        <Ionicons
                            name="arrow-back"
                            size={18}
                            color={ORANGE}
                        />

                        <Text style={styles.loginButtonText}>
                            Zurück zur Anmeldung
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

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },

    safeArea: {
        flex: 1,
        backgroundColor: BACKGROUND,
    },

    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 40,
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 45,
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#444448',
        backgroundColor: '#171719',
        alignItems: 'center',
        justifyContent: 'center',
    },

    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderWidth: 1,
        borderColor: '#444448',
        backgroundColor: '#171719',
        borderRadius: 25,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    languageText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },

    illustrationContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },

    circleOuter: {
        width: 126,
        height: 126,
        borderRadius: 63,
        backgroundColor: '#17130f',
        borderWidth: 1,
        borderColor: '#4b321a',
        alignItems: 'center',
        justifyContent: 'center',

        shadowColor: ORANGE,
        shadowOpacity: 0.15,
        shadowRadius: 30,
        shadowOffset: {
            width: 0,
            height: 6,
        },

        elevation: 4,
    },

    circleInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#211a13',
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        color: '#ffffff',
        fontSize: 31,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 12,
    },

    subtitle: {
        color: '#aaaaaf',
        fontSize: 15,
        lineHeight: 23,
        textAlign: 'center',
        marginBottom: 36,
    },

    label: {
        color: '#eeeeee',
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
        marginBottom: 24,
    },

    input: {
        flex: 1,
        height: '100%',
        marginLeft: 12,
        color: '#ffffff',
        fontSize: 16,
    },

    primaryButton: {
        height: 58,
        borderRadius: 30,
        backgroundColor: ORANGE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },

    primaryButtonDisabled: {
        opacity: 0.45,
    },

    primaryButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
    },

    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 26,
        padding: 16,
        backgroundColor: '#171719',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#323236',
    },

    infoIcon: {
        marginRight: 10,
        marginTop: 1,
    },

    infoText: {
        flex: 1,
        color: '#a9a9ae',
        fontSize: 13,
        lineHeight: 19,
    },

    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        marginTop: 30,
    },

    loginButtonText: {
        color: ORANGE,
        fontSize: 15,
        fontWeight: '700',
    },

    footer: {
        color: '#77777c',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 42,
    },
});