import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
	test('landing page loads', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Geminis Labs/i);
	});

	test('auth page shows login UI', async ({ page }) => {
		await page.goto('/auth');
		await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
	});
});

// El motivo de existir del rail: antes, dos de cada tres productos quedaban
// escondidos tras un selector y los visitantes no sabían que existían. Si algo
// vuelve a esconderlos, esto tiene que fallar.
test.describe('descubribilidad de productos', () => {
	test('los tres productos se ven sin interactuar', async ({ page }) => {
		await page.goto('/');
		const rail = page.getByRole('tablist', { name: 'Productos' });
		for (const name of ['NEXUS', 'ORION', 'SIGNUM']) {
			await expect(rail.getByRole('tab', { name: new RegExp(name, 'i') })).toBeVisible();
		}
	});

	test('cada producto declara qué hace, no solo su nombre', async ({ page }) => {
		await page.goto('/');
		const rail = page.getByRole('tablist', { name: 'Productos' });
		await expect(rail).toContainText('Rastreo GPS en tiempo real');
		await expect(rail).toContainText('API de geolocalización sin GPS');
		await expect(rail).toContainText('Identidad médica de emergencia');
	});

	test('cada panel enlaza a su destino', async ({ page }) => {
		await page.goto('/');
		const destinos = {
			nexus: '/products/nexus',
			orion: 'https://orion.geminislabs.com/',
			signum: 'https://signum.geminislabs.com/'
		};
		for (const [id, href] of Object.entries(destinos)) {
			await page.click(`#tab-${id}`);
			await expect(page.locator(`#tab-${id}`)).toHaveAttribute('aria-selected', 'true');
			const panel = page.locator(`#panel-${id}`);
			await expect(panel).toBeVisible();
			await expect(panel.locator('a.nx-cta')).toHaveAttribute('href', href);
		}
	});

	// Regresión concreta: el ternario binario anterior nunca alcanzaba el tercer
	// producto, así que Signum era inaccesible por teclado.
	test('se llega a los tres productos con el teclado', async ({ page }) => {
		await page.goto('/');
		const nexus = page.locator('#tab-nexus');
		await nexus.click();
		await expect(nexus).toHaveAttribute('aria-selected', 'true');
		await nexus.focus();
		await page.keyboard.press('ArrowRight');
		await expect(page.locator('#tab-orion')).toHaveAttribute('aria-selected', 'true');
		await page.keyboard.press('ArrowRight');
		await expect(page.locator('#tab-signum')).toHaveAttribute('aria-selected', 'true');
		// y cicla de vuelta al primero
		await page.keyboard.press('ArrowRight');
		await expect(page.locator('#tab-nexus')).toHaveAttribute('aria-selected', 'true');
	});
});
