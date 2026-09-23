import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { metrics } from '@opentelemetry/api';
import { authService } from './authService.js';

// Mock del apiClient
vi.mock('./apiClient.js', () => ({
	apiClient: {
		post: vi.fn(),
		get: vi.fn()
	},
	ApiError: class ApiError extends Error {
		constructor(message, status, data) {
			super(message);
			this.status = status;
			this.data = data;
		}
		isAuthError() {
			return this.status === 401;
		}
		isValidationError() {
			return this.status === 422;
		}
		isServerError() {
			return this.status >= 500;
		}
		isNetworkError() {
			return this.status === 0;
		}
	}
}));

describe('AuthService', () => {
	/** @type {ReturnType<typeof vi.fn>} */
	let add;

	beforeEach(() => {
		vi.clearAllMocks();
		add = vi.fn();
		vi.spyOn(metrics, 'getMeter').mockReturnValue({
			createCounter: () => ({ add })
		});
		// Limpiar sessionStorage
		Object.keys(sessionStorage).forEach((key) => {
			sessionStorage.removeItem(key);
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('login', () => {
		it('debería realizar login exitoso', async () => {
			const mockResponse = {
				access_token: 'mock-access-token',
				id_token: 'mock-id-token',
				user: { id: 1, email: 'test@example.com' }
			};

			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce(mockResponse);

			const result = await authService.login({
				email: 'test@example.com',
				password: 'password'
			});

			expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/login', {
				email: 'test@example.com',
				password: 'password'
			});

			expect(result.success).toBe(true);
			expect(result.message).toBe('Sesión iniciada exitosamente');
		});

		it('debería manejar errores de login', async () => {
			const { apiClient, ApiError } = await import('./apiClient.js');
			const error = new ApiError('Credenciales inválidas', 401, {});

			apiClient.post.mockRejectedValueOnce(error);

			const result = await authService.login({
				email: 'test@example.com',
				password: 'wrong-password'
			});

			expect(result.success).toBe(false);
			expect(result.message).toBe('Credenciales inválidas');
		});

		it('login exitoso emite journey event con outcome=success', async () => {
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({
				access_token: 'tok',
				id_token: 'id'
			});
			await authService.login({ email: 'test@example.com', password: 'password' });
			expect(add).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ journey: 'auth.login', outcome: 'success' })
			);
		});

		it('login 401 emite journey event con outcome=failure, error_category=user', async () => {
			const { apiClient, ApiError } = await import('./apiClient.js');
			apiClient.post.mockRejectedValueOnce(new ApiError('bad', 401, {}));
			await authService.login({ email: 'test@example.com', password: 'wrong' });
			expect(add).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					journey: 'auth.login',
					outcome: 'failure',
					error_category: 'user'
				})
			);
		});

		it('login 5xx emite journey event con outcome=failure, error_category=operational', async () => {
			const { apiClient, ApiError } = await import('./apiClient.js');
			apiClient.post.mockRejectedValueOnce(new ApiError('boom', 500, {}));
			await authService.login({ email: 'test@example.com', password: 'password' });
			expect(add).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					journey: 'auth.login',
					outcome: 'failure',
					error_category: 'operational'
				})
			);
		});

		it('login timeout emite journey event con outcome=failure, error_category=timeout', async () => {
			const abort = new Error('aborted');
			abort.name = 'AbortError';
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockRejectedValueOnce(abort);
			await authService.login({ email: 'test@example.com', password: 'password' });
			expect(add).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					journey: 'auth.login',
					outcome: 'failure',
					error_category: 'timeout'
				})
			);
		});

		it('credenciales no aparecen en ninguna señal emitida', async () => {
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({ access_token: 'tok', id_token: 'id' });
			await authService.login({
				email: 'ada@secreto.mx',
				password: 'super-secret-pass-xyz'
			});
			const serialized = JSON.stringify(add.mock.calls);
			expect(serialized).not.toContain('super-secret-pass-xyz');
			expect(serialized).not.toContain('ada@secreto.mx');
		});
	});

	describe('logout', () => {
		it('debería limpiar el sessionStorage al hacer logout', async () => {
			// Simular tokens almacenados
			sessionStorage.setItem('geminis_access_token', 'mock-token');
			sessionStorage.setItem('geminis_id_token', 'mock-id-token');
			sessionStorage.setItem('geminis_user_data', JSON.stringify({ id: 1 }));

			const result = await authService.logout();

			expect(result.success).toBe(true);
			expect(sessionStorage.getItem('geminis_access_token')).toBeNull();
			expect(sessionStorage.getItem('geminis_id_token')).toBeNull();
			expect(sessionStorage.getItem('geminis_user_data')).toBeNull();
		});
	});

	describe('isAuthenticated', () => {
		it('debería retornar true si hay tokens válidos', () => {
			// JWT simulado con expiración futura (exp)
			const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
			const payload = btoa(
				JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 }) // expira en 60 segundos
			);
			const signature = 'signature';
			const fakeJwt = `${header}.${payload}.${signature}`;

			sessionStorage.setItem('geminis_access_token', fakeJwt);
			sessionStorage.setItem('geminis_id_token', fakeJwt);

			const result = authService.isAuthenticated();

			expect(result).toBe(true);
		});

		it('debería retornar false si no hay tokens', () => {
			const result = authService.isAuthenticated();

			expect(result).toBe(false);
		});

		it('debería retornar false si los tokens están vacíos', () => {
			sessionStorage.setItem('geminis_access_token', '');
			sessionStorage.setItem('geminis_id_token', '');

			const result = authService.isAuthenticated();

			expect(result).toBe(false);
		});
	});

	describe('getUserData', () => {
		it('debería retornar datos del usuario almacenados', () => {
			const userData = { id: 1, email: 'test@example.com' };
			sessionStorage.setItem('geminis_user_data', JSON.stringify(userData));

			const result = authService.getUserData();

			expect(result).toEqual(userData);
		});

		it('debería retornar null si no hay datos', () => {
			const result = authService.getUserData();

			expect(result).toBeNull();
		});
	});

	describe('token helpers', () => {
		it('getAccessToken and getIdToken read sessionStorage', () => {
			sessionStorage.setItem('geminis_access_token', 'a');
			sessionStorage.setItem('geminis_id_token', 'i');
			expect(authService.getAccessToken()).toBe('a');
			expect(authService.getIdToken()).toBe('i');
		});

		it('isTokenValid returns false for expired token', () => {
			const header = btoa(JSON.stringify({ alg: 'HS256' }));
			const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 }));
			const expired = `${header}.${payload}.sig`;
			expect(authService.isTokenValid(expired)).toBe(false);
		});
	});

	describe('forgotPassword', () => {
		it('sends reset request', async () => {
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({ message: 'sent' });

			const result = await authService.forgotPassword('user@test.com');

			expect(result.success).toBe(true);
			expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
				email: 'user@test.com'
			});
		});
	});

	describe('confirmEmail', () => {
		it('confirms email token', async () => {
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({ message: 'ok' });

			const result = await authService.confirmEmail('token-1');

			expect(result.success).toBe(true);
		});
	});

	describe('register', () => {
		it('registers a new client', async () => {
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({ id: 1 });

			const result = await authService.register({
				accountName: 'Acme',
				fullName: 'Jane',
				email: 'j@test.com',
				password: 'secret'
			});

			expect(result.success).toBe(true);
			expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/register', {
				account_name: 'Acme',
				name: 'Jane',
				email: 'j@test.com',
				password: 'secret'
			});
		});
	});

	describe('getCurrentClient', () => {
		it('returns client data when token exists', async () => {
			sessionStorage.setItem('geminis_access_token', 'tok');
			const { apiClient } = await import('./apiClient.js');
			apiClient.get.mockResolvedValueOnce({ name: 'Acme' });

			const result = await authService.getCurrentClient();

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ name: 'Acme' });
		});

		it('fails without access token', async () => {
			const result = await authService.getCurrentClient();
			expect(result.success).toBe(false);
		});
	});

	describe('resendVerification', () => {
		it('sends verification email', async () => {
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({ ok: true });

			const result = await authService.resendVerification('j@test.com');
			expect(result.success).toBe(true);
		});
	});

	describe('acceptInvitation', () => {
		it('accepts invitation with password', async () => {
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({ message: 'Welcome' });

			const result = await authService.acceptInvitation('inv-token', 'new-pass');
			expect(result.success).toBe(true);
		});
	});

	describe('resetPassword', () => {
		it('resets password with code', async () => {
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({ ok: true });

			const result = await authService.resetPassword('j@test.com', '123456', 'new-pass');
			expect(result.success).toBe(true);
		});
	});

	describe('refreshToken', () => {
		it('stores new tokens on success', async () => {
			sessionStorage.setItem('geminis_refresh_token', 'refresh-1');
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({
				access_token: 'new-access',
				id_token: 'new-id'
			});

			const result = await authService.refreshToken();

			expect(result.success).toBe(true);
			expect(sessionStorage.getItem('geminis_access_token')).toBe('new-access');
		});

		it('clears tokens when refresh fails', async () => {
			sessionStorage.setItem('geminis_refresh_token', 'bad');
			sessionStorage.setItem('geminis_access_token', 'old');
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockRejectedValueOnce(new Error('expired'));

			const result = await authService.refreshToken();

			expect(result.success).toBe(false);
			expect(sessionStorage.getItem('geminis_access_token')).toBeNull();
		});

		it('fails when refresh token is missing', async () => {
			const result = await authService.refreshToken();
			expect(result.success).toBe(false);
		});

		it('refresh exitoso emite journey event con outcome=success', async () => {
			sessionStorage.setItem('geminis_refresh_token', 'refresh-1');
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({
				access_token: 'new-access',
				id_token: 'new-id'
			});
			await authService.refreshToken();
			expect(add).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ journey: 'auth.refresh', outcome: 'success' })
			);
		});

		it('refresh fallido emite journey event con outcome=failure', async () => {
			sessionStorage.setItem('geminis_refresh_token', 'bad');
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockRejectedValueOnce(new Error('expired'));
			await authService.refreshToken();
			expect(add).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ journey: 'auth.refresh', outcome: 'failure' })
			);
		});

		it('tokens no aparecen en ninguna señal', async () => {
			sessionStorage.setItem('geminis_refresh_token', 'refresh-secret-xyz');
			const { apiClient } = await import('./apiClient.js');
			apiClient.post.mockResolvedValueOnce({
				access_token: 'new-access-secret-token',
				id_token: 'new-id-secret-token'
			});
			await authService.refreshToken();
			const serialized = JSON.stringify(add.mock.calls);
			expect(serialized).not.toContain('refresh-secret-xyz');
			expect(serialized).not.toContain('new-access-secret-token');
			expect(serialized).not.toContain('new-id-secret-token');
		});
	});

	describe('handleAuthError branches', () => {
		it('maps validation, server, network and 404 errors', async () => {
			const { apiClient, ApiError } = await import('./apiClient.js');

			apiClient.post.mockRejectedValueOnce(new ApiError('bad', 422, { detail: 'Invalid' }));
			expect((await authService.login({ email: 'a', password: 'b' })).message).toBe('Invalid');

			apiClient.post.mockRejectedValueOnce(new ApiError('denied', 403, { detail: 'Verify email' }));
			expect((await authService.login({ email: 'a', password: 'b' })).message).toBe('Verify email');

			apiClient.post.mockRejectedValueOnce(new ApiError('denied', 403, {}));
			expect((await authService.login({ email: 'a', password: 'b' })).message).toBe('denied');

			apiClient.post.mockRejectedValueOnce(new ApiError('missing', 404, { detail: 'Not found' }));
			expect((await authService.login({ email: 'a', password: 'b' })).message).toBe('Not found');

			apiClient.post.mockRejectedValueOnce(new ApiError('boom', 500, {}));
			expect((await authService.login({ email: 'a', password: 'b' })).message).toBe(
				'Error del servidor. Intenta más tarde.'
			);

			apiClient.post.mockRejectedValueOnce(new ApiError('offline', 0, {}));
			expect((await authService.login({ email: 'a', password: 'b' })).message).toBe(
				'Error de conexión. Verifica tu internet.'
			);
		});
	});

	describe('isAuthenticated edge cases', () => {
		it('clears invalid literal null tokens', () => {
			sessionStorage.setItem('geminis_access_token', 'null');
			sessionStorage.setItem('geminis_id_token', 'null');
			expect(authService.isAuthenticated()).toBe(false);
		});

		it('clears expired access token', () => {
			const header = btoa(JSON.stringify({ alg: 'HS256' }));
			const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 100 }));
			const expired = `${header}.${payload}.sig`;
			sessionStorage.setItem('geminis_access_token', expired);
			sessionStorage.setItem('geminis_id_token', expired);
			expect(authService.isAuthenticated()).toBe(false);
			expect(sessionStorage.getItem('geminis_access_token')).toBeNull();
		});

		it('treats malformed jwt as invalid', () => {
			expect(authService.isTokenValid('not-a-jwt')).toBe(false);
		});
	});
});
