import { apiClient, ApiError } from './apiClient.js';
import { API_CONFIG } from '$lib/config/api.js';
import { formatDateTimeLocal } from '$lib/utils/datetime.js';

/**
 * Servicio para manejar operaciones relacionadas con usuarios
 */
class UserService {
	/**
	 * Obtiene la información del usuario autenticado
	 */
	async getCurrentUser() {
		try {
			const accessToken = this.getAccessToken();
			if (!accessToken) {
				throw new Error('No hay token de acceso disponible');
			}

			const response = await apiClient.get(API_CONFIG.ENDPOINTS.GET_USER_ME, {}, accessToken);

			return {
				success: true,
				data: response
			};
		} catch (error) {
			return this.handleUserError(error, 'Error al obtener información del usuario');
		}
	}

	/**
	 * Obtiene todos los usuarios asociados (solo para usuarios maestro)
	 */
	async getUsers() {
		try {
			const accessToken = this.getAccessToken();
			if (!accessToken) {
				throw new Error('No hay token de acceso disponible');
			}

			const response = await apiClient.get(API_CONFIG.ENDPOINTS.GET_USERS, {}, accessToken);

			return {
				success: true,
				data: response
			};
		} catch (error) {
			return this.handleUserError(error, 'Error al obtener usuarios asociados');
		}
	}

	/**
	 * Cambia la contraseña del usuario autenticado
	 */
	async changePassword(oldPassword, newPassword) {
		try {
			const accessToken = this.getAccessToken();
			if (!accessToken) {
				throw new Error('No hay token de acceso disponible');
			}

			const requestData = {
				old_password: oldPassword,
				new_password: newPassword
			};

			const response = await apiClient.patch(
				API_CONFIG.ENDPOINTS.CHANGE_PASSWORD,
				requestData,
				accessToken
			);

			return {
				success: true,
				message: 'Contraseña actualizada correctamente',
				data: response
			};
		} catch (error) {
			return this.handleUserError(error, 'Error al cambiar la contraseña');
		}
	}

	/**
	 * Obtiene el token de acceso del almacenamiento
	 */
	getAccessToken() {
		if (typeof window === 'undefined') return null;
		return sessionStorage.getItem('geminis_access_token');
	}

	/**
	 * Maneja errores de usuario de forma consistente
	 */
	handleUserError(error, defaultMessage) {
		let message;
		let details = {};

		if (error instanceof ApiError) {
			// Errores específicos de la API
			if (error.isValidationError()) {
				// Para errores de validación, mantener los detalles para procesamiento específico
				message = 'Error de validación';
				details = error.data;

				// Si hay detalles específicos, intentar extraer un mensaje más útil
				if (error.data?.detail) {
					if (typeof error.data.detail === 'string') {
						message = error.data.detail;
					} else if (Array.isArray(error.data.detail) && error.data.detail.length > 0) {
						// Tomar el primer error como mensaje principal
						message = error.data.detail[0].msg || 'Datos inválidos';
					}
				}
			} else if (error.isAuthError()) {
				message = 'Sesión expirada o sin permisos';
			} else if (error.isServerError()) {
				message = 'Error del servidor. Intenta más tarde.';
			} else if (error.isNetworkError()) {
				message = 'Error de conexión. Verifica tu internet.';
			} else {
				message = error.message || defaultMessage;
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
	 * Formatea la fecha de último acceso (instante del servidor) en el huso
	 * y locale del dispositivo del usuario.
	 */
	formatLastLogin(lastLoginAt) {
		return formatDateTimeLocal(lastLoginAt);
	}

	/**
	 * Determina el rol del usuario basado en is_master
	 */
	getUserRole(isMaster) {
		return isMaster ? 'Administrador principal' : 'Usuario vinculado';
	}

	/**
	 * Obtiene el color del badge según el rol
	 */
	getRoleBadgeColor(isMaster) {
		return isMaster
			? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
			: 'bg-gray-500/20 text-gray-300 border-gray-500/30';
	}
}

// Instancia singleton del servicio de usuarios
export const userService = new UserService();

// Exportar también la clase para testing
export { UserService };
