export const useApi = () => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.API_URL,
    credentials: 'include',

    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/login') 
        console.warn('Пользователь не авторизован')
      }
    }
  })

  return { api }
}