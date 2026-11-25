<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { services, diagnosticoSituaciones, diagnosticoFrentes } from '$lib/data/services.js';
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import HoloForge from '$lib/components/HoloForge.svelte';
	import ShaderBackground from '$lib/components/experiencia/ShaderBackground.svelte';
	import { cargarRecaptcha, enviarContacto, validarContacto } from '$lib/contacto.js';

	// ── El suelo de las puertas ───────────────────────────────────────────
	//
	// Toda la página transcurre sobre una superficie: el hero tiene la mesa del
	// escritorio y el Lab tiene sus plataformas apoyadas en una. Las dos puertas
	// eran lo único flotando en el vacío, y de ahí venía buena parte de la
	// sensación de que les faltaba algo.
	//
	// La rejilla es geometría derivada, no contenido, así que se calcula aquí y no
	// en `services.js`: no hay nada que un editor quiera tocar a mano.
	const FUGA = { x: 600, y: 8 };
	const SUELO = 520;

	// Abanico de líneas hacia el observador. Se abren más allá de los bordes para
	// que en el recorte no se vea dónde termina el abanico.
	const suelaRadiales = Array.from(
		{ length: 13 },
		(_, i) => `M${FUGA.x} ${FUGA.y} L${-500 + i * 183.3} ${SUELO}`
	);

	// Transversales con separación creciente hacia abajo: el espaciado ES la
	// perspectiva. Repartidas en lineal se leerían como un pentagrama.
	const suelaTransversales = Array.from({ length: 11 }, (_, i) => {
		const t = (i + 1) / 12;
		return `M-200 ${(FUGA.y + (SUELO - FUGA.y) * t ** 2.3).toFixed(1)} H1400`;
	});

	// ── Formulario del diagnóstico ────────────────────────────────────────
	//
	// Vive aquí y no en una página aparte porque el embudo eran tres navegaciones
	// antes de poder escribir una letra. La lógica —saneado, validación, reCAPTCHA
	// y envío— es la misma que usa la landing, importada de `$lib/contacto.js`:
	// solo el marcado es de esta página, porque el lenguaje visual es distinto.
	let datos = { nombre: '', correo_electronico: '', telefono: '', mensaje: '' };
	let errores = { nombre: '', correo_electronico: '', telefono: '', mensaje: '', general: '' };
	let enviando = false;
	let acuse = '';
	let acuseOk = false;

	onMount(() => {
		cargarRecaptcha();
		const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (quieto) return;
		const tCto = setInterval(() => {
			consejoN += 1;
			consejoVisible = false;
			setTimeout(() => (consejoVisible = true), 900);
		}, 3200);
		let tLab = 0;
		const pasoLab = () => {
			etapaActiva = etapaActiva >= focos.length - 1 ? -1 : etapaActiva + 1;
			tLab = setTimeout(pasoLab, etapaActiva === -1 ? 3200 : 2600);
		};
		tLab = setTimeout(pasoLab, 3200);
		return () => {
			clearInterval(tCto);
			clearTimeout(tLab);
		};
	});

	async function enviar(evento) {
		evento.preventDefault();
		acuse = '';

		const revision = validarContacto(datos);
		errores = revision.errores;
		if (!revision.valido) return;

		enviando = true;
		// El contexto viaja dentro del mensaje para que quien conteste sepa que
		// viene de aquí y no del formulario general de la landing.
		const r = await enviarContacto(datos, {
			accion: 'diagnostico',
			contexto: 'Diagnóstico tecnológico'
		});
		enviando = false;

		acuseOk = r.ok;
		acuse = r.mensaje;
		if (r.ok) datos = { nombre: '', correo_electronico: '', telefono: '', mensaje: '' };
	}

	// Lo que recibes en cada etapa de un proyecto completo.
	const etapas = [
		{ paso: 'Idea', recibes: 'Viabilidad técnica' },
		{ paso: 'PoC', recibes: 'Prueba que funciona' },
		{ paso: 'MVP', recibes: 'Primera versión en uso' },
		{ paso: 'Producto', recibes: 'Versión completa' },
		{ paso: 'Producción', recibes: 'Operación y soporte' }
	];

	// Nuestros productos como prueba, con las capacidades que usó cada uno.
	const pruebas = [
		{
			id: 'nexus',
			name: 'Nexus',
			mark: '/img/products/mark-nexus.webp',
			usa: 'IoT · nube · geoespacial · apps',
			href: '/products/nexus'
		},
		{
			id: 'orion',
			name: 'Orion',
			mark: '/img/products/mark-orion.webp',
			usa: 'API · datos · telecomunicaciones',
			href: 'https://orion.geminislabs.com/'
		},
		{
			id: 'signum',
			name: 'Signum',
			mark: '/img/products/mark-signum.webp',
			usa: 'Web ligera · bilingüe · alta disponibilidad',
			href: 'https://signum.geminislabs.com/'
		}
	];

	const preguntas = [
		{
			q: '¿Cuánto cuesta?',
			a: 'Depende del alcance. Cotizamos después de una primera conversación o de un diagnóstico, cuando ya entendemos el problema.'
		},
		{
			q: '¿Cuánto tarda un proyecto?',
			a: 'Depende de lo que haya que resolver. Al cerrar el diagnóstico o la evaluación de la idea te damos un plan por etapas, y cada etapa termina con algo que funciona.'
		},
		{
			q: '¿Firman acuerdo de confidencialidad?',
			a: 'Sí. Firmamos NDA antes de revisar información de tu empresa.'
		},
		{
			q: '¿Tengo que contratar el proyecto completo?',
			a: 'No. Puedes empezar por un diagnóstico o por CTO por horas, y decidir después si seguimos juntos.'
		},
		{
			q: '¿Trabajan con lo que ya tenemos?',
			a: 'Sí. Integramos con tus sistemas, equipos y proveedores actuales; no empezamos de cero si no hace falta.'
		},
		{
			q: '¿Dónde están?',
			a: 'En Querétaro. Trabajamos de forma remota y presencial según el proyecto.'
		}
	];

	// ── CTO por horas: frentes y consejos ────────────────────────────────
	const frentes = [
		{ id: 'equipo', label: 'Equipo', x: 14, y: 22 },
		{ id: 'prov', label: 'Proveedores', x: 50, y: 10 },
		{ id: 'tec', label: 'Tecnología', x: 86, y: 22 }
	];
	const consejos = [
		{ to: 'prov', t: 'Ese proveedor te está cobrando de más' },
		{ to: 'tec', t: 'Esta arquitectura no va a escalar' },
		{ to: 'equipo', t: 'Contratemos primero a alguien senior' },
		{ to: 'tec', t: 'Antes de meter IA, arreglemos los datos' },
		{ to: 'prov', t: 'No compres eso todavía' }
	];
	let consejoN = 0;
	let consejoVisible = false;
	$: consejo = consejos[consejoN % consejos.length];

	// ── Cómo trabajamos: la cámara recorre la imagen etapa por etapa ──────
	// Empieza en la vista completa (-1), se acerca a cada etapa y vuelve.
	// Posición (en % de la imagen) de lo que ilustra cada etapa.
	const focos = [
		{ x: 13, y: 58 },
		{ x: 31, y: 52 },
		{ x: 46, y: 44 },
		{ x: 62, y: 34 },
		{ x: 84, y: 40 }
	];
	let etapaActiva = -1;

	// ── Capacidades: un solo panel de detalle, a lo ancho ─────────────────
	let capAbierta = null;
	function verDetalle(slug) {
		capAbierta = slug;
	}
	// Mientras la ventana está abierta, la página de atrás no se desplaza.
	$: if (typeof document !== 'undefined') document.body.style.overflow = capAbierta ? 'hidden' : '';
	// ── Cierre: aurora de fondo (se monta al acercarse) ───────────────────
	const AURORA = {
		key: 'servicios-cierre',
		mode: 'aurora',
		colors: ['#030a07', '#1f7a4a', '#c9a74a', '#eaffe0'],
		intensity: 0.6
	};
	let auroraCerca = false;
	function cercano(nodo, cb) {
		const io = new IntersectionObserver(
			(e) => {
				if (e[0].isIntersecting) {
					cb();
					io.disconnect();
				}
			},
			{ rootMargin: '600px' }
		);
		io.observe(nodo);
		return { destroy: () => io.disconnect() };
	}
	// Si se sale de la página con la ventana abierta, la página siguiente debe poder desplazarse.
	onMount(() => () => (document.body.style.overflow = ''));

	function enfocar(nodo) {
		nodo.focus();
	}
	function teclaModal(e) {
		if (e.key === 'Escape' && capAbierta) capAbierta = null;
	}

	// Los seis apartados del documento del diagnóstico. Van en un array y no
	// sueltos en el marcado para poder escalonar el recorrido de la señal: cada
	// fila necesita saber su posición.
	const apartados = [
		'Estado actual',
		'Riesgos',
		'Oportunidades',
		'Arquitectura recomendada',
		'Roadmap',
		'Estimación de inversión'
	];

	// ── Puntero: parallax suave por sección ──────────────────────────────
	const acotar = (v) => Math.max(-1, Math.min(1, v));

	/**
	 * Escribe la posición del puntero sobre un elemento como `--px` y `--py`,
	 * normalizadas a −1..1, para que sus descendientes las usen en CSS.
	 *
	 * Van como custom properties y no como estado de Svelte: cambian en cada
	 * fotograma, y pasarlas por el ciclo de render volvería a evaluar el árbol
	 * entero sesenta veces por segundo para mover unos píxeles.
	 *
	 * `caja` permite medir contra un descendiente en vez de contra el elemento:
	 * el hero es mucho más ancho que el árbol, y medir contra la sección haría
	 * que el puntero sobre el texto empujara las hojas lejos de su rama.
	 * `alMedir` recibe la posición en el sistema 0–100 de esa caja, para lo que
	 * cada sección necesite además del desplazamiento.
	 */
	function conPuntero(nodo, { caja: selector, alMedir, alSalir } = {}) {
		const caja = selector ? nodo.querySelector(selector) : nodo;
		if (!caja) return;

		const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
		let cuadro = 0;
		let puntero = null;

		function pintar() {
			cuadro = 0;
			if (!puntero) return;
			const r = caja.getBoundingClientRect();
			if (!r.width || !r.height) return;

			const x = ((puntero.x - r.left) / r.width) * 100;
			const y = ((puntero.y - r.top) / r.height) * 100;

			if (!quieto.matches) {
				nodo.style.setProperty('--px', acotar((x - 50) / 50).toFixed(3));
				nodo.style.setProperty('--py', acotar((y - 50) / 50).toFixed(3));
			}
			alMedir?.(x, y);
		}

		function mover(e) {
			// El dedo no tiene hover: en táctil todo se quedaría encendido bajo la
			// yema y se apagaría al levantarla, que no es lo que el gesto pide.
			if (e.pointerType === 'touch') return;
			puntero = { x: e.clientX, y: e.clientY };
			if (!cuadro) cuadro = requestAnimationFrame(pintar);
		}

		function salir() {
			puntero = null;
			if (cuadro) {
				cancelAnimationFrame(cuadro);
				cuadro = 0;
			}
			nodo.style.setProperty('--px', '0');
			nodo.style.setProperty('--py', '0');
			alSalir?.();
		}

		nodo.addEventListener('pointermove', mover);
		nodo.addEventListener('pointerleave', salir);

		return {
			destroy() {
				nodo.removeEventListener('pointermove', mover);
				nodo.removeEventListener('pointerleave', salir);
				if (cuadro) cancelAnimationFrame(cuadro);
			}
		};
	}
</script>

<svelte:head>
	<title>Servicios de ingeniería y consultoría tecnológica | Geminis Labs</title>
	<meta
		name="description"
		content="Consultoría y arquitectura, software y cloud, IA y datos, IoT y hardware, Industria 4.0 y soluciones integrales. De la idea a una solución operando, con un solo equipo."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
</svelte:head>

<svelte:window on:keydown={teclaModal} />

<Navbar />

<main class="sv-page">
	<!-- ── HERO ──────────────────────────────────────────── -->
	<!-- Una arquitectura holográfica que se ensambla sola (Three.js, solo en esta
	     página); el texto vive a la izquierda y la escena a la derecha. -->
	<section class="sv-hero">
		<div class="sv-hero-forge">
			<HoloForge />
		</div>
		<div class="sv-hero-velo" aria-hidden="true"></div>

		<div class="sv-hero-inner">
			<div class="sv-hero-copy">
				<p class="sv-overline">Ingeniería y consultoría</p>
				<h1 class="sv-hero-title">De la idea a una solución que funciona.</h1>
				<p class="sv-hero-sub">
					Tomamos un problema de negocio desde que todavía es una idea y lo llevamos hasta una
					solución operando.
					<strong>Un solo equipo, de la estrategia a producción.</strong>
				</p>
				<div class="sv-hero-actions">
					<a href="#diagnostico" class="sv-btn sv-btn--primary">Agenda un diagnóstico</a>
					<a href="/#productos" class="sv-btn sv-btn--ghost">Ver nuestros productos</a>
				</div>
			</div>
		</div>
	</section>

	<!-- ── TRES FORMAS DE TRABAJAR CON NOSOTROS ──────────── -->
	<section class="sv-doors" id="doors">
		<!-- La superficie sobre la que se apoyan las dos puertas. Decorativa: lo que
		     dice ya está en el texto, así que queda fuera del árbol de accesibilidad. -->
		<svg
			class="sv-suelo"
			viewBox="0 0 1200 520"
			preserveAspectRatio="xMidYMax slice"
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<linearGradient
					id="svSueloFade"
					gradientUnits="userSpaceOnUse"
					x1="0"
					y1="0"
					x2="0"
					y2="520"
				>
					<stop offset="0%" stop-color="var(--sv-accent)" stop-opacity="0" />
					<stop offset="38%" stop-color="var(--sv-accent)" stop-opacity="0.3" />
					<stop offset="100%" stop-color="var(--sv-accent)" stop-opacity="0.03" />
				</linearGradient>
			</defs>
			{#each suelaRadiales as d (d)}
				<path {d} />
			{/each}
			{#each suelaTransversales as d (d)}
				<path {d} />
			{/each}
		</svg>

		<div class="sv-container">
			<header class="sv-head">
				<p class="sv-overline">Por dónde empezar</p>
				<h2 class="sv-title">Tres formas de trabajar con nosotros</h2>
				<p class="sv-sub">
					No tienes que contratar el proyecto completo: puedes empezar por entender en qué estás
					parado, sumar liderazgo técnico o llevar una idea hasta producción.
				</p>
			</header>
			<div class="sv-door-grid">
				<article class="sv-door">
					<div class="sv-door-copy">
						<h3 class="sv-door-title">Diagnóstico tecnológico</h3>
						<p class="sv-door-desc">
							«Dime qué está mal y qué debería hacer.» Revisamos arquitectura, infraestructura,
							costos, escalabilidad y seguridad, y te entregamos un documento con el que puedes
							decidir — contrates con nosotros o no.
						</p>
						<a href="#diagnostico" class="sv-btn sv-btn--primary">Agenda un diagnóstico</a>
					</div>

					<!--
						Los seis apartados eran una cadena de flechas que se partía en dos
						líneas y se leía como una nota al pie. Como índice del documento
						dicen lo mismo, se leen de un vistazo y le dan a esta puerta el
						peso visual que la otra ya tenía por su diagrama.

						No lleva `aria-hidden`: aquí viven los seis apartados y en ningún
						otro sitio, a diferencia del diagrama del CTOaaS, que repite lo
						que su lista ya dice.
					-->
					<figure class="sv-entrega">
						<div class="sv-entrega-hoja">
							<p class="sv-entrega-titulo">Lo que recibes</p>
							<ol class="sv-entrega-indice">
								{#each apartados as apartado, i (apartado)}
									<li style="--i: {i}">{apartado}</li>
								{/each}
							</ol>
						</div>
						<figcaption class="sv-entrega-pie">
							El índice del documento que se entrega al cerrar el diagnóstico.
						</figcaption>
					</figure>
				</article>
				<article class="sv-door">
					<div class="sv-door-copy">
						<h3 class="sv-door-title">CTO por horas</h3>
						<p class="sv-door-desc">
							No necesitas un CTO de tiempo completo, necesitas que alguien te diga «no compres
							eso», «ese proveedor te está vendiendo de más», «esta arquitectura no va a escalar» o
							«antes de meter IA arreglemos los datos».
						</p>
						<ul class="sv-door-list">
							<li>Estrategia tecnológica y roadmaps</li>
							<li>Evaluación de proveedores y propuestas</li>
							<li>Supervisión técnica de quien ya te desarrolla</li>
							<li>Acompañamiento en la contratación de tu equipo</li>
						</ul>
						<a href="/#contacto" class="sv-btn sv-btn--ghost">Hablar de acompañamiento</a>
					</div>
					<!-- El diagrama va como SVG y no como imagen: escala sin pixelarse,
					     hereda la paleta de la sección y puede animarse con el mismo pulso
					     que el resto. Es decorativo —lo que dice ya está en la lista de
					     arriba— así que queda fuera del árbol de accesibilidad. -->
					<!-- El CTO como núcleo vivo: los tres frentes orbitan y, de vez en cuando,
					     sale del núcleo la frase que evita perder dinero en ese frente. -->
					<figure class="sv-cto" aria-hidden="true">
						<div class="sv-cto-escena">
							<svg class="sv-cto-lineas" viewBox="0 0 300 200" preserveAspectRatio="none">
								{#each frentes as f (f.id)}
									<line
										x1="150"
										y1="118"
										x2={f.x * 3}
										y2={f.y * 2}
										class:on={consejo.to === f.id}
									/>
								{/each}
							</svg>
							<span class="sv-cto-anillo"></span>
							<span class="sv-cto-anillo sv-cto-anillo--2"></span>
							<span class="sv-cto-nucleo">CTO</span>
							{#each frentes as f (f.id)}
								<span
									class="sv-cto-frente"
									class:on={consejo.to === f.id && consejoVisible}
									style="--x: {f.x}%; --y: {f.y}%"
								>
									{f.label}
								</span>
							{/each}
							{#key consejoN}
								<span
									class="sv-cto-consejo"
									style="--tx: {frentes.find((f) => f.id === consejo.to).x}%; --ty: {frentes.find(
										(f) => f.id === consejo.to
									).y}%"
								>
									«{consejo.t}»
								</span>
							{/key}
						</div>
						<figcaption class="sv-cto-pie">
							Tu empresa, con una sola cabeza técnica sobre los tres frentes donde se pierde el
							dinero.
						</figcaption>
					</figure>
				</article>
				<article class="sv-door">
					<div class="sv-door-copy">
						<h3 class="sv-door-title">Proyecto completo</h3>
						<p class="sv-door-desc">
							De la idea a una solución operando: validamos que se puede construir, diseñamos la
							arquitectura, construimos software, hardware e infraestructura, y lo mantenemos en
							producción. Un solo equipo de principio a fin.
						</p>
						<a href="#como-trabajamos" class="sv-btn sv-btn--ghost">Ver cómo trabajamos</a>
					</div>
					<figure class="sv-entrega">
						<div class="sv-entrega-hoja">
							<p class="sv-entrega-titulo">El recorrido</p>
							<ol class="sv-entrega-indice">
								{#each ['Idea', 'Prueba de concepto', 'MVP', 'Producto', 'Producción'] as paso, i (paso)}
									<li style="--i: {i}">{paso}</li>
								{/each}
							</ol>
						</div>
						<figcaption class="sv-entrega-pie">
							Puedes detenerte en cualquier etapa con algo que funciona.
						</figcaption>
					</figure>
				</article>
			</div>
		</div>
	</section>

	<!-- ── CAPACIDADES EN BENTO ──────────────────────────── -->
	<!-- Seis capacidades a la vista, con la promesa en lenguaje de negocio. El
	     detalle técnico (los ~170 ítems) queda plegado para quien lo quiera. -->
	<section class="sv-caps" id="capacidades" aria-labelledby="sv-caps-title">
		<div class="sv-container">
			<header class="sv-head">
				<p class="sv-overline">Qué hacemos</p>
				<h2 id="sv-caps-title" class="sv-title">Seis capacidades, una sola casa</h2>
				<p class="sv-sub">
					No vendemos horas de programador. Vendemos capacidad de ingeniería: entender el problema,
					diseñar la tecnología y construir la solución.
				</p>
			</header>
			<div class="sv-caps-grid">
				{#each services as cap, i (cap.slug)}
					<article
						class="sv-cap"
						class:sv-cap--ancha={i === 0 || i === services.length - 1}
						class:is-abierta={capAbierta === cap.slug}
					>
						<p class="sv-cap-num">{cap.num}</p>
						<h3 class="sv-cap-title">{cap.title}</h3>
						<p class="sv-cap-promise">{cap.promise}</p>
						<ul class="sv-cap-chips">
							{#each cap.chips.slice(0, 4) as chip (chip)}<li>{chip}</li>{/each}
						</ul>
						<button
							type="button"
							class="sv-cap-ver"
							aria-haspopup="dialog"
							on:click={() => verDetalle(cap.slug)}
						>
							Ver detalle técnico →
						</button>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── INNOVATION LAB ────────────────────────────────── -->
	<section class="sv-lab" id="como-trabajamos">
		<div class="sv-container sv-lab-inner">
			<div class="sv-lab-copy">
				<p class="sv-overline">Cómo trabajamos</p>
				<h2 class="sv-title">¿Tienes una idea y no sabes si se puede construir?</h2>
				<p class="sv-sub">
					Lo averiguamos con un PoC antes de que comprometas presupuesto en algo que quizá no es
					viable. Evaluación técnica, selección de tecnologías, arquitectura inicial y estimación de
					costos.
				</p>
				<a href="/#contacto" class="sv-btn sv-btn--primary sv-btn--inline">Evalúa tu idea</a>
			</div>

			<!--
				La ilustración no repite lo que dice la lista. La lista nombra las
				FASES —idea, PoC, MVP— y la ilustración enseña las DISCIPLINAS que
				hay que atravesar para recorrerlas: electrónica, conectividad, nube y
				aplicaciones. Por eso lleva texto alternativo propio y no `alt=""`.

				Va abajo del todo de la página, así que carga en diferido: no compite
				con la fotografía del hero, que es la que decide el LCP.
			-->
			<figure class="sv-lab-figura">
				<!-- El lienzo existe solo para que el velo de bordes se ciña a la imagen:
				     sobre la `figure` entera taparía también las fases de abajo. -->
				<div class="sv-lab-lienzo">
					<img
						class:sv-lab-zoom={etapaActiva >= 0}
						style={etapaActiva >= 0
							? `--x: ${focos[etapaActiva].x}%; --y: ${focos[etapaActiva].y}%`
							: ''}
						src="/img/servicios-lab.webp"
						alt="El recorrido completo de un producto: el boceto de una idea, la electrónica de un prototipo, el dispositivo terminado, la nube que recibe sus datos y los tableros donde se consultan."
						width="1672"
						height="941"
						loading="lazy"
						decoding="async"
					/>
				</div>

				<!-- Las fases van SOBRE la imagen, apoyadas en su borde inferior: de
				     paso tapan la franja donde el archivo se funde con la sección. -->
				<ol class="sv-flow">
					{#each etapas as e, i (e.paso)}
						<li class="sv-flow-step" class:is-on={etapaActiva === i}>
							<span class="sv-flow-n" aria-hidden="true">{i + 1}</span>
							<span class="sv-flow-txt">
								<strong>{e.paso}</strong>
								<small>{e.recibes}</small>
							</span>
						</li>
					{/each}
				</ol>
			</figure>
		</div>
	</section>

	<!-- ── CIERRE ────────────────────────────────────────── -->
	<section class="sv-close" use:conPuntero>
		<div class="sv-container sv-close-inner">
			<div>
				<h2 class="sv-title sv-close-title">
					Entendemos el problema, diseñamos la tecnología y construimos la solución.
				</h2>
				<p class="sv-sub sv-close-sub">
					Nuestros propios productos son la prueba: los diseñamos, construimos y operamos nosotros.
				</p>
				<ul class="sv-pruebas">
					{#each pruebas as p (p.id)}
						<li>
							<a href={p.href} class="sv-prueba">
								<img src={p.mark} alt="" loading="lazy" />
								<span>
									<strong>{p.name}</strong>
									<small>{p.usa}</small>
								</span>
							</a>
						</li>
					{/each}
				</ul>
				<div class="sv-hero-actions sv-close-actions">
					<a href="#diagnostico" class="sv-btn sv-btn--primary">Agenda un diagnóstico</a>
					<a href="/#productos" class="sv-btn sv-btn--ghost">Ver los productos</a>
				</div>
			</div>

			<!--
				El despiece de Nexus es la prueba de lo que el párrafo afirma: la
				carcasa, la electrónica, el equipo terminado y, colgando de él, la
				conectividad, los mapas y los tableros. No es adorno, así que lleva
				texto alternativo propio.

				El archivo trae alfa de verdad —63.5% transparente— así que no
				necesita ni máscara ni velo: se apoya directo sobre la sección.
			-->
			<figure class="sv-close-figura">
				<img
					src="/img/servicios-construimos.webp"
					alt="Despiece de un equipo Nexus: la carcasa, su plano, la electrónica interna y el equipo terminado, con la conectividad, la señal, los mapas y los tableros saliendo de él."
					width="980"
					height="770"
					loading="lazy"
					decoding="async"
				/>
			</figure>
		</div>
	</section>

	<!-- ── PREGUNTAS FRECUENTES ──────────────────────────── -->
	<section class="sv-faq" aria-labelledby="sv-faq-title">
		<div class="sv-container sv-faq-inner">
			<header class="sv-head">
				<p class="sv-overline">Preguntas frecuentes</p>
				<h2 id="sv-faq-title" class="sv-title">Antes de hablar</h2>
			</header>
			<div class="sv-faq-list">
				{#each preguntas as f (f.q)}
					<details class="sv-faq-item">
						<summary>{f.q}</summary>
						<p>{f.a}</p>
					</details>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── DIAGNÓSTICO ───────────────────────────────────── -->
	<!--
		Era una página aparte. Se trajo aquí porque el embudo eran tres
		navegaciones antes de que nadie pudiera escribir una letra, y la URL vieja
		redirige a este ancla.
	-->
	<section class="sv-diag" id="diagnostico" aria-labelledby="sv-diag-title">
		<!-- La misma aurora del cierre de la página principal: el sitio termina igual. -->
		<div class="sv-diag-aurora" aria-hidden="true" use:cercano={() => (auroraCerca = true)}>
			{#if auroraCerca}<ShaderBackground preset={AURORA} contained />{/if}
		</div>
		<div class="sv-diag-fade" aria-hidden="true"></div>
		<div class="sv-container">
			<header class="sv-head">
				<p class="sv-overline">Diagnóstico tecnológico</p>
				<h2 id="sv-diag-title" class="sv-title">Empieza por saber en qué estás parado</h2>
				<p class="sv-sub">
					Cuéntanos qué te está pasando. La primera llamada es para acotar el alcance y decirte si
					podemos ayudarte — <strong>si no podemos, también te lo decimos.</strong>
				</p>
			</header>

			<div class="sv-diag-grid">
				<div class="sv-diag-contexto">
					<h3 class="sv-diag-sub">Si alguna de estas te suena, es para ti</h3>
					<ul class="sv-diag-casos">
						{#each diagnosticoSituaciones as caso (caso)}
							<li>{caso}</li>
						{/each}
					</ul>

					<h3 class="sv-diag-sub">Y esto es lo que revisamos</h3>
					<ul class="sv-diag-frentes">
						{#each diagnosticoFrentes as frente (frente)}
							<li>{frente}</li>
						{/each}
					</ul>
				</div>

				<form class="sv-form" on:submit={enviar} novalidate>
					{#if acuse}
						<p class="sv-form-acuse" class:sv-form-acuse--ok={acuseOk} role="status">{acuse}</p>
					{/if}
					{#if errores.general}
						<p class="sv-form-error sv-form-error--general" role="alert">{errores.general}</p>
					{/if}

					<div class="sv-form-campo">
						<label for="dg-nombre">Nombre <span aria-hidden="true">*</span></label>
						<input
							id="dg-nombre"
							type="text"
							maxlength="200"
							bind:value={datos.nombre}
							disabled={enviando}
							aria-invalid={!!errores.nombre}
							aria-describedby={errores.nombre ? 'dg-nombre-error' : undefined}
						/>
						{#if errores.nombre}
							<p class="sv-form-error" id="dg-nombre-error">{errores.nombre}</p>
						{/if}
					</div>

					<div class="sv-form-fila">
						<div class="sv-form-campo">
							<label for="dg-correo">Correo</label>
							<input
								id="dg-correo"
								type="email"
								bind:value={datos.correo_electronico}
								disabled={enviando}
								aria-invalid={!!errores.correo_electronico}
								aria-describedby={errores.correo_electronico ? 'dg-correo-error' : undefined}
							/>
							{#if errores.correo_electronico}
								<p class="sv-form-error" id="dg-correo-error">{errores.correo_electronico}</p>
							{/if}
						</div>

						<div class="sv-form-campo">
							<label for="dg-tel">Teléfono</label>
							<input
								id="dg-tel"
								type="tel"
								bind:value={datos.telefono}
								disabled={enviando}
								aria-invalid={!!errores.telefono}
								aria-describedby={errores.telefono ? 'dg-tel-error' : undefined}
							/>
							{#if errores.telefono}
								<p class="sv-form-error" id="dg-tel-error">{errores.telefono}</p>
							{/if}
						</div>
					</div>
					<!-- Uno de los dos basta, pero alguno hace falta: sin correo ni teléfono
					     no hay forma de responder. Se dice antes de enviar, no después. -->
					<p class="sv-form-nota">Con uno de los dos basta para poder responderte.</p>

					<div class="sv-form-campo">
						<label for="dg-mensaje">Qué te está pasando <span aria-hidden="true">*</span></label>
						<textarea
							id="dg-mensaje"
							rows="5"
							maxlength="5000"
							bind:value={datos.mensaje}
							disabled={enviando}
							aria-invalid={!!errores.mensaje}
							aria-describedby={errores.mensaje ? 'dg-mensaje-error' : undefined}></textarea>
						{#if errores.mensaje}
							<p class="sv-form-error" id="dg-mensaje-error">{errores.mensaje}</p>
						{/if}
					</div>

					<button type="submit" class="sv-btn sv-btn--primary" disabled={enviando}>
						{enviando ? 'Enviando…' : 'Solicitar un diagnóstico'}
					</button>
				</form>
			</div>
		</div>
	</section>
</main>

<!-- Detalle técnico de una capacidad: ventana al frente, como las tarjetas
	     «Más información» de las páginas de producto. Esc o clic afuera la cierran. -->
{#if capAbierta}
	{@const cap = services.find((c) => c.slug === capAbierta)}
	<div
		class="sv-modal"
		role="presentation"
		on:click|self={() => (capAbierta = null)}
		transition:fade={{ duration: 220 }}
	>
		<div
			class="sv-modal-card"
			role="dialog"
			aria-modal="true"
			aria-labelledby="sv-modal-title"
			transition:scale={{ start: 0.94, duration: 320 }}
		>
			<button
				type="button"
				class="sv-modal-cerrar"
				aria-label="Cerrar"
				use:enfocar
				on:click={() => (capAbierta = null)}>✕</button
			>
			<p class="sv-cap-num">{cap.num}</p>
			<h3 class="sv-modal-title" id="sv-modal-title">{cap.title}</h3>
			<p class="sv-modal-promise">{cap.promise}</p>
			<p class="sv-modal-intro">{cap.detail.intro}</p>
			<div class="sv-cap-panel-grid">
				{#each cap.detail.groups as grupo (grupo.title)}
					<div class="sv-cap-col">
						<p class="sv-cap-grupo">{grupo.title}</p>
						<ul class="sv-cap-lista">
							{#each grupo.items as item (item)}<li>{item}</li>{/each}
						</ul>
					</div>
				{/each}
			</div>
			<div class="sv-modal-pie">
				<a href="#diagnostico" class="sv-btn sv-btn--primary" on:click={() => (capAbierta = null)}
					>{cap.entrada}</a
				>
			</div>
		</div>
	</div>
{/if}

<Footer />

<style>
	.sv-page {
		background: var(--sv-bg);
		color: var(--sv-text);
		font-family: var(--gl-font-body);
	}

	/* `login-page.css` declara un `section { min-height: 100vh; display: flex }`
	   sin scope que se filtra a todo el sitio. Se neutraliza aquí, igual que hace
	   nexus.css para los suyos. */
	.sv-page section:not(.sv-hero) {
		min-height: 0;
		display: block;
	}

	.sv-container {
		width: min(1180px, 92vw);
		margin: 0 auto;
	}

	.sv-overline {
		font-family: var(--gl-font-label);
		font-size: 0.72rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: var(--sv-accent);
		margin: 0 0 1rem;
	}

	.sv-title {
		font-family: var(--gl-font-body);
		font-weight: 600;
		font-size: clamp(1.5rem, 3.2vw, 2.3rem);
		line-height: 1.2;
		text-wrap: balance;
		margin: 0 0 1rem;
	}

	.sv-sub {
		font-size: clamp(0.98rem, 1.2vw, 1.1rem);
		line-height: 1.65;
		color: var(--sv-text-muted);
		max-width: 62ch;
		margin: 0;
	}

	.sv-head {
		margin-bottom: clamp(2rem, 4vw, 3rem);
	}

	/* ── Hero ──────────────────────────────────────────── */

	.sv-hero {
		/* Puntero normalizado a −1..1, que escribe el JS. Vive aquí y no en el
		   árbol porque la fotografía también lo lee, y son hermanos. El valor de
		   reposo va declarado para que el hero se dibuje quieto antes de que
		   nadie lo toque. */
		--px: 0;
		--py: 0;
		position: relative;
		isolation: isolate;
		min-height: max(38rem, 100vh);
		display: flex;
		align-items: stretch;
		overflow: hidden;
		background: var(--sv-bg);
	}
	/*
	 * Dos velos, no uno. El vertical asienta la parte baja para el texto y los
	 * botones; el horizontal apaga la ventana de la ciudad, que es la zona más
	 * clara de la imagen (34.5 de luminancia frente a 14.5 del hombro) y la
	 * única que podría comerse un titular blanco.
	 */
	/*
	 * El velo se concentra DEBAJO DEL TEXTO, no sobre toda la imagen. Antes eran
	 * dos degradados a lo ancho que se multiplicaban entre sí y apagaban la
	 * escena entera para proteger un bloque de texto que ocupa un tercio.
	 *
	 * El radial hace ese trabajo donde hace falta —abajo a la izquierda, sobre el
	 * hombro— y el lineal solo asienta los bordes superior e inferior lo justo
	 * para que la barra de navegación y el corte con la sección siguiente no
	 * queden duros.
	 */
	.sv-hero-forge {
		position: absolute;
		inset: 0;
		z-index: 0;
	}
	.sv-hero-velo {
		pointer-events: none;
		z-index: 1;
		position: absolute;
		inset: 0;
		background:
			radial-gradient(
				95% 85% at 12% 28%,
				rgba(0, 12, 21, 0.88) 0%,
				rgba(0, 12, 21, 0.5) 34%,
				transparent 64%
			),
			linear-gradient(180deg, rgba(0, 12, 21, 0.4) 0%, transparent 22%, rgba(0, 12, 21, 0.45) 100%);
	}
	.sv-hero-inner {
		position: relative;
		z-index: 2;
		width: 100%;
		display: grid;
		grid-template-columns: minmax(0, 0.38fr) minmax(0, 0.62fr);
		/* El texto va arriba a la izquierda: abajo a la derecha vive la escena 3D. */
		align-items: start;
		gap: clamp(1.5rem, 3vw, 3rem);
		padding: clamp(7.5rem, 17vh, 11rem) 0 clamp(2.5rem, 5vw, 4rem);
		padding-left: max(2rem, calc((100% - 1180px) / 2));
		padding-right: clamp(1rem, 2vw, 2rem);
	}
	.sv-hero-copy {
		max-width: 30rem;
	}

	@keyframes svArbolFluir {
		from {
			stroke-dashoffset: 50;
		}
		to {
			stroke-dashoffset: 0;
		}
	}
	/* Los nodos se centran en su coordenada, no se anclan por la esquina: así
	   `--x`/`--y` señalan el punto del trazo con el que deben coincidir. */

	@media (prefers-reduced-motion: reduce) {
		/* Los textos se quedan en su color de reposo, que es el que declara la
		   regla: aquí basta con quitarles la animación. */
		.sv-entrega-indice li,
		.sv-entrega-indice li::before {
			animation: none;
		}
		/* El foco se queda: encender un nodo no es movimiento, y sin él el árbol
		   dejaría de responder. Lo que se va es el desplazamiento, que además el
		   JS ni siquiera llega a escribir. */
		.sv-close-figura {
			transform: none;
		}
	}
	.sv-hero-title {
		font-family: var(--gl-font-body);
		font-weight: 700;
		font-size: clamp(2rem, 4.4vw, 3.4rem);
		line-height: 1.08;
		letter-spacing: -0.02em;
		text-wrap: balance;
		margin: 0 0 1.1rem;
		max-width: 15ch;
		text-shadow: 0 2px 18px rgba(0, 12, 21, 0.6);
	}
	.sv-hero-sub {
		font-size: clamp(0.98rem, 1.2vw, 1.12rem);
		line-height: 1.6;
		color: var(--sv-text-muted);
		max-width: 44ch;
		margin: 0 0 1.75rem;
		text-shadow: 0 1px 12px rgba(0, 12, 21, 0.6);
	}
	.sv-hero-sub strong {
		color: var(--sv-text);
		font-weight: 600;
	}

	.sv-hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
	}

	/* ── Botones ───────────────────────────────────────── */

	.sv-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0.75rem 1.6rem;
		border-radius: var(--gl-r-sm);
		font-weight: 600;
		font-size: 0.95rem;
		text-decoration: none;
		transition:
			transform var(--gl-dur) var(--gl-ease),
			background var(--gl-dur) var(--gl-ease),
			border-color var(--gl-dur) var(--gl-ease);
	}

	.sv-btn--primary {
		background: var(--sv-accent);
		color: var(--sv-accent-ink);
		border: 1px solid var(--sv-accent);
	}

	.sv-btn--primary:hover {
		transform: translateY(-2px);
		background: #a4ecf9;
		border-color: #a4ecf9;
	}

	.sv-btn--ghost {
		background: transparent;
		color: var(--sv-text);
		border: 1px solid var(--sv-rule);
	}

	.sv-btn--ghost:hover {
		border-color: var(--sv-accent);
	}

	.sv-btn--inline {
		margin-top: 1.75rem;
	}

	.sv-btn:focus-visible {
		outline: 2px solid var(--sv-accent);
		outline-offset: 3px;
	}

	/* ── Riel de proceso ───────────────────────────────── */

	/* El destello de llegada. Va en un pseudoelemento y no en el nodo para que
	   sea solo `transform` y `opacity`: animar el `box-shadow` del propio punto
	   repintaría en cada fotograma. */

	/*
	 * La línea de 1px que une los nodos: gradiente de la escalera teal.
	 *
	 * La transparencia va en los colores y no en `opacity`, porque `opacity`
	 * multiplica a los hijos y dejaría la partícula al 45% de su brillo.
	 */
	/*
	 * La partícula. Se desplaza con `left` y no con `transform` porque el recorrido
	 * es el ancho del tramo, que lo fija la rejilla: un `translateX` en porcentaje
	 * se mediría contra los 5 px de la propia partícula, no contra el tramo.
	 */

	/*
	 * Cada animación dura el ciclo ENTERO y solo se mueve durante su primer
	 * quinto; el resto del tiempo espera invisible en el destino. Es lo que
	 * permite escalonar los cuatro tramos con un simple retardo: con una duración
	 * de un quinto y repetición infinita, los cuatro irían en fase y se vería una
	 * lluvia de partículas en paralelo en vez de una sola recorriendo el riel.
	 */
	@keyframes svRielParticula {
		0% {
			left: 0%;
			opacity: 0;
		}
		3% {
			opacity: 1;
		}
		17% {
			opacity: 1;
		}
		20% {
			left: 100%;
			opacity: 0;
		}
		100% {
			left: 100%;
			opacity: 0;
		}
	}

	@keyframes svRielDestello {
		0% {
			opacity: 0;
			transform: scale(0.6);
		}
		4% {
			opacity: 1;
			transform: scale(2.4);
		}
		20% {
			opacity: 0;
			transform: scale(3.3);
		}
		100% {
			opacity: 0;
			transform: scale(3.3);
		}
	}

	/*
	 * El rótulo y su descripción se encienden con el paso de la partícula, con el
	 * mismo retardo que el destello del nodo: lo que recorre el riel no es un
	 * adorno, es la lectura del proceso paso por paso.
	 *
	 * Se apagan más tarde de lo que tarda el siguiente en encenderse —vuelven al
	 * reposo en el 30% y el vecino arranca en el 20%— para que haya un instante
	 * con los dos vivos. Sin ese solape el riel parpadea; con él, avanza.
	 */

	/* El reposo va como sombra transparente y no como `none`: entre `none` y una
	   sombra con color no hay interpolación, y el resplandor aparecería de golpe. */
	@keyframes svRielRotulo {
		0%,
		30%,
		100% {
			color: var(--sv-text);
			text-shadow: 0 0 0 rgba(127, 227, 245, 0);
		}
		5%,
		18% {
			color: var(--sv-accent);
			text-shadow: 0 0 14px rgba(127, 227, 245, 0.5);
		}
	}

	@keyframes svRielTexto {
		0%,
		30%,
		100% {
			color: var(--sv-text-faint);
		}
		5%,
		18% {
			color: var(--sv-text-muted);
		}
	}

	/* ── Panal de capacidades ──────────────────────────── */

	/*
	 * El panal a la izquierda y el detalle a la derecha. Antes el contenido moría
	 * en la mitad del ancho y la otra mitad era fondo vacío con un chevron de
	 * 12 px dentro: 52% de lienzo sin resolver y ningún hito con el que hacer
	 * contrapeso. Ahora esa mitad es el panel.
	 */

	/* La caja del panal: 100 de ancho por `--alto` (115.47) de alto, que es lo que
	   ocupan seis hexágonos de vértice arriba dispuestos cinco alrededor de uno. */

	/*
	 * Cada celda se centra en su coordenada. El ancho es el del hexágono (40 de
	 * 100) y la proporción √3/2 es la de un hexágono regular con vértice arriba:
	 * si se toca una sin la otra, el panal deja de teselar y aparecen holguras
	 * entre celdas vecinas.
	 */

	/*
	 * Sin fondo ni contorno propios: las seis ilustraciones ya vienen recortadas
	 * en hexágono y con su borde luminoso, así que dibujar una celda debajo era
	 * poner un hexágono detrás de otro. El `clip-path` se queda como garantía de
	 * que el borde salga limpio aunque una ilustración llegue justo al filo.
	 */

	/* Velo al pie: sobre una ilustración a sangre, el rótulo y el ordinal se
	   pierden contra lo que toque caer detrás. */
	/*
	 * El velo es un óvalo CENTRADO, no una banda al pie. El rótulo vive en el
	 * medio del hexágono, que es su parte más ancha —abajo el hexágono se
	 * estrecha y desperdicia sus esquinas—, así que la protección tiene que estar
	 * donde está el texto. Solo hace falta con la celda encendida, porque en
	 * reposo la propia ilustración ya está al 28%.
	 */

	/*
	 * El rótulo se retira en reposo y solo llega a tinta plena en la celda
	 * encendida. Es el reparto inverso al de la ilustración, así que en cada
	 * estado hay un protagonista y no dos disputándose el mismo sitio.
	 */

	/* El ordinal encabeza el rótulo. Es el mismo motivo 01–06 del índice del
	   diagnóstico: en las filas viejas estaba a 11 px y al 44%, donde dejaba de
	   ser número y era textura. */

	/*
	 * La celda encendida crece y se adelanta. Al crecer invade a sus vecinas —un
	 * panal no tiene hueco donde crecer— y eso es justo lo que se busca: se lee
	 * como que sale del plano hacia el espectador, no como que empuja al resto.
	 * Por eso necesita `z-index`: sin él, las celdas que van después en el
	 * marcado se le pintarían encima.
	 */

	/*
	 * La del centro no es una hermana de las otras cinco: ES las otras cinco
	 * juntas. Va más densa y con el contorno más marcado incluso apagada, porque
	 * si las seis pesan igual el panal vuelve a contar la mentira que la lista
	 * contaba — que «Soluciones Integrales» es una capacidad más.
	 */

	/* Entra desplazándose desde el panal, no apareciendo de la nada: el texto
	   viene de la celda que se acaba de encender. */
	@keyframes svDetalleEntra {
		from {
			opacity: 0;
			transform: translateX(-0.75rem);
		}
	}

	/*
	 * El relevo entre capacidades. La salida es una transición sobre el elemento
	 * que ya está en pantalla; la entrada es una ANIMACIÓN, porque un elemento que
	 * viene de `display: none` no transiciona —no hay estado anterior desde el que
	 * interpolar— y una animación sí arranca al mostrarse.
	 *
	 * Sin `fill-mode`: al terminar, el elemento vuelve a su opacidad normal y deja
	 * la propiedad libre para que la transición de salida la tome la próxima vez.
	 */

	@keyframes svRelevo {
		from {
			opacity: 0;
			transform: translateY(0.6rem);
		}
	}

	/* ── Banda de detalle ──────────────────────────────── */

	/*
	 * Una columna por grupo. El número de grupos y el de ítems correlacionan —a
	 * más grupos, más ítems—, así que el recuento de columnas absorbe él solo casi
	 * todo el rango: 38 ítems en 5 columnas son 8 filas; 15 en 3 columnas, 5.
	 */

	/* El título del grupo toma el tono de la celda encendida, que ya se calcula.
	   Un tono POR GRUPO rompería la regla de que el color es por posición, y se
	   leería como una taxonomía que nadie quiso afirmar. */

	/*
	 * Los ítems van como lista y no como píldoras. Una píldora con borde promete
	 * interacción que aquí no existe, y ciento setenta y una de ellas en una misma
	 * sección son puro ruido. Alineados a la izquierda bajo su título, la
	 * proximidad ya agrupa sin gastar un píxel de tinta.
	 */

	/*
	 * La 06 no es una lista: sus ítems son PASOS ORDENADOS del dispositivo al
	 * dashboard, y el orden es lo único que significan. Como nube desordenada se
	 * perdería justo el argumento de esa capacidad.
	 */

	/* ── Puertas de entrada ────────────────────────────── */

	/*
	 * El suelo en perspectiva. La página entera transcurre sobre una superficie
	 * —la mesa del hero, las plataformas del Lab— y las dos puertas eran lo único
	 * flotando en el vacío.
	 *
	 * Va detrás con `z-index: -1` dentro de un contexto de apilado propio: sin
	 * `isolation`, ese −1 lo mandaría por detrás del fondo de la sección y la
	 * rejilla no se vería en absoluto.
	 */
	.sv-doors {
		position: relative;
		isolation: isolate;
		padding: clamp(3.5rem, 7vw, 5.5rem) 0;
		background: var(--sv-bg-2);
		border-top: 1px solid var(--sv-rule);
	}

	.sv-suelo {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 68%;
		z-index: -1;
		pointer-events: none;
		fill: none;
		stroke: url(#svSueloFade);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
		/* Se disuelve a los lados en vez de cortarse contra el borde del viewport:
		   una rejilla que termina en línea recta se lee como una caja, no como una
		   superficie que sigue más allá del encuadre. */
		-webkit-mask-image: linear-gradient(
			90deg,
			transparent 0%,
			#000 16%,
			#000 84%,
			transparent 100%
		);
		mask-image: linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%);
	}

	/*
	 * Una puerta por fila, no dos en paralelo. Las dos ofertas traen volúmenes de
	 * contenido muy distintos —una acaba en un botón y la otra lleva un diagrama—
	 * y al ponerlas en columnas la corta dejaba medio metro de hueco debajo.
	 * Estirarlas a la misma altura tampoco servía: eso ya se probó y abría el
	 * mismo vacío, pero dentro de la tarjeta.
	 *
	 * Cada puerta es ahora un ancho completo con el texto a un lado y su prueba al
	 * otro. El hueco desaparece porque no hay dos columnas que igualar, y cada
	 * oferta recibe el mismo espacio que la otra.
	 */
	.sv-door-grid {
		display: grid;
		gap: 1.25rem;
	}

	/*
	 * Cada puerta lleva su propia atmósfera. Era la sección más plana de la
	 * página —dos rectángulos de color casi uniforme, entre un hero con fotografía
	 * y un Lab con resplandor— y de ahí venía la sensación de que le faltaba algo.
	 *
	 * El color no puede venir de otro tono: el verde es de Nexus, la plata de
	 * Orion y el rojo de Signum, y meter cualquiera aquí haría que el sitio se
	 * leyera como tres empresas. Sale de RANGO dentro del cian: un teal profundo
	 * detrás de la prueba de cada puerta, que además la hace parecer iluminada en
	 * vez de pegada.
	 *
	 * El resplandor se coloca en un punto distinto en cada una para que las dos
	 * filas no se lean como la misma tarjeta repetida.
	 */
	.sv-door {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
		gap: clamp(1.5rem, 4vw, 3.5rem);
		align-items: center;
		padding: clamp(1.5rem, 3vw, 2.5rem);
		border: 1px solid var(--sv-rule);
		border-radius: var(--gl-r-md);
		/* Opaca, no translúcida. Con la rejilla detrás, un fondo al 3% dejaba pasar
		   las líneas por encima del texto del índice. Una tarjeta que se apoya en
		   una superficie la tapa; si no, no está apoyada. */
		background: rgba(9, 31, 40, 0.74);
		backdrop-filter: blur(3px);
		transition:
			border-color 0.45s var(--gl-ease),
			background-color 0.45s var(--gl-ease);
	}

	.sv-door::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background: radial-gradient(68% 120% at 76% 26%, rgba(8, 131, 160, 0.34), transparent 62%);
		opacity: 0.85;
		transition: opacity 0.45s var(--gl-ease);
	}
	.sv-door:nth-child(2)::before {
		background: radial-gradient(64% 118% at 80% 74%, rgba(8, 131, 160, 0.34), transparent 62%);
	}

	/* La tarjeta no es pulsable —lo es el botón de dentro—, así que la respuesta
	   al puntero es ambiental y no una invitación a hacer clic: sube la luz, no
	   aparece un cursor de mano ni se levanta la caja. */
	.sv-door:hover {
		border-color: rgba(127, 227, 245, 0.22);
		background-color: rgba(12, 39, 50, 0.9);
	}
	.sv-door:hover::before {
		opacity: 1;
	}

	.sv-door-copy {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		align-items: flex-start;
	}

	.sv-door-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.sv-door-desc {
		color: var(--sv-text-muted);
		line-height: 1.6;
		margin: 0;
	}

	/* ── Entregable del diagnóstico ────────────────────── */

	.sv-entrega {
		margin: 0;
		display: grid;
		gap: 0.7rem;
	}

	.sv-entrega-hoja {
		position: relative;
		overflow: hidden;
		padding: 1.3rem 1.35rem 1.1rem;
		border: 1px solid var(--sv-rule);
		border-radius: var(--gl-r-sm);
		background: rgba(127, 227, 245, 0.045);
	}
	/* La banda superior es lo que hace que el bloque se lea como un documento y
	   no como otra tarjeta más dentro de la tarjeta. */
	.sv-entrega-hoja::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--gl-teal-400), var(--sv-accent));
	}

	.sv-entrega-titulo {
		font-family: var(--gl-font-label);
		font-size: 0.64rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--sv-text-faint);
		margin: 0 0 0.9rem;
	}

	/*
	 * La misma señal que recorre el riel de proceso, aquí en vertical: se enciende
	 * un apartado tras otro, como se escribe el documento. Siete franjas para seis
	 * filas; la séptima es la pausa, sin la cual el recorrido se leería como un
	 * bucle sin principio.
	 *
	 * Es el motivo de toda la página —la señal que atraviesa el árbol, el riel y
	 * el diagrama del CTOaaS—, así que esta sección deja de ser la única quieta.
	 */
	.sv-entrega-indice {
		--ciclo: 6.6s;
		--franja: calc(var(--ciclo) / 7);
		list-style: none;
		margin: 0;
		padding: 0;
		counter-reset: sv-apartado;
	}

	.sv-entrega-indice li {
		counter-increment: sv-apartado;
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0.52rem 0;
		border-top: 1px solid var(--sv-rule);
		font-size: 0.92rem;
		color: var(--sv-text-muted);
		animation: svDocFila var(--ciclo) linear infinite;
		animation-delay: calc(var(--i) * var(--franja));
	}
	.sv-entrega-indice li:first-child {
		border-top: 0;
		padding-top: 0;
	}

	/* La numeración se pinta con contadores y no viene en el marcado: es
	   ordinal del índice, no contenido que haya que leer en voz alta. */
	.sv-entrega-indice li::before {
		content: counter(sv-apartado, decimal-leading-zero);
		font-family: var(--gl-font-label);
		font-size: 0.6rem;
		color: var(--sv-accent);
		animation: svDocOrdinal var(--ciclo) linear infinite;
		animation-delay: calc(var(--i) * var(--franja));
	}

	/* Vuelven al reposo más tarde de lo que tarda la siguiente en encenderse, para
	   que haya un instante con dos vivas: sin ese solape el índice parpadea. */
	@keyframes svDocFila {
		0%,
		26%,
		100% {
			color: var(--sv-text-muted);
		}
		4%,
		15% {
			color: var(--sv-text);
		}
	}

	/* La sombra de reposo va transparente y no `none`: entre `none` y una sombra
	   con color no hay interpolación, y el número se encendería de golpe. */
	@keyframes svDocOrdinal {
		0%,
		26%,
		100% {
			color: var(--sv-accent);
			text-shadow: 0 0 0 rgba(127, 227, 245, 0);
		}
		4%,
		15% {
			color: #ddfaff;
			text-shadow: 0 0 11px rgba(127, 227, 245, 0.85);
		}
	}

	.sv-entrega-pie {
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--sv-text-faint);
	}

	.sv-door-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}

	.sv-door-list li {
		position: relative;
		padding-left: 1.15rem;
		font-size: 0.92rem;
		color: var(--sv-text-muted);
	}

	.sv-door-list li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--sv-accent);
	}

	/* ── Diagrama del CTO por horas ─────────────────────── */
	/* El origen y las hojas son de la caja; el nodo es de quien la atiende, así
	   que se lleva el acento. */
	/* Un pulso baja por cada rama, escalonado: la decisión entra por arriba y
	   sale hacia los tres frentes. Es el mismo gesto que el de la landing. */
	@keyframes svCtoBajar {
		from {
			stroke-dashoffset: 28;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	.sv-door .sv-btn {
		margin-top: auto;
	}

	/* ── Innovation Lab ────────────────────────────────── */

	.sv-lab {
		padding: clamp(3.5rem, 7vw, 5.5rem) 0;
	}

	/*
	 * El texto no se estira a todo el ancho del contenedor: a 1180 px una línea
	 * de párrafo se vuelve ilegible. La ilustración sí lo ocupa entero.
	 *
	 * El margen NEGATIVO monta el final del texto sobre el inicio de la imagen.
	 * Cae en la banda superior del archivo, que está vacía de lado a lado durante
	 * unos doscientos píxeles, así que no hace falta oscurecer nada para que el
	 * texto se lea encima. Sin ese solape los dos bloques se leían como dos cosas
	 * puestas una tras otra en vez de como una sola composición.
	 *
	 * El solape es constante —lo fija el margen, no el alto del texto—, así que el
	 * titular puede crecer a tres líneas sin comerse el dibujo.
	 */
	.sv-lab-copy {
		position: relative;
		z-index: 2;
		max-width: 46rem;
		margin-bottom: clamp(-11rem, -11vw, -2rem);
	}

	.sv-lab-figura {
		position: relative;
		margin: 0;
	}
	/* El desvanecido vertical va en el contenedor y el horizontal en la imagen:
	   una máscara por elemento se multiplican solas al componerse. */
	.sv-lab-lienzo {
		position: relative;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(
			180deg,
			transparent 0%,
			#000 17%,
			#000 89%,
			transparent 100%
		);
		mask-image: linear-gradient(180deg, transparent 0%, #000 17%, #000 89%, transparent 100%);
	}
	.sv-lab-lienzo img {
		display: block;
		width: 100%;
		height: auto;
		transform-origin: 50% 50%;
		transition:
			transform 1.6s cubic-bezier(0.65, 0, 0.35, 1),
			transform-origin 1.6s cubic-bezier(0.65, 0, 0.35, 1),
			filter 1.6s ease;
		-webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%);
		mask-image: linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%);
	}
	/*
	 * EL BORDE DE LA ILUSTRACIÓN
	 *
	 * El archivo no tiene un fondo plano: lleva un resplandor ancho que va de
	 * #01131e en los costados a #012c40 en el centro, y se mantiene así hacia
	 * abajo. La sección sí era plana, y esa diferencia —no el corte— es lo que
	 * dibujaba el rectángulo. Ningún velo corto puede tapar una diferencia que
	 * continúa más allá del borde.
	 *
	 * Así que la sección recibe el mismo resplandor (`.sv-lab-figura::before`) y
	 * la imagen se desvanece con MÁSCARA en vez de con un velo de color encima.
	 * Con el fondo ya no plano, pintar `--sv-bg` sobre los bordes abriría una
	 * banda OSCURA donde antes había una clara: el mismo error al revés. La
	 * máscara no supone nada sobre lo que hay detrás.
	 *
	 * Dos elementos con una máscara cada uno en vez de uno con dos: así no hace
	 * falta `mask-composite`, que es lo único de esta receta que no está en todos
	 * los navegadores que nos importan.
	 */
	.sv-lab-figura::before {
		content: '';
		position: absolute;
		inset: -14% -5%;
		pointer-events: none;
		background: radial-gradient(
			ellipse at 50% 50%,
			rgba(0, 90, 140, 0.26) 0%,
			rgba(0, 90, 140, 0.13) 42%,
			transparent 72%
		);
	}

	/*
	 * Las cinco fases van SOBRE la ilustración, apoyadas en su borde inferior y en
	 * horizontal, para que cada una caiga sobre el tramo que le toca: la lista
	 * deja de ser un bloque suelto y pasa a ser la leyenda de lo que se está
	 * viendo. De paso cubren la franja donde el archivo se funde con la sección,
	 * que es el punto donde el cambio de tono se nota.
	 */
	.sv-flow {
		position: absolute;
		left: 0;
		right: 0;
		bottom: clamp(0.75rem, 2.5vw, 2.25rem);
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(9rem, 100%), 1fr));
		gap: 0.6rem;
	}

	/*
	 * Fondo propio y no solo borde: encima de la ilustración, una etiqueta
	 * transparente compite con los reflejos de las plataformas.
	 *
	 * `cursor: default` porque son rótulos, no párrafos. El cursor de texto
	 * invitaba a seleccionarlos como si fueran contenido que se lee, y a
	 * confundirlos con algo pulsable que no responde.
	 */
	.sv-flow-step {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.85rem 1.1rem;
		border: 1px solid rgba(127, 227, 245, 0.22);
		border-radius: var(--gl-r-sm);
		background: rgba(7, 26, 34, 0.74);
		backdrop-filter: blur(7px);
		font-weight: 600;
		cursor: default;
	}

	.sv-flow-n {
		font-family: var(--gl-font-label);
		font-size: 0.7rem;
		color: var(--sv-accent);
	}

	/* ── Diagnóstico ───────────────────────────────────── */

	.sv-diag {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		padding: clamp(3.5rem, 7vw, 5.5rem) 0;
		border-top: 1px solid var(--sv-rule);
		background: #071a22;
	}
	.sv-diag-aurora,
	.sv-diag-fade {
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
	}
	.sv-diag-fade {
		background:
			linear-gradient(
				180deg,
				#071a22 0%,
				rgba(7, 26, 34, 0) 26%,
				rgba(7, 26, 34, 0) 70%,
				#071a22 100%
			),
			radial-gradient(ellipse 60% 55% at 50% 60%, rgba(3, 10, 7, 0.5), transparent 75%);
	}

	/* La calificación y el formulario van EN PARALELO, no uno tras otro: quien ya
	   se reconoció en la primera lista no debería tener que pasar por encima de
	   ella otra vez para llegar a escribir. */
	.sv-diag-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: clamp(2rem, 5vw, 4rem);
		align-items: start;
	}

	.sv-diag-sub {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.9rem;
	}
	.sv-diag-sub + * + .sv-diag-sub,
	.sv-diag-sub:not(:first-child) {
		margin-top: 2rem;
	}

	.sv-diag-casos {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.65rem;
	}
	.sv-diag-casos li {
		position: relative;
		padding-left: 1.5rem;
		color: var(--sv-text-muted);
		line-height: 1.55;
	}
	/* Una marca de verificación dibujada con dos bordes: es la lista del «esto me
	   pasa a mí», y un punto neutro no dice lo mismo que una palomita. */
	.sv-diag-casos li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.42em;
		width: 0.42rem;
		height: 0.7rem;
		border: solid var(--sv-accent);
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	.sv-diag-frentes {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}
	.sv-diag-frentes li {
		padding: 0.38rem 0.7rem;
		border: 1px solid var(--sv-rule);
		border-radius: var(--gl-r-pill);
		font-size: 0.78rem;
		color: var(--sv-text-muted);
		cursor: default;
	}

	/* ── Formulario ────────────────────────────────────── */

	.sv-form {
		display: grid;
		gap: 1rem;
		padding: clamp(1.5rem, 3vw, 2.25rem);
		border: 1px solid var(--sv-rule);
		border-radius: var(--gl-r-md);
		background: rgba(127, 227, 245, 0.035);
	}

	.sv-form-fila {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(11rem, 100%), 1fr));
		gap: 1rem;
	}

	.sv-form-campo {
		display: grid;
		gap: 0.4rem;
	}
	.sv-form-campo label {
		font-family: var(--gl-font-label);
		font-size: 0.62rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--sv-text-faint);
	}
	.sv-form-campo label span {
		color: var(--sv-accent);
	}

	.sv-form input,
	.sv-form textarea {
		width: 100%;
		padding: 0.7rem 0.85rem;
		border: 1px solid var(--sv-rule);
		border-radius: var(--gl-r-sm);
		background: rgba(4, 14, 19, 0.55);
		color: var(--sv-text);
		font: inherit;
		transition:
			border-color 0.25s var(--gl-ease),
			box-shadow 0.25s var(--gl-ease);
	}
	.sv-form textarea {
		resize: vertical;
		min-height: 7rem;
	}
	/* El foco se marca con anillo y no solo con color: quien navega con teclado
	   tiene que ver dónde está sin depender de distinguir dos azules. */
	.sv-form input:focus-visible,
	.sv-form textarea:focus-visible {
		outline: none;
		border-color: var(--sv-accent);
		box-shadow: 0 0 0 3px rgba(127, 227, 245, 0.22);
	}
	.sv-form input[aria-invalid='true'],
	.sv-form textarea[aria-invalid='true'] {
		border-color: #f0a4a4;
	}
	.sv-form input:disabled,
	.sv-form textarea:disabled {
		opacity: 0.6;
	}

	.sv-form-nota {
		margin: -0.4rem 0 0;
		font-size: 0.78rem;
		color: var(--sv-text-faint);
	}

	.sv-form-error {
		margin: 0;
		font-size: 0.8rem;
		color: #f0a4a4;
	}
	.sv-form-error--general {
		padding: 0.6rem 0.8rem;
		border: 1px solid rgba(240, 164, 164, 0.35);
		border-radius: var(--gl-r-sm);
		background: rgba(240, 164, 164, 0.08);
	}

	.sv-form-acuse {
		margin: 0;
		padding: 0.7rem 0.9rem;
		border-radius: var(--gl-r-sm);
		font-size: 0.88rem;
		border: 1px solid rgba(240, 164, 164, 0.35);
		background: rgba(240, 164, 164, 0.08);
		color: #f0a4a4;
	}
	.sv-form-acuse--ok {
		border-color: rgba(127, 227, 245, 0.35);
		background: rgba(127, 227, 245, 0.08);
		color: var(--sv-accent);
	}

	.sv-form .sv-btn {
		justify-self: start;
	}

	/* ── Cierre ────────────────────────────────────────── */

	.sv-close {
		overflow: hidden;
		padding: clamp(3.5rem, 7vw, 5.5rem) 0;
		border-top: 1px solid var(--sv-rule);
		background:
			radial-gradient(ellipse at 50% 100%, rgba(8, 131, 160, 0.22), transparent 62%), var(--sv-bg);
	}

	/* Dos columnas: el texto ocupaba la mitad izquierda y la derecha quedaba
	   vacía. El despiece no rellena el hueco, lo justifica: es lo que el párrafo
	   afirma que construimos. */
	.sv-close-inner {
		display: grid;
		grid-template-columns: minmax(0, 0.44fr) minmax(0, 0.56fr);
		gap: clamp(1.25rem, 3vw, 2.5rem);
		align-items: center;
		/*
		 * La perspectiva vive en el contenedor y no en la figura: puesta en el
		 * propio elemento que rota, cada punto se proyecta desde su propio centro y
		 * el giro se lee plano, como un naipe girando en dos dimensiones.
		 *
		 * Y va LEJOS. Cuanto más cerca está el punto de vista, más se abre el
		 * trapecio al girar, y ese trapecio es lo que delata que detrás no hay un
		 * objeto sino una lámina. A 2400 px la deformación es casi un
		 * desplazamiento lateral.
		 */
		perspective: 2400px;
	}

	.sv-close-figura {
		margin: 0;
		/*
		 * Ya no hace falta tirar de ella hacia la izquierda: el archivo venía con
		 * un 36.9% de aire transparente en ese lado y se recortó en origen, que es
		 * donde estaba el problema. Solo conserva la salida por la derecha, porque
		 * el despiece vuela hacia afuera y cortarlo contra un margen invisible lo
		 * detendría en seco. El recorte lo pone la sección, no el viewport.
		 */
		margin-right: clamp(-5rem, -4vw, 0rem);

		/*
		 * Gira con el puntero, solo en horizontal y poco.
		 *
		 * Al rotar una imagen plana sobre su centro, sus dos mitades se desplazan
		 * en sentidos opuestos: eso es lo que delata que es una lámina, y a diez
		 * grados era lo primero que se veía. Cuatro bastan para que se lea como un
		 * cambio de punto de vista.
		 *
		 * El giro va acompañado de un desplazamiento lateral en el mismo sentido, y
		 * ahí está el truco: el desplazamiento mueve la pieza ENTERA hacia un lado,
		 * así que la mitad que el giro traía hacia el espectador ya no retrocede.
		 * Deja de haber dos mitades contradiciéndose, que es lo que se leía como
		 * papel doblándose.
		 *
		 * Sin inclinación vertical: un despiece visto de lado no cabecea, y el
		 * cabeceo era la mitad del delator.
		 *
		 * El sentido es el de mover la CÁMARA y no el objeto, igual que la
		 * fotografía del hero se desplaza en contra del cursor.
		 */
		transform: rotateY(calc(var(--px, 0) * -4deg)) translateX(calc(var(--px, 0) * -12px));
		transform-style: preserve-3d;
		transition: transform 0.55s var(--gl-ease);
		will-change: transform;
	}
	.sv-close-figura img {
		display: block;
		width: 100%;
		height: auto;
	}

	.sv-close-title {
		max-width: 24ch;
	}

	.sv-close-sub {
		margin-bottom: 2rem;
	}

	.sv-close-actions {
		margin: 0;
	}

	/* ── Responsive ────────────────────────────────────── */

	@media (max-width: 900px) {
		/* A una columna: el árbol no cabe al costado y el texto necesita el ancho.
		   La foto sigue detrás, con el velo más cerrado para que el titular aguante
		   sobre la ventana de la ciudad. */
		.sv-hero-inner {
			grid-template-columns: 1fr;
			padding-right: max(2rem, calc((100% - 1180px) / 2));
		}
		.sv-hero-velo {
			background: linear-gradient(
				180deg,
				rgba(0, 12, 21, 0.62) 0%,
				rgba(0, 12, 21, 0.45) 30%,
				rgba(0, 12, 21, 0.88) 100%
			);
		}

		/*
		 * El panal se apila sobre su detalle en vez de caer a otra interfaz: a este
		 * ancho un panal con panel al costado no existe, pero el panal mismo sí
		 * cabe si se encoge. Degradar a una lista dejaría a la mitad del tráfico
		 * sin el único cambio que arregla la sección.
		 */

		/*
		 * La banda NO se centra. Centrar una promesa de una línea es tolerable;
		 * centrar treinta y ocho etiquetas taxonómicas las vuelve ilegibles, porque
		 * el ojo pierde el borde izquierdo con el que las recorre.
		 */

		.sv-close-inner,
		.sv-diag-grid {
			grid-template-columns: 1fr;
		}
		.sv-close-figura {
			margin-right: 0;
		}

		/* Las puertas se apilan: a este ancho el texto y su prueba no caben uno al
		   lado del otro sin que los dos queden estrechos. */
		.sv-door {
			grid-template-columns: 1fr;
		}

		/* El montaje del Innovation Lab se deshace. Aquí la ilustración mide la
		   mitad de alto y las cinco fases necesitan dos o tres filas: encima de
		   ella no caben, y el texto tampoco tiene banda vacía donde apoyarse. */
		.sv-lab-copy {
			margin-bottom: 1.75rem;
		}

		.sv-flow {
			position: static;
			margin-top: 1rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		/* Solo el pulso se oculta. La lista de antes metía aquí las propias filas
		   junto al pulso, así que con la preferencia activada la sección
		   desaparecía entera en vez de quedarse quieta. */

		.sv-btn {
			transition: none;
		}

		/* La celda encendida se distingue por la ilustración a plena luz, no por
		   crecer: el cambio de tamaño es movimiento y aquí sobra. */

		/* Y el relevo entre capacidades es instantáneo: el JS ya se salta el
		   desvanecido, aquí se quita lo que quedaría del lado del CSS. */

		.sv-btn--primary:hover {
			transform: none;
		}
	}

	/* ── Capacidades en bento ─────────────────────────── */
	.sv-caps {
		padding: clamp(3.5rem, 7vw, 6rem) 0;
	}
	.sv-caps-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
	}
	.sv-cap {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.5rem;
		border: 1px solid var(--sv-rule);
		border-radius: var(--gl-r-md);
		background:
			radial-gradient(ellipse 80% 60% at 100% 0%, rgba(127, 227, 245, 0.08), transparent 70%),
			var(--sv-bg-2);
		transition:
			border-color 0.3s ease,
			transform 0.3s ease;
	}
	.sv-cap:hover {
		border-color: rgba(127, 227, 245, 0.35);
		transform: translateY(-3px);
	}
	.sv-cap--ancha {
		grid-column: span 2;
	}
	.sv-cap-num {
		margin: 0;
		font-family: var(--gl-font-label);
		font-size: 0.8rem;
		color: var(--sv-accent);
	}
	.sv-cap-title {
		margin: 0;
		font-size: 1.25rem;
		color: var(--sv-text, #f4f1e8);
	}
	.sv-cap-promise {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--sv-text-muted);
	}
	.sv-cap-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0.2rem 0 0;
		padding: 0;
		list-style: none;
	}
	.sv-cap-chips li {
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		background: rgba(127, 227, 245, 0.08);
		font-size: 0.78rem;
		color: var(--sv-text-muted);
	}
	.sv-cap-grupo {
		margin: 0.8rem 0 0.2rem;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--sv-text, #f4f1e8);
	}

	/* ── Etapas: lo que recibes ───────────────────────── */
	.sv-flow-txt {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.sv-flow-txt small {
		font-size: 0.74rem;
		font-weight: 500;
		color: var(--sv-text-muted);
	}

	/* ── Prueba: nuestros productos ───────────────────── */
	.sv-pruebas {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 1.4rem 0 1.6rem;
		padding: 0;
		list-style: none;
	}
	.sv-prueba {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.6rem 0.9rem 0.6rem 0.6rem;
		border: 1px solid var(--sv-rule);
		border-radius: 14px;
		background: rgba(7, 26, 34, 0.7);
		text-decoration: none;
		transition: border-color 0.3s ease;
	}
	.sv-prueba:hover {
		border-color: rgba(127, 227, 245, 0.45);
	}
	.sv-prueba img {
		width: 34px;
		height: 34px;
		object-fit: contain;
	}
	.sv-prueba strong {
		display: block;
		font-size: 0.95rem;
		color: var(--sv-text, #f4f1e8);
	}
	.sv-prueba small {
		font-size: 0.75rem;
		color: var(--sv-text-muted);
	}

	/* ── Preguntas frecuentes ─────────────────────────── */
	.sv-faq {
		padding: clamp(3.5rem, 7vw, 6rem) 0 clamp(2rem, 4vw, 3rem);
	}
	.sv-faq-inner {
		display: grid;
		grid-template-columns: minmax(0, 0.38fr) minmax(0, 0.62fr);
		gap: clamp(1.5rem, 4vw, 4rem);
		align-items: start;
	}
	.sv-faq-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.sv-faq-item {
		padding: 1rem 1.2rem;
		border: 1px solid var(--sv-rule);
		border-radius: var(--gl-r-sm);
		background: var(--sv-bg-2);
	}
	.sv-faq-item summary {
		cursor: pointer;
		font-weight: 600;
		color: var(--sv-text, #f4f1e8);
	}
	.sv-faq-item p {
		margin: 0.6rem 0 0;
		line-height: 1.6;
		color: var(--sv-text-muted);
	}

	@media (max-width: 960px) {
		.sv-caps-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.sv-faq-inner {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 600px) {
		.sv-caps-grid {
			grid-template-columns: 1fr;
		}
		.sv-cap--ancha {
			grid-column: auto;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sv-cap {
			transition: none;
		}
	}

	/* ── CTO por horas: núcleo vivo ───────────────────── */
	.sv-cto {
		margin: 0;
	}
	.sv-cto-escena {
		position: relative;
		height: 220px;
		border-radius: var(--gl-r-md);
		background: radial-gradient(
			ellipse 60% 70% at 50% 62%,
			rgba(127, 227, 245, 0.12),
			transparent 70%
		);
	}
	.sv-cto-lineas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.sv-cto-lineas line {
		stroke: rgba(127, 227, 245, 0.25);
		stroke-width: 1;
		stroke-dasharray: 3 5;
		animation: sv-cto-flujo 1.4s linear infinite;
		transition: stroke 0.4s ease;
	}
	.sv-cto-lineas line.on {
		stroke: rgba(0, 255, 198, 0.85);
	}
	@keyframes sv-cto-flujo {
		to {
			stroke-dashoffset: -16;
		}
	}
	.sv-cto-nucleo {
		position: absolute;
		left: 50%;
		top: 59%;
		display: grid;
		place-items: center;
		width: 74px;
		height: 74px;
		translate: -50% -50%;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #c9f7ff, #38c9e6 45%, #0a5b6e 100%);
		box-shadow:
			0 0 30px rgba(56, 232, 255, 0.6),
			0 0 80px rgba(56, 232, 255, 0.25);
		font-family: var(--gl-font-label);
		font-size: 1rem;
		color: #04222b;
		animation: sv-cto-latido 3.2s ease-in-out infinite;
	}
	@keyframes sv-cto-latido {
		50% {
			box-shadow:
				0 0 44px rgba(56, 232, 255, 0.8),
				0 0 110px rgba(56, 232, 255, 0.35);
		}
	}
	.sv-cto-anillo {
		position: absolute;
		left: 50%;
		top: 59%;
		width: 120px;
		height: 120px;
		translate: -50% -50%;
		border: 1px solid rgba(127, 227, 245, 0.35);
		border-top-color: rgba(0, 255, 198, 0.9);
		border-radius: 50%;
		animation: sv-cto-gira 6s linear infinite;
	}
	.sv-cto-anillo--2 {
		width: 160px;
		height: 160px;
		border-color: rgba(127, 227, 245, 0.15);
		border-left-color: rgba(127, 227, 245, 0.6);
		animation-duration: 10s;
		animation-direction: reverse;
	}
	@keyframes sv-cto-gira {
		to {
			rotate: 360deg;
		}
	}
	.sv-cto-frente {
		position: absolute;
		left: var(--x);
		top: var(--y);
		translate: -50% -50%;
		padding: 0.4rem 0.8rem;
		border-radius: 999px;
		background: rgba(7, 26, 34, 0.9);
		box-shadow: inset 0 0 0 1px rgba(127, 227, 245, 0.3);
		font-family: var(--gl-font-label);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--sv-text-muted);
		transition:
			box-shadow 0.4s ease,
			color 0.4s ease;
	}
	.sv-cto-frente.on {
		color: #fff;
		box-shadow:
			inset 0 0 0 1px rgba(0, 255, 198, 0.9),
			0 0 22px rgba(0, 255, 198, 0.4);
	}
	/* La frase sale del núcleo y viaja hasta su frente. */
	.sv-cto-consejo {
		position: absolute;
		z-index: 2;
		max-width: 62%;
		padding: 0.45rem 0.8rem;
		border-radius: 12px;
		background: rgba(0, 40, 30, 0.92);
		box-shadow: inset 0 0 0 1px rgba(0, 255, 198, 0.5);
		font-size: 0.82rem;
		font-style: italic;
		color: #e6fff7;
		white-space: nowrap;
		translate: -50% -50%;
		animation: sv-cto-viaje 3.2s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	@keyframes sv-cto-viaje {
		0% {
			left: 50%;
			top: 59%;
			opacity: 0;
			scale: 0.6;
		}
		15% {
			opacity: 1;
			scale: 1;
		}
		45%,
		80% {
			left: clamp(22%, var(--tx), 78%);
			top: calc(var(--ty) + 16%);
			opacity: 1;
		}
		100% {
			left: clamp(22%, var(--tx), 78%);
			top: calc(var(--ty) + 16%);
			opacity: 0;
		}
	}
	.sv-cto-pie {
		margin-top: 0.8rem;
		font-size: 0.8rem;
		text-align: center;
		color: var(--sv-text-muted);
	}

	/* ── Capacidades: botón y panel de detalle ────────── */
	.sv-caps-grid {
		align-items: start;
	}
	.sv-cap.is-abierta {
		border-color: rgba(127, 227, 245, 0.6);
		box-shadow: 0 0 0 1px rgba(127, 227, 245, 0.25);
	}
	.sv-cap-ver {
		align-self: flex-start;
		margin-top: 0.4rem;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--sv-accent);
		cursor: pointer;
	}
	.sv-cap-ver:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.sv-cap-panel-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.4rem 2rem;
	}
	.sv-cap-lista {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sv-cap-lista li {
		position: relative;
		padding: 0.22rem 0 0.22rem 0.95rem;
		font-size: 0.86rem;
		line-height: 1.45;
		color: var(--sv-text-muted);
	}
	.sv-cap-lista li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.72rem;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--sv-accent);
	}

	/* ── Cómo trabajamos: la cámara se acerca a cada etapa ── */
	.sv-lab-lienzo img.sv-lab-zoom {
		transform-origin: var(--x) var(--y);
		transform: scale(1.55);
		filter: brightness(1.08) saturate(1.1);
	}
	.sv-flow-step {
		transition:
			border-color 0.4s ease,
			box-shadow 0.4s ease;
	}
	.sv-flow-step.is-on {
		border-color: rgba(0, 255, 198, 0.8);
		box-shadow: 0 0 24px rgba(0, 255, 198, 0.25);
	}

	/* ── Cierre: el despiece flota ────────────────────── */
	.sv-close-figura img {
		animation: sv-flota 6s ease-in-out infinite;
	}
	@keyframes sv-flota {
		50% {
			translate: 0 -12px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sv-cto-lineas line,
		.sv-cto-nucleo,
		.sv-cto-anillo,
		.sv-cto-consejo,
		.sv-close-figura img {
			animation: none;
		}
		.sv-lab-lienzo img {
			transition: none;
		}
	}

	/* ── Ventana de detalle técnico ───────────────────── */
	.sv-modal {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: grid;
		place-items: center;
		padding: clamp(1rem, 4vw, 3rem);
		background: rgba(2, 10, 14, 0.62);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}
	.sv-modal-card {
		position: relative;
		width: min(1040px, 100%);
		max-height: min(86vh, 900px);
		overflow-y: auto;
		padding: clamp(1.6rem, 3.5vw, 2.8rem);
		border: 1px solid rgba(127, 227, 245, 0.35);
		border-radius: 24px;
		background:
			radial-gradient(ellipse 60% 50% at 0% 0%, rgba(127, 227, 245, 0.12), transparent 70%),
			var(--sv-bg-2);
		box-shadow:
			0 40px 120px rgba(0, 0, 0, 0.6),
			0 0 0 1px rgba(127, 227, 245, 0.08);
	}
	.sv-modal-cerrar {
		position: sticky;
		top: 0;
		float: right;
		width: 40px;
		height: 40px;
		border: 1px solid var(--sv-rule);
		border-radius: 50%;
		background: rgba(7, 26, 34, 0.9);
		font-size: 1rem;
		color: var(--sv-text, #f4f1e8);
		cursor: pointer;
	}
	.sv-modal-cerrar:hover {
		border-color: rgba(127, 227, 245, 0.6);
	}
	.sv-modal-title {
		margin: 0.3rem 0 0.6rem;
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		color: var(--sv-text, #f4f1e8);
	}
	.sv-modal-promise {
		margin: 0 0 0.6rem;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--sv-accent);
	}
	.sv-modal-intro {
		max-width: 70ch;
		margin: 0 0 1.8rem;
		line-height: 1.65;
		color: var(--sv-text-muted);
	}
	.sv-modal-pie {
		margin-top: 2rem;
		padding-top: 1.4rem;
		border-top: 1px solid var(--sv-rule);
	}
</style>
