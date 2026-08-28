// Построитель URL для внешних API (переложен в ApiBuilder, чтобы центрально
// держать базовый адрес из runtime-config в одном месте).
export const useApiBuilder = () => {
    const config = useRuntimeConfig()
    
    // Приводит относительный url к полному http-адресу API.
    // Правила:
    //  - абсолютные http(s) url возвращаются как есть;
    //  - ведущие '/api' / 'api' срезаются (это путь Nuxt-роутов, не нашего API);
    //  - к остатку добавляется префикс config.public.API_URL.
    const buildApiUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http')) return url
        
        let cleanUrl = url
        if (cleanUrl.startsWith('/api')) {
            cleanUrl = cleanUrl.slice(4)
        } else if (cleanUrl.startsWith('api')) {
            cleanUrl = cleanUrl.slice(3)
        }
        
        const finalUrl = cleanUrl.startsWith('/') ? cleanUrl : '/' + cleanUrl
        return `${config.public.API_URL}${finalUrl}`
    }
    
    return {
        buildApiUrl
    }
}