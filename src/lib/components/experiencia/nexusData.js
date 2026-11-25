/** Datos compartidos entre la experiencia y la página de Nexus. */

export const CHAIN = [
	{ k: 'Vehículo', v: 'Unidad 14 en ruta' },
	{ k: 'Evento', v: 'Sale de la geocerca del cliente a las 15:02' },
	{ k: 'Contexto', v: 'Detenida 40 min fuera de ruta' },
	{ k: 'Decisión', v: 'Operaciones llama al operador' }
];

/** Resoluciones H3 que GeoContext calcula por evento (valores de la librería h3 4.5). */
export const H3_LEVELS = [
	{ r: 6, area: '36 km²', edge: '3.7 km', d: 'Ciudad' },
	{ r: 7, area: '5.2 km²', edge: '1.4 km', d: 'Sector' },
	{ r: 8, area: '0.74 km²', edge: '531 m', d: 'Colonia' },
	{ r: 9, area: '0.11 km²', edge: '201 m', d: 'Manzanas' },
	{ r: 10, area: '0.015 km²', edge: '76 m', d: 'Calle' }
];

export const H3_ADVANTAGES = [
	{
		t: '¿Está dentro? Una búsqueda',
		d: 'La geocerca es un conjunto de celdas: saber si una unidad entró es buscar su celda, no calcular geometría.',
		st: 'Listo'
	},
	{
		t: 'De la calle a la ciudad',
		d: 'El mismo evento se agrega en cinco escalas sin volver a procesarlo.',
		st: 'En validación'
	},
	{
		t: 'Vecinos a la misma distancia',
		d: 'Zonas comparables entre sí y búsquedas de cercanía directas.',
		st: 'Propiedad de H3'
	},
	{
		t: 'Agregar por zona',
		d: 'Indicadores por celda con menos exposición de recorridos individuales.',
		st: 'Propiedad de H3'
	}
];
