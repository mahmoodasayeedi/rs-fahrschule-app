import { Alert, Platform } from 'react-native';

// Works in the browser (Expo web) AND on real phones.
// window.confirm only exists on web; Alert.alert only shows buttons on native.
export function confirmAction(message: string, confirmLabel = 'Ja'): Promise<boolean> {
    if (Platform.OS === 'web') {
        return Promise.resolve(window.confirm(message));
    }
    return new Promise((resolve) => {
        Alert.alert('Bitte bestätigen', message, [
            { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
            { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
        ], { cancelable: true, onDismiss: () => resolve(false) });
    });
}
