import { describe, it, expect } from 'vitest';
import { GET } from '../+server.js';

describe('GET /health', () => {
	it('retorna 200', () => {
		const res = GET();
		expect(res.status).toBe(200);
	});

	it('body contiene status, service, version, environment, uptime_s, timestamp', async () => {
		const body = await GET().json();
		expect(body).toEqual(
			expect.objectContaining({
				status: expect.any(String),
				service: expect.any(String),
				version: expect.any(String),
				environment: expect.any(String),
				uptime_s: expect.any(Number),
				timestamp: expect.any(String)
			})
		);
	});

	it('status es ok | degraded | error', async () => {
		const body = await GET().json();
		expect(['ok', 'degraded', 'error']).toContain(body.status);
	});

	it('version no es undefined ni vacío', async () => {
		const body = await GET().json();
		expect(body.version).toBeTruthy();
	});

	it('environment es production | test | local', async () => {
		const body = await GET().json();
		expect(['production', 'test', 'local']).toContain(body.environment);
	});

	it('timestamp es ISO 8601 válido', async () => {
		const body = await GET().json();
		expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
	});

	it('no contiene tokens, secrets ni PII', async () => {
		const body = await GET().json();
		const serialized = JSON.stringify(body).toLowerCase();
		expect(serialized).not.toContain('bearer');
		expect(serialized).not.toContain('password');
		expect(serialized).not.toContain('authorization');
		expect(body).not.toHaveProperty('email');
		expect(body).not.toHaveProperty('token');
	});

	it('Cache-Control: no-store', () => {
		const res = GET();
		expect(res.headers.get('Cache-Control')).toBe('no-store');
	});
});
