export function redirectToLogin() {
    // window.location.href = '#/login'
    navigateTo('/login');
}

export function redirectToRegister() {
    navigateTo('/register');
}

export function redirectToFeed() {
    navigateTo('/feed');
}

export function redirectToProfile(nickname: string) {
    navigateTo(`/profile/${nickname}`);
}
