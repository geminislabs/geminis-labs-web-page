// Configuración de la API
export const API_CONFIG = {
	// URL base de la API - usar variable de entorno o fallback
	BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8100',

	// Endpoints de la API (solo los documentados oficialmente)
	ENDPOINTS: {
		// Autenticación
		LOGIN: '/api/v1/auth/login',
		REFRESH_TOKEN: '/api/v1/auth/refresh',
		FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
		RESET_PASSWORD: '/api/v1/auth/reset-password',
		CHANGE_PASSWORD: '/api/v1/auth/password',
		AUTH_ME: '/api/v1/auth/me',

		// Clientes
		REGISTER: '/api/v1/auth/register',
		GET_CLIENT: '/api/v1/clients',
		CONFIRM_EMAIL: '/api/v1/auth/verify-email',
		RESEND_VERIFICATION: '/api/v1/auth/resend-verification',

		// Usuarios
		GET_USER_ME: '/api/v1/users/me',
		GET_USERS: '/api/v1/users',
		ACCEPT_INVITATION: '/api/v1/users/accept-invitation',

		// Organizaciones
		ORGANIZATIONS: '/api/v1/organizations',

		// Facturación (read-only, contexto = organización del usuario)
		BILLING_SUMMARY: '/api/v1/billing/summary',
		BILLING_PAYMENTS: '/api/v1/billing/payments',
		BILLING_INVOICES: '/api/v1/billing/invoices',

		// Contacto
		SEND_CONTACT_MESSAGE: '/api/v1/contact/send-message'
	},

	// Configuración de timeouts
	TIMEOUT: 10000, // 10 segundos

	// Headers por defecto
	DEFAULT_HEADERS: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	}
};

// Función helper para construir URLs completas
export function buildApiUrl(endpoint) {
	return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Función helper para obtener headers con token
export function getAuthHeaders(token = null) {
	const headers = { ...API_CONFIG.DEFAULT_HEADERS };

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return headers;
}
