import { Linking } from 'react-native';

// Digits only, international format without "+", as WhatsApp links need it.
// A number starting with a single 0 is assumed to be German (49).
export function whatsappNumber(phone: string): string {
    const raw = phone.replace(/[^\d+]/g, '');
    if (raw.startsWith('+')) return raw.slice(1);
    if (raw.startsWith('00')) return raw.slice(2);
    if (raw.startsWith('0')) return '49' + raw.slice(1);
    return raw;
}

export function openCall(phone: string) {
    return Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

export function openWhatsApp(phone: string) {
    return Linking.openURL(`https://wa.me/${whatsappNumber(phone)}`);
}

export function openMaps(address: string) {
    return Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    );
}
