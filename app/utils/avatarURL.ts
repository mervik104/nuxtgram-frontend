const BASE_API_URL = 'http://localhost:3001'

export function AvatarURL(url: string): string {
    const URL: string = BASE_API_URL + url
    return URL
}