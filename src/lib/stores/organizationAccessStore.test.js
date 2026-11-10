import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

const getAccessBlock = vi.fn();
vi.mock('$lib/services/userService.js', () => ({
	userService: { getAccessBlock: (...args) => getAccessBlock(...args) }
}));

const { organizationAccess, refreshOrganizationAccess, accessBlockCopy } =
	await import('./organizationAccessStore.js');

const SUSPENDIDA = {
	error_code: 'organization_suspended',
	suspended_by: 'account',
	can_manage_billing: true
};

describe('organizationAccessStore', () => {
	beforeEach(() => {
		getAccessBlock.mockReset();
		organizationAccess.set(null);
	});

	it('toma el access_blocked de /auth/me y lo suelta al reactivarse', async () => {
		getAccessBlock.mockResolvedValueOnce(SUSPENDIDA).mockResolvedValueOnce(null);

		await refreshOrganizationAccess();
		expect(get(organizationAccess)).toEqual(SUSPENDIDA);

		await refreshOrganizationAccess();
		expect(get(organizationAccess)).toBeNull();
	});

	it('owner o billing: aviso con facturación', () => {
		expect(accessBlockCopy(SUSPENDIDA)).toEqual({
			message:
				'El servicio de tu organización está suspendido. Se reactiva solo en cuanto se registre tu pago.',
			showBilling: true
		});
	});

	it('sin permiso de facturación: contactar al administrador', () => {
		const copy = accessBlockCopy({ ...SUSPENDIDA, can_manage_billing: false });
		expect(copy.showBilling).toBe(false);
		expect(copy.message).toMatch(/Contacta al administrador de tu cuenta/);
	});

	it('borrada: sin facturación', () => {
		expect(accessBlockCopy({ ...SUSPENDIDA, error_code: 'organization_deleted' })).toEqual({
			message: 'Esta organización ya no está disponible.',
			showBilling: false
		});
	});
});
