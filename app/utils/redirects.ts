export function redirectToLogin() {
    // window.location.href = '#/login'
    navigateTo('/login');
}

export function redirectToRegister() {
    navigateTo('/register');
}

export function redirectToFeed(postId?: string) {
    if(postId && typeof postId === 'string') {
        navigateTo(`/feed/${postId}`);
    } else {
        navigateTo(`/feed`);
    }
}

export function redirectToProfile(nickname: string) {
    navigateTo(`/profile/${nickname}`);
}
