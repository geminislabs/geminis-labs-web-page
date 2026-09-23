import { API_CONFIG, buildApiUrl, getAuthHeaders } from '$lib/config/api.js';
import { instrumentedFetch } from '$lib/observability/http.js';
import { handleSessionExpired } from './sessionExpiredHandler.js';

/**
 * Route de telemetría: path antes de `?`.
 * @param {string} endpoint
 */
function routeTemplate(endpoint) {
	return (
		String(endpoint || '')
			.split('#')[0]
			.split('?')[0] || 'unspecified'
	);
}

/**
 * Cliente API para manejar todas las peticiones al backend
 */
class ApiClient {
	constructor() {
		this.baseURL = API_CONFIG.BASE_URL;
		this.timeout = API_CONFIG.TIMEOUT;
	}

	/**
	 * Método genérico para hacer peticiones HTTP
	 */
	async request(endpoint, options = {}) {
		const url = buildApiUrl(endpoint);
		const config = {
			method: 'GET',
			headers: API_CONFIG.DEFAULT_HEADERS,
			...options
		};

		// Agregar timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			config.signal = controller.signal;

			const response = await instrumentedFetch(url, {
				...config,
				route: routeTemplate(endpoint),
				targetService: 'siscom-admin-api'
			});
			clearTimeout(timeoutId);

			// Manejar respuestas no exitosas
			if (!response.ok) {
				const errorData = await this.handleErrorResponse(response);
				throw new ApiError(errorData.message || 'Error en la petición', response.status, errorData);
			}

			// Intentar parsear JSON, si falla devolver texto
			try {
				return await response.json();
			} catch {
				return await response.text();
			}
		} catch (error) {
			clearTimeout(timeoutId);

			if (error.name === 'AbortError') {
				throw new ApiError('Tiempo de espera agotado', 408);
			}

			if (error instanceof ApiError) {
				throw error;
			}

			// Error de red u otro error
			throw new ApiError('Error de conexión', 0, { originalError: error });
		}
	}

	/**
	 * Maneja las respuestas de error de la API
	 */
	async handleErrorResponse(response) {
		try {
			const errorData = await response.json();

			// Manejar sesión expirada (401 Unauthorized)
			if (response.status === 401) {
				await this.handleSessionExpired();
			}

			return errorData;
		} catch {
			// Manejar sesión expirada incluso si no se puede parsear la respuesta
			if (response.status === 401) {
				await this.handleSessionExpired();
			}

			return {
				message: `Error ${response.status}: ${response.statusText}`,
				status: response.status
			};
		}
	}

	/**
	 * Maneja la sesión expirada automáticamente
	 */
	async handleSessionExpired() {
		await handleSessionExpired();
	}

	/**
	 * GET request
	 */
	async get(endpoint, params = {}, token = null) {
		const url = new URL(buildApiUrl(endpoint));
		Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

		return this.request(endpoint + url.search, {
			method: 'GET',
			headers: getAuthHeaders(token)
		});
	}

	/**
	 * POST request
	 */
	async post(endpoint, data = {}, token = null) {
		return this.request(endpoint, {
			method: 'POST',
			headers: getAuthHeaders(token),
			body: JSON.stringify(data)
		});
	}

	/**
	 * PATCH request
	 */
	async patch(endpoint, data = {}, token = null) {
		return this.request(endpoint, {
			method: 'PATCH',
			headers: getAuthHeaders(token),
			body: JSON.stringify(data)
		});
	}

	/**
	 * PUT request
	 */
	async put(endpoint, data = {}, token = null) {
		return this.request(endpoint, {
			method: 'PUT',
			headers: getAuthHeaders(token),
			body: JSON.stringify(data)
		});
	}

	/**
	 * DELETE request
	 */
	async delete(endpoint, _params = {}, token = null) {
		return this.request(endpoint, {
			method: 'DELETE',
			headers: getAuthHeaders(token)
		});
	}
}

/**
 * Clase personalizada para errores de la API
 */
export class ApiError extends Error {
	constructor(message, status = 0, data = {}) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.data = data;
	}

	/**
	 * Verifica si es un error de autenticación
	 */
	isAuthError() {
		return this.status === 401 || this.status === 403;
	}

	/**
	 * Verifica si es un error de validación
	 */
	isValidationError() {
		return this.status === 400 || this.status === 409 || this.status === 422;
	}

	/**
	 * Verifica si es un error del servidor
	 */
	isServerError() {
		return this.status >= 500;
	}

	/**
	 * Verifica si es un error de red
	 */
	isNetworkError() {
		return this.status === 0;
	}
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

// Exportar también la clase para testing
export { ApiClient };
