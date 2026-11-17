import type { useRouter } from 'expo-router';

type AppRouter = ReturnType<typeof useRouter>;

// router.back() throws "GO_BACK was not handled" when there is no history
// (e.g. after a browser reload). Fall back to a known screen instead.
export function goBack(router: AppRouter, fallback: string) {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace(fallback as any);
    }
}
