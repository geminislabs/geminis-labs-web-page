import { apiClient, ApiError } from './apiClient.js';
import { API_CONFIG } from '$lib/config/api.js';
import { startJourney } from '$lib/observability/journey.js';

/**
 * Servicio de autenticación que maneja login, registro y tokens
 */
class AuthService {
	constructor() {
		this.storageKeys = {
			ACCESS_TOKEN: 'geminis_access_token',
			ID_TOKEN: 'geminis_id_token',
			REFRESH_TOKEN: 'geminis_refresh_token',
			USER_DATA: 'geminis_user_data'
		};
	}

	/**
	 * Registra un nuevo cliente
	 */
	async register(userData) {
		try {
			const requestData = {
				account_name: userData.accountName,
				name: userData.fullName, // API espera 'name', no 'nombre_completo'
				email: userData.email,
				password: userData.password
			};

			// Usar apiClient para consistencia
			const data = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, requestData);

			return {
				success: true,
				message:
					'Cliente creado exitosamente. Revisa tu correo para verificar tu email antes de iniciar sesión.',
				data: data
			};
		} catch (error) {
			return this.handleAuthError(error, 'Error al crear la cuenta');
		}
	}

	/**
	 * Obtiene la información del cliente actual
	 */
	async getCurrentClient() {
		try {
			const accessToken = this.getAccessToken();
			if (!accessToken) {
				throw new Error('No hay token de acceso disponible');
			}

			const response = await apiClient.get(API_CONFIG.ENDPOINTS.GET_CLIENT, {}, accessToken);

			return {
				success: true,
				data: response
			};
		} catch (error) {
			return this.handleAuthError(error, 'Error al obtener información del cliente');
		}
	}

	/**
	 * Reenvía el email de verificación
	 */
	async resendVerification(email) {
		try {
			const response = await apiClient.post(API_CONFIG.ENDPOINTS.RESEND_VERIFICATION, {
				email: email
			});

			return {
				success: true,
				message: 'Si el email existe y no está verificado, recibirás un nuevo código.',
				data: response
			};
		} catch (error) {
			return this.handleAuthError(error, 'Error al reenviar verificación');
		}
	}

	/**
	 * Confirma el email del usuario
	 */
	async confirmEmail(token) {
		try {
			const response = await apiClient.post(
				`${API_CONFIG.ENDPOINTS.CONFIRM_EMAIL}?token=${encodeURIComponent(token)}`
			);

			return {
				success: true,
				message: 'Cuenta activada correctamente. Ahora puedes iniciar sesión.',
				data: response
			};
		} catch (error) {
			return this.handleAuthError(error, 'Error al verificar el email');
		}
	}

	/**
	 * Acepta una invitación de usuario
	 */
	async acceptInvitation(token, password) {
		try {
			const response = await apiClient.post(API_CONFIG.ENDPOINTS.ACCEPT_INVITATION, {
				token: token,
				password: password
			});

			return {
				success: true,
				message: response.message || 'Invitación aceptada exitosamente. Ya puedes iniciar sesión.',
				data: response
			};
		} catch (error) {
			return this.handleAuthError(error, 'Error al aceptar la invitación');
		}
	}

	/**
	 * Inicia sesión del usuario
	 */
	async login(credentials) {
		const journey = startJourney('auth.login');
		try {
			// El backend espera JSON con email y password (según el curl que funciona)
			const loginData = {
				email: credentials.email,
				password: credentials.password
			};

			// Usar apiClient para consistencia
			const data = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, loginData);

			// Guardar tokens en almacenamiento seguro
			this.storeTokens(data);
			journey.end('success');

			return {
				success: true,
				message: 'Sesión iniciada exitosamente',
				data: data
			};
		} catch (error) {
			const classified = classifyAuthJourneyError(error);
			journey.end(classified.outcome, { error_category: classified.errorCategory });
			return this.handleAuthError(error, 'Error al iniciar sesión');
		}
	}

	/**
	 * Cierra la sesión del usuario
	 */
	async logout() {
		try {
			// Limpiar tokens del almacenamiento
			this.clearTokens();

			return {
				success: true,
				message: 'Sesión cerrada exitosamente'
			};
		} catch {
			// Aunque falle, limpiar tokens localmente
			this.clearTokens();
			return {
				success: true,
				message: 'Sesión cerrada'
			};
		}
	}

	/**
	 * Obtiene el token de acceso actual
	 */
	getAccessToken() {
		if (typeof window === 'undefined') return null;
		return sessionStorage.getItem(this.storageKeys.ACCESS_TOKEN);
	}

	/**
	 * Obtiene el token ID actual
	 */
	getIdToken() {
		if (typeof window === 'undefined') return null;
		return sessionStorage.getItem(this.storageKeys.ID_TOKEN);
	}

	/**
	 * Verifica si el usuario está autenticado
	 */
	isAuthenticated() {
		const accessToken = this.getAccessToken();
		const idToken = this.getIdToken();

		// Verificar que los tokens no sean solo strings vacíos o 'null'
		const validAccessToken = accessToken && accessToken !== 'null' && accessToken.trim() !== '';
		const validIdToken = idToken && idToken !== 'null' && idToken.trim() !== '';

		// Si hay tokens inválidos, limpiarlos
		if ((accessToken && !validAccessToken) || (idToken && !validIdToken)) {
			this.clearTokens();
			return false;
		}

		if (!validAccessToken || !validIdToken) {
			return false;
		}

		// Verificar expiración del JWT (decodificando el payload sin librería externa)
		if (!this.isTokenValid(accessToken)) {
			this.clearTokens();
			return false;
		}

		return true;
	}

	/**
	 * Verifica si un JWT no ha expirado
	 */
	isTokenValid(token) {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) return false;
			const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
			if (!payload.exp) return true; // Sin claim exp, asumir válido
			// Dar un margen de 10 segundos para evitar race conditions
			return Date.now() / 1000 < payload.exp - 10;
		} catch {
			return false;
		}
	}

	/**
	 * Obtiene los datos del usuario almacenados
	 */
	getUserData() {
		if (typeof window === 'undefined') return null;
		try {
			const userData = sessionStorage.getItem(this.storageKeys.USER_DATA);
			return userData ? JSON.parse(userData) : null;
		} catch {
			return null;
		}
	}

	/**
	 * Almacena los tokens de forma segura
	 */
	storeTokens(authData) {
		if (typeof window === 'undefined') return;

		// Usar sessionStorage para mayor seguridad
		sessionStorage.setItem(this.storageKeys.ACCESS_TOKEN, authData.access_token);
		sessionStorage.setItem(this.storageKeys.ID_TOKEN, authData.id_token);

		if (authData.refresh_token) {
			sessionStorage.setItem(this.storageKeys.REFRESH_TOKEN, authData.refresh_token);
		}

		// Almacenar datos del usuario si están disponibles
		if (authData.user) {
			sessionStorage.setItem(this.storageKeys.USER_DATA, JSON.stringify(authData.user));
		}
	}

	/**
	 * Limpia todos los tokens del almacenamiento
	 */
	clearTokens() {
		if (typeof window === 'undefined') return;

		Object.values(this.storageKeys).forEach((key) => {
			sessionStorage.removeItem(key);
			localStorage.removeItem(key); // Por si acaso había algo en localStorage
		});
	}

	/**
	 * Maneja errores de autenticación de forma consistente
	 */
	handleAuthError(error, defaultMessage) {
		let message = defaultMessage;
		let details = {};

		if (error instanceof ApiError) {
			// Errores específicos de la API
			if (error.isValidationError()) {
				message = error.data?.detail || 'Datos inválidos';
				details = error.data;
			} else if (error.isAuthError()) {
				// Verificar si es un error de email no verificado (403)
				if (error.status === 403 && error.data?.detail) {
					message = error.data.detail;
					details = error.data;
				} else if (error.status === 403) {
					message = error.message || 'Acceso denegado';
				} else {
					// Error 401 - credenciales inválidas
					message = 'Credenciales inválidas';
				}
			} else if (error.status === 404) {
				// Error 404 - recurso no encontrado (ej: usuario no encontrado)
				message = error.data?.detail || error.message || 'Usuario no se encuentra registrado';
				details = error.data;
			} else if (error.isServerError()) {
				message = 'Error del servidor. Intenta más tarde.';
			} else if (error.isNetworkError()) {
				message = 'Error de conexión. Verifica tu internet.';
			} else {
				// Para cualquier otro error, intentar usar el mensaje del servidor
				message = error.data?.detail || error.message || defaultMessage;
				details = error.data;
			}
		} else {
			// Otros errores
			message = error.message || defaultMessage;
		}

		return {
			success: false,
			message,
			error: error,
			details
		};
	}

	/**
	 * Solicita el envío de un código de recuperación de contraseña
	 */
	async forgotPassword(email) {
		try {
			const response = await apiClient.post(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD, {
				email: email
			});

			return {
				success: true,
				message: 'Si el correo existe, recibirás un código para restablecer tu contraseña.',
				data: response
			};
		} catch (error) {
			return this.handleAuthError(error, 'Error al solicitar recuperación de contraseña');
		}
	}

	/**
	 * Restablece la contraseña usando el código recibido
	 */
	async resetPassword(email, code, newPassword) {
		try {
			const response = await apiClient.post(API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
				email: email,
				code: code,
				new_password: newPassword
			});

			return {
				success: true,
				message: 'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.',
				data: response
			};
		} catch (error) {
			return this.handleAuthError(error, 'Error al restablecer la contraseña');
		}
	}

	/**
	 * Refresca el token de acceso usando el refresh token
	 */
	async refreshToken() {
		const journey = startJourney('auth.refresh');
		try {
			const refreshToken = sessionStorage.getItem(this.storageKeys.REFRESH_TOKEN);
			if (!refreshToken) {
				throw new Error('No refresh token available');
			}

			const response = await apiClient.post(API_CONFIG.ENDPOINTS.REFRESH_TOKEN, {
				refresh_token: refreshToken
			});

			this.storeTokens(response);
			journey.end('success');
			return { success: true, data: response };
		} catch (error) {
			const classified = classifyAuthJourneyError(error);
			journey.end(classified.outcome, { error_category: classified.errorCategory });
			// Si falla el refresh, limpiar tokens
			this.clearTokens();
			return this.handleAuthError(error, 'Sesión expirada');
		}
	}
}

/**
 * Clasifica el error de un journey de auth sin inspeccionar cuerpos ni tokens.
 * @param {unknown} error
 */
function classifyAuthJourneyError(error) {
	const err = /** @type {{ name?: string, status?: number }} */ (error || {});
	if (err.name === 'AbortError' || err.status === 408) {
		return { outcome: 'failure', errorCategory: 'timeout' };
	}
	if (typeof err.status === 'number') {
		if (err.status === 401) return { outcome: 'failure', errorCategory: 'user' };
		if (err.status === 403) return { outcome: 'failure', errorCategory: 'expected' };
		if (err.status >= 500 || err.status === 0) {
			return { outcome: 'failure', errorCategory: 'operational' };
		}
	}
	if (err.name === 'TypeError' || err.name === 'ReferenceError' || err.name === 'SyntaxError') {
		return { outcome: 'failure', errorCategory: 'programming' };
	}
	return { outcome: 'failure', errorCategory: 'operational' };
}

// Instancia singleton del servicio de autenticación
export const authService = new AuthService();

// Exportar también la clase para testing
export { AuthService };
