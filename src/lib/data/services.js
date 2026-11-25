/**
 * Capacidades de ingeniería y consultoría.
 *
 * El documento fuente lista trece áreas. Mostrarlas todas en la navegación
 * convierte la oferta en un catálogo que nadie lee, así que se agrupan en seis
 * capacidades y el detalle vive dentro de cada una.
 *
 * `promise` está escrita en lenguaje de cliente, no de ingeniero: es lo que el
 * visitante tiene que entender sin saber qué es Kafka. Las tecnologías concretas
 * van en `chips`, que es el nivel al que un comprador técnico baja después.
 *
 * `imagen: true` marca las capacidades que tienen ilustración propia en
 * `static/img/capacidades/<slug>.webp` (retiradas). Las que no la tienen caen a la figura
 * dibujada, así que el panal funciona con el juego incompleto y las
 * ilustraciones pueden entrar de una en una.
 *
 * `corto` es la etiqueta del hexágono en el panal: el nombre completo no cabe
 * —un hexágono desperdicia sus esquinas y deja ~65% de su caja utilizable— y el
 * título entero vive en el panel de detalle, que sí tiene sitio.
 *
 * `entrada` dice cómo ARRANCA el trabajo, no cuánto cuesta. El documento fuente
 * no fija precios ni modalidades de contratación, y publicar cifras inventadas
 * comprometería a la empresa. Cuando existan, el campo natural es `precio` y va
 * junto a `entrada`.
 */
export const services = [
	{
		slug: 'consultoria-estrategia',
		imagen: true,
		corto: 'Consultoría',
		num: '01',
		title: 'Consultoría & Estrategia',
		promise:
			'Te decimos qué está mal, qué construir primero y cuánto va a costar, antes de que gastes.',
		chips: ['Diagnóstico', 'Arquitectura', 'Roadmap', 'CTO por horas', 'Due diligence técnica'],
		detail: {
			intro:
				'Muchas organizaciones no necesitan que alguien escriba código todavía. Necesitan que alguien mire lo que ya tienen y diga qué está mal, qué se puede salvar y en qué orden conviene moverse. Ese trabajo se cobra aparte y se entrega aparte: es tuyo, contrates lo que sigue con nosotros o no.',
			groups: [
				{
					title: 'Arquitectura de sistemas',
					items: [
						'Diseño de arquitecturas de software',
						'Sistemas distribuidos',
						'Arquitecturas orientadas a eventos',
						'Microservicios',
						'Sistemas de tiempo real',
						'APIs y servicios backend',
						'Alta disponibilidad y escalabilidad',
						'Arquitecturas multi-tenant',
						'SaaS y PaaS',
						'Integración de sistemas existentes'
					]
				},
				{
					title: 'Auditoría y diagnóstico',
					items: [
						'Auditoría de arquitectura',
						'Auditoría de infraestructura',
						'Evaluación cloud',
						'Evaluación de escalabilidad',
						'Revisión de código',
						'Evaluación de seguridad',
						'Análisis de costos',
						'Diagnóstico de rendimiento',
						'Evaluación de estrategia de datos e IA',
						'Technical due diligence'
					]
				},
				{
					title: 'Acompañamiento tecnológico',
					items: [
						'CTO externo / Fractional CTO',
						'Definición de estrategia tecnológica',
						'Evaluación de proveedores',
						'Selección de tecnologías',
						'Planeación de proyectos y roadmaps',
						'Evaluación de propuestas técnicas',
						'Supervisión técnica de proveedores',
						'Acompañamiento en la contratación de equipos'
					]
				}
			]
		},
		entrada: 'Empieza con un diagnóstico'
	},
	{
		slug: 'software-cloud',
		imagen: true,
		corto: 'Software',
		num: '02',
		title: 'Software & Cloud',
		promise:
			'Construimos y modernizamos plataformas que aguantan crecer, sin que se caigan un martes.',
		chips: [
			'Plataformas web',
			'APIs y backend',
			'Sistemas distribuidos',
			'DevOps',
			'Migración a cloud',
			'Observabilidad'
		],
		detail: {
			intro:
				'A veces no hace falta una aplicación nueva: hace falta que la que ya tienes deje de ser el cuello de botella. Evaluamos si conviene modernizar o rehacer, y luego lo hacemos — con la infraestructura, los despliegues y la observabilidad que hacen que siga en pie después de que nos vayamos.',
			groups: [
				{
					title: 'Desarrollo',
					items: [
						'Plataformas web',
						'Aplicaciones móviles',
						'Backend y APIs',
						'Dashboards operativos',
						'Sistemas administrativos',
						'Plataformas B2B y B2C',
						'Sistemas internos',
						'Integraciones con ERP, CRM y terceros'
					]
				},
				{
					title: 'Modernización',
					items: [
						'Evaluación de sistemas existentes',
						'Modernización de sistemas legacy',
						'Migración de monolitos',
						'Migración hacia cloud',
						'Rediseño de arquitectura',
						'Reducción de deuda técnica',
						'Diagnóstico de rendimiento y escalabilidad'
					]
				},
				{
					title: 'Cloud e infraestructura',
					items: [
						'Diseño de infraestructura cloud',
						'Arquitecturas híbridas',
						'Contenedores',
						'Alta disponibilidad',
						'Disaster recovery',
						'Optimización de costos cloud'
					]
				},
				{
					title: 'DevOps y observabilidad',
					items: [
						'CI/CD',
						'Docker y containerización',
						'Infrastructure as Code',
						'Automatización de despliegues',
						'Ambientes de desarrollo, staging y producción',
						'Logging centralizado',
						'Métricas y alertamiento',
						'Diagnóstico de sistemas distribuidos'
					]
				},
				{
					title: 'Seguridad',
					items: [
						'Security by Design',
						'Arquitecturas seguras',
						'IAM',
						'Gestión de secretos',
						'Seguridad cloud',
						'Seguridad de APIs',
						'Hardening',
						'Estrategias de respaldo y recuperación',
						'Observabilidad de seguridad'
					]
				}
			]
		},
		entrada: 'Empieza con una evaluación del sistema actual'
	},
	{
		slug: 'ai-data',
		imagen: true,
		corto: 'IA & Datos',
		num: '03',
		title: 'IA & Datos',
		promise:
			'IA aplicada a tu operación real: automatizar procesos, ordenar información y decidir con datos, no con demos.',
		chips: [
			'Casos de uso y viabilidad',
			'Agentes de IA',
			'RAG y búsqueda semántica',
			'Pipelines de datos',
			'Streaming de eventos',
			'Tiempo real'
		],
		detail: {
			intro:
				'La pregunta no es si se puede meter IA. Es si tus datos aguantan lo que quieres hacer con ellos, y si el caso de uso devuelve más de lo que cuesta. Empezamos por ahí, no por el modelo.',
			groups: [
				{
					title: 'AI Engineering',
					items: [
						'Identificación de casos de uso',
						'Evaluación de viabilidad y ROI',
						'Integración de modelos de lenguaje',
						'RAG y búsqueda semántica',
						'Automatización inteligente',
						'Procesamiento y clasificación de información',
						'Sistemas de recomendación',
						'Computer Vision cuando aplique'
					]
				},
				{
					title: 'Agentic AI',
					items: [
						'Diseño de agentes de IA',
						'Sistemas multiagente',
						'Agentes conectados con herramientas y APIs',
						'Human-in-the-loop',
						'Memoria y contexto',
						'Orquestación de agentes',
						'Evaluación y observabilidad de agentes',
						'Integración con sistemas empresariales'
					]
				},
				{
					title: 'Data Engineering',
					items: [
						'Diseño de pipelines de datos',
						'Procesamiento en tiempo real',
						'Streaming de eventos',
						'ETL y ELT',
						'Integración de fuentes de datos',
						'Almacenamiento de series temporales',
						'Data APIs'
					]
				},
				{
					title: 'Sistemas en tiempo real',
					items: [
						'Kafka y event streaming',
						'Telemetría',
						'Procesamiento de eventos',
						'Geoprocesamiento',
						'Tracking',
						'Sistemas de alertamiento',
						'Sistemas basados en ubicación',
						'Procesamiento masivo de dispositivos'
					]
				}
			]
		},
		entrada: 'Empieza con un PoC'
	},
	{
		slug: 'iot-hardware',
		imagen: true,
		corto: 'IoT',
		num: '04',
		title: 'IoT & Hardware',
		promise:
			'Dispositivos, sensores y conectividad que mandan datos confiables desde donde pasa el trabajo.',
		chips: [
			'Arquitectura device → cloud',
			'Sensores y gateways',
			'Firmware y embebidos',
			'LoRaWAN',
			'MQTT',
			'GPS/GNSS',
			'NFC/RFID',
			'Edge computing'
		],
		detail: {
			intro:
				'Un dispositivo que manda datos malos es peor que no tener dispositivo. Diseñamos la cadena completa —sensor, conectividad, protocolo, ingesta— y antes de eso te ayudamos a responder si de verdad necesitas hardware propio.',
			groups: [
				{
					title: 'IoT',
					items: [
						'Diseño de soluciones IoT',
						'Arquitectura device → cloud',
						'Telemetría',
						'Sensores y gateways',
						'Protocolos de comunicación',
						'MQTT',
						'Redes celulares',
						'LoRaWAN',
						'Wi-Fi y BLE',
						'GPS/GNSS',
						'NFC/RFID',
						'Edge computing',
						'Administración remota de dispositivos'
					]
				},
				{
					title: 'Plataformas IoT',
					items: [
						'Device management',
						'Dashboards',
						'Alertas',
						'Recolección de telemetría',
						'Procesamiento en tiempo real',
						'Geolocalización',
						'Analítica',
						'Automatización basada en eventos'
					]
				},
				{
					title: 'Hardware y embebidos',
					items: [
						'Selección de componentes',
						'Diseño conceptual de dispositivos',
						'Arquitectura electrónica',
						'Prototipado',
						'Integración de sensores',
						'Sistemas embebidos',
						'Firmware',
						'Comunicación dispositivo-servidor',
						'Integración hardware/software'
					]
				},
				{
					title: 'Build vs Buy',
					items: [
						'Costo',
						'Tiempo de desarrollo',
						'Escalabilidad',
						'Mantenimiento',
						'Disponibilidad de componentes',
						'Integración',
						'Riesgo tecnológico'
					]
				}
			]
		},
		entrada: 'Empieza resolviendo build vs buy'
	},
	{
		slug: 'industria-automatizacion',
		imagen: true,
		corto: 'Industria',
		num: '05',
		title: 'Industria & Automatización',
		promise: 'Conectamos máquinas, personas, procesos y software para que la planta se mida sola.',
		chips: [
			'Digitalización de procesos',
			'Monitoreo de maquinaria',
			'Integración OT/IT',
			'Trazabilidad',
			'Computer Vision',
			'Integración ERP/MES'
		],
		detail: {
			intro:
				'Conectamos máquinas, personas, procesos y software. En el Bajío y en Querétaro esto casi siempre empieza igual: una operación que ya funciona pero que se mide a mano, en papel o en una hoja de cálculo que solo entiende una persona.',
			groups: [
				{
					title: 'Captura y monitoreo',
					items: [
						'Digitalización de procesos',
						'Captura automática de datos',
						'Monitoreo de maquinaria',
						'Telemetría industrial',
						'Trazabilidad',
						'RFID y NFC'
					]
				},
				{
					title: 'Integración',
					items: [
						'Integración OT/IT',
						'Integración con ERP y MES',
						'Automatización de procesos',
						'Edge computing'
					]
				},
				{
					title: 'Decisión',
					items: [
						'Dashboards operativos',
						'Alertamiento',
						'Mantenimiento basado en datos',
						'Analítica operacional',
						'Computer Vision'
					]
				}
			]
		},
		entrada: 'Empieza con un recorrido de planta'
	},
	{
		slug: 'soluciones-integrales',
		imagen: true,
		corto: 'Integrales',
		num: '06',
		title: 'Soluciones Integrales',
		promise: 'Un solo proveedor del sensor al dashboard: nadie se echa la culpa entre proveedores.',
		chips: ['Hardware', 'Conectividad', 'Software', 'Cloud', 'Datos', 'IA', 'Operación'],
		detail: {
			// Sus «grupos» no son temas, son CADENAS de ejemplo: los ítems están
			// ORDENADOS —del dispositivo al dashboard— y el orden es lo único que
			// significan. Pintarlos como nube lo destruiría.
			forma: 'cadena',
			intro:
				'La diferencia no es que hagamos hardware y software. Es que podemos analizar y diseñar el sistema entero, y eso te evita coordinar a cinco proveedores que se echan la culpa entre ellos cuando algo no funciona.',
			groups: [
				{
					title: '«Necesito saber dónde están mis activos y cuándo salen de una zona»',
					items: [
						'Dispositivo',
						'Conectividad',
						'Protocolo',
						'Backend',
						'Streaming',
						'Base de datos',
						'Geoprocesamiento',
						'Alertas',
						'Dashboard',
						'Aplicación',
						'Infraestructura',
						'Operación'
					]
				},
				{
					title: '«Quiero medir las condiciones de mis cultivos»',
					items: [
						'Sensores',
						'LoRaWAN',
						'Gateway',
						'Edge',
						'Cloud',
						'Plataforma',
						'Datos',
						'IA',
						'Alertas',
						'Automatización'
					]
				}
			]
		},
		entrada: 'Empieza contándonos el problema'
	}
];

/**
 * El flujo que se muestra como riel de proceso encima de las capacidades.
 * Es una secuencia real, no una decoración: por eso va numerada y en orden.
 */
export const processSteps = [
	{
		key: 'entendemos',
		label: 'Entendemos',
		short: 'Tu problema',
		desc: 'Qué problema hay debajo de lo que nos pides.'
	},
	{
		key: 'disenamos',
		label: 'Diseñamos',
		short: 'Plan claro',
		desc: 'La arquitectura y el camino, antes de escribir código.'
	},
	{
		key: 'construimos',
		label: 'Construimos',
		short: 'Tecnología real',
		desc: 'Software, hardware e infraestructura.'
	},
	{
		key: 'integramos',
		label: 'Integramos',
		short: 'Con lo que ya tienes',
		desc: 'Con lo que ya tienes funcionando.'
	},
	{
		key: 'operamos',
		label: 'Operamos',
		short: 'En producción',
		desc: 'Y lo mantenemos en producción.'
	}
];

/** Capacidad por slug; `undefined` si no existe. */
export function service(slug) {
	return services.find((s) => s.slug === slug);
}

/**
 * Etiquetas sobre la ilustración de la sección de servicios en la landing.
 *
 * Los rótulos viven en la banda vacía que queda SOBRE la silueta de la escena
 * isométrica, nunca encima del dibujo: `x`/`labelY` colocan el anillo y la línea
 * es la que baja a buscar el elemento, hasta `y`.
 *
 * Los `labelY` no son a ojo. La silueta de la ilustración se midió columna a
 * columna sobre el propio archivo (primera fila con contenido, en % del alto):
 *
 *   x   10%  18%  26%  34%  42%  50%  58%  66%  74%  82%  90%
 *   y   45   35   31   36   31   27   25   19   16    7   13
 *
 * Cada rótulo ocupa ~15% del ancho y ~10% del alto, así que su `labelY` se fija
 * para que el borde inferior quede 1.5% por encima del punto más alto de la
 * silueta en TODO el rango horizontal que cubre. Si cambias un texto y crece de
 * línea, hay que rebajar su `labelY` en la misma proporción.
 *
 * Los anclajes van cada 16 puntos y el rótulo mide 14, así que tampoco se tocan
 * en horizontal a ningún ancho al que se muestre esta versión (>1200px).
 */
export const scenePins = [
	{
		title: 'Hardware & IoT',
		desc: 'Dispositivos, sensores y conectividad',
		x: 11,
		labelY: 11,
		y: 46
	},
	{
		title: 'Datos',
		desc: 'Ingesta, procesamiento y almacenamiento',
		x: 27,
		labelY: 5,
		y: 42
	},
	{
		title: 'Infraestructura & Cloud',
		desc: 'Escalable, segura y confiable',
		x: 43,
		labelY: -1,
		y: 38
	},
	{
		title: 'IA & Analítica',
		desc: 'Modelos, automatización y decisiones',
		x: 59,
		labelY: -7,
		y: 30
	},
	{
		title: 'Aplicaciones',
		desc: 'Dashboards, APIs y experiencias',
		x: 75,
		labelY: -13,
		y: 20
	}
];

/**
 * El árbol tecnológico del hero de servicios.
 *
 * Sigue la referencia: tronco vertical al centro y ramas que salen a IZQUIERDA
 * y DERECHA a distintas alturas, no todas a la misma ni todas del mismo lado.
 * Un árbol de verdad es asimétrico; el primer intento salió en peine, con todo
 * colgando de un lado, y por eso no se leía como árbol.
 *
 * `tamano` crece hacia abajo —de 18 en la copa a 40 en la maraña de la base—
 * porque en la referencia los nodos ganan tamaño al acercarse a la mesa. Es lo
 * que le da profundidad a la escena.
 *
 * Coordenadas y tamaño en porcentajes sobre la caja del árbol, nunca en
 * píxeles, para que la composición aguante cualquier ancho.
 *
 * `voltear` refleja el nodo en horizontal: los mismos cuatro cubos leídos al
 * revés dejan de parecer el mismo nodo repetido.
 *
 * `capa` decide la profundidad del parallax: 1 se mueve poco (el tronco, que
 * ancla la escena) y 3 se mueve más (las hojas, que flotan por delante).
 */
/**
 * EL PANAL
 *
 * Las seis capacidades dejan de ser una lista y pasan a ser una sola figura con
 * seis estados, que es lo que el titular afirma («una sola casa») y que una
 * columna de filas idénticas no podía enseñar.
 *
 * La forma no es adorno: los hexágonos TESELAN, encajan sin dejar huecos entre
 * ellos. Eso es exactamente lo que dice la sexta capacidad —«un solo proveedor
 * del sensor al dashboard: nadie se echa la culpa entre proveedores»— y por eso
 * va en el CENTRO, con las otras cinco alrededor. La sexta no es una hermana de
 * las otras: es las otras cinco juntas, y la geometría lo dice sin escribirlo.
 *
 * Queda un hueco, porque un hexágono tiene seis vecinos y solo hay cinco que
 * poner. Se deja a la DERECHA, mirando al panel de detalle: el panal se abre
 * hacia donde aparece el texto en vez de cerrarse sobre sí mismo.
 *
 * Geometría de hexágono con vértice arriba: ancho `a = √3·s`, alto `2s`, y los
 * vecinos caen en (±a, 0) y (±a/2, ±3s/2). Con `a = 40` el conjunto mide 100 de
 * ancho por 115.47 de alto, que es la caja en la que se posiciona todo.
 */
const PANAL_A = 40;
const PANAL_S = PANAL_A / Math.sqrt(3);
export const PANAL_ALTO = 5 * PANAL_S;

// Centro del panal dentro de esa caja, y desplazamientos de los cinco vecinos
// en el orden en que se leen: horario desde arriba a la izquierda, saltando el
// hueco de la derecha.
const PANAL_CENTRO = { x: 1.5 * PANAL_A, y: PANAL_ALTO / 2 };
const PANAL_ANILLO = [
	{ dx: -PANAL_A / 2, dy: (-3 * PANAL_S) / 2 },
	{ dx: PANAL_A / 2, dy: (-3 * PANAL_S) / 2 },
	{ dx: PANAL_A / 2, dy: (3 * PANAL_S) / 2 },
	{ dx: -PANAL_A / 2, dy: (3 * PANAL_S) / 2 },
	{ dx: -PANAL_A, dy: 0 }
];

/**
 * Coloca las seis capacidades en el panal. La última va al centro y las cinco
 * primeras al anillo, en el orden del array: el orden de los datos es el orden
 * de lectura, y así renumerarlas o reordenarlas no obliga a tocar geometría.
 */
/*
 * El color de cada celda es una rampa POR POSICIÓN, no un color por significado.
 *
 * Con un solo cian no caben seis escalones legibles, y seis tonos con
 * significado acabarían formando parejas que parecen agrupaciones deliberadas
 * que nadie quiso decir. En cambio una rampa continua del azul del anillo al
 * hielo del centro se lee como una sola familia, distingue cada celda de su
 * vecina, y dice lo que la sección afirma: las cinco alimentan a la una.
 *
 * El recorrido va de 214° a 187°, que es del azul de las luces de ciudad del
 * hero al cian de marca. Ni entra en el verde de Nexus, ni en la plata de Orion,
 * ni en el rojo de Signum.
 */
const PANAL_TONO_INICIO = 214;
const PANAL_TONO_FIN = 187;

export function celdasPanal(capacidades) {
	const ultima = capacidades.length - 1;
	return capacidades.map((c, i) => {
		const centro = i === ultima;
		const d = centro ? { dx: 0, dy: 0 } : PANAL_ANILLO[i];
		const t = ultima > 0 ? i / (ultima - 1 || 1) : 0;
		const tono = centro
			? PANAL_TONO_FIN
			: Math.round(PANAL_TONO_INICIO + (PANAL_TONO_FIN - PANAL_TONO_INICIO) * Math.min(t, 1));
		return {
			...c,
			centro,
			x: PANAL_CENTRO.x + d.dx,
			y: PANAL_CENTRO.y + d.dy,
			// El centro es el destino de la rampa: mismo tono que el final del
			// anillo pero mucho más claro, para que se lea como aquello a lo que
			// las otras cinco llegan.
			color: centro ? `hsl(${tono} 92% 82%)` : `hsl(${tono} 78% 64%)`
		};
	});
}

/**
 * El diagnóstico tecnológico, que vivía en su propia página.
 *
 * Se trajo al hub porque el embudo eran tres navegaciones antes de que nadie
 * pudiera escribir una letra: servicios → diagnóstico → contacto. De la página
 * vieja se conserva lo que el hub no podía decir —quién se reconoce en la oferta
 * y qué se revisa— y se descarta lo que ya repetía: los apartados del entregable
 * están en la puerta y los ocho frentes se solapan con las seis capacidades.
 */
export const diagnosticoSituaciones = [
	'Tu plataforma ya no aguanta y no sabes si es el código, la infraestructura o el diseño',
	'Un proveedor te pasó una cotización y no tienes con qué contrastarla',
	'Vas a invertir en IA pero sospechas que tus datos no están listos',
	'Heredaste un sistema que nadie documentó',
	'Tu factura de cloud sube y nadie sabe explicar por qué',
	'Quieres conectar máquinas o dispositivos y no sabes por dónde se empieza'
];

/** Los ocho frentes de la auditoría. Van como etiquetas: son alcance, no oferta. */
export const diagnosticoFrentes = [
	'Arquitectura',
	'Infraestructura y cloud',
	'Escalabilidad',
	'Código y deuda técnica',
	'Seguridad',
	'Datos e IA',
	'IoT y dispositivos',
	'Costos'
];

export const arbolNodos = [
	// Copa: es la única excepción del árbol. De ella salen DOS ramas además del
	// tronco; en el resto del árbol las ramas nacen de una unión intermedia.
	// Sus dos hojas son las más pequeñas y las más pegadas al tronco: son la
	// punta de la pirámide.
	{ id: 'copa', img: 'tree-1', x: 48, y: 8, tamano: 26, capa: 2 },
	{ id: 'hoja-1i', img: 'tree-3', x: 29, y: 22, tamano: 19, capa: 3 },
	{ id: 'hoja-1d', img: 'tree-6', x: 68, y: 23, tamano: 19, capa: 3, voltear: true },

	// Segundo nivel: el nodo de paso va del lado izquierdo. A la derecha lo
	// tenía encajonado entre la unión y el anillo, que es la pieza más ancha
	// del árbol, y ese tramo quedaba saturado.
	{ id: 'union-2', img: 'tree-parent-node', x: 48, y: 38, tamano: 15, capa: 1 },
	{ id: 'paso-2i', img: 'tree-child-node', x: 34, y: 41, tamano: 5, capa: 2 },
	{ id: 'hoja-2i', img: 'tree-2', x: 19, y: 45, tamano: 24, capa: 3 },
	{ id: 'hoja-2d', img: 'tree-4', x: 77, y: 42, tamano: 30, capa: 3 },

	// Tercer nivel: el otro nodo de paso, del lado contrario al del segundo.
	// Dos pasos a la misma altura flanqueando el mismo tronco se leen como un
	// par simétrico, que es justo lo que el árbol evita.
	{ id: 'union-3', img: 'tree-parent-node', x: 48, y: 55, tamano: 17, capa: 1 },
	{ id: 'hoja-3i', img: 'tree-7', x: 11, y: 59, tamano: 21, capa: 3 },
	{ id: 'paso-3d', img: 'tree-child-node', x: 60, y: 57.7, tamano: 5.5, capa: 2 },
	{ id: 'hoja-3d', img: 'tree-3', x: 82, y: 62, tamano: 25, capa: 3, voltear: true },

	// Base: los nodos más grandes y los que más se alejan del tronco. La copa
	// llega a x≈20/78 y aquí se llega a x≈-11/101: es esa progresión, y no el
	// tamaño de las piezas, la que hace que la silueta se lea como un árbol.
	{ id: 'union-4', img: 'tree-parent-node', x: 48, y: 73, tamano: 20, capa: 1 },
	{ id: 'hoja-4i', img: 'tree-5', x: 14, y: 81, tamano: 50, capa: 3 },
	{ id: 'hoja-4d', img: 'tree-1', x: 84, y: 81, tamano: 34, capa: 3, voltear: true },

	{ id: 'raiz', img: 'tree-parent-node', x: 48, y: 92, tamano: 28, capa: 1 }
];

/**
 * Los trazos que unen los nodos, en el mismo sistema de 0–100.
 *
 * Cada rama sale del tronco, quiebra en DIAGONAL y remata en horizontal sobre
 * su nodo. Con quiebres solo en ángulo recto el árbol se leía como un peine, y
 * los dos lados salían con el mismo ángulo: aquí cada rama tiene su propia
 * pendiente y su propio largo.
 *
 * Terminan en el CENTRO de su nodo, no en el borde de su caja: el PNG lleva
 * resplandor transparente alrededor, así que el dibujo visible queda más
 * adentro y una rama que muere en el borde deja un hueco. El nodo se pinta
 * encima y tapa el remate.
 *
 * `retardo` escalona el pulso para que la señal recorra el árbol y no lo
 * encienda entero a la vez.
 */
export const arbolRamas = [
	{ id: 'tronco', d: 'M48 92 V12', retardo: 0, tronco: true },

	// Todas BAJAN al alejarse del tronco: una rama horizontal deja el conjunto
	// como un candelabro, y lo que la referencia muestra es un abeto. El quiebre
	// diagonal es el que hace el descenso; el remate horizontal solo aterriza
	// sobre el nodo.
	{ id: 'rama-1i', d: 'M46 13 L37 17 L33 22 H29', retardo: 2.4 },
	{ id: 'rama-1d', d: 'M50 13 L59 17 L64 23 H68', retardo: 2.7 },

	{ id: 'rama-2i', d: 'M48 38 L36 40 L26 45 H19', retardo: 1.8 },
	{ id: 'rama-2d', d: 'M48 38 L58 39 L69 42 H77', retardo: 2.1 },

	{ id: 'rama-3i', d: 'M48 55 L34 56 L21 59 H11', retardo: 1.2 },
	{ id: 'rama-3d', d: 'M48 55 L58 57 L72 62 H82', retardo: 1.5 },

	{ id: 'rama-4i', d: 'M48 73 L36 75 L24 81 H14', retardo: 0.6 },
	{ id: 'rama-4d', d: 'M48 73 L62 75 L74 81 H84', retardo: 0.9 }
];

/**
 * La rama que alimenta a un nodo, para poder encenderla cuando el puntero se
 * acerca. Se deduce del identificador en vez de guardarse como campo: `hoja-3i`
 * y `paso-3i` cuelgan de `rama-3i`, y todo lo que está sobre el eje —copa,
 * uniones y raíz— cuelga del tronco. Un campo aparte sería una segunda copia de
 * la misma relación, y las dos podrían acabar contradiciéndose.
 */
export function ramaDeNodo(id) {
	const m = /^(?:hoja|paso)-(\d[id])$/.exec(id);
	return m ? `rama-${m[1]}` : 'tronco';
}

/**
 * Cuánto se aparta un nodo, en píxeles, cuando el puntero cruza el hero de lado
 * a lado. Dos factores, y el segundo es el que faltaba.
 *
 * `capa` es PROFUNDIDAD: lo que está más cerca del espectador se desplaza más,
 * que es de donde sale la sensación de fondo.
 *
 * La altura es ESTRUCTURA: el árbol está apoyado en la mesa. La raíz no se mueve
 * y la copa es la que más oscila, como oscila un árbol de verdad. Sin esto las
 * quince piezas se desplazaban lo mismo y el conjunto entero patinaba sobre la
 * fotografía en vez de reaccionar.
 *
 * El 0.3 es el suelo: ni siquiera lo que está pegado a la mesa se queda del todo
 * rígido, porque un elemento inmóvil entre otros que respiran se lee como pegado.
 */
const AMPLITUD_CAPA = { 1: 3, 2: 8, 3: 16 };
const SUELO_ALTURA = 0.3;

export function amplitudNodo(nodo) {
	const ys = arbolNodos.map((n) => n.y);
	const base = Math.max(...ys);
	const recorrido = base - Math.min(...ys);
	const altura = SUELO_ALTURA + (1 - SUELO_ALTURA) * ((base - nodo.y) / recorrido);
	return Number((AMPLITUD_CAPA[nodo.capa] * altura).toFixed(2));
}
