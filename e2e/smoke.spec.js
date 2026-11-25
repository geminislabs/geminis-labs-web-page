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

// Antes, dos de cada tres productos quedaban escondidos tras un selector y los
// visitantes no sabían que existían. Ahora cada producto tiene su propio bloque
// a la vista; si algo vuelve a esconderlos, esto tiene que fallar.
test.describe('descubribilidad de productos', () => {
	const productos = [
		{
			id: 'nexus',
			name: 'NEXUS',
			hace: 'Dónde está, a dónde fue y cuándo salió de la zona.',
			href: '/products/nexus'
		},
		{
			id: 'orion',
			name: 'ORION',
			hace: 'Ubica un dispositivo por señal celular, sin GPS a bordo.',
			href: 'https://orion.geminislabs.com/'
		},
		{
			id: 'signum',
			name: 'SIGNUM',
			hace: 'Un QR que habla por ti cuando tú no puedes.',
			href: 'https://signum.geminislabs.com/'
		}
	];

	test('los tres productos se ven sin interactuar', async ({ page }) => {
		await page.goto('/');
		for (const p of productos) {
			await expect(page.getByRole('heading', { name: p.name, exact: true })).toBeVisible();
		}
	});

	test('cada producto declara qué hace, no solo su nombre', async ({ page }) => {
		await page.goto('/');
		for (const p of productos) {
			await expect(page.locator(`article[data-product="${p.id}"]`)).toContainText(p.hace);
		}
	});

	test('cada bloque enlaza a su destino', async ({ page }) => {
		await page.goto('/');
		for (const p of productos) {
			const cta = page.locator(`article[data-product="${p.id}"] a.ps-cta`);
			await expect(cta).toHaveAttribute('href', p.href);
		}
	});

	// Regresión concreta: con el selector anterior Signum era inaccesible por
	// teclado. Los tres enlaces deben poder recibir el foco.
	test('se llega a los tres productos con el teclado', async ({ page }) => {
		await page.goto('/');
		for (const p of productos) {
			const cta = page.locator(`article[data-product="${p.id}"] a.ps-cta`);
			await cta.focus();
			await expect(cta).toBeFocused();
		}
	});
});
