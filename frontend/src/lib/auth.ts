import router from 'next/router';

export const logout = () => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear cookies
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Clear storage events
    window.dispatchEvent(new Event('auth-change'));
    window.dispatchEvent(new Event('storage'));
};
