import { init } from '$lib/observability/init.js';
import { installNodeErrorCapture, reportUnhandled } from '$lib/observability/capture.js';
import { recordHttpServer } from '$lib/observability/http.js';
import { scrubUrl } from '$lib/observability/scrubber.js';

await init();
installNodeErrorCapture();

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
function serverRoute(event) {
	try {
		if (event?.route?.id) return String(event.route.id);
		return scrubUrl(event?.url?.pathname ?? '') || 'unspecified';
	} catch {
		return 'unspecified';
	}
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error, message }) {
	reportUnhandled(error, 'sveltekit');
	return { message };
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const pathname = event?.url?.pathname ?? '';
	if (pathname.startsWith('/internal/otlp')) {
		return resolve(event);
	}
	const start = Date.now();
	try {
		const response = await resolve(event);
		try {
			recordHttpServer({
				route: serverRoute(event),
				method: event.request.method,
				statusCode: response.status,
				durationMs: Date.now() - start
			});
		} catch {
			/* fail-open */
		}
		return response;
	} catch (error) {
		try {
			recordHttpServer({
				route: serverRoute(event),
				method: event.request.method,
				statusCode: 500,
				durationMs: Date.now() - start
			});
		} catch {
			/* fail-open */
		}
		throw error;
	}
}
