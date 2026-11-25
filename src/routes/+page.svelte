<script>
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import HeroParticles from '$lib/components/HeroParticles.svelte';
	import HeroGlitch from '$lib/components/HeroGlitch.svelte';
	import ExperienceWorld from '$lib/components/experiencia/ExperienceWorld.svelte';
	import FlowDiagram from '$lib/components/experiencia/FlowDiagram.svelte';
	import QuestionBand from '$lib/components/experiencia/QuestionBand.svelte';
	import ShaderBackground from '$lib/components/experiencia/ShaderBackground.svelte';
	import ProductShowcase from '$lib/components/ProductShowcase.svelte';
	import ServicesBento from '$lib/components/ServicesBento.svelte';
	import HeroTitle from '$lib/components/HeroTitle.svelte';
	import {
		cargarRecaptcha,
		claveRecaptcha,
		enviarContacto,
		validarContacto
	} from '$lib/contacto.js';

	// Variables para efectos parallax
	let scrollY = 0;
	let innerHeight = 0;

	// Variable para detectar si estamos en móvil
	let isMobile = false;

	// Video de fondo del título: pausado, reproduce en hover, rebobina en reversa al salir
	let titleVideo;
	let titleRewindRAF;
	function titlePlay() {
		if (!titleVideo) return;
		cancelAnimationFrame(titleRewindRAF);
		titleVideo.play().catch(() => {});
	}
	function titleRewind() {
		if (!titleVideo) return;
		titleVideo.pause();
		cancelAnimationFrame(titleRewindRAF);
		const step = () => {
			if (!titleVideo) return;
			titleVideo.currentTime = Math.max(0, titleVideo.currentTime - 1 / 30);
			if (titleVideo.currentTime > 0.01) titleRewindRAF = requestAnimationFrame(step);
		};
		titleRewindRAF = requestAnimationFrame(step);
	}

	// Video del futuro: textos secuenciales
	let futuroNear = false;
	let tcFlowNear = false;
	let contactNear = false;
	/** Aurora verde y dorada del cierre de la experiencia. */
	const CONTACT_AURORA = {
		key: 'contacto',
		mode: 'aurora',
		colors: ['#030a07', '#1f7a4a', '#c9a74a', '#eaffe0'],
		intensity: 0.6
	};

	/**
	 * Flujo conceptual por capas (sin marcas, protocolos ni componentes internos):
	 * las mismas cuatro capas de las tarjetas, en movimiento.
	 */
	const TC_RGB = {
		senales: '79,209,255',
		infra: '134,240,221',
		intel: '0,255,150',
		exp: '170,255,110'
	};
	const tcFlowNodes = [
		{
			id: 'veh',
			x: 0.08,
			y: 0.15,
			t: 'Vehículos',
			s: 'Ubicación y estado',
			st: 'ok',
			rgb: TC_RGB.senales
		},
		{
			id: 'sens',
			x: 0.08,
			y: 0.5,
			t: 'Sensores',
			s: 'Señales del entorno',
			st: 'ok',
			rgb: TC_RGB.senales
		},
		{
			id: 'mov',
			x: 0.08,
			y: 0.85,
			t: 'Dispositivos móviles',
			s: 'Personas y equipos',
			st: 'ok',
			rgb: TC_RGB.senales
		},
		{
			id: 'con',
			x: 0.29,
			y: 0.5,
			t: 'Conectividad',
			s: 'Redes inalámbricas',
			st: 'ok',
			rgb: TC_RGB.infra
		},
		{
			id: 'rt',
			x: 0.5,
			y: 0.5,
			t: 'Tiempo real',
			s: 'Eventos al instante',
			st: 'ok',
			rgb: TC_RGB.infra
		},
		{
			id: 'geo',
			x: 0.71,
			y: 0.15,
			t: 'Contexto geoespacial',
			s: 'Zonas y cercanía',
			st: 'ok',
			rgb: TC_RGB.intel
		},
		{
			id: 'pat',
			x: 0.71,
			y: 0.5,
			t: 'Patrones',
			s: 'Anomalías y riesgo',
			st: 'ok',
			rgb: TC_RGB.intel
		},
		{
			id: 'his',
			x: 0.71,
			y: 0.85,
			t: 'Histórico',
			s: 'Trayectos y tendencias',
			st: 'ok',
			rgb: TC_RGB.intel
		},
		{ id: 'ale', x: 0.91, y: 0.15, t: 'Alertas', s: 'Web y app', st: 'ok', rgb: TC_RGB.exp },
		{
			id: 'dec',
			x: 0.91,
			y: 0.5,
			t: 'Decisiones',
			s: 'Mapas y tableros',
			st: 'ok',
			rgb: TC_RGB.exp
		},
		{
			id: 'rep',
			x: 0.91,
			y: 0.85,
			t: 'Reportes y APIs',
			s: 'Integraciones',
			st: 'ok',
			rgb: TC_RGB.exp
		}
	];
	const tcFlowEdges = [
		['veh', 'con'],
		['sens', 'con'],
		['mov', 'con'],
		['con', 'rt'],
		['rt', 'geo'],
		['rt', 'pat'],
		['rt', 'his'],
		['geo', 'ale'],
		['pat', 'dec'],
		['his', 'rep']
	];
	let currentTextIndex = 0;
	let exitingTextIndex = -1;
	let futuroTextInterval;
	let futuroProgressKey = 0; // fuerza recrear la barra de progreso en cada cambio

	/** Llama a `cb` una vez cuando el nodo está a menos de 600 px de entrar en pantalla. */
	function _near(node, cb) {
		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					cb();
					io.disconnect();
				}
			},
			{ rootMargin: '600px' }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}

	function _futuroReveal(node) {
		const show = () => node.classList.add('futuro-in-view');
		// fallback: siempre visible después de 200ms aunque el observer no dispare
		const fallback = setTimeout(show, 200);
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						show();
						clearTimeout(fallback);
						observer.unobserve(node);
					}
				});
			},
			{ threshold: 0 }
		);
		observer.observe(node);
		return {
			destroy() {
				observer.disconnect();
				clearTimeout(fallback);
			}
		};
	}

	const futuroTextos = [
		{
			title: 'Señales móviles',
			desc: 'Capturamos señales del mundo real para ampliar cobertura, precisión y contexto.'
		},
		{
			title: 'Localización híbrida',
			desc: 'Ubicación basada en GPS, celdas, WiFi y contexto geoespacial.'
		},
		{
			title: 'Contexto geoespacial',
			desc: 'Convertimos coordenadas en significado: zonas, patrones, cercanía y comportamiento.'
		},
		{
			title: 'Inteligencia de riesgo',
			desc: 'Detectamos anomalías, zonas críticas y señales relevantes antes de que sea tarde.'
		},
		{
			title: 'Red resiliente',
			desc: 'Infraestructura IoT de largo alcance para escenarios donde la conectividad tradicional no basta.'
		},
		{
			title: 'Modelos predictivos',
			desc: 'Anticipamos eventos y transformamos comportamiento en decisiones accionables.'
		}
	];

	// Áreas (badges) con efecto hover de cuadros a negro + descripción
	let hoveredArea = null;
	const areas = [
		{
			label: 'Inteligencia Artificial',
			icon: 'brain',
			headline: 'IA + Intuición Humana',
			sub: 'Mejores decisiones, no reemplazo humano'
		},
		{
			label: 'IoT',
			icon: 'cpu',
			headline: 'Mundo físico + Mundo digital',
			sub: 'Sensores, ubicación, datos, contexto y soluciones'
		},
		{
			label: 'Telecomunicaciones',
			icon: 'radio',
			headline: 'Humanidad + tecnología',
			sub: 'La tecnología amplifica capacidades y alcance humano'
		},
		{
			label: 'Análisis Geoespacial',
			icon: 'satellite',
			headline: 'Datos + Propósito',
			sub: 'Información convertida en acción'
		},
		{
			label: 'Investigación',
			icon: 'flask',
			headline: 'Soluciones eficientes + innovación =',
			brand: 'Geminis Labs',
			sub: ''
		}
	];
	// Variable para reCAPTCHA
	const recaptchaSiteKey = claveRecaptcha();

	// Variables para el formulario de contacto
	let formData = {
		nombre: '',
		correo_electronico: '',
		telefono: '',
		mensaje: ''
	};

	let formErrors = {
		nombre: '',
		correo_electronico: '',
		telefono: '',
		mensaje: '',
		general: ''
	};

	let isSubmitting = false;
	let submitSuccess = false;
	let submitMessage = '';

	// Carousel Nexus
	const nexusImages = [
		'/img/products/nexus/flayer-1.jpg',
		'/img/products/nexus/flayer-2.png',
		'/img/products/nexus/flayer-3.png',
		'/img/products/nexus/flayer-4.png'
	];
	let currentNexusSlide = 0;
	let nexusCarouselInterval;

	// Rotating Features Data
	const nexusFeatures = [
		{
			title: 'Rastreo en tiempo real',
			items: [
				'Ubicación precisa por GPS',
				'Historial y reproducción de trayectos',
				'Estados de movimiento y detención'
			]
		},
		{
			title: 'Eventos que importan',
			items: [
				'Alertas por movimiento no autorizado',
				'Excesos, desconexiones y anomalías',
				'Notificaciones configurables en tiempo real'
			]
		},
		{
			title: 'Control operativo centralizado',
			items: [
				'Gestión de flotas y unidades',
				'Mantenimiento y consumo',
				'Visibilidad completa desde un solo panel'
			]
		},
		{
			title: 'Datos listos para decisión',
			items: [
				'Reportes automáticos',
				'Métricas operativas clave',
				'Información accionable, no solo registros'
			]
		},
		{
			title: 'Diseñado para escalar',
			items: [
				'Desde una unidad hasta miles',
				'Arquitectura preparada para crecimiento',
				'Operación estable 24/7'
			]
		}
	];
	let currentFeatureIndex = 0;
	let nexusFeaturesInterval;

	// Orion Features Data
	const orionFeatures = [
		{
			title: 'Motor de Localización',
			description:
				'Triangulación multi-celda, Procesamiento de señal independiente del carrier, Lógica adaptativa para entornos urbanos y rurales, No requiere GPS'
		},
		{
			title: 'Modelo de Precisión',
			description:
				'Radio de confianza dinámico, Precisión ajustada por densidad de señal, Estimación basada en entorno, Ponderación por intensidad de señal'
		},
		{
			title: 'Rendimiento y Respuesta',
			description:
				'Resolución casi en tiempo real, Optimizado para baja latencia, Arquitectura de alta disponibilidad, Diseñado para escalamiento masivo'
		},
		{
			title: 'Cobertura',
			description:
				'Soporte nacional y transfronterizo, Independiente del operador, Lógica optimizada para ciudad y carretera'
		},
		{
			title: 'Capa de Inteligencia',
			description:
				'Análisis histórico de patrones, Inferencia de movimiento, Estimación probabilística de zonas, Preparado para detección de anomalías'
		},
		{
			title: 'Seguridad y Privacidad',
			description:
				'Sin rastreo de dispositivos, Sin identificadores persistentes, Flujo de solicitudes cifrado, Arquitectura orientada a privacidad'
		},
		{
			title: 'Integración',
			description:
				'API REST, Consultas en tiempo real y por lotes, Diseñado para sistemas backend, Preparado para fusión con Nexus'
		}
	];
	let currentOrionFeatureIndex = 0;
	let orionInterval;

	let innerWindowWidth;

	// En móvil (≤600px) el hero muestra solo el logo estático, así que no montamos
	// el canvas de partículas de PIXI (evita su ticker y el coste de batería).
	$: showHeroParticles = innerWindowWidth > 600;

	onMount(() => {
		// Nexus Carousel Autoplay
		nexusCarouselInterval = setInterval(() => {
			currentNexusSlide = (currentNexusSlide + 1) % nexusImages.length;
		}, 8000); // Cambia cada 8 segundos

		// Orion Features Rotation
		orionInterval = setInterval(() => {
			currentOrionFeatureIndex = (currentOrionFeatureIndex + 1) % orionFeatures.length;
		}, 8000); // Cambia cada 8 segundos

		// Nexus Features Rotation
		nexusFeaturesInterval = setInterval(() => {
			currentFeatureIndex = (currentFeatureIndex + 1) % nexusFeatures.length;
		}, 8000); // Cambia cada 8 segundos

		// Futuro: rotación de textos
		futuroTextInterval = setInterval(() => {
			exitingTextIndex = currentTextIndex;
			setTimeout(() => {
				exitingTextIndex = -1;
			}, 400);
			currentTextIndex = (currentTextIndex + 1) % futuroTextos.length;
			futuroProgressKey += 1;
		}, 5000);

		// Cargar el script de reCAPTCHA v3
		cargarRecaptcha();

		// Detectar si estamos en móvil
		const checkMobile = () => {
			isMobile = window.innerWidth <= 768;
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		// Smooth scrolling para los enlaces de navegación
		const links = document.querySelectorAll('a[href^="#"]');
		links.forEach((link) => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const target = document.querySelector(link.getAttribute('href'));
				if (target) {
					target.scrollIntoView({ behavior: 'smooth' });
				}
			});
		});

		// Cleanup
		return () => {
			window.removeEventListener('resize', checkMobile);

			if (nexusCarouselInterval) clearInterval(nexusCarouselInterval);
			if (nexusFeaturesInterval) clearInterval(nexusFeaturesInterval);
			if (orionInterval) clearInterval(orionInterval);
			if (futuroTextInterval) clearInterval(futuroTextInterval);
		};
	});

	// Scroll-reveal: añade la clase 'is-revealed' cuando el nodo entra en viewport.
	// Solo anima opacity/transform (sin reflow). Seguro sin JS: el default es visible.
	function _reveal(node) {
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce) {
			node.classList.add('is-revealed');
			return {};
		}
		node.classList.add('tc-reveal');
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-revealed');
						observer.unobserve(entry.target);
					}
				});
			},
			{ rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
		);
		observer.observe(node);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	// Capas de la sección "Tecnologías que convergen"
	const tcLayers = [
		{
			num: '01',
			title: 'Capa de señales',
			accent: '#0e3a4a',
			icon: 'signal',
			desc: 'Capturamos el mundo físico en tiempo real.',
			chips: [
				'GPS',
				'Celdas celulares',
				'WiFi',
				'Sensores',
				'LoRa',
				'Dispositivos móviles',
				'Telemetría vehicular'
			]
		},
		{
			num: '02',
			title: 'Capa de infraestructura',
			accent: '#0a5266',
			icon: 'infra',
			desc: 'Movemos y almacenamos los datos a gran escala.',
			chips: [
				'Cloud',
				'APIs',
				'Kafka/Redpanda',
				'Bases geoespaciales',
				'Procesamiento en tiempo real',
				'Sistemas distribuidos'
			]
		},
		{
			num: '03',
			title: 'Capa de inteligencia',
			accent: '#0a6a80',
			icon: 'brain',
			desc: 'Convertimos datos en patrones y predicciones.',
			chips: [
				'IA',
				'Modelos predictivos',
				'Detección de anomalías',
				'Análisis histórico',
				'Clasificación de eventos'
			]
		},
		{
			num: '04',
			title: 'Capa de experiencia',
			accent: '#0883a0',
			icon: 'layout',
			desc: 'Entregamos decisiones a las personas.',
			chips: ['Panel web', 'App móvil', 'Alertas', 'Mapas', 'Reportes', 'APIs e integraciones']
		}
	];

	// El saneado, la validación y el envío viven en `$lib/contacto.js`: los usan
	// este formulario y el del diagnóstico en /servicios, y una sola copia de esas
	// reglas es lo que evita que una de las dos se quede sin validar el teléfono o
	// sin adjuntar el token de reCAPTCHA.

	// Función para manejar el envío del formulario de contacto
	async function handleContactSubmit(event) {
		event.preventDefault();

		submitSuccess = false;
		submitMessage = '';

		const { valido, errores } = validarContacto(formData);
		formErrors = errores;
		if (!valido) return;

		isSubmitting = true;
		const resultado = await enviarContacto(formData);
		isSubmitting = false;

		submitSuccess = resultado.ok;
		submitMessage = resultado.mensaje;

		if (resultado.ok) {
			formData = { nombre: '', correo_electronico: '', telefono: '', mensaje: '' };
			// El acuse se retira solo: dejarlo fijo hace que el siguiente envío no se
			// distinga del anterior.
			setTimeout(() => {
				submitSuccess = false;
				submitMessage = '';
			}, 5000);
		}
	}
</script>

<svelte:window bind:scrollY bind:innerHeight bind:innerWidth={innerWindowWidth} />

<svelte:head>
	<title>Geminis Labs</title>
	<meta name="description" content="Soluciones avanzadas" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Canvas decorativo de fondo (CSS puro, sin video) -->
<div class="page-canvas" aria-hidden="true">
	<div class="orb orb-1"></div>
	<div class="orb orb-2"></div>
	<div class="orb orb-3"></div>
	<div class="orb orb-4"></div>
	<div class="grid-lines"></div>
</div>

<!-- Navegación fija -->
<Navbar />

<!-- Sección Hero -->
<section id="inicio" class="hero-particle-section">
	<!-- Video original oculto — HeroGlitch lo dibuja en canvas con el efecto -->
	<video
		class="hero-bg-video"
		src="/vid/cyberhuman-hero.mp4"
		autoplay
		muted
		loop
		playsinline
		on:loadedmetadata={(e) => (e.currentTarget.playbackRate = 0.85)}
	></video>
	<HeroGlitch />

	<!-- Capas de atmósfera visual -->
	<div class="hero-vignette" aria-hidden="true"></div>
	<div class="hero-video-fade" aria-hidden="true"></div>
	<div class="hero-video-bottom-fade" aria-hidden="true"></div>
	<div class="hero-scanlines" aria-hidden="true"></div>
	<div class="hero-right-glow" aria-hidden="true"></div>

	{#if showHeroParticles}
		<HeroParticles />
	{/if}

	<!-- Logo estático — solo visible en móvil -->
	<div class="hero-mobile-logo" aria-label="Geminis Labs">
		<img src="/img/geminis-labs-logo-short.png" alt="Geminis Labs" class="hero-mobile-logo-img" />
		<span class="hero-mobile-logo-text">GEMINIS LABS</span>
	</div>

	<div class="hero-text-overlay" style="transform: translateY({isMobile ? 0 : scrollY * 0.08}px)">
		<div class="hero-label" aria-hidden="true">// GEMINIS LABS · AI &amp; CONNECTIVITY</div>
		<HeroTitle />
		<div
			class="hero-particle-buttons"
			style="transform: translateY({isMobile ? 0 : -scrollY * 0.08}px)"
		>
			<a href="/servicios" class="btn-primary">Descubre Nuestros Servicios</a>
			<a href="#contacto" class="btn-secondary">Contactar Ahora</a>
		</div>
	</div>
</section>

<!-- Sección Laboratorio Tecnológico -->
<section id="ecosistema" class="lab-section">
	<span id="nosotros" style="position:absolute; top:-80px;"></span>
	<div class="lab-noise" aria-hidden="true"></div>
	<div class="lab-head">
		<h2 class="landing-section-title lab-section-title">
			¿Qué es <span class="brand">Geminis Labs</span>?
		</h2>
	</div>
	<div class="container lab-grid">
		<div class="lab-left">
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="lab-title-media" on:mouseenter={titlePlay} on:mouseleave={titleRewind}>
				<video
					bind:this={titleVideo}
					class="lab-title-video"
					src="/vid/title-tech.mp4"
					muted
					playsinline
					preload="none"
				></video>
				<span class="lab-title-scrim" aria-hidden="true"></span>
				<h2 class="landing-section-title lab-title">Tecnología al servicio de la humanidad</h2>
			</div>
		</div>
		<div class="lab-center">
			<img
				src="/img/foco-no-bg.webp"
				alt="Foco con tecnología y naturaleza integradas"
				class="lab-bulb"
				loading="lazy"
			/>
		</div>
		<div class="lab-right">
			<p class="lab-lead">
				Geminis Labs es un laboratorio tecnológico dedicado a construir
				<strong>productos e infraestructura</strong> para resolver problemas reales mediante
				inteligencia artificial, IoT, telecomunicaciones, análisis geoespacial y sistemas
				distribuidos — <strong>a beneficio de la humanidad</strong>.
			</p>
		</div>
	</div>

	<!-- Áreas: badges con icono + efecto hover -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="lab-areas"
		class:focused={hoveredArea !== null}
		on:mouseleave={() => (hoveredArea = null)}
	>
		{#each areas as area, i (area.label)}
			<div
				class="lab-cap"
				class:active={hoveredArea === i}
				class:dim={hoveredArea !== null && hoveredArea !== i}
				on:mouseenter={() => (hoveredArea = i)}
			>
				<span class="lab-cap-icon">
					<svg viewBox="0 0 24 24" aria-hidden="true">
						{#if area.icon === 'brain'}
							<path
								d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"
							/>
							<path
								d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"
							/>
						{:else if area.icon === 'cpu'}
							<rect x="4" y="4" width="16" height="16" rx="2" />
							<rect x="9" y="9" width="6" height="6" />
							<path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
						{:else if area.icon === 'radio'}
							<circle cx="12" cy="12" r="2" />
							<path
								d="M4.93 19.07a10 10 0 0 1 0-14.14M7.76 16.24a6 6 0 0 1 0-8.49M16.24 7.76a6 6 0 0 1 0 8.49M19.07 4.93a10 10 0 0 1 0 14.14"
							/>
						{:else if area.icon === 'satellite'}
							<path d="M4 10a7.31 7.31 0 0 0 10 10Z" />
							<path d="m9 15 3-3" />
							<path d="M17 13a6 6 0 0 0-6-6" />
							<path d="M21 13A10 10 0 0 0 11 3" />
						{:else if area.icon === 'flask'}
							<path d="M10 2v7.31" />
							<path d="M14 9.3V2" />
							<path d="M8.5 2h7" />
							<path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
							<path d="M5.52 16h12.96" />
						{/if}
					</svg>
				</span>
				<span class="lab-cap-label">{area.label}</span>
				<div class="lab-cap-detail">
					<h3>
						{area.headline}
						{#if area.brand}<span class="brand"> {area.brand}</span>{/if}
					</h3>
					{#if area.sub}<p>{area.sub}</p>{/if}
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- Sección Tecnologías que convergen -->
<section id="tecnologias" class="tc-section" aria-labelledby="tc-title">
	<span id="tecnologias-anchor" style="position:absolute; top:-80px;"></span>

	<div class="tc-inner">
		<header class="tc-head">
			<h2 id="tc-title" class="landing-section-title tc-title">Tecnologías que convergen</h2>
			<p class="tc-subhead">De la señal física a la decisión humana.</p>
		</header>

		<div class="tc-grid">
			<!-- LEFT: cuadrícula 2×2 de las cuatro capas -->
			<ol class="tc-layers">
				{#each tcLayers as layer, i (layer.num)}
					<li class="tc-layer-item" style="--tc-accent: {layer.accent};">
						<article class="tc-card" use:_reveal style="--tc-delay: {i * 90}ms;">
							<div class="tc-card-head">
								<span class="tc-icon" aria-hidden="true">
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										{#if layer.icon === 'signal'}
											<path d="M2 20h.01" />
											<path d="M7 20v-4" />
											<path d="M12 20v-8" />
											<path d="M17 20V8" />
											<path d="M22 4v16" />
										{:else if layer.icon === 'infra'}
											<rect x="2" y="3" width="20" height="6" rx="1.5" />
											<rect x="2" y="15" width="20" height="6" rx="1.5" />
											<path d="M6 6h.01M6 18h.01" />
										{:else if layer.icon === 'brain'}
											<path
												d="M12 5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0 3 3 0 0 0 2-5 3 3 0 0 0-2-5 3 3 0 0 0-3-3Z"
											/>
											<path d="M12 5v14" />
										{:else if layer.icon === 'layout'}
											<rect x="3" y="3" width="18" height="18" rx="2" />
											<path d="M3 9h18M9 21V9" />
										{/if}
									</svg>
								</span>
								<span class="tc-num" aria-hidden="true">{layer.num}</span>
								<h3 class="tc-card-title">{layer.title}</h3>
							</div>

							<p class="tc-card-desc">{layer.desc}</p>

							<ul class="tc-chips">
								{#each layer.chips as chip (`${layer.num}-${chip}`)}
									<li class="tc-chip">{chip}</li>
								{/each}
							</ul>
						</article>
					</li>
				{/each}
			</ol>
		</div>

		<!-- Cómo fluye un evento: arquitectura real, con lo que opera hoy y lo que investigamos -->
		<div class="tc-flow" use:_near={() => (tcFlowNear = true)}>
			<div class="tc-flow-head">
				<p class="tc-flow-kicker">Cómo fluye un evento</p>
				<ul class="tc-flow-legend">
					<li><i style="border-color: rgb({TC_RGB.senales})"></i>01 Señales</li>
					<li><i style="border-color: rgb({TC_RGB.infra})"></i>02 Infraestructura</li>
					<li><i style="border-color: rgb({TC_RGB.intel})"></i>03 Inteligencia</li>
					<li><i style="border-color: rgb({TC_RGB.exp})"></i>04 Experiencia</li>
				</ul>
			</div>
			<div class="tc-flow-canvas">
				{#if tcFlowNear}<FlowDiagram nodes={tcFlowNodes} edges={tcFlowEdges} />{/if}
			</div>
		</div>

		<p class="tc-message">
			No construimos tecnología aislada. Construimos sistemas completos:
			<strong>desde la señal física hasta la decisión humana.</strong>
		</p>
	</div>
</section>

<!-- Sección Productos -->
<section id="productos" class="nexus-section">
	<div class="nexus-head">
		<h2 class="landing-section-title">Nuestros Productos</h2>
		<p class="nx-kicker">Tres productos · tres públicos · tres formas de comprarlos</p>
	</div>

	<ProductShowcase />
</section>

<!-- Sección Servicios. Va DESPUÉS de Productos a propósito: los productos son
     la prueba de lo que esta sección afirma, y el "también" del titular necesita
     que el visitante ya los haya visto para tener antecedente. -->
<section id="servicios" class="sv-bento-section">
	<ServicesBento />
</section>

<!-- La pregunta (pantalla 1 de la experiencia) -->
<QuestionBand />

<!-- Sección ¿Por qué existimos? -->
<section id="existimos" class="existimos-section">
	<div class="existimos-inner">
		<h2 class="existimos-title">¿Por qué existimos?</h2>

		<p class="existimos-text existimos-text-1">
			Porque el mundo genera más señales de las que las personas pueden interpretar.
		</p>

		<div class="existimos-text-columns">
			<p class="existimos-text existimos-text-2">
				Datos, ubicaciones, eventos, movimiento, riesgo y comportamiento ocurren todo el tiempo,
				pero rara vez llegan con suficiente contexto para tomar buenas decisiones.
			</p>

			<p class="existimos-text existimos-text-3">
				<strong>Geminis Labs existe</strong> para transformar esas señales en conocimiento útil: tecnología
				que ayuda a comprender mejor el entorno, proteger lo que importa y actuar con mayor claridad.
			</p>
		</div>

		<div class="existimos-layout">
			<div class="existimos-image-side">
				<img
					src="/img/existimos-white-2.webp"
					alt="Visión de Geminis Labs: Comprender, Proteger, Actuar"
					class="existimos-image"
					loading="lazy"
				/>
			</div>

			<div class="existimos-concepts-side">
				<div class="concept-item">
					<div class="concept-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="1" />
							<path
								d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08 0l4.24 4.24"
							/>
						</svg>
					</div>
					<h3>Comprender</h3>
					<p>Convertir datos dispersos en contexto.</p>
				</div>

				<div class="concept-item">
					<div class="concept-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
					</div>
					<h3>Proteger</h3>
					<p>Detectar señales relevantes antes de que sea tarde.</p>
				</div>

				<div class="concept-item">
					<div class="concept-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
						</svg>
					</div>
					<h3>Actuar</h3>
					<p>Convertir el contexto en decisiones claras.</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Sección El Futuro que Estamos Construyendo -->
<section id="futuro" class="futuro-section">
	<div class="futuro-bg" aria-hidden="true">
		<div class="futuro-orb futuro-orb-1"></div>
		<div class="futuro-orb futuro-orb-2"></div>
		<div class="futuro-orb futuro-orb-3"></div>
		<div class="futuro-noise"></div>
	</div>
	<div class="futuro-content">
		<!-- Video Container with all overlays -->
		<div class="futuro-video-container" use:_futuroReveal use:_near={() => (futuroNear = true)}>
			<!-- Fondo: la red vial real de Querétaro de la experiencia (pantalla 2). Se monta al acercarse. -->
			{#if futuroNear}
				<ExperienceWorld sceneId="queretaro" beat={1} contained lite={isMobile} />
			{/if}
			<div class="futuro-dark-overlay"></div>

			<!-- Title Overlay (top-left) -->
			<div class="futuro-title-overlay">
				<h2 class="landing-section-title futuro-title">El Futuro que Estamos Construyendo</h2>
			</div>

			<!-- Sequential Text Panel (right, over video) -->
			<div class="futuro-text-panel">
				<!-- Counter -->
				<span class="futuro-counter"
					>{String(currentTextIndex + 1).padStart(2, '0')} / {String(futuroTextos.length).padStart(
						2,
						'0'
					)}</span
				>

				<!-- Rotating text -->
				<div class="futuro-text-content">
					{#each futuroTextos as texto, i (i)}
						<div
							class="futuro-text-item"
							class:is-active={currentTextIndex === i}
							class:is-exiting={exitingTextIndex === i}
						>
							<h3 class="futuro-text-title">{texto.title}</h3>
							<p class="futuro-text-desc">{texto.desc}</p>
						</div>
					{/each}
				</div>

				<!-- Progress bar: 6 interactive segments -->
				<div class="futuro-progress-bar" aria-label="Progreso de contenido">
					{#each futuroTextos as _, i (i)}
						<button
							class="futuro-progress-seg"
							class:is-active={currentTextIndex === i}
							on:click={() => {
								currentTextIndex = i;
								futuroProgressKey += 1;
							}}
							aria-label="Ir al elemento {i + 1}"
						>
							{#if currentTextIndex === i}
								<span class="futuro-progress-fill" key={futuroProgressKey}></span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Sección Contacto -->
<section id="contacto" class="contact-section">
	<!-- Fondo: la aurora del cierre de la experiencia (pantalla 15). Se monta al acercarse. -->
	<div class="contact-aurora" aria-hidden="true" use:_near={() => (contactNear = true)}>
		{#if contactNear}
			<ShaderBackground preset={CONTACT_AURORA} contained lite={isMobile} />
		{/if}
	</div>
	<div class="contact-aurora-fade" aria-hidden="true"></div>

	<div class="container">
		<div class="contact-header">
			<div class="contact-mark" aria-hidden="true">
				<span class="contact-mark-halo"></span>
				<img src="/img/geminislabs-nobg.webp" alt="" />
			</div>
			<span class="contact-eyebrow">// INICIA UNA CONVERSACIÓN</span>
			<h2 class="landing-section-title contact-heading">
				De la señal a la decisión<br />— empieza aquí
			</h2>
			<p class="contact-intro">
				Cuéntanos tu proyecto. Nuestro equipo responde en menos de 24 horas.
			</p>
			<p class="contact-built">Construido en Querétaro</p>
		</div>

		<div class="contact-content">
			<div class="contact-info">
				<h3>Información de Contacto</h3>
				<div class="contact-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
						<circle cx="12" cy="10" r="3" />
					</svg>
					<p>Querétaro, Querétaro, México</p>
				</div>
				<div class="contact-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path
							d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
						/>
					</svg>
					<p>+52 442 46 77 127</p>
				</div>
				<div class="contact-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
						<polyline points="22,6 12,13 2,6" />
					</svg>
					<p>contacto@geminislabs.com</p>
				</div>

				<div class="social-links">
					<h4>Síguenos</h4>
					<div class="social-icons">
						<a
							href="https://twitter.com"
							class="social-link"
							aria-label="Síguenos en Twitter"
							target="_blank"
							rel="noopener noreferrer"
						>
							<svg viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
								/>
							</svg>
						</a>
						<a
							href="https://facebook.com"
							class="social-link"
							aria-label="Síguenos en Facebook"
							target="_blank"
							rel="noopener noreferrer"
						>
							<svg viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
								/>
							</svg>
						</a>
						<a
							href="https://linkedin.com"
							class="social-link"
							aria-label="Síguenos en LinkedIn"
							target="_blank"
							rel="noopener noreferrer"
						>
							<svg viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
								/>
							</svg>
						</a>
						<a
							href="https://www.instagram.com/geminislabs_official/"
							class="social-link"
							aria-label="Síguenos en Instagram"
							target="_blank"
							rel="noopener noreferrer"
						>
							<svg viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
								/>
							</svg>
						</a>
					</div>
				</div>
			</div>

			<form class="contact-form" on:submit={handleContactSubmit}>
				<h3>Envíanos un Mensaje</h3>

				{#if submitMessage}
					<div class="form-message" class:success={submitSuccess} class:error={!submitSuccess}>
						{submitMessage}
					</div>
				{/if}

				{#if formErrors.general}
					<div class="form-error general-error">
						{formErrors.general}
					</div>
				{/if}

				<div class="form-row">
					<div class="form-group">
						<input
							type="text"
							placeholder="Nombre completo *"
							bind:value={formData.nombre}
							maxlength="200"
							class:error={formErrors.nombre}
							disabled={isSubmitting}
						/>
						{#if formErrors.nombre}
							<span class="error-text">{formErrors.nombre}</span>
						{/if}
					</div>

					<div class="form-group">
						<input
							type="email"
							placeholder="Correo electrónico"
							bind:value={formData.correo_electronico}
							class:error={formErrors.correo_electronico}
							disabled={isSubmitting}
						/>
						{#if formErrors.correo_electronico}
							<span class="error-text">{formErrors.correo_electronico}</span>
						{/if}
					</div>
				</div>

				<div class="form-group">
					<input
						type="tel"
						placeholder="Teléfono"
						bind:value={formData.telefono}
						class:error={formErrors.telefono}
						disabled={isSubmitting}
					/>
					{#if formErrors.telefono}
						<span class="error-text">{formErrors.telefono}</span>
					{/if}
					<span class="hint-text">Ejemplo: +52 123 456 7890 (7-20 dígitos)</span>
				</div>

				<div class="form-group">
					<textarea
						placeholder="Mensaje *"
						rows="5"
						bind:value={formData.mensaje}
						maxlength="5000"
						class:error={formErrors.mensaje}
						disabled={isSubmitting}></textarea>
					{#if formErrors.mensaje}
						<span class="error-text">{formErrors.mensaje}</span>
					{/if}
					<span class="char-count">{formData.mensaje.length}/5000</span>
				</div>

				<div class="submit-wrapper">
					<button type="submit" class="btn-contact-submit" disabled={isSubmitting}>
						{#if isSubmitting}
							<svg
								class="spin-icon"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<path
									d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
								/>
							</svg>
							Enviando...
						{:else}
							Iniciar conversación
							<span class="btn-arrow" aria-hidden="true">→</span>
						{/if}
					</button>
				</div>

				<p class="form-note">
					* Campos requeridos. Debes proporcionar al menos un correo o teléfono.
				</p>

				{#if recaptchaSiteKey}
					<p class="recaptcha-notice">
						Este sitio está protegido por reCAPTCHA y se aplican la
						<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
							Política de Privacidad
						</a>
						y los
						<a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
							Términos de Servicio
						</a>
						de Google.
					</p>
				{/if}
			</form>
		</div>
	</div>
</section>

<Footer />

<style>
	.form-group {
		position: relative;
		margin-bottom: 1.5rem;
	}
	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.875rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		color: #d8d7cc;
		font-size: 1rem;
		transition: all 0.3s ease;
	}
	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #00a6c0;
		background: rgba(255, 255, 255, 0.08);
	}
	.form-group input:disabled,
	.form-group textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.form-group input.error,
	.form-group textarea.error {
		border-color: #ff4444;
		background: rgba(255, 68, 68, 0.1);
	}

	.error-text {
		display: block;
		color: #ff6b6b;
		font-size: 0.875rem;
		margin-top: 0.5rem;
		font-weight: 500;
	}
	.char-count {
		display: block;
		text-align: right;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.25rem;
	}
	.hint-text {
		display: block;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 0.25rem;
		font-style: italic;
	}

	.form-message {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-weight: 500;
		animation: slideIn 0.3s ease;
	}
	.form-message.success {
		background: rgba(46, 213, 115, 0.1);
		border: 2px solid #2ed573;
		color: #2ed573;
	}
	.form-message.error {
		background: rgba(255, 68, 68, 0.1);
		border: 2px solid #ff4444;
		color: #ff6b6b;
	}

	.form-error.general-error {
		background: rgba(255, 68, 68, 0.1);
		border: 2px solid #ff4444;
		border-radius: 8px;
		padding: 0.875rem;
		margin-bottom: 1.5rem;
		color: #ff6b6b;
		font-weight: 500;
		animation: slideIn 0.3s ease;
	}
	.form-note {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.6);
		text-align: center;
		font-style: italic;
	}
	.recaptcha-notice {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-align: center;
		line-height: 1.4;
	}
	.recaptcha-notice a {
		color: #00a6c0;
		text-decoration: underline;
		transition: color 0.3s ease;
	}
	.recaptcha-notice a:hover {
		color: #d8d7cc;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.form-group input,
		.form-group textarea {
			font-size: 0.9375rem;
		}
		.error-text,
		.form-note {
			font-size: 0.8125rem;
		}
		.char-count,
		.hint-text {
			font-size: 0.6875rem;
		}
	}

	/* ===== LAB SECTION (Laboratorio Tecnológico) ===== */
	.lab-section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: 100vh;
		padding: 0;
		position: relative;
		overflow: hidden;
		background-color: #000000; /* negro total y uniforme */
	}
	/* Ruido sutil sobre el negro */
	.lab-noise {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		opacity: 0.04;
		background-image:
			radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.7) 0.5px, transparent 0.6px),
			radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.7) 0.5px, transparent 0.6px);
		background-size:
			8px 8px,
			11px 11px;
	}
	.lab-head {
		position: relative;
		z-index: 1;
		text-align: center;
		padding: clamp(2rem, 3vw, 3.5rem) 1.5rem 0;
	}
	.lab-section .lab-section-title {
		margin-bottom: 0;
	}
	.lab-section-title .brand {
		font-family: 'Dune Rise', 'Inter', sans-serif;
		font-weight: 400;
	}
	.lab-grid {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0;
		/* aprovecha pantallas ultrawide (34") sin tanto hueco lateral */
		max-width: clamp(1200px, 92vw, 2400px);
		margin: 0 auto;
		padding: clamp(2.5rem, 3.5vw, 5rem) clamp(1.5rem, 3vw, 5rem) clamp(2.5rem, 3vw, 4rem);
	}
	.lab-left {
		flex: 0 0 52%;
		max-width: 52%;
		position: relative;
		z-index: 1;
	}
	/* Panel del título con video de fondo: llega hasta el centro del foco */
	.lab-title-media {
		position: relative;
		display: flex;
		align-items: center;
		/* el alto no supera el 90% del alto del foco (≈498px → 448px) */
		min-height: clamp(340px, 28vw, 448px);
		max-height: 448px;
		border-radius: 18px;
		overflow: hidden;
		padding: 1.6rem 1.8rem;
		cursor: default;
	}
	.lab-title-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 0;
	}
	.lab-title-scrim {
		position: absolute;
		inset: 0;
		z-index: 1;
		background: linear-gradient(135deg, rgba(6, 16, 28, 0.66) 0%, rgba(6, 16, 28, 0.4) 100%);
		transition: opacity 0.5s ease;
	}
	/* En hover: el texto casi se desvanece y se ve el video */
	.lab-title-media:hover .lab-title {
		opacity: 0;
	}
	.lab-title-media:hover .lab-title-scrim {
		opacity: 0.3;
	}
	.lab-right {
		flex: 0 1 32%;
		max-width: 32%;
		margin-left: auto;
		position: relative;
	}
	/* Áreas: fila de badges (acordeón) */
	.lab-areas {
		position: relative;
		z-index: 1;
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		align-items: center;
		gap: clamp(0.75rem, 2vw, 2rem);
		height: 200px; /* altura FIJA: la expansión nunca mueve el layout */
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}
	/* Badge — acordeón: el activo se ensancha con su texto, los demás se atenúan */
	.lab-cap {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		width: 146px;
		text-align: center;
		overflow: hidden;
		transition:
			width 0.45s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.35s ease,
			transform 0.35s ease;
	}
	.lab-cap-icon {
		flex: 0 0 auto;
		width: 86px;
		height: 86px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: #7fe3f5;
		border: 1px solid rgba(127, 227, 245, 0.28);
		background: radial-gradient(circle at 50% 32%, rgba(18, 38, 52, 0.9), rgba(6, 16, 28, 0.95));
		box-shadow:
			inset 0 0 22px rgba(0, 0, 0, 0.55),
			0 0 0 6px rgba(127, 227, 245, 0.04);
		transition: all 0.35s ease;
	}
	.lab-cap-icon svg {
		width: 38px;
		height: 38px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.lab-cap-label {
		font-size: 0.82rem;
		font-weight: 500;
		line-height: 1.3;
		color: #c4d0d6;
		overflow-wrap: break-word;
		transition: opacity 0.25s ease;
	}
	.lab-cap-detail {
		display: none;
		width: 330px; /* ancho fijo: el texto no reflua durante la expansión */
		max-width: 100%;
		flex: 0 0 auto;
	}
	/* Atenuar los no activos */
	.lab-areas.focused .lab-cap.dim {
		opacity: 0.28;
		transform: scale(0.9);
		width: 90px;
	}
	.lab-areas.focused .lab-cap.dim .lab-cap-label {
		opacity: 0;
	}
	/* Badge activo: fila icono + texto */
	.lab-cap.active {
		flex-direction: row;
		align-items: center;
		gap: 1.4rem;
		width: 470px;
		text-align: left;
	}
	.lab-cap.active .lab-cap-icon {
		color: #ffffff;
		border-color: rgba(127, 227, 245, 0.7);
		box-shadow:
			inset 0 0 22px rgba(0, 0, 0, 0.4),
			0 0 26px rgba(52, 208, 192, 0.28);
	}
	.lab-cap.active .lab-cap-label {
		display: none;
	}
	.lab-cap.active .lab-cap-detail {
		display: block;
		animation: detailFade 0.55s ease 0.18s both;
	}
	@keyframes detailFade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.lab-cap-detail h3 {
		margin: 0 0 0.4rem;
		font-size: clamp(1.15rem, 1.5vw, 1.7rem);
		font-weight: 700;
		line-height: 1.2;
		color: #ffffff;
	}
	.lab-cap-detail p {
		margin: 0;
		font-size: clamp(0.95rem, 1vw, 1.15rem);
		line-height: 1.4;
		color: #9fdbe6;
	}
	.lab-cap-detail :global(.brand) {
		font-family: 'Dune Rise', 'Inter', sans-serif;
		font-weight: 400;
	}
	.lab-center {
		flex: 0 0 auto;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: -10%; /* el foco se solapa sobre el panel */
		z-index: 2;
	}
	.lab-bulb {
		display: block;
		width: 100%;
		max-width: 290px;
		height: auto;
		filter: drop-shadow(0 14px 26px rgba(10, 37, 64, 0.16));
		animation: labFloat 8s ease-in-out infinite;
	}
	@keyframes labFloat {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5px);
		}
	}
	.lab-section .lab-title {
		position: relative;
		z-index: 2;
		text-align: left;
		margin-bottom: 0;
		font-size: clamp(2rem, 2.8vw, 4.6rem);
		color: #ffffff;
		-webkit-text-fill-color: #ffffff;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
		transition: opacity 0.5s ease;
		max-width: clamp(330px, 27vw, 660px); /* el texto se mantiene a la izquierda, fuera del foco */
	}
	.lab-lead {
		position: relative;
		z-index: 1;
		font-size: clamp(1.1rem, 1.05vw, 1.5rem);
		line-height: 1.75;
		color: #c4d0d6;
		margin: 0 0 2rem;
	}
	.lab-lead strong {
		color: #ffffff;
		font-weight: 700;
	}

	@media (prefers-reduced-motion: reduce) {
		.lab-bulb {
			animation: none;
		}
	}
	@media (max-width: 900px) {
		.lab-grid {
			flex-direction: column;
			align-items: center;
			text-align: center;
			gap: 2rem;
			padding: 3.5rem 1rem 2.5rem;
		}
		.lab-left,
		.lab-right {
			flex: 1 1 100%;
			max-width: 520px;
		}
		.lab-center {
			margin-left: 0;
		}
		.lab-right {
			margin-left: auto;
			margin-right: auto;
		}
		.lab-section .lab-title {
			text-align: center;
			max-width: none;
		}
		.lab-title-media {
			min-height: auto;
			padding: 2rem 1.5rem;
			border-radius: 14px;
			background: rgba(0, 166, 192, 0.06);
			border: 1px solid rgba(0, 166, 192, 0.15);
		}
		.lab-title-video,
		.lab-title-scrim {
			display: none;
		}
		.lab-bulb {
			max-width: 230px;
		}
		.lab-areas {
			flex-wrap: wrap;
			height: auto;
			gap: 1.5rem 2rem;
		}
		.lab-cap.active {
			width: 100%;
		}
		.lab-cap-detail {
			width: auto;
		}
	}

	/* ============================================================
	   Tecnologías que convergen — pila de ascensión sobre blanco
	   ============================================================ */
	.tc-section {
		display: block;
		background: #eceff2; /* blanco menos brillante */
		position: relative;
		overflow: hidden;
	}
	.tc-inner {
		max-width: clamp(1200px, 92vw, 2400px);
		margin: 0 auto;
		padding-inline: clamp(1.5rem, 3vw, 5rem);
	}
	.tc-head {
		text-align: center;
		margin-bottom: clamp(2.5rem, 4vw, 4rem);
	}
	.tc-section .tc-title {
		background: linear-gradient(90deg, #0a2540, #0883a0);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		color: #0a2540;
		margin-bottom: 0.75rem;
	}
	.tc-subhead {
		color: #475569;
		font-size: clamp(1rem, 1.2vw, 1.35rem);
		margin: 0;
	}

	.tc-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: clamp(2rem, 4vw, 5rem);
		align-items: stretch;
	}

	/* --- columna izquierda: cuadrícula 2×2 de tarjetas --- */
	.tc-layers {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: clamp(1.25rem, 2vw, 2rem);
		align-content: start;
	}

	.tc-layer-item {
		position: relative;
		display: flex;
	}

	/* --- tarjeta de capa --- */
	.tc-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 20px;
		border-left: 3px solid var(--tc-accent);
		padding: clamp(1.75rem, 2.2vw, 2.5rem);
		box-shadow: 0 1px 2px rgba(10, 37, 64, 0.04);
		transition:
			transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
			border-left-color 0.3s ease;
		will-change: transform;
	}
	.tc-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 24px 50px -24px rgba(10, 37, 64, 0.3);
		border-left-color: color-mix(in srgb, var(--tc-accent) 75%, #fff);
	}

	.tc-card-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.tc-icon {
		color: var(--tc-accent);
		display: inline-flex;
		flex-shrink: 0;
	}
	.tc-num {
		font-family: 'Audiowide', sans-serif;
		font-size: clamp(1.5rem, 2vw, 2.4rem);
		line-height: 1;
		color: var(--tc-accent);
		opacity: 0.85;
	}
	.tc-card-title {
		font-size: clamp(1.15rem, 1.5vw, 1.7rem);
		font-weight: 600;
		color: #0f172a;
		margin: 0;
	}
	.tc-card-desc {
		color: #475569;
		font-size: clamp(0.95rem, 1vw, 1.1rem);
		margin: 0 0 1rem;
		line-height: 1.4;
	}

	.tc-chips {
		list-style: none;
		margin: auto 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.tc-chip {
		border: 1px solid #e2e8f0;
		border-radius: 999px;
		background: #f8fafc;
		color: #334155;
		padding: 0.4rem 0.85rem;
		font-size: 0.85rem;
		font-weight: 500;
		transition: border-color 0.3s ease;
	}
	.tc-layer-item:hover .tc-chip {
		border-color: color-mix(in srgb, var(--tc-accent) 55%, #e2e8f0);
	}

	/* --- columna derecha: spine de convergencia --- */
	/* --- mensaje clave --- */
	.tc-message {
		max-width: 60ch;
		margin: clamp(3rem, 5vw, 5rem) auto 0;
		text-align: center;
		font-size: clamp(1.25rem, 2.2vw, 2rem);
		line-height: 1.4;
		color: #0f172a;
	}
	.tc-message strong {
		color: #0883a0;
		font-weight: 700;
	}

	/* ── Sección de servicios ────────────────────────────
	   Banda oscura entre la sección de productos y "¿Por qué existimos?".
	   Era la única sección de la landing sin imagen, sin profundidad y con el
	   mismo gesto de rejilla que "Tecnologías que convergen" tenía encima: por
	   eso se leía vacía aunque el texto estuviera. La ilustración anotada carga
	   ahora ese peso y la rejilla de seis capacidades se fue a /servicios. */
	/* Segunda luz, muy tenue, que deriva despacio por detrás de la escena: da
	   profundidad sin que se lea como una animación. */
	@keyframes svDeriva {
		from {
			transform: translate3d(-3%, 2%, 0) scale(1);
		}
		to {
			transform: translate3d(4%, -3%, 0) scale(1.12);
		}
	}
	/* El texto va por encima de la escena, que se le mete por debajo. */
	/* Prueba sin adjetivos ni cifras: un inventario verificable de lo que ya
	   existe. Funciona aquí porque los productos acaban de pasar por pantalla. */

	/* Riel de proceso: es una secuencia real, por eso lleva flechas. */

	/* ── La escena y sus etiquetas ─────────────────────── */
	/* La ilustración lleva canal alfa: su fondo se eliminó del archivo, derivando
	   la transparencia de la luminancia contra un modelo del propio degradado de
	   fondo. Por eso no necesita máscara ni que la sección le iguale el color:
	   simplemente no hay rectángulo. */
	/* El pin cubre todo el marco en vez de ser un punto de tamaño cero: los
	   porcentajes se resuelven contra la altura del contenedor, y con un
	   contenedor de altura 0 se resolvían contra 0. */
	/* El anillo abre la guía arriba, junto al rótulo; la línea baja de ahí hasta
	   el punto de la ilustración y se desvanece al llegar, sin marcarlo con un
	   punto. */
	/* El rótulo cuelga a la derecha de la línea, alineado a la izquierda: la guía
	   queda siempre al costado del texto y nunca lo cruza. */
	/* Un pulso de señal baja por cada guía, del rótulo al dibujo. No es adorno:
	   es lo que hace la plataforma —telemetría que viaja del dispositivo al
	   panel— y repite el ritmo de las trazas de la propia ilustración. Los
	   retardos van escalonados para que se lea como una cadena, no como cinco
	   cosas parpadeando a la vez. */
	@keyframes svFlujo {
		0% {
			top: -26%;
			opacity: 0;
		}
		14% {
			opacity: 1;
		}
		78% {
			opacity: 1;
		}
		100% {
			top: 100%;
			opacity: 0;
		}
	}
	/* Latido del anillo, en fase con el pulso que sale de él. */
	@keyframes svLatido {
		0% {
			transform: scale(0.5);
			opacity: 0.75;
		}
		55% {
			transform: scale(2.1);
			opacity: 0;
		}
		100% {
			transform: scale(2.1);
			opacity: 0;
		}
	}

	/* En pantallas anchas la leyenda es redundante: las etiquetas ya están sobre
	   la imagen. Se conserva para lectores de pantalla y para el móvil. */

	@media (max-width: 1280px) {
		/* Etiquetas fuera: sobre una imagen pequeña se pisan y no se leen. El
		   mismo contenido pasa a leerse como lista debajo. */
	}

	/* --- scroll-reveal (solo opacity/transform) ---
	   La clase .tc-reveal se aplica imperativamente vía JS (use:_reveal),
	   por eso se marca :global para que el compilador no la considere sin uso. */

	/* ≥768px hasta <1024px: cuadrícula 2×2 con el spine arriba como banner */
	@media (max-width: 1023px) {
		.tc-layers {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/* ≤767px: una sola columna de tarjetas, sin spine video */
	@media (max-width: 767px) {
		.tc-layers {
			grid-template-columns: 1fr;
		}
		.tc-num {
			font-size: clamp(1.3rem, 6vw, 1.8rem);
		}
		.tc-message {
			margin-top: 2rem;
			font-size: clamp(1.15rem, 5vw, 1.5rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tc-card,
		.tc-chip {
			transition: none;
		}
		.tc-card:hover {
			transform: none;
		}
	}

	/* Cómo fluye un evento (diagrama de ingeniería de la experiencia) */
	.tc-flow {
		margin-top: clamp(2rem, 4vw, 3.5rem);
		padding: clamp(1.2rem, 2.5vw, 2rem);
		border-radius: 24px;
		background:
			radial-gradient(ellipse 60% 70% at 50% 50%, rgba(0, 120, 140, 0.16), transparent 70%), #061019;
		box-shadow: 0 30px 70px rgba(6, 16, 25, 0.25);
	}
	.tc-flow-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem 1.5rem;
		margin-bottom: 0.6rem;
	}
	.tc-flow-kicker {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #00ff88;
	}
	.tc-flow-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.2rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.82rem;
		color: #94b5d0;
	}
	.tc-flow-legend li {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}
	.tc-flow-legend i {
		width: 22px;
		border-top: 2px solid #86f0dd;
	}
	.tc-flow-canvas {
		min-height: 220px;
	}

	/* ===== BTN-PRODUCT-CTA ===== */

	/* ===== CAPABILITIES SECTION ===== */

	/* ===== BUSINESS MODELS SECTION ===== */

	/* ===== DIFFERENTIATORS (Quiénes Somos) ===== */

	/* ===== EXISTIMOS SECTION ===== */
	.existimos-section {
		padding: 6rem 0;
		background: linear-gradient(180deg, #eceff2 0%, #f5f7f9 100%);
		position: relative;
	}

	.existimos-inner {
		max-width: 1380px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.existimos-title {
		font-size: 2.5rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 3rem;
		text-align: center;
		letter-spacing: -0.01em;
		line-height: 1.3;
	}

	.existimos-text {
		font-size: 1.125rem;
		color: #4a4a4a;
		line-height: 1.7;
		font-weight: 400;
	}

	.existimos-text-1 {
		font-size: 1.5rem;
		font-weight: 500;
		color: #2a2a2a;
		margin: 0 0 3.5rem;
		letter-spacing: -0.01em;
		text-align: center;
		max-width: 100%;
		padding: 0 2rem;
	}

	.existimos-text-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		margin: 0 0 4rem;
		max-width: 1100px;
		margin-left: auto;
		margin-right: auto;
		padding: 0 2rem;
	}

	.existimos-text-2,
	.existimos-text-3 {
		text-align: left;
		max-width: 100%;
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.75;
	}

	.existimos-text-2 {
		color: #4a4a4a;
	}

	.existimos-text-3 {
		color: #4a4a4a;
	}

	.existimos-text-3 strong {
		color: #1a1a1a;
		font-weight: 600;
		background: linear-gradient(135deg, #007a5c 0%, #005a47 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.existimos-layout {
		position: relative;
		display: grid;
		grid-template-columns: 1.4fr 0.85fr;
		gap: 2.5rem;
		align-items: stretch;
		min-height: auto;
		overflow: visible;
	}

	.existimos-image-side {
		position: relative;
		border-radius: 12px;
		box-shadow: 0 12px 32px rgba(0, 168, 120, 0.08);
		overflow: hidden;
		transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.existimos-image-side::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 12px;
		background:
			radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
			radial-gradient(circle at 85% 85%, rgba(0, 168, 120, 0.08) 0%, transparent 60%);
		pointer-events: none;
		z-index: 2;
		transition: all 500ms ease;
	}

	.existimos-image-side:hover::after {
		background:
			radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.25) 0%, transparent 50%),
			radial-gradient(circle at 85% 85%, rgba(0, 168, 120, 0.12) 0%, transparent 60%);
	}

	.existimos-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		border-radius: 12px;
		position: relative;
		z-index: 1;
	}

	.existimos-concepts-side {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: 0.75rem;
		position: relative;
		z-index: 10;
		padding-left: 0;
	}

	.concept-item {
		flex: 1;
		padding: 1.2rem 1.2rem 1.2rem 1.5rem;
		display: flex;
		flex-direction: column;
		justify-content: center;

		background: white;
		border-radius: 8px;
		border-left: 3px solid transparent;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	.concept-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background: #007a5c;
		border-radius: 8px 0 0 8px;
		opacity: 0;
		transition: opacity 300ms ease;
	}

	.concept-item:hover {
		box-shadow: 0 8px 24px rgba(0, 168, 120, 0.12);
		transform: translateY(-2px);
		background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(0, 168, 120, 0.02) 100%);
	}

	.concept-item:hover::before {
		opacity: 1;
	}

	.concept-icon {
		width: 38px;
		height: 38px;
		margin: 0 0 0.6rem 0;
		color: #007a5c;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.concept-icon svg {
		width: 100%;
		height: 100%;
		stroke-width: 2;
	}

	.concept-item:hover .concept-icon {
		transform: scale(1.08) rotateZ(5deg);
		filter: drop-shadow(0 4px 12px rgba(0, 168, 120, 0.3));
	}

	.concept-item h3 {
		font-size: 1rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 0.4rem 0;
		letter-spacing: 0.01em;
		transition: color 300ms ease;
	}

	.concept-item:hover h3 {
		color: #007a5c;
	}

	.concept-item p {
		font-size: 0.85rem;
		color: #5a5a5a;
		line-height: 1.4;
		margin: 0;
		font-weight: 400;
		transition: color 300ms ease;
	}

	.concept-item:hover p {
		color: #4a4a4a;
	}

	@media (max-width: 1024px) {
		.existimos-section {
			padding: 5rem 0;
		}

		.existimos-text-columns {
			grid-template-columns: 1fr;
			gap: 2rem;
			margin: 0 0 3rem;
		}

		.existimos-layout {
			grid-template-columns: 1fr;
			gap: 2rem;
			min-height: auto;
			overflow: visible;
		}

		.existimos-title {
			font-size: 2.5rem;
		}

		.existimos-text-1 {
			font-size: 1.35rem;
			margin-bottom: 2.5rem;
		}
	}

	@media (max-width: 768px) {
		.existimos-section {
			padding: 4rem 0;
		}

		.existimos-inner {
			padding: 0 1.5rem;
		}

		.existimos-title {
			font-size: 2rem;
			margin-bottom: 1.5rem;
		}

		.existimos-text-1 {
			font-size: 1.2rem;
			margin-bottom: 2rem;
			padding: 0 1rem;
		}

		.existimos-text-columns {
			padding: 0 1rem;
			gap: 2rem;
		}

		.existimos-text-2,
		.existimos-text-3 {
			font-size: 0.95rem;
		}

		.existimos-layout {
			min-height: auto;
		}

		.concept-item {
			padding: 1.5rem 1.5rem 1.5rem 2rem;
		}

		.concept-item h3 {
			font-size: 1.05rem;
		}

		.concept-item p {
			font-size: 0.9rem;
		}
	}

	@media (max-width: 640px) {
		.existimos-section {
			padding: 3.5rem 0;
		}

		.existimos-inner {
			padding: 0 1rem;
		}

		.existimos-title {
			font-size: 1.75rem;
			margin-bottom: 1rem;
		}

		.existimos-text-1 {
			font-size: 1.05rem;
			margin-bottom: 1.5rem;
			padding: 0;
		}

		.existimos-text-columns {
			grid-template-columns: 1fr;
			gap: 1.5rem;
			padding: 0;
		}

		.existimos-text-2,
		.existimos-text-3 {
			font-size: 0.9rem;
		}

		.existimos-layout {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.concept-item {
			padding: 1.25rem 1.25rem 1.25rem 1.75rem;
		}

		.concept-item h3 {
			font-size: 0.95rem;
		}

		.concept-item p {
			font-size: 0.85rem;
		}

		.concept-icon {
			width: 40px;
			height: 40px;
			margin-bottom: 0.75rem;
		}
	}

	/* ===== VISION SECTION ===== */

	/* ═══════════════════════════════════════════════════
	   SISTEMA VISUAL GLASS — REDISEÑO COMPLETO
	   ═══════════════════════════════════════════════════ */

	/* Fondo de página global */
	:global(body) {
		background: #071628 !important;
		background-image:
			radial-gradient(ellipse 90% 60% at 10% 5%, rgba(0, 166, 192, 0.22) 0%, transparent 50%),
			radial-gradient(ellipse 70% 50% at 90% 70%, rgba(59, 91, 219, 0.2) 0%, transparent 50%),
			radial-gradient(ellipse 60% 70% at 50% 45%, rgba(14, 165, 233, 0.1) 0%, transparent 65%) !important;
	}

	/* Canvas decorativo fijo */
	.page-canvas {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(70px);
		animation: orb-drift 24s ease-in-out infinite;
	}
	.orb-1 {
		width: 800px;
		height: 800px;
		top: -300px;
		left: -250px;
		background: radial-gradient(circle, rgba(0, 166, 192, 0.32) 0%, transparent 65%);
		animation-duration: 28s;
	}
	.orb-2 {
		width: 650px;
		height: 650px;
		top: 20%;
		right: -180px;
		background: radial-gradient(circle, rgba(59, 91, 219, 0.28) 0%, transparent 65%);
		animation-duration: 34s;
		animation-delay: -12s;
	}
	.orb-3 {
		width: 500px;
		height: 500px;
		bottom: 25%;
		left: 10%;
		background: radial-gradient(circle, rgba(14, 165, 233, 0.22) 0%, transparent 65%);
		animation-duration: 26s;
		animation-delay: -6s;
	}
	.orb-4 {
		width: 400px;
		height: 400px;
		bottom: 5%;
		right: 15%;
		background: radial-gradient(circle, rgba(0, 210, 200, 0.2) 0%, transparent 65%);
		animation-duration: 20s;
		animation-delay: -18s;
	}
	@keyframes orb-drift {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		25% {
			transform: translate(35px, -45px) scale(1.06);
		}
		50% {
			transform: translate(-25px, 35px) scale(0.94);
		}
		75% {
			transform: translate(45px, 25px) scale(1.03);
		}
	}

	.grid-lines {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(0, 166, 192, 0.025) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0, 166, 192, 0.025) 1px, transparent 1px);
		background-size: 64px 64px;
		mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%);
		-webkit-mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%);
	}

	/* Todas las secciones encima del canvas */
	section {
		position: relative;
		z-index: 1;
	}

	/* Separadores entre secciones */

	/* Fondos de sección */
	:global(.about-section .container) {
		background: transparent !important;
	}
	:global(.contact-section) {
		padding: 8rem 0 6rem !important;
		background: transparent !important;
		position: relative !important;
		isolation: isolate !important;
		overflow: hidden !important;
	}

	/* ── Tarjetas Ecosystem ──────────────────────────── */

	/* ── Nexus sin video ─────────────────────────────── */

	/* ── Orion sin video planeta ─────────────────────── */

	/* ── Capacidades glass ───────────────────────────── */

	/* ── Modelos comerciales glass ───────────────────── */

	/* ── Future cards glass ──────────────────────────── */

	/* ── Quiénes somos ───────────────────────────────── */

	/* ── Visión glass container ──────────────────────── */

	/* ── Contacto glass ──────────────────────────────── */
	:global(.contact-form) {
		background: rgba(8, 13, 24, 0.55) !important;
		backdrop-filter: blur(28px) saturate(180%) !important;
		-webkit-backdrop-filter: blur(28px) saturate(180%) !important;
		border: 1px solid rgba(255, 255, 255, 0.1) !important;
		border-top: 1px solid rgba(0, 166, 192, 0.4) !important;
		border-radius: 24px !important;
		padding: 2.5rem !important;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(0, 166, 192, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
		transition: box-shadow 0.3s ease !important;
	}
	:global(.contact-form:focus-within) {
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.45),
			0 0 40px rgba(0, 166, 192, 0.08),
			inset 0 1px 0 rgba(0, 166, 192, 0.12) !important;
	}
	:global(.contact-info) {
		background: rgba(8, 13, 24, 0.5) !important;
		backdrop-filter: blur(20px) !important;
		-webkit-backdrop-filter: blur(20px) !important;
		border: 1px solid rgba(255, 255, 255, 0.09) !important;
		border-top: 1px solid rgba(0, 166, 192, 0.3) !important;
		border-radius: 20px !important;
		padding: 2.5rem !important;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
	}

	/* ── Tech showcase (Quiénes Somos visual) ────────── */

	/* ── Overrides agresivos contra fondos oscuros del CSS global ── */
	:global(.about-section .container) {
		background: transparent !important;
	}
	:global(.contact-section) {
		background: transparent !important;
	}
	:global(.contact-section .container) {
		background: transparent !important;
	}

	/* ── Contacto: elementos decorativos y header ────── */
	/* Línea superior divisora */
	:global(.contact-section)::before {
		content: '';
		position: absolute;
		top: 0;
		left: 10%;
		right: 10%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(0, 166, 192, 0.35) 30%,
			rgba(0, 166, 192, 0.6) 50%,
			rgba(0, 166, 192, 0.35) 70%,
			transparent 100%
		);
		z-index: 1;
	}
	.contact-aurora {
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
	}
	/* Funde la aurora con la sección anterior y oscurece detrás del formulario. */
	.contact-aurora-fade {
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		background:
			linear-gradient(
				180deg,
				#0b1220 0%,
				rgba(11, 18, 32, 0) 24%,
				rgba(11, 18, 32, 0) 72%,
				#0b1220 100%
			),
			radial-gradient(ellipse 45% 22% at 50% 22%, rgba(3, 10, 7, 0.7), transparent 80%),
			radial-gradient(ellipse 60% 45% at 50% 68%, rgba(3, 10, 7, 0.5), transparent 75%);
	}
	.contact-header {
		text-align: center;
		margin-bottom: 4rem;
	}
	.contact-mark {
		position: relative;
		width: 96px;
		height: 96px;
		margin: 0 auto 1.4rem;
	}
	.contact-mark img {
		position: relative;
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 0 18px rgba(120, 255, 170, 0.45));
	}
	.contact-mark-halo {
		position: absolute;
		inset: -60%;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(62, 193, 40, 0.35), transparent 65%);
		animation: contact-halo 4s ease-in-out infinite alternate;
	}
	@keyframes contact-halo {
		to {
			transform: scale(1.12);
			opacity: 0.7;
		}
	}
	.contact-built {
		margin: 1rem 0 0;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #c9a74a;
	}
	@media (prefers-reduced-motion: reduce) {
		.contact-mark-halo {
			animation: none;
		}
	}
	.contact-eyebrow {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #00a6c0;
		margin-bottom: 1.25rem;
		border-left: 2px solid #00a6c0;
		padding-left: 0.75rem;
	}
	.contact-heading {
		font-size: clamp(2rem, 4vw, 3.2rem) !important;
		margin-bottom: 1rem !important;
	}
	.contact-intro {
		font-size: 1.05rem;
		color: rgba(216, 215, 204, 0.7);
		max-width: 480px;
		margin: 0 auto;
		line-height: 1.6;
	}

	/* ── Fila doble nombre + correo ────────────────── */
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 600px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	/* ── Botón submit mejorado ─────────────────────── */
	.btn-contact-submit {
		width: 100%;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #00a6c0 0%, #0086a0 100%);
		color: #fff;
		font-family: inherit;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		position: relative;
		overflow: hidden;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		box-shadow:
			0 4px 20px rgba(0, 166, 192, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.18);
	}
	.btn-contact-submit:hover:not(:disabled) {
		background: linear-gradient(135deg, #00c0dd 0%, #00a6c0 100%);
		transform: translateY(-2px);
		box-shadow:
			0 8px 32px rgba(0, 166, 192, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.22);
	}
	.btn-contact-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
	/* Shimmer sweep en hover */
	.btn-contact-submit::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 60%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.14) 50%,
			transparent 100%
		);
		transform: skewX(-20deg);
		transition: left 0.5s ease;
		pointer-events: none;
	}
	.btn-contact-submit:hover::after {
		left: 160%;
	}
	.btn-arrow {
		font-size: 1.1rem;
		transition: transform 0.2s ease;
	}
	.btn-contact-submit:hover .btn-arrow {
		transform: translateX(4px);
	}
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	.spin-icon {
		width: 18px;
		height: 18px;
		animation: spin 1s linear infinite;
	}

	/* ── Inputs mejorados: focus con glow cyan ──────── */
	.form-group input:focus,
	.form-group textarea:focus {
		border-color: rgba(0, 166, 192, 0.6) !important;
		background: rgba(0, 166, 192, 0.06) !important;
		box-shadow:
			0 0 0 3px rgba(0, 166, 192, 0.1),
			0 4px 16px rgba(0, 166, 192, 0.12) !important;
	}
	.form-group input,
	.form-group textarea {
		background: rgba(8, 13, 24, 0.6) !important;
		caret-color: #00a6c0;
	}

	/* Responsive — ocultar orbes en mobile para perf */
	@media (max-width: 768px) {
		.orb-3,
		.orb-4 {
			display: none;
		}
		.orb-1,
		.orb-2 {
			filter: blur(60px);
		}
	}

	/* ── Hero partículas ─────────────────────────────────── */
	.hero-particle-section {
		position: relative;
		width: 100%;
		min-height: 100vh;
		overflow: hidden;
		background-image: url('/img/deepspace.webp');
		background-size: cover;
		background-position: center center;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.hero-bg-video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center center;
		z-index: 0;
		pointer-events: none;
		opacity: 0; /* HeroGlitch canvas maneja el display */
	}

	/* Gradiente izquierda → legibilidad del texto */
	.hero-video-fade {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		background: linear-gradient(
			to right,
			rgba(0, 0, 0, 0.82) 0%,
			rgba(0, 0, 0, 0.55) 32%,
			rgba(0, 0, 0, 0.18) 58%,
			transparent 100%
		);
		z-index: 2;
		pointer-events: none;
	}

	/* Viñeta radial para enfocar la atención */
	.hero-vignette {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		background: radial-gradient(
			ellipse 110% 100% at 50% 50%,
			transparent 40%,
			rgba(0, 0, 0, 0.55) 100%
		);
	}

	/* Scanlines — textura CRT sutil */
	.hero-scanlines {
		position: absolute;
		inset: 0;
		z-index: 4;
		pointer-events: none;
		background: repeating-linear-gradient(
			0deg,
			transparent 0px,
			transparent 3px,
			rgba(0, 0, 0, 0.06) 3px,
			rgba(0, 0, 0, 0.06) 4px
		);
	}

	/* Resplandor verde suave en el lado del logo */
	.hero-right-glow {
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
		width: 55%;
		z-index: 2;
		pointer-events: none;
		background: radial-gradient(
			ellipse at 78% 44%,
			rgba(0, 255, 140, 0.07) 0%,
			rgba(0, 200, 255, 0.04) 35%,
			transparent 65%
		);
		animation: rightGlowPulse 4s ease-in-out infinite;
	}
	@keyframes rightGlowPulse {
		0%,
		100% {
			opacity: 0.8;
		}
		50% {
			opacity: 1;
		}
	}

	.hero-video-bottom-fade {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 25%;
		width: 100%;
		background: linear-gradient(to top, #000000 65%, transparent 100%);
		z-index: 2;
		pointer-events: none;
	}

	.hero-text-overlay {
		position: relative;
		z-index: 10;
		width: 100%;
		text-align: left;
		padding: 0 5vw 4vh;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.1rem;
		pointer-events: none;
	}

	.hero-text-overlay a {
		pointer-events: all;
	}

	/* Etiqueta pequeña tipo código sobre el título */
	.hero-label {
		font-family: 'Courier New', 'Consolas', monospace;
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		color: rgba(0, 255, 150, 0.65);
		text-transform: uppercase;
		animation: heroLabelFlicker 5s ease-in-out infinite;
	}
	@keyframes heroLabelFlicker {
		0%,
		89%,
		91%,
		93%,
		100% {
			opacity: 0.65;
		}
		90%,
		92% {
			opacity: 0.2;
		}
	}

	.hero-particle-buttons {
		display: flex;
		gap: 1.25rem;
		flex-wrap: wrap;
		justify-content: flex-end;
		width: 100%;
		margin-top: 0.25rem;
	}

	/* ── Hero móvil: solo logo centrado ──────────────────────── */
	.hero-mobile-logo {
		display: none; /* oculto en desktop */
	}

	@media (max-width: 600px) {
		/* Ocultar todas las capas animadas y el canvas de título */
		.hero-bg-video,
		.hero-vignette,
		.hero-video-fade,
		.hero-video-bottom-fade,
		.hero-scanlines,
		.hero-right-glow,
		.hero-text-overlay {
			display: none !important;
		}

		/* Logo centrado */
		.hero-mobile-logo {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 1rem;
			position: absolute;
			inset: 0;
			z-index: 10;
		}

		.hero-mobile-logo-img {
			width: 72px;
			height: 72px;
			object-fit: contain;
			filter: drop-shadow(0 0 18px rgba(0, 166, 192, 0.55));
		}

		.hero-mobile-logo-text {
			font-family: 'Audiowide', sans-serif;
			font-size: 1.35rem;
			letter-spacing: 0.12em;
			color: #ffffff;
			text-shadow: 0 0 24px rgba(0, 166, 192, 0.4);
		}
	}

	/* ── NEXUS PRODUCT SECTION ──────────────────────────────────── */
	/* Servicios en bento: mismo fondo claro que los productos, para leerse como continuación. */
	.sv-bento-section {
		display: block;
		min-height: 0;
		padding: clamp(3rem, 6vw, 5.5rem) 0;
		background: #eceff2;
	}

	.nexus-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: clamp(2rem, 4vw, 3.5rem);
		position: relative;
		overflow: hidden;
		background: #eceff2;
	}
	.nexus-head {
		position: relative;
		z-index: 1;
		text-align: center;
	}
	/* Título en fondo blanco: gradiente oscuro para contraste */
	.nexus-section .landing-section-title {
		background: linear-gradient(90deg, #0a2540, #0883a0);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		color: #0a2540;
	}

	/* Kicker: dice explícitamente cuántos productos hay, para quien escanea */
	.nx-kicker {
		font-family: 'Audiowide', system-ui, sans-serif;
		font-size: 0.72rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		/* 0.55 daba ~4.3:1 sobre #eceff2 a 0.72rem: fallo de AA. */
		color: rgba(10, 37, 64, 0.7);
		margin: 0.5rem 0 0;
	}

	/* ── RAIL DE CÁMARAS ─────────────────────────────────────────
	   Las tres marcas visibles a la vez. Cada celda es una cámara sellada:
	   misma materia de fondo en las tres, y solo cambia la temperatura del
	   foco (--lite) — el ojo lee "la misma sala iluminada distinto", no
	   "fondos de colores". Profundidad con degradado + viñeta, sin fotos. */
	/* Grano: sin él, un degradado tenue sobre casi-negro produce banding
	   visible en pantallas de 8 bits y la cámara se ve barata. */

	/* Temperatura de luz por producto. Orion no tiene croma en su marca, así
	   que compensa con intensidad: su cámara es la más luminosa de las tres. */

	/* Normalización por masa óptica, no por caja: los tres logos tienen
	   ratios distintos (0.96 / 0.83 / 0.69) y alinearlos por ancho los
	   descuadra. Se controla la altura y la marca densa encoge. */
	/* El "para quién". El rail es lo único que un visitante lee de los tres
	   productos a la vez, así que sin esto la comparación se queda en qué hace
	   cada uno y no en cuál es el suyo. */

	/* Estados. Se atenúa la croma de las marcas inactivas lo justo para que el
	   verde de Nexus y el rojo de Signum no vibren entre sí, sin apagarlas. */
	/* Barra de acento inferior */

	/* Shell: centra la tarjeta + reveal de scroll */
	/* La tarjeta de "El futuro que estamos construyendo" queda fija en 1280px
	   (su aspect-ratio 16/9 deriva el ancho de una altura acotada), así que
	   aquí se replica ese ancho útil: 1280 + 2rem de padding a cada lado.
	   Antes llegaba a 2400px y en monitores grandes se desparramaba. */
	/* Tarjeta-marco (el fondo cambia según el producto) */
	/* Capa de fondo (parallax con el mouse) — sobredimensionada para no revelar bordes */
	/* Tema Nexus (grafito-teal + verde) */
	/* Tema Orion (negro mate + plata) */
	/* Tema Signum (negro cálido + acero y rojo).
	   Los tres negros se separan por matiz, no por luminancia: grafito-cian en
	   Nexus, neutro puro en Orion, cálido-rojo aquí. El fondo se genera con CSS
	   —misma receta de cámara del rail, a escala— para no bloquear el lanzamiento
	   a la espera de una fotografía. */
	/* Ruido (noise.png) sobre el fondo */
	/* Pila de paneles: ambos en la misma celda → altura estable, crossfade */

	/* Acentos Orion (plata) */

	/* Acentos Signum (acero + rojo).
	   El rojo de marca #b5121b da 2.7:1 sobre este fondo, así que solo se usa
	   como relleno y borde; para texto va #e8565a (5.3:1), que es el mismo
	   token que Signum ya usa en su propio sistema. */
	/* A opacidad .9 sobre el fondo rojo daba 4.49:1, justo por debajo de AA.
	   A plena opacidad sube a 5.27:1. */
	/* Rojo para características, acero para casos de uso: reproduce en la UI la
	   construcción bimaterial del logotipo. */
	/* Fondo más opaco que el resto para que el trazo del ECG pase por detrás
	   del chip y no cruce el texto. */
	/* El hover oscurece en vez de aclarar: #d62f32 con texto blanco da 4.9:1 y
	   aclarar más rompería AA. */

	/* Partículas de Orion: fluyen de la esquina inferior izquierda hacia el logo */
	@keyframes orionDrift {
		0% {
			transform: translate(calc(-50% + var(--sx)), calc(-50% + var(--sy))) scale(0.5);
			opacity: 0;
		}
		14% {
			opacity: var(--o, 0.7);
		}
		82% {
			opacity: calc(var(--o, 0.7) * 0.55);
		}
		100% {
			transform: translate(-50%, -50%) scale(1.05);
			opacity: 0;
		}
	}

	/* Left content */
	/* El oneLiner: responde "¿qué es?" antes de que el visitante decida seguir
	   leyendo. Sustituye al subtítulo de 45 palabras que nadie leía. */
	/* El problema: deja que el visitante se autoseleccione. Va deliberadamente
	   más callado que el oneLiner — es la segunda pregunta, no la primera. */

	/* Los tres pasos: "¿y yo qué tengo que hacer?". Es una secuencia real, así
	   que va numerada; los doce chips que había antes no lo eran. */

	/* Banda de contratación */
	/* Auto-fit con mínimo: Nexus reparte tres columnas, Orion dos y Signum una
	   sin que ninguna quede huérfana estirándose sobre espacio muerto. */
	/* El acrónimo técnico vive aquí y solo aquí: el gancho comercial es
	   `.nx-model-label`. Las tres modalidades de Nexus son SaaS, así que
	   etiquetar solo a Connect como tal se leería impreciso. */

	/* Ruta al público B2B sin robarle protagonismo al CTA principal. */

	/* Electrocardiograma de Signum: se dibuja de izquierda a derecha detrás de
	   la banda de contratación y se desvanece. Anima stroke-dashoffset sobre un único trazo,
	   así que no provoca reflow. */
	/* Altura fija y centrada: si se estira a todo el alto del bloque, el
	   preserveAspectRatio="none" deforma los picos y deja de leerse como un
	   trazo de monitor. */
	/* Los chips van por encima del trazo */
	@keyframes sgEcg {
		0% {
			stroke-dashoffset: 1400;
			opacity: 0;
		}
		8% {
			opacity: 0.7;
		}
		70% {
			stroke-dashoffset: 0;
			opacity: 0.7;
		}
		92% {
			stroke-dashoffset: 0;
			opacity: 0;
		}
		100% {
			stroke-dashoffset: 0;
			opacity: 0;
		}
	}

	/* CTA */

	/* Right stage */

	@keyframes nexusHaloPulse {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
	}

	/* Tablet: single column, stage above content */
	@media (max-width: 1023px) {
		.nexus-section {
			min-height: auto;
			align-items: flex-start;
			padding: 4rem 0;
		}
	}

	/* Mobile */
	@media (max-width: 639px) {
		.nexus-section {
			padding: 3.5rem 0;
		}

		/* Las tres celdas siguen en fila y siempre visibles: un carril con
		   scroll volvería a esconder productos, que es lo que resolvemos.
		   Cabe recortando el descriptor y colapsando el badge a un punto. */
	}

	/* Reduced motion */

	/* ── Futuro Section ─────────────────────────────────────── */
	.futuro-section {
		background: #0b1220;
		padding: 5rem 0 6rem;
		position: relative;
		overflow: hidden;
	}

	/* Background: orbs + noise */
	.futuro-bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
	}

	.futuro-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
	}

	.futuro-orb-1 {
		width: 700px;
		height: 700px;
		top: -200px;
		left: -150px;
		background: radial-gradient(circle, rgba(0, 166, 192, 0.22) 0%, transparent 65%);
		animation: futuro-drift-1 22s ease-in-out infinite;
	}

	.futuro-orb-2 {
		width: 500px;
		height: 500px;
		bottom: -100px;
		right: -80px;
		background: radial-gradient(circle, rgba(33, 230, 140, 0.14) 0%, transparent 65%);
		animation: futuro-drift-2 28s ease-in-out infinite;
		animation-delay: -10s;
	}

	.futuro-orb-3 {
		width: 400px;
		height: 400px;
		top: 40%;
		left: 40%;
		background: radial-gradient(circle, rgba(59, 91, 219, 0.12) 0%, transparent 65%);
		animation: futuro-drift-1 34s ease-in-out infinite reverse;
		animation-delay: -18s;
	}

	@keyframes futuro-drift-1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(40px, -50px) scale(1.07);
		}
		66% {
			transform: translate(-30px, 40px) scale(0.93);
		}
	}

	@keyframes futuro-drift-2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		40% {
			transform: translate(-50px, 30px) scale(1.05);
		}
		70% {
			transform: translate(35px, -40px) scale(0.96);
		}
	}

	.futuro-noise {
		position: absolute;
		inset: 0;
		background-image: url('/img/noise.webp');
		background-repeat: repeat;
		background-size: 180px 180px;
		opacity: 0.045;
		mix-blend-mode: overlay;
	}

	.futuro-content {
		position: relative;
		z-index: 1;
		/* Sin video que le dé tamaño, el ancho tiene que ser explícito. */
		width: 100%;
		box-sizing: border-box;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.futuro-video-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5);
		animation: futuroReveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
	}

	@keyframes futuroReveal {
		from {
			opacity: 0;
			transform: translateY(24px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Dark Overlay: vignette perimetral + gradiente derecho denso + tono de marca */
	.futuro-dark-overlay {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.55) 100%),
			linear-gradient(
				to left,
				rgba(0, 15, 25, 0.78) 0%,
				rgba(0, 15, 25, 0.12) 50%,
				transparent 65%
			),
			linear-gradient(135deg, rgba(0, 30, 40, 0.45) 0%, transparent 45%),
			linear-gradient(to bottom, rgba(0, 0, 0, 0.25) 0%, transparent 18%);
		pointer-events: none;
		z-index: 1;
		transition: background-color 1.5s ease;
	}

	/* Title Overlay – top-left */
	.futuro-title-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 55%;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.5rem;
		padding: 3.5rem 3rem;
		z-index: 4;
		pointer-events: none;
	}

	.futuro-title {
		font-size: clamp(1.8rem, 3.5vw, 3rem);
		font-weight: 700;
		letter-spacing: -0.5px;
		margin: 0;
		color: #ffffff;
		text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
		line-height: 1.15;
		border-left: 3px solid #00a6c0;
		padding-left: 1rem;
	}

	/* Text Panel – right side, over video */
	.futuro-text-panel {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 45%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 3rem;
		z-index: 4;
		border-left: 1px solid rgba(0, 166, 192, 0.2);
	}

	.futuro-counter {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.4);
		margin-bottom: 1.25rem;
		font-variant-numeric: tabular-nums;
	}

	.futuro-text-content {
		position: relative;
		min-height: 160px;
	}

	.futuro-text-item {
		position: absolute;
		width: 100%;
		opacity: 0;
		transform: translateY(12px);
		transition:
			opacity 0.5s ease,
			transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
		pointer-events: none;
	}

	.futuro-text-item.is-active {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
	}

	.futuro-text-item.is-exiting {
		opacity: 0;
		transform: translateY(-12px);
		transition:
			opacity 0.35s ease,
			transform 0.35s ease-in;
	}

	.futuro-text-title {
		font-size: clamp(1.3rem, 2.2vw, 1.7rem);
		font-weight: 700;
		color: #21e68c;
		margin: 0 0 0.75rem 0;
		letter-spacing: 0.02em;
		text-shadow:
			0 0 20px rgba(33, 230, 140, 0.3),
			0 2px 8px rgba(0, 0, 0, 0.7);
	}

	.futuro-text-desc {
		font-size: clamp(0.88rem, 1.4vw, 0.98rem);
		color: rgba(240, 240, 240, 0.88);
		line-height: 1.65;
		margin: 0;
		text-shadow:
			0 1px 4px rgba(0, 0, 0, 0.8),
			0 0 12px rgba(0, 0, 0, 0.6);
	}

	/* Progress bar: 6 interactive segments */
	.futuro-progress-bar {
		display: flex;
		gap: 5px;
		margin-top: 1.75rem;
	}

	.futuro-progress-seg {
		flex: 1;
		height: 3px;
		background: rgba(255, 255, 255, 0.15);
		border: none;
		cursor: pointer;
		border-radius: 2px;
		padding: 0;
		position: relative;
		overflow: hidden;
		transition: background 0.3s;
	}

	.futuro-progress-seg:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.futuro-progress-fill {
		position: absolute;
		inset: 0;
		background: #00a6c0;
		transform-origin: left;
		animation: seg-fill 5s linear forwards;
	}

	@keyframes seg-fill {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}

	/* Pantalla completa (≥640px): el mapa llena la ventana y los textos se quedan en
	   un marco centrado de 1300px, así no se separan en pantallas gigantes. */
	@media (min-width: 640px) {
		.futuro-section {
			height: 100vh;
			min-height: 620px;
			padding: 0;
		}
		.futuro-content {
			max-width: none;
			height: 100%;
			padding: 0;
		}
		.futuro-video-container {
			height: 100%;
			aspect-ratio: auto;
			border-radius: 0;
			box-shadow: none;
		}
		.futuro-title-overlay {
			left: max(2rem, calc((100% - 1300px) / 2));
			right: 50%;
			justify-content: center;
			padding: 0;
		}
		.futuro-text-panel {
			right: max(2rem, calc((100% - 1300px) / 2));
			width: min(42%, 540px);
			padding: 0 0 0 3rem;
		}
	}

	/* Tablet */
	@media (max-width: 1023px) {
		.futuro-title {
			font-size: 1.8rem;
		}

		.futuro-text-panel {
			width: 50%;
			padding: 2.5rem;
		}

		.futuro-text-title {
			font-size: 1.3rem;
		}

		.futuro-text-desc {
			font-size: 0.88rem;
		}
	}

	/* Mobile */
	@media (max-width: 639px) {
		/* Reset the global section { min-height: 100vh; align-items: center } */
		.futuro-section {
			min-height: auto !important;
			align-items: flex-start !important;
			padding: 2.5rem 0 3rem;
		}

		.futuro-content {
			padding: 0 1rem;
			width: 100%;
			flex-direction: column;
		}

		/* Ocultar solo video y overlays — el título se muestra sobre el panel */
		.futuro-video-container :global(.xp-world),
		.futuro-dark-overlay {
			display: none;
		}

		/* Título en flujo normal, encima del panel de texto */
		.futuro-title-overlay {
			display: block !important;
			position: static !important;
			width: 100% !important;
			padding: 0 0 1.25rem;
			background: none;
		}

		.futuro-title {
			font-size: 1.55rem !important;
			line-height: 1.25;
		}

		/* El contenedor colapsa sin video — lo quitamos del flow */
		.futuro-video-container {
			position: static !important;
			width: 100% !important;
			aspect-ratio: unset !important;
			height: auto !important;
			overflow: visible !important;
			box-shadow: none !important;
			border-radius: 0 !important;
		}

		.futuro-text-panel {
			position: relative !important;
			left: auto !important;
			right: auto !important;
			top: auto !important;
			bottom: auto !important;
			width: 100% !important;
			max-width: 100% !important;
			padding: 1.75rem 1.25rem;
			border-left: none;
			border-top: none;
			border-radius: 16px;
			margin-top: 0;
			background: rgba(10, 18, 30, 0.85);
			border: 1px solid rgba(0, 166, 192, 0.18);
			box-sizing: border-box !important;
		}

		.futuro-text-content {
			min-height: 120px;
		}

		.futuro-text-title {
			font-size: 1.15rem;
		}

		.futuro-text-desc {
			font-size: 0.85rem;
		}
	}
</style>
