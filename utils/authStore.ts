/**
 * Module-level auth state store.
 * Diset oleh _layout.tsx saat bootstrap, dibaca oleh index.tsx untuk guard.
 * TODO: Ganti dengan Supabase session / AsyncStorage di masa mendatang.
 */
let _isLoggedIn: boolean = false;

export const setAuthState = (loggedIn: boolean) => {
    _isLoggedIn = loggedIn;
};

export const getAuthState = (): boolean => {
    return _isLoggedIn;
};
