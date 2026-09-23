import { browser } from '$app/environment';
import { toastStore } from '$lib/stores/toastStore.js';
import { logWarn } from '$lib/observability/capture.js';
import { recordJourneyOutcome } from '$lib/observability/journey.js';

function emitSessionExpired() {
	try {
		logWarn('auth.session_expired', { error_category: 'authentication' });
		recordJourneyOutcome({
			journey: 'auth.session_expired',
			outcome: 'failure',
			errorCategory: 'authentication'
		});
	} catch {
		/* fail-open */
	}
}

/**
 * Handles 401 session expiry without a static apiClient → authStore import cycle.
 */
export async function handleSessionExpired() {
	if (!browser) return;

	try {
		const { pageTransitionStore } = await import('$lib/stores/pageTransitionStore.js');
		const { authStore } = await import('$lib/stores/authStore.js');

		await authStore.logout();
		toastStore.warning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
		await pageTransitionStore.goto('/auth', {
			transitionType: 'fade',
			replaceState: true
		});
		emitSessionExpired();
	} catch {
		logWarn('auth.session_expired.handler_failed', { error_category: 'programming' });
	}
}
