import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from '../+server.js';

describe('OTLP same-origin proxy', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('POST /v1/metrics reenvía al collector', async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
		vi.stubGlobal('fetch', fetchMock);
		const response = await POST({
			params: { path: 'v1/metrics' },
			request: new Request('http://localhost/internal/otlp/v1/metrics', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: '{"resourceMetrics":[]}'
			})
		});
		expect(response.status).toBe(204);
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:4318/v1/metrics',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('ruta no permitida responde 404 y no llama al collector', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const response = await POST({
			params: { path: 'v1/hack' },
			request: new Request('http://localhost/internal/otlp/v1/hack', { method: 'POST', body: '{}' })
		});
		expect(response.status).toBe(404);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('produccion sin OTLP_ENDPOINT responde 204 y no llama al collector', async () => {
		const had = Object.prototype.hasOwnProperty.call(process.env, 'OTLP_ENDPOINT');
		const previous = process.env.OTLP_ENDPOINT;
		delete process.env.OTLP_ENDPOINT;
		vi.stubEnv('NODE_ENV', 'production');
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		try {
			const response = await POST({
				params: { path: 'v1/traces' },
				request: new Request('http://localhost/internal/otlp/v1/traces', {
					method: 'POST',
					body: '{}'
				})
			});
			expect(response.status).toBe(204);
			expect(fetchMock).not.toHaveBeenCalled();
		} finally {
			if (had) process.env.OTLP_ENDPOINT = previous;
		}
	});

	it('si el collector falla, igual 204 (fail-open)', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		const response = await POST({
			params: { path: 'v1/logs' },
			request: new Request('http://localhost/internal/otlp/v1/logs', {
				method: 'POST',
				body: '{}'
			})
		});
		expect(response.status).toBe(204);
	});
});
