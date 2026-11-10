import { writable } from 'svelte/store';
import { userService } from '$lib/services/userService.js';

/**
 * Si la organización del usuario está suspendida o borrada.
 *
 * El portal es donde vive facturación, así que aquí no se bloquea nada: el
 * backend deja pagar a owner y billing de una organización suspendida. Sólo se
 * avisa, arriba de todo el panel, y se manda a facturación a quien puede pagar.
 * Al registrarse el pago, admin-api reactiva sola la organización.
 *
 * @typedef {{ error_code: 'organization_suspended' | 'organization_deleted', suspended_by: 'organization' | 'account', can_manage_billing: boolean }} AccessBlock
 */
export const organizationAccess = writable(/** @type {AccessBlock | null} */ (null));

/** Vuelve a preguntar a `/auth/me`. Se llama al entrar al panel y al recargar facturación. */
export async function refreshOrganizationAccess() {
	organizationAccess.set(await userService.getAccessBlock());
}

/**
 * El texto del aviso.
 * @param {AccessBlock} block
 * @returns {{ message: string, showBilling: boolean }}
 */
export function accessBlockCopy(block) {
	if (block.error_code === 'organization_deleted') {
		return { message: 'Esta organización ya no está disponible.', showBilling: false };
	}
	if (block.can_manage_billing) {
		return {
			message:
				'El servicio de tu organización está suspendido. Se reactiva solo en cuanto se registre tu pago.',
			showBilling: true
		};
	}
	return {
		message:
			'El servicio de tu organización está suspendido. Contacta al administrador de tu cuenta.',
		showBilling: false
	};
}
