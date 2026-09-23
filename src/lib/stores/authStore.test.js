import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore, isAuthenticated, currentUser, authLoading, authError } from './authStore.js';
import { logs } from '@opentelemetry/api-logs';

// Mock de los servicios
vi.mock('../services/authService.js', () => ({
	authService: {
		login: vi.fn(),
		logout: vi.fn(),
		isAuthenticated: vi.fn(),
		getUserData: vi.fn(),
		register: vi.fn(),
		confirmEmail: vi.fn(),
		getCurrentClient: vi.fn(),
		resendVerification: vi.fn(),
		forgotPassword: vi.fn(),
		resetPassword: vi.fn(),
		acceptInvitation: vi.fn()
	}
}));

// Mock del browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('AuthStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('estado inicial', () => {
		it('debería tener estado inicial correcto', () => {
			const state = get(authStore);

			expect(state).toEqual({
				isAuthenticated: false,
				user: null,
				loading: false,
				error: null
			});
		});
	});

	describe('init', () => {
		it('debería inicializar con usuario autenticado', async () => {
			const mockUser = { id: 1, email: 'test@example.com' };
			const { authService } = await import('../services/authService.js');

			authService.isAuthenticated.mockReturnValueOnce(true);
			authService.getUserData.mockReturnValueOnce(mockUser);

			authStore.init();

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(true);
			expect(state.user).toEqual(mockUser);
			expect(state.loading).toBe(false);
		});

		it('debería inicializar sin usuario autenticado', async () => {
			const { authService } = await import('../services/authService.js');

			authService.isAuthenticated.mockReturnValueOnce(false);
			authService.getUserData.mockReturnValueOnce(null);

			authStore.init();

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBe(null);
			expect(state.loading).toBe(false);
		});
	});

	describe('login', () => {
		it('debería actualizar estado durante login exitoso', async () => {
			const mockUser = { id: 1, email: 'test@example.com' };
			const { authService } = await import('../services/authService.js');

			authService.login.mockResolvedValueOnce({
				success: true,
				message: 'Login exitoso'
			});
			authService.getUserData.mockReturnValueOnce(mockUser);

			const result = await authStore.login({
				email: 'test@example.com',
				password: 'password'
			});

			expect(result.success).toBe(true);

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(true);
			expect(state.user).toEqual(mockUser);
			expect(state.loading).toBe(false);
			expect(state.error).toBe(null);
		});

		it('debería manejar errores de login', async () => {
			const { authService } = await import('../services/authService.js');

			authService.login.mockResolvedValueOnce({
				success: false,
				message: 'Credenciales inválidas'
			});

			const result = await authStore.login({
				email: 'test@example.com',
				password: 'wrong-password'
			});

			expect(result.success).toBe(false);

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBe(null);
			expect(state.loading).toBe(false);
			expect(state.error).toBe('Credenciales inválidas');
		});
	});

	describe('logout', () => {
		it('debería limpiar estado al hacer logout', async () => {
			const { authService } = await import('../services/authService.js');

			authService.logout.mockResolvedValueOnce({
				success: true
			});

			const result = await authStore.logout();

			expect(result.success).toBe(true);

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBe(null);
			expect(state.loading).toBe(false);
			expect(state.error).toBe(null);
		});
	});

	describe('register', () => {
		it('debería registrar usuario exitosamente', async () => {
			const { authService } = await import('../services/authService.js');

			authService.register.mockResolvedValueOnce({
				success: true,
				message: 'Usuario registrado'
			});

			const result = await authStore.register({
				fullName: 'Test User',
				email: 'test@example.com',
				password: 'password'
			});

			expect(result.success).toBe(true);

			const state = get(authStore);
			expect(state.loading).toBe(false);
			expect(state.error).toBe(null);
		});
	});

	describe('utility methods', () => {
		it('clearError debería limpiar errores', () => {
			authStore.clearError();
			const state = get(authStore);
			expect(state.error).toBe(null);
		});

		it('updateUser debería actualizar datos del usuario', () => {
			const newUserData = { name: 'Updated Name' };

			authStore.updateUser(newUserData);

			const state = get(authStore);
			expect(state.user).toEqual(expect.objectContaining(newUserData));
		});
	});

	describe('confirmEmail', () => {
		it('updates state on success', async () => {
			const { authService } = await import('../services/authService.js');
			authService.confirmEmail.mockResolvedValueOnce({ success: true, message: 'OK' });

			const result = await authStore.confirmEmail('token');

			expect(result.success).toBe(true);
			expect(get(authStore).loading).toBe(false);
		});
	});

	describe('forgotPassword', () => {
		it('stores error on failure', async () => {
			const { authService } = await import('../services/authService.js');
			authService.forgotPassword.mockResolvedValueOnce({
				success: false,
				message: 'No encontrado'
			});

			await authStore.forgotPassword('a@test.com');

			expect(get(authStore).error).toBe('No encontrado');
		});
	});

	describe('acceptInvitation', () => {
		it('updates state on success', async () => {
			const { authService } = await import('../services/authService.js');
			authService.acceptInvitation.mockResolvedValueOnce({ success: true, message: 'OK' });

			const result = await authStore.acceptInvitation('tok', 'pass');

			expect(result.success).toBe(true);
			expect(get(authStore).loading).toBe(false);
		});
	});

	describe('getClientInfo', () => {
		it('merges client data into user', async () => {
			const { authService } = await import('../services/authService.js');
			authStore.updateUser({ id: 1 });
			authService.getCurrentClient.mockResolvedValueOnce({
				success: true,
				data: { company: 'Acme' }
			});

			await authStore.getClientInfo();

			expect(get(authStore).user).toMatchObject({
				id: 1,
				client: { company: 'Acme' }
			});
		});
	});

	describe('resendVerification', () => {
		it('stores error on failure', async () => {
			const { authService } = await import('../services/authService.js');
			authService.resendVerification.mockResolvedValueOnce({
				success: false,
				message: 'No enviado'
			});

			await authStore.resendVerification('a@test.com');

			expect(get(authStore).error).toBe('No enviado');
		});
	});

	describe('resetPassword', () => {
		it('clears error on success', async () => {
			const { authService } = await import('../services/authService.js');
			authService.resetPassword.mockResolvedValueOnce({ success: true, message: 'OK' });

			await authStore.resetPassword('a@test.com', '123', 'new');

			expect(get(authStore).error).toBeNull();
		});

		it('handles thrown errors', async () => {
			const { authService } = await import('../services/authService.js');
			authService.resetPassword.mockRejectedValueOnce(new Error('boom'));

			const result = await authStore.resetPassword('a@test.com', '123', 'new');

			expect(result.success).toBe(false);
			expect(get(authStore).error).toBe('Error al restablecer la contraseña');
		});
	});

	describe('error catch paths', () => {
		it('login handles thrown errors', async () => {
			const emit = vi.fn();
			vi.spyOn(logs, 'getLogger').mockReturnValue({ emit });
			const { authService } = await import('../services/authService.js');
			authService.login.mockRejectedValueOnce(new Error('network'));

			const result = await authStore.login({ email: 'a', password: 'b' });

			expect(result.success).toBe(false);
			expect(get(authStore).error).toBe('Error al iniciar sesión');
			expect(emit).toHaveBeenCalledWith(expect.objectContaining({ severityText: 'WARN' }));
			vi.restoreAllMocks();
		});

		it('forgotPassword handles thrown errors', async () => {
			const { authService } = await import('../services/authService.js');
			authService.forgotPassword.mockRejectedValueOnce(new Error('fail'));

			const result = await authStore.forgotPassword('a@test.com');

			expect(result.success).toBe(false);
			expect(get(authStore).error).toBe('Error al solicitar recuperación de contraseña');
		});
	});

	// Cada método del store tiene tres salidas: éxito, el servicio responde
	// `success: false`, y el servicio lanza. Las dos últimas dejan un mensaje en
	// el estado que la UI enseña, así que se comprueban una por una.
	describe('rama de fallo del servicio', () => {
		it.each([
			['register', (a) => a.register({ email: 'a@test.com' }), 'register'],
			['confirmEmail', (a) => a.confirmEmail('tok'), 'confirmEmail'],
			['acceptInvitation', (a) => a.acceptInvitation('tok', 'pw'), 'acceptInvitation'],
			['getClientInfo', (a) => a.getClientInfo(), 'getCurrentClient'],
			['resendVerification', (a) => a.resendVerification('a@test.com'), 'resendVerification'],
			['resetPassword', (a) => a.resetPassword('a@test.com', '123', 'pw'), 'resetPassword']
		])('%s guarda el mensaje que devuelve el servicio', async (_n, llamada, metodo) => {
			const { authService } = await import('../services/authService.js');
			authService[metodo].mockResolvedValueOnce({ success: false, message: 'Credencial inválida' });

			const result = await llamada(authStore);

			expect(result.success).toBe(false);
			expect(get(authStore).error).toBe('Credencial inválida');
			expect(get(authStore).loading).toBe(false);
		});
	});

	describe('el servicio lanza', () => {
		it.each([
			[
				'register',
				(a) => a.register({ email: 'a@test.com' }),
				'register',
				'Error al registrar usuario'
			],
			['confirmEmail', (a) => a.confirmEmail('tok'), 'confirmEmail', 'Error al verificar email'],
			[
				'acceptInvitation',
				(a) => a.acceptInvitation('tok', 'pw'),
				'acceptInvitation',
				'Error al aceptar la invitación'
			],
			[
				'getClientInfo',
				(a) => a.getClientInfo(),
				'getCurrentClient',
				'Error al obtener información del cliente'
			],
			[
				'resendVerification',
				(a) => a.resendVerification('a@test.com'),
				'resendVerification',
				'Error al reenviar verificación'
			],
			[
				'resetPassword',
				(a) => a.resetPassword('a@test.com', '123', 'pw'),
				'resetPassword',
				'Error al restablecer la contraseña'
			]
		])('%s cae a su mensaje por defecto', async (_n, llamada, metodo, esperado) => {
			const { authService } = await import('../services/authService.js');
			authService[metodo].mockRejectedValueOnce(new Error('red caída'));

			const result = await llamada(authStore);

			expect(result.success).toBe(false);
			expect(result.message).toBe(esperado);
			expect(get(authStore).error).toBe(esperado);
			expect(get(authStore).loading).toBe(false);
		});

		// El logout es la excepción a propósito: si el backend falla, la sesión
		// local se limpia igual. Dejar al usuario "dentro" sería peor.
		it('logout limpia la sesión local aunque el backend falle', async () => {
			const { authService } = await import('../services/authService.js');
			authService.logout.mockRejectedValueOnce(new Error('502'));
			authStore.updateUser({ id: 1, email: 'a@test.com' });

			const result = await authStore.logout();

			expect(result).toEqual({ success: true });
			expect(get(authStore)).toEqual({
				isAuthenticated: false,
				user: null,
				loading: false,
				error: null
			});
		});
	});

	it('init deja un error legible si la comprobación de sesión falla', async () => {
		const { authService } = await import('../services/authService.js');
		authService.isAuthenticated.mockImplementationOnce(() => {
			throw new Error('sessionStorage no disponible');
		});

		authStore.init();

		expect(get(authStore).error).toBe('Error al verificar la sesión');
		expect(get(authStore).isAuthenticated).toBe(false);
	});

	// Los stores derivados son lo que consumen los componentes; si alguno deja
	// de reflejar el estado, la UI se queda desincronizada en silencio.
	it('los stores derivados reflejan el estado', () => {
		authStore.clearError();
		authStore.updateUser({ id: 7, email: 'a@test.com' });

		expect(get(currentUser)).toEqual({ id: 7, email: 'a@test.com' });
		expect(get(isAuthenticated)).toBe(get(authStore).isAuthenticated);
		expect(get(authLoading)).toBe(false);
		expect(get(authError)).toBeNull();
	});
});
