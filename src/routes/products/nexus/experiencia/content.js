/**
 * Contenido editable de la experiencia «Geminis Labs · Nexus».
 *
 * Regla de credibilidad (doc 02): distinguir siempre lo LISTO, lo PARCIAL y
 * lo FUTURO. No agregar cifras de clientes, márgenes, SLA ni capacidad
 * probada que no existan. Los costos internos no se muestran en esta versión.
 */

const IMG = '/img/products/nexus/experiencia';

/** Escenas en orden. `beats` = revelaciones adicionales tras entrar. */
export const SCENES = [
	{ id: 'hero', beats: 0, title: 'Geminis Labs · Experience 2026' },
	{ id: 'pregunta', beats: 1, title: 'La pregunta' },
	{ id: 'queretaro', beats: 3, title: 'Querétaro en movimiento' },
	{ id: 'geminis', beats: 2, title: 'Geminis Labs' },
	{ id: 'nexus', beats: 1, title: 'Nexus' },
	{ id: 'demo', beats: 1, title: 'Nexus en vivo' },
	{ id: 'telemetria', beats: 1, title: 'Un día real' },
	{ id: 'mercado', beats: 2, title: 'A quién sirve' },
	{ id: 'economia', beats: 2, title: 'Oferta comercial' },
	{ id: 'ingenieria', beats: 2, title: 'Ingeniería y confianza' },
	{ id: 'horizonte', beats: 0, title: 'Horizonte' },
	{ id: 'centli', beats: 2, title: 'Centli' },
	{ id: 'peticion', beats: 2, title: 'La propuesta' },
	{ id: 'cierre', beats: 1, title: 'Cierre' }
];

/**
 * Fondo WebGL por escena (ver ShaderBackground.svelte). `null` = sin shader
 * (la escena usa fotografía o el mapa). `mask` oscurece donde va el contenido.
 */
export const BACKDROPS = {
	geminis: {
		mode: 'aurora',
		colors: ['#03100b', '#1f8a4c', '#2fd18a', '#b8ffd9'],
		intensity: 0.9
	},
	pregunta: {
		mode: 'smoke',
		colors: ['#060302', '#2a1205', '#7a3a0e', '#f2a14a'],
		intensity: 0.85
	},
	telemetria: {
		mode: 'silk',
		colors: ['#020814', '#0a2a4a', '#1d6fa3', '#9ad8ff'],
		mask: [0.5, 0.5, 0.5, 0.42],
		maskK: 0.6,
		intensity: 0.8
	},
	horizonte: {
		mode: 'aurora',
		colors: ['#010605', '#0b5a3a', '#11707a', '#9ff5c4'],
		intensity: 0.7
	},
	peticion: {
		mode: 'silk',
		colors: ['#020806', '#0a3324', '#1f8a4c', '#a8f0c4'],
		mask: [0.5, 0.55, 0.55, 0.45],
		maskK: 0.75,
		intensity: 0.55
	},
	cierre: {
		mode: 'aurora',
		colors: ['#030a07', '#1f7a4a', '#c9a74a', '#eaffe0'],
		intensity: 0.85
	}
};

export const NEXUS_LIVE_URL = 'https://nexus.geminislabs.com/login';

/** Video de respaldo de la demo (opcional). Colocar el archivo en static/. */
export const DEMO_VIDEO_SRC = `${IMG}/demo-nexus.mp4`;

export const IMAGES = {
	centliCampo: `${IMG}/centli-campo.webp`,
	centliDron: `${IMG}/centli-dron.webp`
};

export const FLOW = ['Dispositivos', 'Conectividad', 'Eventos', 'Contexto', 'Decisiones'];

export const CHAIN = [
	{ k: 'Vehículo', v: 'Unidad 14 en ruta' },
	{ k: 'Evento', v: 'Sale de la geocerca del cliente a las 15:02' },
	{ k: 'Contexto', v: 'Detenida 40 min fuera de ruta' },
	{ k: 'Decisión', v: 'Operaciones llama al operador' }
];

/** Capturas reales de Nexus (sin ubicaciones ni datos personales). */
export const APP_SCREENS = [
	{
		src: `${IMG}/app-unidad.webp`,
		title: 'Estado de la unidad',
		caption: 'Ignición, velocidad, voltaje, GPS y señal LTE',
		hue: 160
	},
	{
		src: `${IMG}/app-informe.webp`,
		title: 'Informe del día',
		caption: 'Distancia, combustible, tiempos y excepciones',
		hue: 190
	},
	{
		src: `${IMG}/app-velocidad.webp`,
		title: 'Velocidad histórica',
		caption: 'Comportamiento de la unidad hora por hora',
		hue: 200
	},
	{
		src: `${IMG}/app-bateria.webp`,
		title: 'Energía',
		caption: 'Batería del vehículo y respaldo interno',
		hue: 140
	}
];

/** Funciones listas para demostrar en vivo. */
export const DEMO_READY = [
	'Seguimiento GPS',
	'Trayectos e historial',
	'Geocercas y eventos',
	'Alertas',
	'Telemetría',
	'Flotillas y roles'
];

/**
 * Un día real de la unidad de pruebas del equipo (informe de Nexus,
 * 17–18 nov 2026). Sin ubicaciones. La serie de batería reproduce el trazo
 * de la gráfica del informe.
 */
export const TELEMETRY = {
	period: 'Unidad de pruebas del equipo · 17–18 nov 2026',
	kpis: [
		{ v: 28.8, d: 1, u: 'km', k: 'Distancia' },
		{ v: 62, d: 0, u: 'min', k: 'En movimiento' },
		{ v: 39, d: 0, u: 'min', k: 'Detenido' },
		{ v: 3.4, d: 1, u: 'L', k: 'Combustible' },
		{ v: 412, d: 0, u: '', k: 'Reportes con posición válida' }
	],
	/** Velocidad promedio por hora (km/h), del trazo de la gráfica del informe. */
	speeds: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 31, 2, 10, 9, 1, 10, 10, 1, 0, 0, 0, 0, 0, 0],
	battery: [
		12.62, 12.6, 12.62, 12.58, 12.6, 12.55, 12.58, 12.6, 12.4, 12.62, 12.55, 13.85, 12.8, 13.98,
		13.8, 12.9, 13.75, 13.5, 12.9, 12.85, 12.83, 12.85
	]
};

export const SEGMENTS = [
	{
		id: 'flotillas',
		when: 'Hoy',
		title: 'Flotillas de 5 a 100 unidades',
		who: 'Dirección, logística, operaciones y seguridad patrimonial',
		problem: '¿Dónde está? ¿Qué pasó? ¿Cuándo debo actuar?',
		answer: 'Seguimiento, trayectos, geocercas y alertas',
		visual: 'flotilla',
		primary: true
	},
	{
		id: 'integradores',
		when: 'Próximo canal',
		title: 'Integradores GPS',
		who: 'Empresas con cartera de clientes y equipos instalados',
		problem: 'Necesitan plataforma propia sin construirla',
		answer: 'Marca blanca: personalización lista, distribución en pruebas',
		visual: 'marca'
	},
	{
		id: 'movilidad',
		when: 'Futuro',
		title: 'Aseguradoras y movilidad',
		who: 'Riesgo, siniestros y planeación',
		problem: 'Entender el riesgo con datos de movimiento',
		answer: 'Investigación y alianzas',
		visual: 'riesgo'
	}
];

export const CHANNELS = ['Logística', 'Automotriz', 'Plásticos', 'Integradores TI'];

export const PLANS = [
	{ name: 'ONE', monthly: 199, setup: 1199 },
	{ name: 'PRO', monthly: 249, setup: 1449, featured: true },
	{ name: 'MAX', monthly: 349, setup: 1799 }
];

export const PIPELINE = [
	'Dispositivo GPS',
	'Recepción',
	'Procesamiento de eventos',
	'Contexto y reglas',
	'Histórico y alertas'
];

export const CONTROLS = ['Roles y permisos', 'Comunicación cifrada', 'Respaldos periódicos'];
export const NEXT_STEPS = ['Redundancia', 'Pruebas de carga', 'Despliegues sin interrupción'];

export const ORBITS = [
	{ t: 'Teams', s: 'En pruebas', d: 'Grupos con propósito y duración', visual: 'teams' },
	{
		t: 'Marca blanca',
		s: 'Parcial',
		d: 'Personalización lista · distribución en pruebas',
		visual: 'marca'
	},
	{
		t: 'Inteligencia',
		s: 'Experimental',
		d: 'Relacionar señales para decidir mejor',
		visual: 'inteligencia'
	}
];

/** Ciclo de inteligencia de Centli (documento maestro v0.7). */
export const CENTLI_CYCLE = [
	{ k: 'Observar', d: 'Satélite, dron, sensores y registro en campo' },
	{ k: 'Comprender', d: 'Suelo, agua, cultivos, ganado y clima en un solo modelo' },
	{ k: 'Predecir', d: 'Riesgos y evolución con supuestos explícitos' },
	{ k: 'Recomendar', d: 'Acciones con evidencia, costo y responsable' },
	{ k: 'Actuar', d: 'Ejecución supervisada y trazable' },
	{ k: 'Aprender', d: 'Medir el resultado y mejorar el siguiente ciclo' }
];

export const CENTLI_PILOT = [
	'Productividad hídrica',
	'LoRaWAN',
	'Operación sin Internet',
	'Riego supervisado'
];

/** Tarjetas de la propuesta; cada una abre su ficha. */
export const ASKS = [
	{
		id: 'compradores',
		n: '01',
		title: 'Compradores',
		short: 'Conexión con empresas de logística y flotillas de 5 a 100 unidades',
		ficha: {
			title: 'Compradores calificados',
			lead: 'Empresas que mueven unidades todos los días y necesitan saber qué pasó, dónde y cuándo.',
			items: [
				['Perfil', 'Distribución, logística, mantenimiento y servicios con 5 a 100 vehículos'],
				['Quién decide', 'Dirección, logística, operaciones o seguridad patrimonial'],
				['Qué resolvemos hoy', 'Seguimiento, trayectos, geocercas, alertas y control de acceso'],
				['Primer contacto', 'Diagnóstico breve + demostración en vivo con su operación'],
				['Lo que entregamos', 'Propuesta formal, factura y soporte local']
			]
		}
	},
	{
		id: 'integradores',
		n: '02',
		title: 'Integradores y clústeres',
		short: 'Presentación con agrupamientos de logística, automotriz y tecnología',
		ficha: {
			title: 'Integradores y clústeres',
			lead: 'Canales que ya atienden a empresas con unidades en movimiento.',
			items: [
				[
					'Clústeres de interés',
					'Logística, automotriz, plásticos y tecnologías de la información'
				],
				['Integradores GPS', 'Empresas con cartera que buscan plataforma propia'],
				[
					'Marca blanca',
					'Personalización de logos y pantallas lista; distribución multiempresa en pruebas'
				],
				['Formato', 'Una presentación técnica por canal, con demo en vivo']
			]
		}
	},
	{
		id: 'pilotos',
		n: '03',
		title: 'Pilotos acotados',
		short: 'Dos o tres escenarios con alcance, responsable y criterio de éxito',
		ficha: {
			title: 'Piloto Nexus 90',
			lead: 'Un piloto pequeño, medible y con decisión al final.',
			items: [
				['Días 1–15', 'Diagnóstico: cómo se resuelve hoy el problema y con qué esfuerzo'],
				['Días 16–30', 'Integración: instalación, usuarios, geocercas y alertas'],
				['Días 31–75', 'Observación: operación real y seguimiento'],
				['Días 76–90', 'Evaluación: resultados contra la línea base y decisión de compra'],
				['Se mide', 'Eventos atendidos, tiempo de respuesta y uso de la plataforma']
			]
		}
	},
	{
		id: 'institucional',
		n: '04',
		title: 'Ruta como proveedor',
		short: 'Orientación para entrar a las cadenas de proveeduría de Querétaro',
		ficha: {
			title: 'Ruta como proveedor tecnológico',
			lead: 'Queremos entrar a las cadenas de proveeduría como un proveedor queretano de tecnología propia.',
			items: [
				['Canal', '¿Qué mecanismo de vinculación es el adecuado para esta necesidad?'],
				[
					'Preparación',
					'¿Qué requisitos nos pedirían antes de presentarnos a un comprador industrial?'
				],
				['Continuidad', '¿Hay espacios B2B activos donde podamos incorporarnos?'],
				['Seguimiento', 'Responsable, entregable y fecha de la siguiente revisión']
			]
		}
	}
];

export const CONTACT = {
	site: 'geminislabs.com',
	email: 'contacto@geminislabs.com'
};

/** Íconos de línea (24×24) para las tarjetas de la propuesta. */
export const ASK_ICONS = {
	compradores: 'M3 17h2a2 2 0 0 0 4 0h6a2 2 0 0 0 4 0h2v-5l-3-4h-4V6H3v11zm12-7h3l2 3h-5V10z',
	integradores:
		'M6 3a3 3 0 1 1 0 6a3 3 0 0 1 0-6zM18 3a3 3 0 1 1 0 6a3 3 0 0 1 0-6zM12 15a3 3 0 1 1 0 6a3 3 0 0 1 0-6zM8 8l3 7M16 8l-3 7M9 6h6',
	pilotos: 'M5 21V4M5 4h11l-2 4 2 4H5',
	institucional: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18'
};

/** Material propio del sitio (videos e imágenes de Nexus). */
export const MEDIA = {
	futuroMapa: '/vid/futuro-mapa.mp4',
	camiones: '/img/products/nexus/taas-1.mp4',
	helice: '/vid/technology-helix-alt.mp4',
	nexusLogo: '/vid/nexus-animation.mp4',
	kit: `${IMG}/kit-taas.webp`,
	ciudadPines: `${IMG}/ciudad-pines.webp`,
	americas: `${IMG}/americas-conexiones.webp`
};

/** Capturas reales de la app móvil (solo pantallas de informes, sin mapas). */
export const PHONE_SCREENS = [47, 48, 49, 50].map((n) => `${IMG}/movil-${n}.webp`);
