export const usePostLink = () => {
    const createPostUrl = (postId: string) => {
        if (!postId) return ''
        const url = window.location.origin
        const postUrl = url + `/#/feed/${postId}`
        navigator.clipboard.writeText(postUrl)
        const toast = useNotification()
        toast.success({ message: 'Ссылка на пост скопирована' })
    }
    return {
        createPostUrl
    }
}