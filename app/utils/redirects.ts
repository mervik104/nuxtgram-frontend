export function redirectToLogin() {
    // window.location.href = '#/login'
    navigateTo('/login');
}

export function redirectToRegister() {
    navigateTo('/register');
}

export function redirectToFeed(postId?: string) {
    if(postId) {
        navigateTo(`/feed/${postId}`);
    } else {
        navigateTo(`/feed`);
    }
}

export function redirectToProfile(nickname: string) {
    navigateTo(`/profile/${nickname}`);
}
