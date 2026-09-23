import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { metrics } from '@opentelemetry/api';
import {
	sanearTexto,
	correoValido,
	telefonoValido,
	validarContacto,
	cargarRecaptcha,
	tokenRecaptcha,
	enviarContacto,
	LIMITE_NOMBRE,
	LIMITE_MENSAJE
} from './contacto.js';

const base = { nombre: 'Ada', correo_electronico: 'ada@ejemplo.mx', telefono: '', mensaje: 'Hola' };

describe('sanearTexto', () => {
	it('escapa las etiquetas en vez de dejarlas pasar', () => {
		expect(sanearTexto('<script>alert(1)</script>')).not.toContain('<script>');
	});

	it('escapa comillas y barras, que es por donde se rompe un atributo', () => {
		const salida = sanearTexto(`" ' /`);
		expect(salida).toContain('&quot;');
		expect(salida).toContain('&#x27;');
		expect(salida).toContain('&#x2F;');
	});

	it('devuelve cadena vacía ante nulo o indefinido', () => {
		expect(sanearTexto('')).toBe('');
		expect(sanearTexto(undefined)).toBe('');
		expect(sanearTexto(null)).toBe('');
	});
});

describe('correoValido', () => {
	it('acepta un correo con arroba y dominio', () => {
		expect(correoValido('ada@ejemplo.mx')).toBe(true);
	});

	it('rechaza los que no tienen arroba, dominio o punto', () => {
		for (const malo of ['ada', 'ada@', 'ada@ejemplo', '@ejemplo.mx', 'a da@ejemplo.mx']) {
			expect(correoValido(malo), malo).toBe(false);
		}
	});
});

describe('telefonoValido', () => {
	// Se cuentan DÍGITOS, no caracteres: un número escrito con espacios, guiones
	// o paréntesis es válido y la gente lo escribe así.
	it('ignora el formato y cuenta los dígitos', () => {
		expect(telefonoValido('+52 (55) 1234-5678')).toBe(true);
	});

	it('rechaza por debajo de 7 dígitos y por encima de 20', () => {
		expect(telefonoValido('123456')).toBe(false);
		expect(telefonoValido('1'.repeat(21))).toBe(false);
	});
});

describe('validarContacto', () => {
	it('acepta un envío completo', () => {
		expect(validarContacto(base).valido).toBe(true);
	});

	it('exige nombre y mensaje', () => {
		expect(validarContacto({ ...base, nombre: '  ' }).errores.nombre).toBeTruthy();
		expect(validarContacto({ ...base, mensaje: '' }).errores.mensaje).toBeTruthy();
	});

	it('corta nombre y mensaje en su límite', () => {
		expect(validarContacto({ ...base, nombre: 'a'.repeat(LIMITE_NOMBRE + 1) }).valido).toBe(false);
		expect(validarContacto({ ...base, mensaje: 'a'.repeat(LIMITE_MENSAJE + 1) }).valido).toBe(
			false
		);
	});

	// La regla que no es obvia: por separado son opcionales, en conjunto no. Sin
	// ninguno de los dos no hay forma de responderle a quien escribió.
	it('exige al menos un medio de contacto', () => {
		const r = validarContacto({ ...base, correo_electronico: '', telefono: '' });
		expect(r.valido).toBe(false);
		expect(r.errores.general).toBeTruthy();
	});

	it('acepta solo teléfono, sin correo', () => {
		expect(
			validarContacto({ ...base, correo_electronico: '', telefono: '5512345678' }).valido
		).toBe(true);
	});

	it('valida el formato de los que sí vienen', () => {
		expect(
			validarContacto({ ...base, correo_electronico: 'roto' }).errores.correo_electronico
		).toBeTruthy();
		expect(validarContacto({ ...base, telefono: '12' }).errores.telefono).toBeTruthy();
	});

	it('no deja errores colgados entre llamadas', () => {
		validarContacto({ ...base, nombre: '' });
		expect(validarContacto(base).errores.nombre).toBe('');
	});
});

describe('cargarRecaptcha', () => {
	beforeEach(() => {
		document.head.querySelectorAll('script[src*="recaptcha"]').forEach((n) => n.remove());
	});

	it('no inyecta nada sin clave configurada', () => {
		cargarRecaptcha('');
		expect(document.querySelector('script[src*="recaptcha"]')).toBeNull();
	});

	it('inyecta el script con la clave', () => {
		cargarRecaptcha('clave-de-prueba');
		const s = document.querySelector('script[src*="recaptcha"]');
		expect(s.src).toContain('render=clave-de-prueba');
		expect(s.async).toBe(true);
	});

	// Dos invocaciones ocurren de verdad: la landing lo carga al montar y una
	// navegación del cliente a /servicios volvería a llamarlo.
	it('no lo inyecta dos veces', () => {
		cargarRecaptcha('clave-de-prueba');
		cargarRecaptcha('clave-de-prueba');
		expect(document.querySelectorAll('script[src*="recaptcha"]')).toHaveLength(1);
	});
});

describe('tokenRecaptcha', () => {
	afterEach(() => {
		delete window.grecaptcha;
	});

	it('devuelve null si no hay clave', async () => {
		expect(await tokenRecaptcha('accion', '')).toBeNull();
	});

	it('devuelve null si el script no llegó a cargar', async () => {
		expect(await tokenRecaptcha('accion', 'clave')).toBeNull();
	});

	it('pide el token con la acción que se le pasa', async () => {
		const execute = vi.fn().mockResolvedValue('tok-123');
		window.grecaptcha = { ready: (cb) => cb(), execute };
		expect(await tokenRecaptcha('diagnostico', 'clave')).toBe('tok-123');
		expect(execute).toHaveBeenCalledWith('clave', { action: 'diagnostico' });
	});

	it('devuelve null —y no revienta— si grecaptcha falla', async () => {
		window.grecaptcha = { ready: (cb) => cb(), execute: vi.fn().mockRejectedValue(new Error('x')) };
		expect(await tokenRecaptcha('accion', 'clave')).toBeNull();
	});
});

describe('enviarContacto', () => {
	const lleno = {
		nombre: 'Ada',
		correo_electronico: 'ada@ejemplo.mx',
		telefono: '5512345678',
		mensaje: 'Quiero un diagnóstico'
	};

	/** @type {ReturnType<typeof vi.fn>} */
	let add;

	beforeEach(() => {
		add = vi.fn();
		vi.spyOn(metrics, 'getMeter').mockReturnValue({
			createCounter: () => ({ add })
		});
		// El entorno se fija a mano: `.env` trae una clave real, y con ella el envío
		// corta antes del `fetch` cuando no hay `grecaptcha`. Ese corte es correcto
		// —y se prueba aparte—, pero aquí estorba.
		vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', '');
		delete window.grecaptcha;
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ message: 'Listo' }) })
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	const cuerpoEnviado = () => JSON.parse(fetch.mock.calls[0][1].body);

	it('envía los cuatro campos saneados', async () => {
		const r = await enviarContacto(lleno);
		expect(r).toEqual({ ok: true, mensaje: 'Listo' });
		const cuerpo = cuerpoEnviado();
		expect(cuerpo.nombre).toBe('Ada');
		expect(cuerpo.correo_electronico).toBe('ada@ejemplo.mx');
		expect(cuerpo.telefono).toBe('5512345678');
		expect(cuerpo.mensaje).toContain('Quiero un diagnóstico');
	});

	// El API rechaza campos vacíos; los opcionales se omiten en vez de mandarse
	// como cadena vacía.
	it('omite los opcionales que vienen vacíos', async () => {
		await enviarContacto({ ...lleno, telefono: '', correo_electronico: '' });
		const cuerpo = cuerpoEnviado();
		expect(cuerpo).not.toHaveProperty('telefono');
		expect(cuerpo).not.toHaveProperty('correo_electronico');
	});

	// El contexto va DENTRO del mensaje y no como campo suelto: el contrato del
	// API no es nuestro para extenderlo, y un campo desconocido podría rebotar el
	// envío entero.
	it('antepone el contexto al mensaje sin inventar un campo', async () => {
		await enviarContacto(lleno, { contexto: 'Diagnóstico tecnológico' });
		const cuerpo = cuerpoEnviado();
		expect(cuerpo.mensaje).toBe('[Diagnóstico tecnológico] Quiero un diagnóstico');
		expect(cuerpo).not.toHaveProperty('contexto');
	});

	it('sanea lo que el visitante escribe antes de mandarlo', async () => {
		await enviarContacto({ ...lleno, nombre: '<b>Ada</b>' });
		expect(cuerpoEnviado().nombre).not.toContain('<b>');
	});

	it('adjunta el token cuando reCAPTCHA responde', async () => {
		vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'clave');
		window.grecaptcha = { ready: (cb) => cb(), execute: vi.fn().mockResolvedValue('tok-abc') };
		await enviarContacto(lleno, { accion: 'diagnostico' });
		expect(cuerpoEnviado().recaptcha_token).toBe('tok-abc');
	});

	// La protección que importa: con reCAPTCHA configurado pero sin token, NO se
	// envía. Mandarlo sin token dejaría pasar spam que el servidor cree verificado.
	it('no envía si reCAPTCHA está configurado y falla', async () => {
		vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'clave');
		const r = await enviarContacto(lleno);
		expect(r.ok).toBe(false);
		expect(r.mensaje).toMatch(/reCAPTCHA/);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('devuelve el mensaje del servidor cuando rechaza', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: 'Datos inválidos' }) })
		);
		expect(await enviarContacto(lleno)).toEqual({ ok: false, mensaje: 'Datos inválidos' });
	});

	it('explica la caída de red en vez de dejar el formulario colgado', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
		const r = await enviarContacto(lleno);
		expect(r.ok).toBe(false);
		expect(r.mensaje).toMatch(/conexión/i);
	});

	it('submit exitoso emite journey event con outcome=success', async () => {
		await enviarContacto(lleno);
		expect(add).toHaveBeenCalledWith(
			1,
			expect.objectContaining({ journey: 'contact.submit', outcome: 'success' })
		);
	});

	it('reCAPTCHA fail emite journey con outcome=failure, error_category=dependency', async () => {
		vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'clave');
		const r = await enviarContacto(lleno);
		expect(r.ok).toBe(false);
		expect(add).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				journey: 'contact.submit',
				outcome: 'failure',
				error_category: 'dependency'
			})
		);
	});

	it('fetch 5xx emite journey con outcome=failure, error_category=operational', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({ message: 'down' })
			})
		);
		await enviarContacto(lleno);
		expect(add).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				journey: 'contact.submit',
				outcome: 'failure',
				error_category: 'operational'
			})
		);
	});

	it('timeout emite journey con outcome=failure, error_category=timeout', async () => {
		const abort = new Error('aborted');
		abort.name = 'AbortError';
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));
		await enviarContacto(lleno);
		expect(add).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				journey: 'contact.submit',
				outcome: 'failure',
				error_category: 'timeout'
			})
		);
	});

	it('payload del formulario ausente en todas las señales', async () => {
		await enviarContacto(lleno);
		expect(JSON.stringify(add.mock.calls)).not.toContain('ada@ejemplo.mx');
		expect(JSON.stringify(add.mock.calls)).not.toContain('5512345678');
		expect(JSON.stringify(add.mock.calls)).not.toContain('Quiero un diagnóstico');
	});

	it('recaptcha_token ausente en todas las señales', async () => {
		vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'clave');
		window.grecaptcha = { ready: (cb) => cb(), execute: vi.fn().mockResolvedValue('tok-abc') };
		await enviarContacto(lleno, { accion: 'diagnostico' });
		expect(JSON.stringify(add.mock.calls)).not.toContain('tok-abc');
		expect(JSON.stringify(add.mock.calls)).not.toContain('recaptcha_token');
	});
});
