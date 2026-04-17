export const useApi = () => {
  const api = $fetch.create({
    baseURL: 'http://localhost:3001/api',
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