<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const { user } = useAuthStore()
if (user) {
    redirectToProfile(user.nickname)
}
else {
    redirectToLogin()
}

</script>