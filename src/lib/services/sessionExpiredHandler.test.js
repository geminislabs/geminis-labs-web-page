import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleSessionExpired } from './sessionExpiredHandler.js';
import { metrics } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';

const { logout, goto, warning } = vi.hoisted(() => ({
	logout: vi.fn(),
	goto: vi.fn(),
	warning: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$lib/stores/toastStore.js', () => ({
	toastStore: { warning }
}));

vi.mock('$lib/stores/authStore.js', () => ({
	authStore: { logout }
}));

vi.mock('$lib/stores/pageTransitionStore.js', () => ({
	pageTransitionStore: { goto }
}));

describe('handleSessionExpired', () => {
	/** @type {ReturnType<typeof vi.fn>} */
	let add;
	/** @type {ReturnType<typeof vi.fn>} */
	let emit;

	beforeEach(() => {
		add = vi.fn();
		emit = vi.fn();
		vi.spyOn(metrics, 'getMeter').mockReturnValue({
			createCounter: () => ({ add })
		});
		vi.spyOn(logs, 'getLogger').mockReturnValue({ emit });
		vi.clearAllMocks();
		logout.mockResolvedValue(undefined);
		goto.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('logs out, warns user, and redirects to auth', async () => {
		await handleSessionExpired();

		expect(logout).toHaveBeenCalledOnce();
		expect(warning).toHaveBeenCalledWith(
			'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
		);
		expect(goto).toHaveBeenCalledWith('/auth', {
			transitionType: 'fade',
			replaceState: true
		});
	});

	it('emite auth.session_expired con outcome=failure', async () => {
		await handleSessionExpired();
		expect(emit).toHaveBeenCalledWith(
			expect.objectContaining({
				body: 'auth.session_expired',
				attributes: expect.objectContaining({ error_category: 'authentication' })
			})
		);
		expect(add).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				journey: 'auth.session_expired',
				outcome: 'failure',
				error_category: 'authentication'
			})
		);
	});

	it('sessionExpiredHandler registra métrica journey_outcome_total', async () => {
		await handleSessionExpired();
		expect(add).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				journey: 'auth.session_expired',
				outcome: 'failure',
				error_category: 'authentication'
			})
		);
	});

	it('swallows errors during expiry handling', async () => {
		logout.mockRejectedValueOnce(new Error('logout failed'));
		await expect(handleSessionExpired()).resolves.toBeUndefined();
		expect(emit).toHaveBeenCalledWith(
			expect.objectContaining({
				severityText: 'WARN',
				body: 'auth.session_expired.handler_failed'
			})
		);
	});
});
