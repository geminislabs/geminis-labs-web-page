import { json } from '@sveltejs/kit';

export const prerender = false;

function readConst(value, fallback) {
	if (value == null) return fallback;
	const text = String(value).trim();
	return text === '' ? fallback : text;
}

export function GET() {
	try {
		const service = readConst(
			typeof __SERVICE_NAME__ !== 'undefined' ? __SERVICE_NAME__ : '',
			'geminis-labs-web-page'
		);
		const version = readConst(
			typeof __SERVICE_VERSION__ !== 'undefined' ? __SERVICE_VERSION__ : '',
			'0.0.0'
		);
		let environment = 'local';
		if (typeof process !== 'undefined' && process.env?.DEPLOY_ENV) {
			const env = String(process.env.DEPLOY_ENV).trim();
			if (env === 'production' || env === 'test' || env === 'local') environment = env;
		} else if (typeof __DEPLOY_ENV__ !== 'undefined') {
			const defined = String(__DEPLOY_ENV__).trim();
			if (defined === 'production' || defined === 'test' || defined === 'local') {
				environment = defined;
			}
		}
		return json(
			{
				status: 'ok',
				service,
				version,
				environment,
				uptime_s: Math.floor(
					typeof process !== 'undefined' && typeof process.uptime === 'function'
						? process.uptime()
						: 0
				),
				timestamp: new Date().toISOString()
			},
			{
				headers: {
					'Cache-Control': 'no-store'
				}
			}
		);
	} catch {
		return json(
			{
				status: 'error',
				service: 'geminis-labs-web-page',
				version: '0.0.0',
				environment: 'local',
				uptime_s: 0,
				timestamp: new Date().toISOString()
			},
			{
				status: 503,
				headers: {
					'Cache-Control': 'no-store'
				}
			}
		);
	}
}
