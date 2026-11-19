<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import './nexus.css';

	let scrollY = $state(0);
	let faqTab = $state('familias');
	let openFaq = $state({ familias: null, flotillas: null, partners: null });
	let heroReady = $state(false);

	// Audience selector
	let selectedAudience = $state(null);
	let hoveredPanel = $state(null);
	let contentEl = $state(null);
	let selectorEl = $state(null);
	let isMobile = $state(false);

	const panelVideos = {
		familias: '/img/products/nexus/familia.mp4',
		flotillas: '/img/products/nexus/empresas.mp4',
		partners: '/img/products/nexus/taas-2.mp4'
	};

	const preloadedVideos = new SvelteSet();

	function preloadVideo(segment) {
		const src = panelVideos[segment];
		if (!src || preloadedVideos.has(src)) return;
		preloadedVideos.add(src);
		const link = document.createElement('link');
		link.rel = 'preload';
		link.as = 'video';
		link.href = src;
		document.head.appendChild(link);
	}

	async function selectPanel(segment) {
		if (selectedAudience === segment) {
			selectedAudience = null;
			return;
		}
		selectedAudience = segment;
		await tick();
		selectorEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function handlePanelMove(event, panelEl) {
		const rect = panelEl.getBoundingClientRect();
		panelEl.style.setProperty('--mx', `${event.clientX - rect.left}px`);
		panelEl.style.setProperty('--my', `${event.clientY - rect.top}px`);
	}

	let heroVideoEl = $state(null);
	const VIDEO_LOOP_PAUSE = 4000; // ms pause before replay

	function handleVideoEnd() {
		setTimeout(() => {
			if (heroVideoEl) {
				heroVideoEl.currentTime = 0;
				heroVideoEl.play();
			}
		}, VIDEO_LOOP_PAUSE);
	}

	let heroOpacity = $derived.by(() => {
		if (typeof window === 'undefined') return 1;
		const ih = window.innerHeight;
		if (scrollY < ih * 0.15) return 1;
		if (scrollY < ih * 0.85) return 1 - (scrollY - ih * 0.15) / (ih * 0.7);
		return 0;
	});

	const faqData = {
		familias: [
			{
				q: '¿Mi familiar va a saber que lo estoy rastreando?',
				a: 'Nexus te da control total sobre la visibilidad del monitoreo. Puedes configurarlo para que la persona monitorizada reciba una notificación (modo transparente) o para que el seguimiento sea discreto. La decisión es completamente tuya.'
			},
			{
				q: '¿Qué pasa si desconectan o retiran el dispositivo?',
				a: 'Nexus genera una alerta automática cuando el dispositivo pierde alimentación de forma inesperada. Recibes la última posición registrada y el momento exacto en que ocurrió. No hay forma de desconectarlo silenciosamente.'
			},
			{
				q: '¿Funciona con cualquier marca o modelo de auto?',
				a: 'Compatible con cualquier vehículo con puerto OBD-II, que incluye prácticamente todos los autos fabricados a partir del año 2000, sin importar la marca.'
			},
			{
				q: '¿Cuántos vehículos puedo tener en mi cuenta familiar?',
				a: 'Una sola cuenta Nexus puede gestionar múltiples vehículos al mismo tiempo, con alertas configuradas de forma independiente para cada uno.'
			}
		],
		flotillas: [
			{
				q: '¿Puedo exportar los reportes sin que el equipo acceda al sistema completo?',
				a: 'Sí. Los reportes son exportables en PDF y Excel, y puedes programarlos para que lleguen automáticamente por correo. Los destinatarios no necesitan cuenta en la plataforma.'
			},
			{
				q: '¿Cuántos administradores o roles distintos puede tener mi cuenta?',
				a: 'Sin límite restrictivo. Los permisos son configurables por rol y por vehículo individual: administrador general, supervisores regionales, operadores con vista limitada y clientes con acceso específico.'
			},
			{
				q: '¿Se puede integrar con nuestro ERP o sistema logístico?',
				a: 'Nexus cuenta con API disponible para clientes de flotilla. El alcance de la integración depende de tu sistema; nuestro equipo técnico evalúa cada caso durante la demo.'
			},
			{
				q: '¿Qué pasa si una unidad opera en zonas sin señal celular?',
				a: 'El dispositivo almacena los datos localmente y los sincroniza automáticamente al recuperar señal. El historial de ruta queda completo, sin huecos en el mapa.'
			}
		],
		partners: [
			{
				q: '¿Qué hardware es compatible con la integración TaaS?',
				a: 'Cualquier dispositivo capaz de transmitir latitud, longitud y timestamp en formato JSON vía HTTP o MQTT. Nuestro equipo valida la compatibilidad en la primera sesión técnica.'
			},
			{
				q: '¿Cómo se protegen los datos de los clientes finales?',
				a: 'TLS en tránsito y AES-256 en reposo. Los datos son tuyos — no los compartimos con terceros. Firmamos NDA durante el onboarding y la retención de datos es configurable por cuenta.'
			},
			{
				q: '¿Cuánto tiempo toma poner la primera integración en producción?',
				a: 'Un equipo técnico con experiencia básica en APIs completa la integración de datos en 1 a 3 días hábiles. La configuración de marca blanca toma 1 a 2 días adicionales.'
			}
		]
	};

	function toggleFaq(tab, idx) {
		openFaq[tab] = openFaq[tab] === idx ? null : idx;
	}

	onMount(() => {
		setTimeout(() => {
			heroReady = true;
		}, 150);

		const mq = window.matchMedia('(max-width: 767px)');
		isMobile = mq.matches;
		mq.addEventListener('change', (e) => {
			isMobile = e.matches;
		});

		const observer = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add('is-visible');
						observer.unobserve(e.target);
					}
				}),
			{ threshold: 0, rootMargin: '0px 0px 60px 0px' }
		);
		document.querySelectorAll('.nx-reveal').forEach((el) => observer.observe(el));

		return () => {
			observer.disconnect();
		};
	});
</script>

<svelte:window bind:scrollY />

<svelte:head>
	<title>Nexus by Geminis Labs — Inteligencia Vehicular en Tiempo Real</title>
	<meta
		name="description"
		content="Plataforma de inteligencia vehicular en tiempo real para familias, flotillas y partners TaaS. Rastreo GPS, telemetría, geocercas de precisión y apps nativas. Nexus by Geminis Labs."
	/>
	<!-- Preload audience panel images — visible above the fold on scroll -->
	<link rel="preload" as="image" href="/img/products/nexus/familia.png" />
	<link rel="preload" as="image" href="/img/products/nexus/empresas.png" />
	<link rel="preload" as="image" href="/img/products/nexus/taas.png" />
</svelte:head>

<div class="nx-page-wrap">
	<Navbar />
	<main class="nx-page">
		<!-- HERO -->
		<section class="nx-hero">
			<!-- Video background -->
			<video
				bind:this={heroVideoEl}
				class="nx-hero-video"
				src="/vid/nexus-animation.mp4"
				muted
				playsinline
				autoplay
				onended={handleVideoEnd}
				aria-hidden="true"
			></video>

			<!-- Dark overlay for text legibility -->
			<div class="nx-hero-overlay" aria-hidden="true"></div>

			<!-- Subtle coordinate grid on top -->
			<div class="nx-hero-grid" aria-hidden="true"></div>

			<div class="nx-hero-inner">
				<!-- Centered text block -->
				<div class="nx-hero-content" style="opacity: {heroOpacity}" class:nx-hero-ready={heroReady}>
					<div class="nx-hero-status">
						<span class="nx-status-dot"></span>
						RASTREO · ALERTAS · TELEMETRÍA
					</div>
					<h1 class="nx-hero-title">Tu vehículo no debería<br />desaparecer de tu control.</h1>
					<p class="nx-hero-sub">
						Nexus te muestra dónde está, cómo se mueve y qué está pasando — en tiempo real, desde
						iPhone, Android y Web.
					</p>
					<div class="nx-hero-actions">
						<a href="/#contacto" class="btn-nx-primary">Hablar con un asesor</a>
						<a href="#app" class="btn-nx-ghost">Ver cómo funciona Nexus</a>
					</div>
				</div>

				<!-- radar removed — video background carries the visual -->
				<div class="nx-radar-wrap" aria-hidden="true" style="display:none">
					<svg
						class="nx-radar-svg"
						viewBox="0 0 560 560"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<defs>
							<radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
								<stop offset="0%" stop-color="#00f3ff" stop-opacity="0.18" />
								<stop offset="100%" stop-color="#00f3ff" stop-opacity="0" />
							</radialGradient>
							<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
								<feGaussianBlur stdDeviation="3" result="coloredBlur" />
								<feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge
								>
							</filter>
							<filter id="glowStrong" x="-100%" y="-100%" width="300%" height="300%">
								<feGaussianBlur stdDeviation="6" result="coloredBlur" />
								<feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge
								>
							</filter>
							<clipPath id="radarClip">
								<circle cx="280" cy="280" r="248" />
							</clipPath>
						</defs>

						<!-- Outer dashed ring -->
						<circle
							cx="280"
							cy="280"
							r="268"
							fill="none"
							stroke="rgba(0,243,255,0.06)"
							stroke-width="1"
							stroke-dasharray="4 8"
						/>
						<!-- Rings -->
						<circle
							cx="280"
							cy="280"
							r="240"
							fill="none"
							stroke="rgba(0,243,255,0.10)"
							stroke-width="1"
						/>
						<circle
							cx="280"
							cy="280"
							r="180"
							fill="none"
							stroke="rgba(0,243,255,0.14)"
							stroke-width="1"
						/>
						<circle
							cx="280"
							cy="280"
							r="120"
							fill="none"
							stroke="rgba(0,243,255,0.18)"
							stroke-width="1"
						/>
						<circle
							cx="280"
							cy="280"
							r="60"
							fill="none"
							stroke="rgba(0,243,255,0.22)"
							stroke-width="1"
						/>

						<!-- Range labels -->
						<text
							x="344"
							y="276"
							fill="rgba(0,243,255,0.28)"
							font-size="9"
							font-family="'Courier New',monospace">60m</text
						>
						<text
							x="404"
							y="276"
							fill="rgba(0,243,255,0.22)"
							font-size="9"
							font-family="'Courier New',monospace">120m</text
						>
						<text
							x="462"
							y="276"
							fill="rgba(0,243,255,0.18)"
							font-size="9"
							font-family="'Courier New',monospace">180m</text
						>

						<!-- Crosshairs -->
						<line
							x1="32"
							y1="280"
							x2="528"
							y2="280"
							stroke="rgba(0,243,255,0.07)"
							stroke-width="1"
						/>
						<line
							x1="280"
							y1="32"
							x2="280"
							y2="528"
							stroke="rgba(0,243,255,0.07)"
							stroke-width="1"
						/>
						<line
							x1="104"
							y1="104"
							x2="456"
							y2="456"
							stroke="rgba(0,243,255,0.03)"
							stroke-width="1"
						/>
						<line
							x1="456"
							y1="104"
							x2="104"
							y2="456"
							stroke="rgba(0,243,255,0.03)"
							stroke-width="1"
						/>

						<!-- Rotating sweep -->
						<g class="nx-sweep-group" clip-path="url(#radarClip)">
							<path
								d="M 280 280 L 528 280 A 248 248 0 0 0 365 47 Z"
								fill="url(#sweepGrad)"
								opacity="0.9"
							/>
							<line
								x1="280"
								y1="280"
								x2="528"
								y2="280"
								stroke="rgba(0,243,255,0.6)"
								stroke-width="1.5"
							/>
						</g>

						<!-- Asset dot 1 — VH-04 (green, moving) -->
						<g class="nx-dot-ping" style="--ping-delay:0s">
							<circle cx="392" cy="120" r="10" fill="rgba(0,255,136,0.07)" class="nx-ping-ring" />
							<circle cx="392" cy="120" r="5" fill="#00ff88" filter="url(#glow)" />
							<text
								x="402"
								y="115"
								fill="rgba(0,255,136,0.75)"
								font-size="9"
								font-family="'Courier New',monospace">VH-04 ●</text
							>
							<text
								x="402"
								y="126"
								fill="rgba(0,255,136,0.45)"
								font-size="8"
								font-family="'Courier New',monospace">87km/h</text
							>
						</g>

						<!-- Asset dot 2 — HOGAR (cyan, parked) -->
						<g class="nx-dot-ping" style="--ping-delay:0.7s">
							<circle cx="162" cy="335" r="9" fill="rgba(0,243,255,0.07)" class="nx-ping-ring" />
							<circle cx="162" cy="335" r="4.5" fill="#00f3ff" filter="url(#glow)" />
							<text
								x="88"
								y="330"
								fill="rgba(0,243,255,0.75)"
								font-size="9"
								font-family="'Courier New',monospace">● HOGAR</text
							>
							<text
								x="88"
								y="341"
								fill="rgba(0,243,255,0.45)"
								font-size="8"
								font-family="'Courier New',monospace">detenido</text
							>
						</g>

						<!-- Asset dot 3 — UT-12 (blue, moving) -->
						<g class="nx-dot-ping" style="--ping-delay:1.4s">
							<circle cx="115" cy="418" r="9" fill="rgba(10,122,255,0.08)" class="nx-ping-ring" />
							<circle cx="115" cy="418" r="4.5" fill="#0a7aff" filter="url(#glow)" />
							<text
								x="60"
								y="412"
								fill="rgba(10,122,255,0.75)"
								font-size="9"
								font-family="'Courier New',monospace">● UT-12</text
							>
							<text
								x="60"
								y="423"
								fill="rgba(10,122,255,0.45)"
								font-size="8"
								font-family="'Courier New',monospace">62km/h</text
							>
						</g>

						<!-- Asset dot 4 — VH-01 (green, geofenced) -->
						<g class="nx-dot-ping" style="--ping-delay:2.1s">
							<circle cx="294" cy="201" r="9" fill="rgba(0,255,136,0.06)" class="nx-ping-ring" />
							<circle cx="294" cy="201" r="4" fill="#00ff88" filter="url(#glow)" />
							<text
								x="304"
								y="197"
								fill="rgba(0,255,136,0.70)"
								font-size="9"
								font-family="'Courier New',monospace">VH-01</text
							>
							<text
								x="304"
								y="208"
								fill="rgba(0,255,136,0.40)"
								font-size="8"
								font-family="'Courier New',monospace">geocerca</text
							>
						</g>

						<!-- Asset dot 5 — VH-09 (cyan, moving fast) -->
						<g class="nx-dot-ping" style="--ping-delay:2.8s">
							<circle cx="388" cy="151" r="9" fill="rgba(0,243,255,0.05)" class="nx-ping-ring" />
							<circle cx="388" cy="151" r="4" fill="#00f3ff" filter="url(#glow)" />
							<text
								x="398"
								y="147"
								fill="rgba(0,243,255,0.65)"
								font-size="9"
								font-family="'Courier New',monospace">VH-09</text
							>
							<text
								x="398"
								y="158"
								fill="rgba(0,243,255,0.38)"
								font-size="8"
								font-family="'Courier New',monospace">101km/h</text
							>
						</g>

						<!-- Asset dot 6 — UT-03 (blue, delivery) -->
						<g class="nx-dot-ping" style="--ping-delay:3.5s">
							<circle cx="329" cy="430" r="9" fill="rgba(10,122,255,0.07)" class="nx-ping-ring" />
							<circle cx="329" cy="430" r="4" fill="#0a7aff" filter="url(#glow)" />
							<text
								x="339"
								y="426"
								fill="rgba(10,122,255,0.70)"
								font-size="9"
								font-family="'Courier New',monospace">UT-03</text
							>
							<text
								x="339"
								y="437"
								fill="rgba(10,122,255,0.40)"
								font-size="8"
								font-family="'Courier New',monospace">entrega</text
							>
						</g>

						<!-- Center pip -->
						<circle cx="280" cy="280" r="4" fill="#00f3ff" filter="url(#glowStrong)" />
						<circle
							cx="280"
							cy="280"
							r="9"
							fill="none"
							stroke="rgba(0,243,255,0.4)"
							stroke-width="1"
						/>
						<circle
							cx="280"
							cy="280"
							r="16"
							fill="none"
							stroke="rgba(0,243,255,0.15)"
							stroke-width="1"
						/>

						<!-- HUD corner brackets -->
						<path
							d="M 20 60 L 20 20 L 60 20"
							fill="none"
							stroke="rgba(0,243,255,0.3)"
							stroke-width="1.5"
						/>
						<path
							d="M 500 20 L 540 20 L 540 60"
							fill="none"
							stroke="rgba(0,243,255,0.3)"
							stroke-width="1.5"
						/>
						<path
							d="M 20 500 L 20 540 L 60 540"
							fill="none"
							stroke="rgba(0,243,255,0.3)"
							stroke-width="1.5"
						/>
						<path
							d="M 500 540 L 540 540 L 540 500"
							fill="none"
							stroke="rgba(0,243,255,0.3)"
							stroke-width="1.5"
						/>

						<!-- HUD labels -->
						<text
							x="28"
							y="40"
							fill="rgba(0,243,255,0.4)"
							font-size="8"
							font-family="'Courier New',monospace"
							letter-spacing="0.12em">NEXUS // TRACKING ARRAY</text
						>
						<text
							x="28"
							y="532"
							fill="rgba(0,243,255,0.3)"
							font-size="8"
							font-family="'Courier New',monospace">LAT 19.432° N</text
						>
						<text
							x="28"
							y="545"
							fill="rgba(0,243,255,0.3)"
							font-size="8"
							font-family="'Courier New',monospace">LON 99.133° W</text
						>
						<text
							x="390"
							y="532"
							fill="rgba(0,255,136,0.45)"
							font-size="8"
							font-family="'Courier New',monospace">ASSETS: 6 ACTIVE</text
						>
						<text
							x="390"
							y="545"
							fill="rgba(0,243,255,0.3)"
							font-size="8"
							font-family="'Courier New',monospace">SEÑAL: GPS · LTE</text
						>
					</svg>
				</div>
			</div>

			<div class="nx-scroll-cue" aria-hidden="true">
				<div class="nx-scroll-cue-line"></div>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
					><path d="M6 9l6 6 6-6" /></svg
				>
			</div>
		</section>

		<!-- AUDIENCE INTRO -->
		<div class="nx-aud-intro" id="audiencias">
			<p class="nx-aud-intro-eyebrow">TU PERFIL</p>
			<h2 class="nx-aud-intro-headline">No todos rastrean<br />por la misma <em>razón.</em></h2>
			<p class="nx-aud-intro-sub">Elige el perfil que más se acerca a tu caso de uso.</p>
		</div>

		<!-- AUDIENCE SELECTOR -->
		<section class="nx-audience-selector" aria-label="Selecciona tu perfil" bind:this={selectorEl}>
			<!-- Panel 1: Familias -->
			<div
				class="nx-panel nx-panel--familias"
				class:is-active={selectedAudience === 'familias'}
				class:is-hovered={hoveredPanel === 'familias'}
				class:is-dimmed={hoveredPanel !== null &&
					hoveredPanel !== 'familias' &&
					selectedAudience !== 'familias'}
				role="button"
				tabindex="0"
				aria-label="Familias"
				onclick={() => selectPanel('familias')}
				onkeydown={(e) => e.key === 'Enter' && selectPanel('familias')}
				onmousemove={(e) => handlePanelMove(e, e.currentTarget)}
				onmouseenter={() => {
					hoveredPanel = 'familias';
					preloadVideo('familias');
				}}
				onmouseleave={() => (hoveredPanel = null)}
			>
				{#if selectedAudience === 'familias' && !isMobile}
					<video class="nx-panel-video" src={panelVideos.familias} autoplay loop muted playsinline
					></video>
				{:else}
					<img
						class="nx-panel-img nx-panel-img--bw"
						src="/img/products/nexus/familia.png"
						alt=""
						aria-hidden="true"
					/>
					<img
						class="nx-panel-img nx-panel-img--color"
						src="/img/products/nexus/familia.png"
						alt="Familia junto a su vehículo"
					/>
				{/if}
				<div class="nx-panel-overlay">
					<span class="nx-panel-ordinal" aria-hidden="true">01</span>
					<div class="nx-panel-info">
						<span class="nx-panel-eyebrow">Familias</span>
						<p class="nx-panel-hook">Ya llegaste.<br />Ellos, todavía no.</p>
						<span class="nx-panel-live">
							<span class="nx-live-dot"></span>
							<span>Ubicación en tiempo real</span>
						</span>
					</div>
					<svg
						class="nx-panel-arrow"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg
					>
				</div>
			</div>

			<div
				class="nx-panel-divider"
				class:speed-streak={hoveredPanel !== null}
				aria-hidden="true"
			></div>

			<!-- Panel 2: Flotillas -->
			<div
				class="nx-panel nx-panel--flotillas"
				class:is-active={selectedAudience === 'flotillas'}
				class:is-hovered={hoveredPanel === 'flotillas'}
				class:is-dimmed={hoveredPanel !== null &&
					hoveredPanel !== 'flotillas' &&
					selectedAudience !== 'flotillas'}
				role="button"
				tabindex="0"
				aria-label="Flotillas"
				onclick={() => selectPanel('flotillas')}
				onkeydown={(e) => e.key === 'Enter' && selectPanel('flotillas')}
				onmousemove={(e) => handlePanelMove(e, e.currentTarget)}
				onmouseenter={() => {
					hoveredPanel = 'flotillas';
					preloadVideo('flotillas');
				}}
				onmouseleave={() => (hoveredPanel = null)}
			>
				{#if selectedAudience === 'flotillas' && !isMobile}
					<video class="nx-panel-video" src={panelVideos.flotillas} autoplay loop muted playsinline
					></video>
				{:else}
					<img
						class="nx-panel-img nx-panel-img--bw"
						src="/img/products/nexus/empresas.png"
						alt=""
						aria-hidden="true"
					/>
					<img
						class="nx-panel-img nx-panel-img--color"
						src="/img/products/nexus/empresas.png"
						alt="Flotilla de camiones en operación"
					/>
				{/if}
				<div class="nx-panel-overlay">
					<span class="nx-panel-ordinal" aria-hidden="true">02</span>
					<div class="nx-panel-info">
						<span class="nx-panel-eyebrow">Flotillas</span>
						<p class="nx-panel-hook">Sabes cuánto gastas.<br />Mentira.</p>
						<span class="nx-panel-live">
							<span class="nx-live-dot"></span>
							<span>Trayectos, alertas y reportes</span>
						</span>
					</div>
					<svg
						class="nx-panel-arrow"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg
					>
				</div>
			</div>

			<div
				class="nx-panel-divider"
				class:speed-streak={hoveredPanel !== null}
				aria-hidden="true"
			></div>

			<!-- Panel 3: Partners -->
			<div
				class="nx-panel nx-panel--partners"
				class:is-active={selectedAudience === 'partners'}
				class:is-hovered={hoveredPanel === 'partners'}
				class:is-dimmed={hoveredPanel !== null &&
					hoveredPanel !== 'partners' &&
					selectedAudience !== 'partners'}
				role="button"
				tabindex="0"
				aria-label="Partners & TaaS"
				onclick={() => selectPanel('partners')}
				onkeydown={(e) => e.key === 'Enter' && selectPanel('partners')}
				onmousemove={(e) => handlePanelMove(e, e.currentTarget)}
				onmouseenter={() => {
					hoveredPanel = 'partners';
					preloadVideo('partners');
				}}
				onmouseleave={() => (hoveredPanel = null)}
			>
				{#if selectedAudience === 'partners' && !isMobile}
					<video class="nx-panel-video" src={panelVideos.partners} autoplay loop muted playsinline
					></video>
				{:else}
					<img
						class="nx-panel-img nx-panel-img--bw"
						src="/img/products/nexus/taas.png"
						alt=""
						aria-hidden="true"
					/>
					<img
						class="nx-panel-img nx-panel-img--color"
						src="/img/products/nexus/taas.png"
						alt="Plataforma Nexus en múltiples dispositivos"
					/>
				{/if}
				<div class="nx-panel-overlay">
					<span class="nx-panel-ordinal" aria-hidden="true">03</span>
					<div class="nx-panel-info">
						<span class="nx-panel-eyebrow">Partners & TaaS</span>
						<p class="nx-panel-hook">Tu hardware.<br />Nuestra plataforma. Mañana.</p>
						<span class="nx-panel-live">
							<span class="nx-live-dot"></span>
							<span>Equipos Suntech y Queclink</span>
						</span>
					</div>
					<svg
						class="nx-panel-arrow"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg
					>
				</div>
			</div>
		</section>

		<!-- DYNAMIC AUDIENCE CONTENT -->
		{#if selectedAudience}
			<section class="nx-audience-content nx-aud--{selectedAudience}" bind:this={contentEl}>
				{#key selectedAudience}
					<div class="nx-aud-inner" in:fly={{ y: 28, duration: 380, easing: cubicOut }}>
						<div class="nx-aud-container">
							{#if selectedAudience === 'familias'}
								<div class="nx-aud-header">
									<span class="nx-aud-eyebrow nx-aud-eyebrow--familias">Para Familias</span>
									<h2 class="nx-aud-headline">
										Saber que llegaron bien<br />no debería ser un lujo.
									</h2>
									<p class="nx-aud-sub">
										Diseñas tu vida entera para protegerlos — Nexus hace lo mismo con sus vehículos.
									</p>
								</div>
								<div class="nx-callouts">
									<div class="nx-callout">
										<span class="nx-callout-num nx-cn--familias">2 AM</span>
										<span class="nx-callout-label">Alerta en tu muñeca</span>
										<p class="nx-callout-text">
											Cuando el carro se enciende a una hora en que nadie debería moverse, tú lo
											sabes primero. No el vecino, no la aseguradora. Tú.
										</p>
									</div>
									<div class="nx-callout">
										<span class="nx-callout-num nx-cn--familias">0 km</span>
										<span class="nx-callout-label">Margen de error</span>
										<p class="nx-callout-text">
											Geocercas con forma libre, no círculos que mienten. Tu hijo cruza la zona que
											acordaron — la notificación llega antes del siguiente semáforo.
										</p>
									</div>
									<div class="nx-callout">
										<span class="nx-callout-num nx-cn--familias">Historial</span>
										<span class="nx-callout-label">Que no se puede borrar</span>
										<p class="nx-callout-text">
											Replay completo: hora, ruta, paradas, velocidad. No para perseguirlos — para
											tener la conversación con datos, no con sospechas.
										</p>
									</div>
								</div>
								<div class="nx-aud-cta">
									<a href="/#contacto" class="btn-aud btn-aud--familias"
										>Quiero saber que llegaron bien</a
									>
									<p class="nx-cta-download-note">
										Descarga gratis: <a href="#download" class="nx-cta-link-sm">App Store</a> ·
										<a href="#download" class="nx-cta-link-sm">Google Play</a>
									</p>
								</div>
							{:else if selectedAudience === 'flotillas'}
								<div class="nx-aud-header">
									<span class="nx-aud-eyebrow nx-aud-eyebrow--flotillas">Para Flotillas</span>
									<h2 class="nx-aud-headline">
										Cada unidad que no ves<br />es dinero que ya perdiste.
									</h2>
									<p class="nx-aud-sub">
										El problema no es que tus conductores sean malos — es que nadie les está
										mostrando los números.
									</p>
								</div>
								<div class="nx-callouts">
									<div class="nx-callout">
										<span class="nx-callout-num nx-cn--flotillas">Combustible</span>
										<span class="nx-callout-label">El gasto invisible</span>
										<p class="nx-callout-text">
											El desvío de 3 km que nadie reporta, el ralentí de 40 minutos con el motor
											encendido. Nexus los detecta y te los presenta en tu correo antes de que abras
											la oficina.
										</p>
									</div>
									<div class="nx-callout">
										<span class="nx-callout-num nx-cn--flotillas">Datos</span>
										<span class="nx-callout-label">No intuiciones</span>
										<p class="nx-callout-text">
											Cuando el dato es objetivo, la conversación cambia. "VH-09 tuvo 4 paradas no
											programadas el martes." Los conductores se autorregulan solos.
										</p>
									</div>
									<div class="nx-callout">
										<span class="nx-callout-num nx-cn--flotillas">ROI</span>
										<span class="nx-callout-label">Encuentra dónde se va el dinero</span>
										<p class="nx-callout-text">
											Kilómetros innecesarios, tiempos detenidos y consumo fuera de lo esperado
											dejan de ser costos invisibles. Nexus los convierte en información para que
											puedas actuar sobre ellos.
										</p>
									</div>
								</div>
								<div class="nx-aud-cta">
									<a href="/#contacto" class="btn-aud btn-aud--flotillas"
										>Ver cómo funciona en mi operación</a
									>
								</div>
							{:else if selectedAudience === 'partners'}
								<div class="nx-aud-header">
									<span class="nx-aud-eyebrow nx-aud-eyebrow--partners">Partners & TaaS</span>
									<h2 class="nx-aud-headline">
										Tus clientes esperan una plataforma.<br />Tú tienes el hardware. Nosotros, el
										resto.
									</h2>
									<p class="nx-aud-sub">
										No construyas lo que ya existe — lanza tu servicio con marca propia esta semana.
									</p>
								</div>
								<div class="nx-callouts">
									<div class="nx-callout">
										<span class="nx-callout-num nx-cn--partners">3 días</span>
										<span class="nx-callout-label">A producción</span>
										<p class="nx-callout-text">
											Si tu dispositivo envía latitud, longitud y timestamp en JSON o MQTT, ya es
											compatible. Sin reescribir firmware, sin contratos de 18 meses.
										</p>
									</div>
									<div class="nx-callout">
										<span class="nx-callout-num nx-cn--partners">100%</span>
										<span class="nx-callout-label">Tu marca, nuestra infraestructura</span>
										<p class="nx-callout-text">
											Tus clientes ven tu nombre, tu logo, tu app. Nosotros mantenemos servidores,
											mapas, notificaciones, reportes, roles, AES-256 y soporte de plataforma. Tú
											cobras.
										</p>
									</div>
									<div class="nx-callout">
										<span class="nx-callout-num nx-cn--partners">18 meses</span>
										<span class="nx-callout-label">De desarrollo que no vas a gastar</span>
										<p class="nx-callout-text">
											Apps nativas iOS/Android, mapas, geocercas, telemetría, permisos, API,
											webhooks — Nexus TaaS elimina ese costo y ese riesgo de tu ecuación desde el
											día uno.
										</p>
									</div>
								</div>
								<div class="nx-aud-cta">
									<a href="/#contacto" class="btn-aud btn-aud--partners"
										>Hablar con el equipo técnico</a
									>
								</div>
							{/if}
						</div>
					</div>
				{/key}
			</section>
		{/if}

		<!-- APP GALLERY -->
		<section class="nx-gallery" id="app">
			<div class="nx-container">
				<div class="nx-section-header nx-reveal">
					<p class="nx-overline">La app en tus manos</p>
					<h2 class="nx-section-title">Descárgala. Úsala. Impresiona.</h2>
					<p class="nx-section-sub">
						GPS en vivo, historial de recorridos, geocercas de precisión y telemetría completa —
						todo en iOS y Android.
					</p>
				</div>

				<div class="nx-gallery-grid">
					<!-- Card 1: Live tracking -->
					<div class="nx-phone-card nx-reveal">
						<img
							src="/img/products/nexus/IMG_8745.PNG"
							alt="Rastreo en vivo — mapa con pin del vehículo KIA"
							loading="lazy"
						/>
						<div class="nx-phone-caption-wrap">
							<div class="nx-phone-caption">
								<span class="nx-phone-caption-title">Rastreo en vivo</span>
								<span class="nx-phone-caption-desc">Sabe dónde está, en este momento.</span>
							</div>
						</div>
					</div>

					<!-- Card 2: Route replay -->
					<div class="nx-phone-card nx-reveal">
						<img
							src="/img/products/nexus/IMG_8751.PNG"
							alt="Replay de recorrido con controles de reproducción"
							loading="lazy"
						/>
						<div class="nx-phone-caption-wrap">
							<div class="nx-phone-caption">
								<span class="nx-phone-caption-title">Replay de recorrido</span>
								<span class="nx-phone-caption-desc"
									>Reconstruye cualquier trayecto, al segundo.</span
								>
							</div>
						</div>
					</div>

					<!-- Card 3: Hexagonal geocerce — differentiator badge -->
					<div class="nx-phone-card nx-reveal" data-diff="01">
						<img
							src="/img/products/nexus/IMG_8746.PNG"
							alt="Crear Zona — geocercas hexagonales de precisión"
							loading="lazy"
						/>
						<div class="nx-phone-caption-wrap">
							<div class="nx-phone-caption">
								<span class="nx-phone-caption-title">Geocercas hexagonales</span>
								<span class="nx-phone-caption-desc">Zonas exactas. Cero falsas alarmas.</span>
							</div>
						</div>
					</div>

					<!-- Card 4: Telemetry dashboard -->
					<div class="nx-phone-card nx-reveal">
						<img
							src="/img/products/nexus/IMG_8747.PNG"
							alt="Dashboard de telemetría — distancia, combustible, tiempo"
							loading="lazy"
						/>
						<div class="nx-phone-caption-wrap">
							<div class="nx-phone-caption">
								<span class="nx-phone-caption-title">Telemetría completa</span>
								<span class="nx-phone-caption-desc"
									>Combustible, distancia, tiempo. De un vistazo.</span
								>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- FAQ -->
		<section class="nx-faq" id="preguntas">
			<div class="nx-container">
				<div class="nx-section-header nx-reveal">
					<p class="nx-overline">Respuestas claras</p>
					<h2 class="nx-section-title">Preguntas frecuentes</h2>
					<p class="nx-section-sub">Sin rodeos. Sin letra pequeña.</p>
				</div>

				<div class="nx-faq-tabs">
					<button
						class="nx-faq-tab"
						class:active={faqTab === 'familias'}
						onclick={() => {
							faqTab = 'familias';
						}}>Familias</button
					>
					<button
						class="nx-faq-tab"
						class:active={faqTab === 'flotillas'}
						onclick={() => {
							faqTab = 'flotillas';
						}}>Flotillas</button
					>
					<button
						class="nx-faq-tab"
						class:active={faqTab === 'partners'}
						onclick={() => {
							faqTab = 'partners';
						}}>Partners</button
					>
				</div>

				<div class="nx-faq-list">
					{#each faqData[faqTab] as item, i (item.q)}
						<div class="nx-faq-item" class:is-open={openFaq[faqTab] === i}>
							<button
								class="nx-faq-q"
								onclick={() => toggleFaq(faqTab, i)}
								aria-expanded={openFaq[faqTab] === i}
							>
								<span>{item.q}</span>
								<span class="nx-faq-chevron">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										width="18"
										height="18"
									>
										<path d="M6 9l6 6 6-6" />
									</svg>
								</span>
							</button>
							<div class="nx-faq-a">
								<p>{item.a}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- CTA SECTION -->
		<section class="nx-ctas" id="demo">
			<!-- Layered premium background -->
			<div class="nx-ctas-bg" aria-hidden="true">
				<div class="nx-ctas-depth"></div>
				<div class="nx-ctas-dotgrid"></div>
				<svg class="nx-ctas-net" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice">
					<line
						x1="120"
						y1="80"
						x2="310"
						y2="190"
						stroke="rgba(0,166,192,0.08)"
						stroke-width="0.6"
					/>
					<line
						x1="310"
						y1="190"
						x2="560"
						y2="130"
						stroke="rgba(0,166,192,0.06)"
						stroke-width="0.6"
					/>
					<line
						x1="560"
						y1="130"
						x2="780"
						y2="260"
						stroke="rgba(62,193,40,0.07)"
						stroke-width="0.6"
					/>
					<line
						x1="780"
						y1="260"
						x2="1050"
						y2="160"
						stroke="rgba(0,166,192,0.07)"
						stroke-width="0.6"
					/>
					<line
						x1="310"
						y1="190"
						x2="480"
						y2="360"
						stroke="rgba(0,166,192,0.05)"
						stroke-width="0.5"
					/>
					<line
						x1="480"
						y1="360"
						x2="700"
						y2="400"
						stroke="rgba(62,193,40,0.05)"
						stroke-width="0.5"
					/>
					<line
						x1="700"
						y1="400"
						x2="900"
						y2="320"
						stroke="rgba(0,166,192,0.05)"
						stroke-width="0.5"
					/>
					<line
						x1="900"
						y1="320"
						x2="1050"
						y2="160"
						stroke="rgba(0,166,192,0.06)"
						stroke-width="0.5"
					/>
					<line
						x1="120"
						y1="80"
						x2="480"
						y2="360"
						stroke="rgba(62,193,40,0.03)"
						stroke-width="0.4"
						stroke-dasharray="4 6"
					/>
					<line
						x1="1050"
						y1="160"
						x2="1150"
						y2="380"
						stroke="rgba(0,166,192,0.05)"
						stroke-width="0.5"
					/>
					<circle cx="120" cy="80" r="3" fill="rgba(0,166,192,0.5)" />
					<circle cx="120" cy="80" r="7" fill="rgba(0,166,192,0.08)" />
					<circle cx="310" cy="190" r="3.5" fill="rgba(62,193,40,0.6)" />
					<circle cx="310" cy="190" r="9" fill="rgba(62,193,40,0.07)" />
					<circle cx="560" cy="130" r="2.5" fill="rgba(0,166,192,0.4)" />
					<circle cx="560" cy="130" r="6" fill="rgba(0,166,192,0.06)" />
					<circle cx="480" cy="360" r="3" fill="rgba(0,166,192,0.35)" />
					<circle cx="480" cy="360" r="7" fill="rgba(0,166,192,0.05)" />
					<circle cx="780" cy="260" r="2.5" fill="rgba(62,193,40,0.4)" />
					<circle cx="780" cy="260" r="6" fill="rgba(62,193,40,0.06)" />
					<circle cx="700" cy="400" r="2" fill="rgba(0,166,192,0.3)" />
					<circle cx="900" cy="320" r="3" fill="rgba(0,166,192,0.4)" />
					<circle cx="900" cy="320" r="7" fill="rgba(0,166,192,0.05)" />
					<circle cx="1050" cy="160" r="4" fill="rgba(62,193,40,0.55)" />
					<circle cx="1050" cy="160" r="10" fill="rgba(62,193,40,0.07)" />
					<circle cx="1150" cy="380" r="2" fill="rgba(0,166,192,0.25)" />
					<circle r="2" fill="rgba(0,166,192,0.9)">
						<animateMotion dur="4s" repeatCount="indefinite" path="M120,80 Q220,135 310,190" />
					</circle>
					<circle r="1.5" fill="rgba(62,193,40,0.9)">
						<animateMotion
							dur="5.5s"
							repeatCount="indefinite"
							begin="1s"
							path="M310,190 Q435,175 560,130"
						/>
					</circle>
					<circle r="2" fill="rgba(0,166,192,0.8)">
						<animateMotion
							dur="6s"
							repeatCount="indefinite"
							begin="2.5s"
							path="M780,260 Q915,210 1050,160"
						/>
					</circle>
				</svg>
				<div class="nx-ctas-glow nx-ctas-glow--cyan"></div>
				<div class="nx-ctas-glow nx-ctas-glow--green"></div>
				<div class="nx-ctas-glow nx-ctas-glow--deep"></div>
				<div class="nx-ctas-vignette"></div>
			</div>
			<div class="nx-container">
				<div class="nx-section-header nx-reveal">
					<p class="nx-overline">Empieza hoy</p>
					<h2 class="nx-section-title">Una plataforma. Tres formas de usarla.</h2>
					<p class="nx-section-sub">Elige la experiencia que mejor se adapta a tu operación.</p>
				</div>

				<div class="nx-cta-grid">
					<!-- ── FAMILIA ──────────────────────────────── -->
					<div class="nx-cta-card nx-cta-card--familia nx-reveal">
						<div class="nx-cta-visual nx-cta-visual--familia" aria-hidden="true">
							<div class="nx-cta-visual-bg"></div>
							<!-- iPhone mockup -->
							<div class="nx-mock-phone">
								<div class="nx-mock-phone-notch"></div>
								<div class="nx-mock-phone-screen">
									<div class="nx-mock-map">
										<div class="nx-mock-map-grid"></div>
										<svg class="nx-mock-route" viewBox="0 0 160 120" fill="none">
											<path
												d="M20 95 Q40 70 60 65 Q90 58 110 40 Q130 25 145 20"
												stroke="rgba(0,255,136,0.7)"
												stroke-width="2"
												stroke-dasharray="4 3"
												stroke-linecap="round"
											/>
											<circle
												cx="20"
												cy="95"
												r="4"
												fill="rgba(0,255,136,0.3)"
												stroke="rgba(0,255,136,0.8)"
												stroke-width="1.5"
											/>
											<circle cx="145" cy="20" r="5" fill="#00ff88" />
											<circle
												cx="145"
												cy="20"
												r="10"
												fill="rgba(0,255,136,0.15)"
												class="nx-mock-ping"
											/>
										</svg>
									</div>
									<div class="nx-mock-statusbar">
										<span>Nexus</span>
										<span class="nx-mock-live">● LIVE</span>
									</div>
									<div class="nx-mock-pill">
										<div class="nx-mock-pill-dot"></div>
										<div>
											<div class="nx-mock-pill-label">Toyota RAV4</div>
											<div class="nx-mock-pill-sub">En movimiento · 62 km/h</div>
										</div>
									</div>
								</div>
							</div>
							<div class="nx-cta-visual-glow"></div>
						</div>
						<div class="nx-cta-body">
							<div class="nx-cta-header">
								<div class="nx-cta-icon">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
										<polyline points="9 22 9 12 15 12 15 22" />
									</svg>
								</div>
								<div class="nx-cta-segment-label">Para familias</div>
							</div>
							<h3 class="nx-cta-title">Protege lo que más importa</h3>
							<p class="nx-cta-desc">
								Alertas en tiempo real, geocercas y rastreo activo. Sin contratos forzosos.
							</p>
							<ul class="nx-cta-bullets">
								<li>Alertas inmediatas de movimiento</li>
								<li>Geocercas inteligentes</li>
								<li>Historial de recorridos</li>
								<li>App iOS y Android incluida</li>
							</ul>
							<div class="nx-cta-actions">
								<a href="/#contacto" class="nx-cta-btn nx-cta-btn--familia"
									>Quiero proteger mi vehículo</a
								>
								<p class="nx-cta-sub-note">
									Descarga gratis: <a href="#download" class="nx-cta-link-sm">App Store</a> ·
									<a href="#download" class="nx-cta-link-sm">Google Play</a>
								</p>
							</div>
						</div>
					</div>

					<!-- ── FLOTILLA (featured) ───────────────────── -->
					<div class="nx-cta-card nx-cta-card--flotilla nx-cta-card--featured nx-reveal">
						<div class="nx-cta-badge">Más popular</div>
						<div class="nx-cta-visual nx-cta-visual--flotilla" aria-hidden="true">
							<div class="nx-cta-visual-bg"></div>
							<div class="nx-mock-dash">
								<div class="nx-mock-dash-bar">
									<span class="nx-mock-dash-title">Fleet Overview</span>
									<span class="nx-mock-dash-badge">14 activas</span>
								</div>
								<div class="nx-mock-metrics">
									<div class="nx-mock-metric">
										<span class="nx-mock-metric-val">14</span>
										<span class="nx-mock-metric-lbl">En ruta</span>
									</div>
									<div class="nx-mock-metric nx-mock-metric--warn">
										<span class="nx-mock-metric-val">2</span>
										<span class="nx-mock-metric-lbl">Alertas</span>
									</div>
									<div class="nx-mock-metric">
										<span class="nx-mock-metric-val">3</span>
										<span class="nx-mock-metric-lbl">Geocercas</span>
									</div>
								</div>
								<div class="nx-mock-fleet-map">
									<div class="nx-mock-map-grid"></div>
									<svg class="nx-mock-fleet-svg" viewBox="0 0 220 80" fill="none">
										<path
											d="M10 50 Q50 30 90 35 Q130 40 170 20 Q195 12 210 15"
											stroke="rgba(8,145,178,0.3)"
											stroke-width="1.5"
											stroke-dasharray="3 2"
										/>
										<circle cx="45" cy="35" r="4" fill="#0891b2" />
										<circle cx="45" cy="35" r="8" fill="rgba(8,145,178,0.15)" />
										<circle cx="90" cy="32" r="4" fill="#0891b2" />
										<circle cx="130" cy="28" r="4" fill="#0891b2" />
										<circle cx="170" cy="18" r="4" fill="#f59e0b" />
										<circle cx="170" cy="18" r="8" fill="rgba(245,158,11,0.15)" />
										<circle cx="60" cy="55" r="3.5" fill="#0891b2" />
										<circle cx="155" cy="45" r="3.5" fill="#0891b2" />
									</svg>
								</div>
								<div class="nx-mock-alert-row">
									<div class="nx-mock-alert-dot"></div>
									<span class="nx-mock-alert-text">Unidad 07 — geocerca violation · hace 2 min</span
									>
								</div>
							</div>
							<div class="nx-cta-visual-glow"></div>
						</div>
						<div class="nx-cta-body">
							<div class="nx-cta-header">
								<div class="nx-cta-icon">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<rect x="1" y="3" width="15" height="13" />
										<polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
										<circle cx="5.5" cy="18.5" r="2.5" />
										<circle cx="18.5" cy="18.5" r="2.5" />
									</svg>
								</div>
								<div class="nx-cta-segment-label">Para flotillas</div>
							</div>
							<h3 class="nx-cta-title">Visibilidad total de tu operación</h3>
							<p class="nx-cta-desc">
								Monitoreo en tiempo real, reportes automáticos y alertas inteligentes. Diseñado para
								escalar.
							</p>
							<ul class="nx-cta-bullets">
								<li>Dashboard en tiempo real</li>
								<li>Alertas y geocercas por unidad</li>
								<li>Reportes automáticos</li>
								<li>Multiusuario con roles</li>
								<li>API e integraciones disponibles</li>
							</ul>
							<div class="nx-cta-actions">
								<a href="/#contacto" class="nx-cta-btn nx-cta-btn--flotilla">Solicitar una demo</a>
							</div>
						</div>
					</div>

					<!-- ── PARTNERS / TaaS ───────────────────────── -->
					<div class="nx-cta-card nx-cta-card--partners nx-reveal">
						<div class="nx-cta-visual nx-cta-visual--taas" aria-hidden="true">
							<div class="nx-cta-visual-bg"></div>
							<div class="nx-mock-arch">
								<div class="nx-arch-node nx-arch-node--top">
									<svg viewBox="0 0 16 16" fill="none"
										><rect
											x="1"
											y="4"
											width="14"
											height="9"
											rx="2"
											stroke="currentColor"
											stroke-width="1.2"
										/><path
											d="M5 4V2M11 4V2"
											stroke="currentColor"
											stroke-width="1.2"
											stroke-linecap="round"
										/><circle cx="4" cy="9" r="1.2" fill="currentColor" opacity="0.5" /><circle
											cx="8"
											cy="9"
											r="1.2"
											fill="currentColor"
											opacity="0.5"
										/></svg
									>
									<span>Device / Hardware</span>
									<span class="nx-arch-status"></span>
								</div>
								<div class="nx-arch-connector">
									<div class="nx-arch-line"></div>
									<span class="nx-arch-proto">TCP · MQTT</span>
									<div class="nx-arch-line"></div>
								</div>
								<div class="nx-arch-node nx-arch-node--mid">
									<svg viewBox="0 0 16 16" fill="none"
										><path
											d="M8 1v14M1 8h14"
											stroke="currentColor"
											stroke-width="1.2"
											stroke-linecap="round"
											opacity="0.4"
										/><circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.2" /></svg
									>
									<span>Geminis Ingestion</span>
								</div>
								<div class="nx-arch-connector">
									<div class="nx-arch-line"></div>
									<span class="nx-arch-proto">Processing</span>
									<div class="nx-arch-line"></div>
								</div>
								<div class="nx-arch-node nx-arch-node--mid">
									<svg viewBox="0 0 16 16" fill="none"
										><rect
											x="1"
											y="1"
											width="14"
											height="14"
											rx="2"
											stroke="currentColor"
											stroke-width="1.2"
										/><path
											d="M4 5.5h8M4 8h6M4 10.5h4"
											stroke="currentColor"
											stroke-width="1.2"
											stroke-linecap="round"
										/></svg
									>
									<span>REST API · Webhooks</span>
								</div>
								<div class="nx-arch-connector"><div class="nx-arch-line"></div></div>
								<div class="nx-arch-outputs">
									<span class="nx-arch-output-chip">Web</span>
									<span class="nx-arch-output-chip">Mobile</span>
									<span class="nx-arch-output-chip nx-arch-output-chip--accent">White-label</span>
								</div>
							</div>
							<svg class="nx-arch-pulse-svg" viewBox="0 0 200 220" aria-hidden="true">
								<defs
									><filter id="arch-glow"
										><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge
											><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge
										></filter
									></defs
								>
								<circle r="2" fill="rgba(99,102,241,0.90)" filter="url(#arch-glow)">
									<animateMotion dur="2.2s" repeatCount="indefinite" path="M100,18 L100,195" />
								</circle>
								<circle r="1.5" fill="rgba(67,56,202,0.75)">
									<animateMotion
										dur="2.2s"
										repeatCount="indefinite"
										begin="1.1s"
										path="M100,18 L100,195"
									/>
								</circle>
							</svg>
							<div class="nx-cta-visual-glow"></div>
						</div>
						<div class="nx-cta-body">
							<div class="nx-cta-header">
								<div class="nx-cta-icon">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="16 18 22 12 16 6" />
										<polyline points="8 6 2 12 8 18" />
										<circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.4" />
									</svg>
								</div>
								<div class="nx-cta-segment-label">Para partners</div>
							</div>
							<h3 class="nx-cta-title">Nexus Connect y Nexus Platform</h3>
							<p class="nx-cta-desc">
								Conecta tu propio hardware a nuestra infraestructura, o lanza la plataforma completa
								bajo tu marca.
							</p>
							<ul class="nx-cta-bullets">
								<li>TCP, MQTT y REST API</li>
								<li>White-label disponible</li>
								<li>Webhooks e integraciones</li>
								<li>Onboarding técnico incluido</li>
							</ul>
							<div class="nx-cta-actions">
								<a href="/#contacto" class="nx-cta-btn nx-cta-btn--partners"
									>Hablar sobre integración</a
								>
								<p class="nx-cta-sub-note">
									<a href="/products/nexus/partners" class="nx-cta-link-sm"
										>Ver detalles técnicos →</a
									>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- SOCIAL PROOF -->
		<section class="nx-proof" id="evidencia">
			<div class="nx-container">
				<div class="nx-stats-bar nx-reveal">
					<div class="nx-proof-point">
						<div class="nx-proof-icon" aria-hidden="true">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path
									d="M9 12l2 2 4-4"
								/></svg
							>
						</div>
						<span class="nx-proof-label">En producción</span>
						<span class="nx-proof-desc">Plataforma operativa, no una maqueta</span>
					</div>
					<div class="nx-proof-point">
						<div class="nx-proof-icon" aria-hidden="true">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								><rect x="5" y="2" width="14" height="20" rx="2" /><line
									x1="12"
									y1="18"
									x2="12.01"
									y2="18"
								/><rect x="2" y="7" width="3" height="10" rx="1" opacity="0.4" /></svg
							>
						</div>
						<span class="nx-proof-label">iOS, Android y Web</span>
						<span class="nx-proof-desc">Apps disponibles hoy, sin lista de espera</span>
					</div>
					<div class="nx-proof-point">
						<div class="nx-proof-icon" aria-hidden="true">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line
									x1="12"
									y1="5"
									x2="12"
									y2="19"
									opacity="0.3"
								/></svg
							>
						</div>
						<span class="nx-proof-label">GPS, API y MQTT</span>
						<span class="nx-proof-desc">Conecta tu hardware desde el primer día</span>
					</div>
				</div>

				<div class="nx-testimonials-grid">
					<div class="nx-testimonial nx-reveal">
						<div class="nx-testimonial-quote">"</div>
						<p class="nx-testimonial-text">
							Tengo tres hijos y dos carros que les presto. Ahora sé exactamente dónde están y si se
							salen de la ruta me avisa de inmediato. Nexus me devolvió la calma que no sabía que
							había perdido.
						</p>
						<div class="nx-testimonial-author">
							<strong>Claudia R.</strong>
							<span>Madre de familia, Monterrey</span>
						</div>
					</div>

					<div class="nx-testimonial nx-reveal">
						<div class="nx-testimonial-quote">"</div>
						<p class="nx-testimonial-text">
							En los primeros dos meses redujimos el desperdicio de combustible de 12% a menos del
							2%. Los números hablan solos.
						</p>
						<div class="nx-testimonial-author">
							<strong>Ing. Martínez</strong>
							<span>Director de Operaciones, flota de 35 unidades</span>
						</div>
					</div>

					<div class="nx-testimonial nx-reveal">
						<div class="nx-testimonial-quote">"</div>
						<p class="nx-testimonial-text">
							Desde que implementamos Nexus no hemos tenido un solo robo en obra. Las geocercas nos
							avisan de madrugada si algo se mueve fuera de horario.
						</p>
						<div class="nx-testimonial-author">
							<strong>Gerente de Proyectos</strong>
							<span>Constructora, norte de México</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	</main>
	<Footer />
</div>
