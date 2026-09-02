import { copyToClipboard } from '~/utils/clipboard'

// Ссылки на посты: формирование URL и копирование в буфер обмена.
export const usePostLink = () => {
    // Собирает кликабельный url поста (hash-роутинг: origin + '/#/feed/<postId>'),
    // копирует его в буфер (с фолбэком для не-secure контекстов) и показывает
    // подтверждающий тост.
    const createPostUrl = (postId: string) => {
        if (!postId) return ''
        const url = window.location.origin
        const postUrl = url + `/#/feed/${postId}`
        copyToClipboard(postUrl)
        const toast = useToast()
        toast.add({
            color: 'success',
            icon: 'solar:check-circle-bold',
            title: 'Ссылка скопирована',
            duration: 2500,
        })
    }
    return {
        createPostUrl
    }
}