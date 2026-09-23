import { init } from '$lib/observability/init.js';
import { installBrowserErrorCapture, reportUnhandled } from '$lib/observability/capture.js';

await init();
installBrowserErrorCapture();

/** @type {import('@sveltejs/kit').HandleClientError} */
export function handleError({ error, message }) {
	reportUnhandled(error, 'sveltekit');
	return { message };
}
