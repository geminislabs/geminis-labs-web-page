import { get } from 'svelte/store';
import { authStore } from '$lib/stores/authStore.js';
import { loadStripe } from '@stripe/stripe-js';
import { getOrCreatePaymentIdempotencyKey } from '$lib/utils/idempotency.js';
import { instrumentedFetch } from '$lib/observability/http.js';
import { startJourney } from '$lib/observability/journey.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8100';
const _sdkInstances = {};
let _gatewayConfig = null;

function _getToken() {
	const auth = get(authStore);
	return (
		auth?.accessToken ??
		auth?.access_token ??
		sessionStorage.getItem('geminis_access_token') ??
		null
	);
}

/**
 * Route de telemetría: path sin query y con IDs sustituidos.
 * @param {string} path
 */
function routeTemplate(path) {
	let route = String(path || '')
		.split('#')[0]
		.split('?')[0];
	route = route.replace(/\/invoices\/[^/]+/g, '/invoices/:id');
	route = route.replace(
		/\/payment-methods\/(?!confirm(?:\/|$)|default(?:\/|$))[^/]+/g,
		'/payment-methods/:id'
	);
	return route || 'unspecified';
}

async function authFetch(path, options = {}) {
	const token = _getToken();
	if (!token) throw new Error('Sesión no iniciada');
	let res;
	try {
		res = await instrumentedFetch(`${API_BASE}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
				...(options.headers ?? {})
			},
			route: routeTemplate(path),
			targetService: 'siscom-admin-api'
		});
	} catch (e) {
		const msg = typeof e?.message === 'string' ? e.message : '';
		if (e?.name === 'TypeError' || /failed to fetch|networkerror|load failed/i.test(msg)) {
			throw new Error(
				'No se pudo conectar con el servidor. Revisa que la API esté en marcha e intenta de nuevo.'
			);
		}
		throw e;
	}
	if (res.status === 401) throw new Error('Tu sesión expiró. Por favor inicia sesión de nuevo.');
	return res;
}

/** FastAPI puede mandar `detail` como string, objeto o lista de errores 422. */
function apiDetail(body, fallback = null) {
	const detail = body?.detail;
	if (typeof detail === 'string' && detail.trim()) return detail.trim();
	if (Array.isArray(detail) && detail.length > 0) {
		const first = detail[0];
		if (typeof first === 'string' && first.trim()) return first.trim();
		if (first && typeof first === 'object') {
			const msg = first.msg ?? first.message;
			if (typeof msg === 'string' && msg.trim()) {
				return msg.replace(/^Value error,\s*/i, '').trim();
			}
		}
	}
	if (detail && typeof detail === 'object') {
		const msg = detail.message ?? detail.detail ?? detail.msg;
		if (typeof msg === 'string' && msg.trim()) return msg.trim();
	}
	return fallback;
}

function apiError(body, fallback) {
	return new Error(apiDetail(body, fallback) ?? fallback);
}

async function getGatewayConfig(gateway) {
	if (_gatewayConfig && !gateway) return _gatewayConfig;
	const res = await authFetch(`/api/v1/stripe/config${gateway ? `?gateway=${gateway}` : ''}`);
	if (!res.ok) throw new Error('No se pudo obtener la configuración de pagos');
	const config = await res.json();
	if (!gateway) _gatewayConfig = config;
	return config;
}

async function getAvailableGateways() {
	try {
		return (await getGatewayConfig()).available_gateways ?? ['stripe'];
	} catch {
		return ['stripe'];
	}
}

async function getSDK(gateway = 'stripe') {
	if (_sdkInstances[gateway]) return _sdkInstances[gateway];
	const config = await getGatewayConfig(gateway);
	if (gateway === 'stripe') {
		const instance = await loadStripe(config.publishable_key);
		if (!instance) throw new Error('Error cargando Stripe.js');
		_sdkInstances['stripe'] = instance;
		return instance;
	}
	throw new Error(`SDK para pasarela '${gateway}' no implementado`);
}

function stripeAppearance() {
	return {
		theme: 'night',
		variables: {
			colorPrimary: '#6366f1',
			colorBackground: '#0d1520',
			colorText: '#e2e8f0',
			colorTextSecondary: '#64748b',
			colorDanger: '#ef4444',
			fontFamily: '"Inter",system-ui,sans-serif',
			fontSizeBase: '14px',
			borderRadius: '10px'
		},
		rules: {
			'.Input': {
				backgroundColor: 'rgba(255,255,255,0.04)',
				border: '1px solid rgba(255,255,255,0.08)',
				boxShadow: 'none',
				color: '#e2e8f0'
			},
			'.Input:focus': {
				border: '1px solid rgba(99,102,241,0.5)',
				boxShadow: '0 0 0 3px rgba(99,102,241,0.12)'
			},
			'.Label': { color: '#64748b', fontSize: '12px', fontWeight: '600' },
			'.Tab': {
				backgroundColor: 'rgba(255,255,255,0.03)',
				border: '1px solid rgba(255,255,255,0.06)'
			},
			'.Tab--selected': {
				backgroundColor: 'rgba(99,102,241,0.12)',
				border: '1px solid rgba(99,102,241,0.3)',
				color: '#a5b4fc'
			}
		}
	};
}

async function getSummary() {
	const res = await authFetch('/api/v1/billing/summary');
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, `Error ${res.status}`);
	}
	return res.json();
}

async function getPayments({ limit = 20, offset = 0, status = null } = {}) {
	let url = `/api/v1/billing/payments?limit=${limit}&offset=${offset}`;
	if (status) url += `&status=${status}`;
	const res = await authFetch(url);
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, `Error ${res.status}`);
	}
	const body = await res.json();
	const payments = (body.payments ?? []).map((p) => ({
		...p,
		status: p.payment_status ?? p.status ?? null,
		paid_at: p.succeeded_at ?? p.paid_at ?? null,
		method: p.payment_method_type ?? p.method ?? 'card'
	}));
	return { data: payments, total: body.total ?? 0, has_more: body.has_more ?? false };
}

async function getInvoices({ limit = 20, offset = 0 } = {}) {
	const res = await authFetch(`/api/v1/billing/invoices?limit=${limit}&offset=${offset}`);
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, `Error ${res.status}`);
	}
	const body = await res.json();
	const invoices = (body.invoices ?? []).map((inv) => ({
		...inv,
		total_mxn: inv.total_mxn ?? inv.total_amount ?? inv.amount ?? null,
		amount: inv.amount ?? inv.total_amount ?? null,
		invoice_url: inv.invoice_url ?? inv.stripe_receipt_url ?? inv.invoice_pdf_url ?? null,
		has_receipt: inv.has_receipt === true,
		has_cfdi: inv.has_cfdi === true || Boolean(inv.cfdi_uuid),
		cfdi_uuid: inv.cfdi_uuid ?? null
	}));
	return { data: invoices, total: body.total ?? 0, has_more: body.has_more ?? false };
}

async function getPlans() {
	const res = await instrumentedFetch(`${API_BASE}/api/v1/plans`, {
		route: '/api/v1/plans',
		targetService: 'siscom-admin-api'
	});
	if (!res.ok) throw new Error(`Error ${res.status} al obtener planes`);
	const body = await res.json();
	return body.plans ?? [];
}

async function getPaymentMethods(gateway = 'stripe') {
	const res = await authFetch(`/api/v1/stripe/payment-methods?gateway=${gateway}`);
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, `Error ${res.status}`);
	}
	const data = await res.json();
	return Array.isArray(data) ? data : [];
}

async function initAddPaymentMethodFlow(mountId, gateway = 'stripe') {
	const res = await authFetch(`/api/v1/stripe/setup-intent?gateway=${gateway}`, { method: 'POST' });
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, 'Error al inicializar el guardado de tarjeta');
	}
	const { client_token } = await res.json();
	if (gateway === 'stripe') {
		const stripe = await getSDK('stripe');
		const elements = stripe.elements({
			clientSecret: client_token,
			appearance: stripeAppearance(),
			locale: 'es'
		});
		elements.create('payment').mount(`#${mountId}`);
		return {
			gateway,
			async confirmSetup(returnUrl) {
				return stripe.confirmSetup({
					elements,
					confirmParams: { return_url: returnUrl },
					redirect: 'if_required'
				});
			}
		};
	}
	throw new Error(`Flujo no implementado para '${gateway}'`);
}

async function confirmSetupIntent(setupIntentId, gateway = 'stripe') {
	const res = await authFetch('/api/v1/stripe/payment-methods/confirm', {
		method: 'POST',
		body: JSON.stringify({ setup_intent_id: setupIntentId, gateway })
	});
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, 'No se pudo registrar la tarjeta');
	}
	const data = await res.json();
	return Array.isArray(data) ? data : [];
}

async function deletePaymentMethod(externalToken, gateway = 'stripe') {
	const res = await authFetch(
		`/api/v1/stripe/payment-methods/${encodeURIComponent(externalToken)}?gateway=${gateway}`,
		{ method: 'DELETE' }
	);
	if (res.status === 204) return { ok: true };
	const b = await res.json().catch(() => ({}));
	throw apiError(b, 'Error al eliminar');
}

async function setDefaultPaymentMethod(externalToken, gateway = 'stripe') {
	const res = await authFetch('/api/v1/stripe/payment-methods/default', {
		method: 'PATCH',
		body: JSON.stringify({ external_token: externalToken, gateway })
	});
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, 'Error al actualizar');
	}
	return res.json();
}

async function setAutoRenew(autoRenew) {
	const res = await authFetch('/api/v1/stripe/auto-renew', {
		method: 'PATCH',
		body: JSON.stringify({ auto_renew: autoRenew })
	});
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, 'Error al actualizar la renovación automática');
	}
	return res.json();
}

function paymentApiError(status, body, fallback) {
	const err = new Error(apiDetail(body, fallback) ?? fallback);
	if (status === 409) {
		const detail = body?.detail;
		err.code =
			(detail && typeof detail === 'object' && !Array.isArray(detail) && detail.code) ||
			'PAYMENT_ALREADY_PROCESSED';
	}
	return err;
}

async function getQuote(planId, billingCycle) {
	const res = await authFetch(
		`/api/v1/stripe/quote?plan_id=${encodeURIComponent(planId)}&billing_cycle=${encodeURIComponent(billingCycle)}`
	);
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, 'No se pudo obtener el precio');
	}
	return res.json();
}

async function downloadInvoiceReceipt(invoiceId, invoiceNumber) {
	if (!invoiceId) throw new Error('Factura no encontrada');
	const res = await authFetch(`/api/v1/billing/invoices/${invoiceId}/receipt.pdf`);
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, 'No se pudo descargar el comprobante');
	}
	await _saveBlob(res, `comprobante-${invoiceNumber || invoiceId}.pdf`);
}

async function getTaxProfile() {
	const res = await authFetch('/api/v1/billing/tax-profile');
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, 'No se pudieron cargar los datos fiscales');
	}
	return res.json();
}

async function saveTaxProfile(payload) {
	const res = await authFetch('/api/v1/billing/tax-profile', {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, 'No se pudieron guardar los datos fiscales');
	}
	return res.json();
}

async function stampInvoiceCfdi(invoiceId, use) {
	if (!invoiceId) throw new Error('Factura no encontrada');
	const res = await authFetch(`/api/v1/billing/invoices/${invoiceId}/cfdi`, {
		method: 'POST',
		body: JSON.stringify(use ? { use } : {})
	});
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, 'No se pudo timbrar el CFDI');
	}
	return res.json();
}

async function downloadInvoiceCfdi(invoiceId, format, invoiceNumber) {
	if (!invoiceId) throw new Error('Factura no encontrada');
	const fmt = format === 'xml' ? 'xml' : 'pdf';
	const res = await authFetch(`/api/v1/billing/invoices/${invoiceId}/cfdi.${fmt}`);
	if (!res.ok) {
		const b = await res.json().catch(() => ({}));
		throw apiError(b, `No se pudo descargar el CFDI (${fmt.toUpperCase()})`);
	}
	await _saveBlob(res, `cfdi-${invoiceNumber || invoiceId}.${fmt}`);
}

async function _saveBlob(res, filename) {
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	try {
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
	} finally {
		URL.revokeObjectURL(url);
	}
}

function classifyCheckoutError(error, status) {
	if (typeof status === 'number') {
		if (status === 401) return 'authentication';
		if (status === 403) return 'authorization';
		if (status >= 500 || status === 0) return 'operational';
	}
	const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
	if (name === 'AbortError') return 'timeout';
	const msg = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
	if (/sesión expiró/i.test(msg)) return 'authentication';
	if (name === 'TypeError') return 'programming';
	return 'operational';
}

async function createPaymentIntent({ planId, billingCycle, gateway = 'stripe', idempotencyKey }) {
	const journey = startJourney('checkout.start');
	try {
		const key = idempotencyKey ?? getOrCreatePaymentIdempotencyKey(planId, billingCycle);
		if (!key) {
			journey.end('failure', { error_category: 'programming' });
			throw new Error('No se pudo generar la clave de idempotencia del pago');
		}
		const res = await authFetch('/api/v1/stripe/payment-intent', {
			method: 'POST',
			headers: { 'Idempotency-Key': key },
			body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle, gateway })
		});
		if (!res.ok) {
			const b = await res.json().catch(() => ({}));
			journey.end('failure', { error_category: classifyCheckoutError(null, res.status) });
			if (res.status === 409) throw paymentApiError(409, b, 'Este período ya fue pagado');
			if (res.status === 403) throw new Error(apiDetail(b) ?? 'Sin permiso para gestionar pagos');
			throw new Error(apiDetail(b) ?? 'Error al inicializar el pago');
		}
		journey.end('success');
		return res.json();
	} catch (error) {
		journey.end('failure', { error_category: classifyCheckoutError(error) });
		throw error;
	}
}

/**
 * Cierra el journey de retorno de Stripe usando solo el status, nunca el query string.
 * @param {unknown} redirectStatus
 * @returns {'success' | 'failure' | 'cancelled'}
 */
function completeCheckout(redirectStatus) {
	const journey = startJourney('checkout.complete');
	let status = typeof redirectStatus === 'string' ? redirectStatus : '';
	if (status.includes('?') || status.includes('=')) {
		try {
			status = new URLSearchParams(status.split('?').pop()).get('redirect_status') || '';
		} catch {
			status = '';
		}
	}
	const normalized = status.toLowerCase();
	if (normalized === 'succeeded' || normalized === 'success') {
		journey.end('success');
		return 'success';
	}
	if (normalized === 'canceled' || normalized === 'cancelled') {
		journey.end('cancelled');
		return 'cancelled';
	}
	journey.end('failure', { error_category: 'expected' });
	return 'failure';
}

async function mountCardForm({ mountId, amountCents, gateway = 'stripe' }) {
	if (gateway !== 'stripe') throw new Error(`Gateway '${gateway}' no soportado`);
	if (!Number.isInteger(amountCents) || amountCents <= 0) {
		throw new Error('El formulario de pago requiere el importe en centavos del backend');
	}

	const stripe = await getSDK('stripe');

	const elements = stripe.elements({
		mode: 'payment',
		amount: amountCents,
		currency: 'mxn',
		setupFutureUsage: 'off_session',
		appearance: stripeAppearance(),
		locale: 'es'
	});

	const el = document.getElementById(mountId);
	if (!el) throw new Error(`Elemento #${mountId} no encontrado en el DOM`);
	elements.create('payment').mount(el);

	return {
		/** El monto de Elements debe seguir al del PaymentIntent que se confirmará. */
		updateAmount(nextAmountCents) {
			if (!Number.isInteger(nextAmountCents) || nextAmountCents <= 0) return;
			elements.update({ amount: nextAmountCents });
		},
		async submit() {
			const { error } = await elements.submit();
			return { error };
		},
		async confirmPayment(clientSecret, returnUrl) {
			return stripe.confirmPayment({
				elements,
				clientSecret,
				confirmParams: { return_url: returnUrl },
				redirect: 'if_required'
			});
		}
	};
}

async function retrievePaymentIntent(clientSecret, gateway = 'stripe') {
	if (gateway !== 'stripe') throw new Error(`Gateway '${gateway}' no soportado`);
	const stripe = await getSDK('stripe');
	return stripe.retrievePaymentIntent(clientSecret);
}

/**
 * Espera a que el banco confirme (3DS / banca móvil) o a que el cargo falle.
 * No cobra de nuevo: solo consulta el mismo PaymentIntent.
 */
async function waitForPaymentIntent(
	clientSecret,
	{ timeoutMs = 90000, intervalMs = 2000, gateway = 'stripe' } = {}
) {
	const started = Date.now();
	let last = await retrievePaymentIntent(clientSecret, gateway);
	if (last.error) return last;
	while (Date.now() - started < timeoutMs) {
		const status = last.paymentIntent?.status;
		if (
			status === 'succeeded' ||
			status === 'requires_capture' ||
			status === 'canceled' ||
			status === 'requires_payment_method'
		) {
			return last;
		}
		await new Promise((r) => setTimeout(r, intervalMs));
		last = await retrievePaymentIntent(clientSecret, gateway);
		if (last.error) return last;
	}
	return last;
}

async function confirmWithSavedPM({
	clientSecret,
	paymentMethodToken,
	returnUrl,
	gateway = 'stripe'
}) {
	if (gateway !== 'stripe') throw new Error(`Gateway '${gateway}' no soportado`);
	const stripe = await getSDK('stripe');
	const data = { payment_method: paymentMethodToken };
	if (returnUrl) data.return_url = returnUrl;
	return stripe.confirmCardPayment(clientSecret, data);
}

export const billingService = {
	getGatewayConfig,
	getAvailableGateways,
	getSummary,
	getPayments,
	getInvoices,
	getPlans,
	getPaymentMethods,
	initAddPaymentMethodFlow,
	confirmSetupIntent,
	deletePaymentMethod,
	setDefaultPaymentMethod,
	setAutoRenew,
	getQuote,
	downloadInvoiceReceipt,
	getTaxProfile,
	saveTaxProfile,
	stampInvoiceCfdi,
	downloadInvoiceCfdi,
	createPaymentIntent,
	completeCheckout,
	mountCardForm,
	confirmWithSavedPM,
	retrievePaymentIntent,
	waitForPaymentIntent
};
