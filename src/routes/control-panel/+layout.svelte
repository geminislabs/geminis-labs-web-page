<script>
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { goto, beforeNavigate } from '$app/navigation';
	import { authStore, isAuthenticated } from '$lib/stores/authStore.js';
	import { refreshOrganizationAccess } from '$lib/stores/organizationAccessStore.js';
	import SuspensionBanner from '$lib/components/control-panel/SuspensionBanner.svelte';

	let { children } = $props();

	function checkAuth() {
		if (!get(isAuthenticated)) {
			goto('/auth', { replaceState: true });
		}
	}

	onMount(() => {
		// Re-inicializar para revalidar expiración del token
		authStore.init();
		checkAuth();
		if (get(isAuthenticated)) refreshOrganizationAccess();
	});

	beforeNavigate(checkAuth);
</script>

<SuspensionBanner />

{@render children?.()}
