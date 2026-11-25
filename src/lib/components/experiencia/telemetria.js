/** Informe real de Nexus: unidad de pruebas del equipo, 17–18 nov 2026 (sin ubicaciones). */
export const TELEMETRY = {
	period: 'Unidad de pruebas del equipo · 17–18 nov 2026',
	kpis: [
		{ v: 28.8, d: 1, u: 'km', k: 'Distancia' },
		{ v: 62, d: 0, u: 'min', k: 'En movimiento' },
		{ v: 39, d: 0, u: 'min', k: 'Detenido' },
		{ v: 3.4, d: 1, u: 'L', k: 'Combustible' },
		{ v: 0, d: 0, u: '', k: 'Alertas' }
	],
	/** Salud del equipo, del mismo informe: comunicaciones con posición válida. */
	health: {
		valid: 412,
		total: 434,
		exceptions: ['Señal baja (<20) · 18.5', 'Pocos satélites (<10) · 10'],
		at: '17 nov · 22:00'
	},
	/**
	 * Estado de la batería con un criterio explícito: en reposo ≥ 12.4 V y en
	 * marcha entre 13.7 y 14.7 V. El mínimo del trazo ocurre en reposo.
	 */
	batteryStatus: {
		ok: true,
		label: 'Saludable',
		detail: 'Criterio: en reposo ≥ 12.4 V y en marcha 13.7–14.7 V. Cumple ambos.'
	},
	/** Diagnóstico indicativo por voltaje (no sustituye una prueba de carga). */
	batteryCheck: [
		{ v: '12.6 V', k: 'En reposo', d: 'Carga completa' },
		{ v: '13.8–14.0 V', k: 'En marcha', d: 'El alternador carga en rango normal' },
		{ v: '4.2 V', k: 'Respaldo interno', d: 'Estable todo el día' }
	],
	/** Velocidad promedio por hora (km/h), del trazo de la gráfica del informe. */
	speeds: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 31, 2, 10, 9, 1, 10, 10, 1, 0, 0, 0, 0, 0, 0],
	battery: [
		12.62, 12.6, 12.62, 12.58, 12.6, 12.55, 12.58, 12.6, 12.4, 12.62, 12.55, 13.85, 12.8, 13.98,
		13.8, 12.9, 13.75, 13.5, 12.9, 12.85, 12.83, 12.85
	]
};

/** Lo que el mismo flujo de datos permitirá (investigación, no implementado). */
export const TELEMETRY_NEXT = [
	{
		t: 'Mantenimiento predictivo',
		d: 'Tendencia de voltaje y arranques para anticipar fallas de batería y alternador'
	},
	{
		t: 'Estado de las calles por horario',
		d: 'Velocidades y paradas por tramo: más allá del tráfico, obras, incidentes y deterioro'
	},
	{
		t: 'Correlación entre unidades',
		d: 'Patrones que comparten vehículos en la misma zona y hora'
	},
	{ t: 'Carga vehicular', d: 'Anticipar qué pasa en un corredor cuando aumenta el flujo' },
	{ t: 'Planeación urbana', d: 'Indicadores agregados por celda para decisiones de ciudad' },
	{
		t: 'Ligado al celular',
		d: 'Vehículo y teléfono del conductor en un mismo contexto (correlación experimental)'
	}
];
