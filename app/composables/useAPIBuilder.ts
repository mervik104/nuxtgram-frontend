export const useApiBuilder = () => {
    const config = useRuntimeConfig()
    
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