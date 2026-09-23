const ALLOWED = new Set(['v1/logs', 'v1/metrics', 'v1/traces']);

function collectorBase() {
	if (typeof process !== 'undefined' && process.env && 'OTLP_ENDPOINT' in process.env) {
		return String(process.env.OTLP_ENDPOINT || '')
			.trim()
			.replace(/\/$/, '');
	}
	if (
		process.env.NODE_ENV === 'production' ||
		process.env.DEPLOY_ENV === 'production' ||
		process.env.DEPLOY_ENV === 'test'
	) {
		return '';
	}
	return 'http://localhost:4318';
}

function abortSignal(ms) {
	if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
		return AbortSignal.timeout(ms);
	}
	const controller = new AbortController();
	setTimeout(() => controller.abort(), ms);
	return controller.signal;
}

/**
 * Proxy same-origin para el browser.
 * El cliente no puede POST a :4318 (Chrome Private Network Access);
 * el sink fail-open traga el error y Grafana no ve journeys.
 */
export async function POST({ params, request }) {
	try {
		const path = String(params.path || '');
		if (!ALLOWED.has(path)) {
			return new Response(null, { status: 404 });
		}
		const base = collectorBase();
		if (!base) return new Response(null, { status: 204 });
		const body = await request.arrayBuffer();
		await fetch(`${base}/${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
			signal: abortSignal(3000)
		});
	} catch {
		/* fail-open */
	}
	return new Response(null, { status: 204 });
}
