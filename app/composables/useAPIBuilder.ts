export const useAPIBuilder = () => {
    const config = useRuntimeConfig()
    
    const buildAPIUrl = (url: string): string => {
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
        buildAPIUrl
    }
}