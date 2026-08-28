// Навигация на страницу входа.
export function redirectToLogin() {
    // window.location.href = '#/login'
    navigateTo('/login');
}

// Навигация на страницу регистрации.
export function redirectToRegister() {
    navigateTo('/register');
}

// Навигация на ленту; при переданном postId — на страницу конкретного поста.
export function redirectToFeed(postId?: string) {
    if(postId && typeof postId === 'string') {
        navigateTo(`/feed/${postId}`);
    } else {
        navigateTo(`/feed`);
    }
}

// Навигация на профиль пользователя по nickname.
export function redirectToProfile(nickname: string) {
    navigateTo(`/profile/${nickname}`);
}
