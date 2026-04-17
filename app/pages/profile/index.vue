<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
    onMounted(() => {
        const {user} = useAuthStore()
        if(user) {
            redirectToProfile(user.nickname)
        }
        else {
            redirectToLogin()
        }
    })
</script>