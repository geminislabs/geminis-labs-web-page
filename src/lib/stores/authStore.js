import { writable, derived } from 'svelte/store';
import { authService } from '$lib/services/authService.js';
import { browser } from '$app/environment';
import { logWarn } from '$lib/observability/capture.js';

/**
 * Store para manejar el estado de autenticación
 */
function createAuthStore() {
	// Estado inicial
	const initialState = {
		isAuthenticated: false,
		user: null,
		loading: false,
		error: null
	};

	const { subscribe, set, update } = writable(initialState);

	return {
		subscribe,

		/**
		 * Inicializa el store verificando si hay una sesión activa
		 */
		init() {
			if (!browser) return;

			update((state) => ({ ...state, loading: true }));

			try {
				const isAuth = authService.isAuthenticated();
				const userData = authService.getUserData();

				update((state) => ({
					...state,
					isAuthenticated: isAuth,
					user: userData,
					loading: false,
					error: null
				}));
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				update((state) => ({
					...state,
					isAuthenticated: false,
					user: null,
					loading: false,
					error: 'Error al verificar la sesión'
				}));
			}
		},

		/**
		 * Registra un nuevo usuario
		 */
		async register(userData) {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const result = await authService.register(userData);

				if (result.success) {
					update((state) => ({
						...state,
						loading: false,
						error: null
					}));
				} else {
					update((state) => ({
						...state,
						loading: false,
						error: result.message
					}));
				}

				return result;
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				const errorMessage = 'Error al registrar usuario';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
				return { success: false, message: errorMessage };
			}
		},

		/**
		 * Confirma el email del usuario
		 */
		async confirmEmail(token) {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const result = await authService.confirmEmail(token);

				update((state) => ({
					...state,
					loading: false,
					error: result.success ? null : result.message
				}));

				return result;
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				const errorMessage = 'Error al verificar email';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
				return { success: false, message: errorMessage };
			}
		},

		/**
		 * Acepta una invitación de usuario
		 */
		async acceptInvitation(token, password) {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const result = await authService.acceptInvitation(token, password);

				update((state) => ({
					...state,
					loading: false,
					error: result.success ? null : result.message
				}));

				return result;
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				const errorMessage = 'Error al aceptar la invitación';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
				return { success: false, message: errorMessage };
			}
		},

		/**
		 * Inicia sesión
		 */
		async login(credentials) {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const result = await authService.login(credentials);

				if (result.success) {
					const userData = authService.getUserData();
					update((state) => ({
						...state,
						isAuthenticated: true,
						user: userData,
						loading: false,
						error: null
					}));
				} else {
					update((state) => ({
						...state,
						isAuthenticated: false,
						user: null,
						loading: false,
						error: result.message
					}));
				}

				return result;
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				const errorMessage = 'Error al iniciar sesión';
				update((state) => ({
					...state,
					isAuthenticated: false,
					user: null,
					loading: false,
					error: errorMessage
				}));
				return { success: false, message: errorMessage };
			}
		},

		/**
		 * Cierra sesión
		 */
		async logout() {
			update((state) => ({ ...state, loading: true }));

			try {
				await authService.logout();

				set({
					isAuthenticated: false,
					user: null,
					loading: false,
					error: null
				});

				return { success: true };
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				// Aunque falle, limpiar el estado local
				set({
					isAuthenticated: false,
					user: null,
					loading: false,
					error: null
				});
				return { success: true };
			}
		},

		/**
		 * Limpia errores
		 */
		clearError() {
			update((state) => ({ ...state, error: null }));
		},

		/**
		 * Obtiene información del cliente actual
		 */
		async getClientInfo() {
			update((state) => ({ ...state, loading: true }));

			try {
				const result = await authService.getCurrentClient();

				if (result.success) {
					update((state) => ({
						...state,
						user: { ...state.user, client: result.data },
						loading: false,
						error: null
					}));
				} else {
					update((state) => ({
						...state,
						loading: false,
						error: result.message
					}));
				}

				return result;
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				const errorMessage = 'Error al obtener información del cliente';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
				return { success: false, message: errorMessage };
			}
		},

		/**
		 * Reenvía email de verificación
		 */
		async resendVerification(email) {
			update((state) => ({ ...state, loading: true }));

			try {
				const result = await authService.resendVerification(email);

				update((state) => ({
					...state,
					loading: false,
					error: result.success ? null : result.message
				}));

				return result;
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				const errorMessage = 'Error al reenviar verificación';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
				return { success: false, message: errorMessage };
			}
		},

		/**
		 * Solicita recuperación de contraseña
		 */
		async forgotPassword(email) {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const result = await authService.forgotPassword(email);

				update((state) => ({
					...state,
					loading: false,
					error: result.success ? null : result.message
				}));

				return result;
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				const errorMessage = 'Error al solicitar recuperación de contraseña';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
				return { success: false, message: errorMessage };
			}
		},

		/**
		 * Restablece la contraseña
		 */
		async resetPassword(email, code, newPassword) {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const result = await authService.resetPassword(email, code, newPassword);

				update((state) => ({
					...state,
					loading: false,
					error: result.success ? null : result.message
				}));

				return result;
			} catch {
				logWarn('auth.store.error', { error_category: 'programming' });
				const errorMessage = 'Error al restablecer la contraseña';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
				return { success: false, message: errorMessage };
			}
		},

		/**
		 * Actualiza los datos del usuario
		 */
		updateUser(userData) {
			update((state) => ({
				...state,
				user: { ...state.user, ...userData }
			}));
		}
	};
}

// Crear el store
export const authStore = createAuthStore();

// Stores derivados para facilitar el uso
export const isAuthenticated = derived(authStore, ($auth) => $auth.isAuthenticated);
export const currentUser = derived(authStore, ($auth) => $auth.user);
export const authLoading = derived(authStore, ($auth) => $auth.loading);
export const authError = derived(authStore, ($auth) => $auth.error);
