import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  const isLoggedIn = !!authStore.user;

  console.log(authStore.user);

  if (to.path === '/' && !isLoggedIn) {
    return navigateTo('/login');
  }

  // if (to.path === '/' && isLoggedIn) {
  //   return navigateTo('/');
  // }

  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    console.log('Вы уже авторизованы');
    return navigateTo('/');
  }
});