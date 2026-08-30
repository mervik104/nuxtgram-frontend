<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

if (user.value) {
    redirectToProfile(user.value.nickname)
}
else {
    authStore.openAuthPrompt()
    redirectToFeed()
}

</script>