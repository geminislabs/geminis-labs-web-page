<script>
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import ExperienceWorld from './ExperienceWorld.svelte';
	import ShaderBackground from '$lib/components/experiencia/ShaderBackground.svelte';
	import AnimatedText from './AnimatedText.svelte';
	import WarpCarousel from './WarpCarousel.svelte';
	import PeakChart from '$lib/components/experiencia/PeakChart.svelte';
	import StageHero from './StageHero.svelte';
	import Audience from './Audience.svelte';
	import NexusSketch from './NexusSketch.svelte';
	import DayRing from '$lib/components/experiencia/DayRing.svelte';
	import MiniVisual from './MiniVisual.svelte';
	import PhoneWall from './PhoneWall.svelte';
	import HorizonVisual from './HorizonVisual.svelte';
	import FlowDiagram from './FlowDiagram.svelte';
	import CityModel3D from './CityModel3D.svelte';
	import {
		SCENES,
		NEXUS_LIVE_URL,
		DEMO_VIDEO_SRC,
		FLOW,
		CHAIN,
		DEMO_READY,
		SEGMENTS,
		CHANNELS,
		PLANS,
		CONTROLS,
		NEXT_STEPS,
		ORBITS,
		ASKS,
		CONTACT,
		BACKDROPS,
		IMAGES,
		APP_SCREENS,
		TELEMETRY,
		CENTLI_CYCLE,
		CENTLI_PILOT,
		ASK_ICONS,
		GL_CAPABILITIES,
		GL_FACTS,
		TELEMETRY_NEXT,
		H3_LEVELS,
		H3_ADVANTAGES,
		RESEARCH_LINES,
		CITY_LAYERS,
		CORRIDOR_PHASES,
		MEDIA,
		PHONE_SCREENS
	} from './content.js';
	import {
		advance,
		retreat,
		goTo,
		progress,
		createWheelGate,
		swipeStep,
		keyAction
	} from '$lib/utils/presentationNav.js';
	import './experiencia.css';

	/** Escena inicial desde la URL (#escena.beat) para recuperar el punto tras recargar. */
	function initialNav() {
		const match = /^#(\d+)\.(\d+)$/.exec(location.hash);
		if (!match) return { scene: 0, beat: 0 };
		const s = Number(match[1]);
		if (!SCENES[s]) return { scene: 0, beat: 0 };
		return { scene: s, beat: Math.min(Number(match[2]), SCENES[s].beats) };
	}

	let nav = $state(initialNav());
	let menuOpen = $state(false);
	let chainPhase = $state(0);
	let activeLayer = $state(0);
	let orbitT = $state(0);

	// Las tarjetas del horizonte orbitan despacio alrededor del logo de Nexus.
	$effect(() => {
		if (scene.id !== 'horizonte' || reduced) return;
		let raf = 0;
		const start = performance.now() - orbitT * 1000;
		const tick = (t) => {
			orbitT = (t - start) / 1000;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
	let ficha = $state(null);
	let videoOpen = $state(false);
	let videoError = $state(false);
	let chromeVisible = $state(false);
	let reduced = $state(false);
	let lite = $state(false);

	let scene = $derived(SCENES[nav.scene]);
	let beat = $derived(nav.beat);
	let pct = $derived(progress(nav, SCENES));
	let backdrop = $derived(BACKDROPS[scene.id] ? { key: scene.id, ...BACKDROPS[scene.id] } : null);

	const wheel = createWheelGate({ threshold: 40, cooldown: 750 });
	let chromeTimer;
	let touchStart = null;

	function overlayOpen() {
		return menuOpen || ficha !== null || videoOpen;
	}

	function next() {
		nav = advance(nav, SCENES);
	}

	function prev() {
		nav = retreat(nav, SCENES);
	}

	function jump(target, atEnd = false) {
		const state = goTo(SCENES, target, { atEnd });
		if (state) nav = state;
		menuOpen = false;
	}

	function openLive() {
		window.open(NEXUS_LIVE_URL, 'nexus-live');
	}

	function toggleFullscreen() {
		if (document.fullscreenElement) document.exitFullscreen?.();
		else document.documentElement.requestFullscreen?.().catch(() => {});
	}

	function closeOverlays() {
		menuOpen = false;
		ficha = null;
		videoOpen = false;
	}

	function onKey(event) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (event.key === 'v' || event.key === 'V') {
			videoError = false;
			videoOpen = !videoOpen;
			return;
		}
		const action = keyAction(event.key);
		if (!action) return;
		if (overlayOpen() && action !== 'close' && action !== 'menu') return;
		event.preventDefault();
		switch (action) {
			case 'next':
				next();
				break;
			case 'prev':
				prev();
				break;
			case 'first':
				jump(0);
				break;
			case 'last':
				jump(SCENES.length - 1, true);
				break;
			case 'menu':
				ficha = null;
				menuOpen = !menuOpen;
				break;
			case 'fullscreen':
				toggleFullscreen();
				break;
			case 'live':
				openLive();
				break;
			case 'close':
				closeOverlays();
				break;
		}
	}

	function onWheel(event) {
		if (overlayOpen()) return;
		const step = wheel(event.deltaY || event.deltaX);
		if (step > 0) next();
		else if (step < 0) prev();
	}

	function onStageClick(event) {
		if (overlayOpen()) return;
		if (event.target.closest('button, a, [data-noadvance]')) return;
		next();
	}

	function onTouchStart(event) {
		const t = event.touches[0];
		touchStart = { x: t.clientX, y: t.clientY };
	}

	function onTouchEnd(event) {
		if (!touchStart || overlayOpen()) return;
		const t = event.changedTouches[0];
		const dx = t.clientX - touchStart.x;
		const dy = t.clientY - touchStart.y;
		// En pantallas angostas el gesto vertical desplaza el contenido; solo el horizontal navega.
		const narrow = window.innerWidth <= 860;
		const step = narrow ? (Math.abs(dx) > Math.abs(dy) ? swipeStep(dx, 0) : 0) : swipeStep(dx, dy);
		touchStart = null;
		if (step > 0) next();
		else if (step < 0) prev();
	}

	function onPointerMove() {
		chromeVisible = true;
		clearTimeout(chromeTimer);
		chromeTimer = setTimeout(() => (chromeVisible = false), 2200);
	}

	/** Entrada/salida de escena: fundido con desenfoque y desplazamiento leve. */
	function cine(_node, { delay = 0, out = false } = {}) {
		if (reduced) return { duration: 200, css: (t) => `opacity:${t}` };
		return {
			delay,
			duration: out ? 420 : 820,
			easing: cubicOut,
			css: (t, u) =>
				`opacity:${t};filter:blur(${u * 10}px);transform:translateY(${u * (out ? -14 : 18)}px) scale(${1 - u * 0.015})`
		};
	}

	/** Conteo corto para valores fijos ya documentados; termina en el valor exacto. */
	function countUp(node, value) {
		const format = (n) => `$${Math.round(n).toLocaleString('es-MX')}`;
		if (reduced) {
			node.textContent = format(value);
			return;
		}
		const start = performance.now();
		const duration = 520;
		let raf = 0;
		const tick = (t) => {
			const p = Math.min(1, (t - start) / duration);
			node.textContent = format(value * (1 - Math.pow(1 - p, 3)));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return { destroy: () => cancelAnimationFrame(raf) };
	}

	/** Conteo para cifras medidas; termina siempre en el valor exacto. */
	function countNumber(node, { value, decimals = 0, delay = 0 }) {
		const format = (n) =>
			n.toLocaleString('es-MX', {
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals
			});
		if (reduced) {
			node.textContent = format(value);
			return;
		}
		node.textContent = format(0);
		const start = performance.now() + delay;
		let raf = 0;
		const tick = (t) => {
			const p = Math.max(0, Math.min(1, (t - start) / 900));
			node.textContent = format(value * (1 - Math.pow(1 - p, 3)));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return { destroy: () => cancelAnimationFrame(raf) };
	}

	/** Video de fondo que se reproduce una sola vez, más lento, y se queda en el último cuadro. */
	function slowOnce(node, rate = 0.6) {
		node.loop = false;
		const apply = () => (node.playbackRate = rate);
		apply();
		node.addEventListener('loadedmetadata', apply);
		return { destroy: () => node.removeEventListener('loadedmetadata', apply) };
	}

	/** Al terminar, el video espera `hold` ms antes de volver a empezar. */
	function holdLoop(node, hold = 7000) {
		node.loop = false;
		let timer;
		const onEnd = () => {
			timer = setTimeout(() => {
				node.currentTime = 0;
				node.play().catch(() => {});
			}, hold);
		};
		node.addEventListener('ended', onEnd);
		return {
			destroy() {
				clearTimeout(timer);
				node.removeEventListener('ended', onEnd);
			}
		};
	}

	function spotlight(event) {
		const el = event.currentTarget;
		const rect = el.getBoundingClientRect();
		el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
		el.style.setProperty('--my', `${event.clientY - rect.top}px`);
	}

	// Recordar la escena en la URL para recuperar el punto si se recarga.
	$effect(() => {
		const hash = `#${nav.scene}.${nav.beat}`;
		if (location.hash !== hash) history.replaceState(history.state, '', hash);
	});

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const params = new URLSearchParams(location.search);
		lite = params.has('lite');
		if (params.has('calma')) reduced = true;
		return () => clearTimeout(chromeTimer);
	});
</script>

<svelte:head>
	<title>Geminis Labs · Nexus — Querétaro 2026</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#060b16" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Audiowide&family=Outfit:wght@100..900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window
	onkeydown={onKey}
	onclick={onStageClick}
	onwheel={onWheel}
	onpointermove={onPointerMove}
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
/>

<div class="xp" class:xp-reduced={reduced}>
	<ShaderBackground preset={backdrop} {reduced} {lite} />
	<ExperienceWorld sceneId={scene.id} {beat} {reduced} {lite} />

	<main class="xp-stage">
		{#key nav.scene}
			<section
				class="xp-scene xs-{scene.id}"
				in:cine={{ delay: 180 }}
				out:cine={{ out: true }}
				aria-label={scene.title}
			>
				{#if scene.id === 'hero'}
					<div class="xp-cinema" aria-hidden="true"><span class="xp-projector"></span></div>
					<div class="xp-screen rv on">
						<StageHero {reduced} {lite} intro radius={3} />
					</div>
					<div class="xp-audience">
						<Audience left={MEDIA.publicoIzq} right={MEDIA.publico} />
					</div>
					<div class="xp-hero-copy">
						<div class="xp-hero-lockup rv on" style="--d:300ms">
							<img src="/img/geminislabs-nobg.webp" alt="" />
							<span>GEMINIS LABS</span>
							<em>Experience 2026</em>
						</div>
						<AnimatedText
							tag="h1"
							className="xp-hero-title"
							text="Una visión. Una empresa. Un futuro por construir."
							delay={600}
						/>
						<p class="xp-hero-sub rv on" style="--d:1700ms">
							Una experiencia narrativa basada en datos, demostraciones y tecnología en tiempo real
							·
							<strong>Querétaro, 20 de noviembre de 2026</strong>
						</p>
					</div>
				{:else if scene.id === 'pregunta'}
					<div class="xp-fog" aria-hidden="true"></div>
					<div class="xp-question-wrap">
						<p class="xp-kicker xp-kicker-warm">Querétaro, hoy</p>
						<p class="xp-question-lead rv on" style="--d:400ms">
							Cada mañana, la ciudad entera se pone en movimiento.
						</p>
						<AnimatedText
							tag="h1"
							className="xp-question"
							text="¿Qué descubrimos cuando dejamos de mirar puntos y empezamos a entender movimientos?"
							show={beat >= 1}
							step={14}
						/>
						<ul class="xp-wwh rv" class:on={beat >= 1} style="--d:1600ms">
							<li><strong>Dónde</strong> está cada unidad</li>
							<li><strong>Cuándo</strong> ocurrió cada evento</li>
							<li><strong>Qué pasó</strong> y qué hacer</li>
						</ul>
					</div>
					<p class="xp-source xp-source-warm">
						Vías reales de Querétaro: © OpenStreetMap contributors · Trazos de luz ilustrativos
					</p>
				{:else if scene.id === 'queretaro'}
					<div class="xp-left">
						<p class="xp-kicker">Querétaro</p>
						<h2 class="xp-h2 rv on">Una ciudad que no deja de moverse.</h2>
						<p class="xp-body rv" class:on={beat >= 1}>
							Cada unidad que sale a ruta genera señales: dónde está, a qué hora, qué hizo.
						</p>
						<div class="xp-case rv" class:on={beat >= 2}>
							<p class="xp-case-q">¿Dónde estuvo la unidad 14 ayer a las 15:40?</p>
							<p class="xp-case-q xp-accent-warn">¿Y por qué tardó 40 minutos más?</p>
						</div>
						<p class="xp-thesis rv" class:on={beat >= 3}>
							Un punto dice <em>dónde</em>.<br />El contexto explica <em>qué pasó</em>.
						</p>
					</div>
					<p class="xp-source">
						Red vial: © OpenStreetMap contributors · Movimientos y escenario ilustrativos, no son
						datos de Nexus
					</p>
				{:else if scene.id === 'geminis'}
					<video
						class="xp-gl-human"
						src={MEDIA.cyberhuman}
						autoplay
						muted
						playsinline
						use:holdLoop={6000}
						aria-hidden="true"
					></video>
					<div class="xp-gl3">
						<div class="xp-gl3-brand">
							<div class="xp-gl-mark rv on">
								<span class="xp-gl-halo" aria-hidden="true"></span>
								<img src="/img/geminislabs-nobg.webp" alt="" />
							</div>
							<div>
								<h2 class="xp-dune rv on" style="--d:200ms">GEMINIS LABS</h2>
								<p class="xp-sub rv on" style="--d:400ms">
									Laboratorio de innovación · Desarrollo de productos · Querétaro
								</p>
							</div>
						</div>
						<AnimatedText
							tag="p"
							className="xp-lema"
							text="Conectamos humanidad y tecnología"
							delay={500}
							step={20}
						/>
						<div class="xp-caps">
							{#each GL_CAPABILITIES as cap, i (cap.t)}
								<article class="xp-cap rv on" style="--d:{700 + i * 120}ms">
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d={cap.icon} /></svg>
									<strong>{cap.t}</strong>
									<span>{cap.d}</span>
								</article>
							{/each}
						</div>
						<ol class="xp-flow" class:joined={beat >= 1}>
							{#each FLOW as word, i (word)}
								<li
									class="rv on beam"
									style="--d:{1200 + i * 120}ms"
									class:last={i === FLOW.length - 1}
								>
									{word}
								</li>
							{/each}
						</ol>
						<div class="xp-gl3-bottom rv" class:on={beat >= 2}>
							<ul class="xp-gl-facts">
								{#each GL_FACTS as f (f.k)}
									<li><strong>{f.v}</strong><span>{f.k}</span></li>
								{/each}
							</ul>
							<div class="xp-portfolio">
								<div class="xp-pf beam">
									<img src="/img/logo-nexus-3x.png" alt="" />
									<div>
										<strong>Nexus</strong>
										<span>Movilidad · en operación</span>
									</div>
								</div>
								<div class="xp-pf xp-pf-centli">
									<span class="xp-pf-c">C</span>
									<div>
										<strong>Centli</strong>
										<span>Agro · visión en desarrollo</span>
									</div>
								</div>
							</div>
							<p class="xp-gl-aim">
								Aspiramos a convertirnos en una empresa emblemática nacida en Querétaro.
							</p>
						</div>
					</div>
				{:else if scene.id === 'nexus'}
					<div class="xp-nexus-map" aria-hidden="true">
						<NexusSketch bind:phase={chainPhase} {reduced} fullbleed />
					</div>
					<div class="xp-bgshade xp-shade-nexusmap" aria-hidden="true"></div>
					<p class="xp-source xp-nexus-note">
						Nexus · seguimiento · escenario ilustrativo sobre calles reales de Querétaro (©
						OpenStreetMap)
					</p>
					<div class="xp-nexus3">
						<h2 class="xp-nexus-word rv on" aria-label="Nexus">
							<img src="/img/logo-nexus-3x.png" alt="" /><span>EXUS</span>
						</h2>
						<AnimatedText
							tag="p"
							className="xp-definition"
							text="Un ambiente de inteligencia para todo aquello que se pone en movimiento."
							delay={350}
							step={12}
						/>
						<ol class="xp-chain2">
							{#each CHAIN as step, i (step.k)}
								<li
									class="rv on"
									class:active={chainPhase === i}
									class:done={chainPhase > i}
									style="--d:{700 + i * 140}ms"
								>
									<span class="xp-chain-n">0{i + 1}</span>
									<span class="xp-chain-k">{step.k}</span>
									<span class="xp-chain-v">{step.v}</span>
								</li>
							{/each}
							<li class="xp-to-live2 rv" class:on={beat >= 1}>
								<span>Ahora, lo que ya funciona.</span>
								<button class="xp-live-btn" onclick={openLive}>
									<span class="xp-live-dot"></span> Abrir Nexus en vivo
								</button>
							</li>
						</ol>
					</div>
				{:else if scene.id === 'h3'}
					<div class="xp-left xp-h3">
						<p class="xp-kicker">Indexación geoespacial H3</p>
						<h2 class="xp-h2 rv on">Querétaro, con contexto geoespacial.</h2>
						{#if beat === 0}
							<p class="xp-body rv on" style="--d:300ms">
								Cada posición se convierte en una celda. 706 celdas H3 de 0.74 km² cubren este mapa;
								se encienden cuando una unidad pasa por ellas.
							</p>
						{:else if beat === 1}
							<p class="xp-body rv on">Una posición, cinco escalas.</p>
							<ol class="xp-h3-levels">
								{#each H3_LEVELS as l, i (l.r)}
									<li style="--i:{i}">
										<span class="xp-h3-r">r{l.r}</span>
										<strong>{l.d}</strong>
										<span>{l.area} · lado {l.edge}</span>
									</li>
								{/each}
							</ol>
							<p class="xp-h3-note">
								GeoContext calcula r10 y sus padres r9–r6 en cada evento · en validación
							</p>
						{:else}
							<ul class="xp-h3-adv">
								{#each H3_ADVANTAGES as a, i (a.t)}
									<li class="rv on" style="--d:{i * 120}ms">
										<strong>{a.t}</strong>
										<span>{a.d}</span>
										<em class:ready={a.st === 'Listo'}>{a.st}</em>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
					<p class="xp-source">
						Celdas H3 reales (librería h3 4.5) · densidad de vías principales © OpenStreetMap
						contributors · estelas ilustrativas
					</p>
				{:else if scene.id === 'demo'}
					<PhoneWall images={PHONE_SCREENS} />
					<div class="xp-wide xp-demo2">
						<div class="xp-demo-top">
							<div>
								<p class="xp-kicker"><span class="xp-live-dot"></span> Nexus · plataforma real</p>
								<h2 class="xp-h2 xp-h2-tight">Operando hoy. En web y en el celular.</h2>
							</div>
							<button class="xp-live-btn" onclick={openLive}>
								<span class="xp-live-dot"></span> Abrir Nexus en vivo
							</button>
						</div>
						<WarpCarousel items={APP_SCREENS} {reduced} />
						<ul class="xp-ready-chips rv" class:on={beat >= 1}>
							{#each DEMO_READY as item, i (item)}
								<li style="--d:{i * 80}ms">
									<span class="xp-check" aria-hidden="true"></span>{item}
								</li>
							{/each}
						</ul>
					</div>
				{:else if scene.id === 'telemetria'}
					<div class="xp-wide xp-telemetry xp-tele3" class:next={beat >= 2}>
						<p class="xp-kicker">Datos reales · unidad de pruebas del equipo</p>
						<h2 class="xp-h2 xp-h2-tight">Un día real: lo que pasó, cómo está y lo que viene.</h2>
						<div class="xp-tele3-top">
							<div class="xp-tele3-ring rv on" style="--d:200ms">
								<DayRing speeds={TELEMETRY.speeds} center="28.8 km" caption={TELEMETRY.period} />
							</div>
							<div class="xp-kpis">
								{#each TELEMETRY.kpis.slice(1) as kpi, i (kpi.k)}
									<div
										class="xp-kpi beam rv on"
										style="--d:{400 + i * 120}ms; --beam-delay:{i * -1.1}s"
									>
										<span
											class="xp-kpi-v"
											use:countNumber={{ value: kpi.v, decimals: kpi.d, delay: 500 + i * 120 }}
											>{kpi.v}</span
										><small>{kpi.u}</small>
										<span class="xp-kpi-k">{kpi.k}</span>
									</div>
								{/each}
							</div>
							<PeakChart
								data={TELEMETRY.battery}
								value={14.0}
								decimals={1}
								unit=" V"
								label="Batería del vehículo"
								minLabel="mín."
								status={TELEMETRY.batteryStatus}
								note="Trazo del informe de Nexus · el pico de 14.0 V es el alternador cargando con el motor encendido"
								color="#4fd1ff"
								{reduced}
							/>
						</div>
						<div class="xp-health rv" class:on={beat >= 1}>
							<div class="xp-health-gauge">
								<svg viewBox="0 0 120 120" aria-hidden="true">
									<circle cx="60" cy="60" r="50" class="xp-gauge-bg" />
									<circle
										cx="60"
										cy="60"
										r="50"
										class="xp-gauge-val"
										pathLength="100"
										style="--v:{(TELEMETRY.health.valid / TELEMETRY.health.total) * 100}"
									/>
								</svg>
								<div class="xp-gauge-text">
									<strong
										>{((TELEMETRY.health.valid / TELEMETRY.health.total) * 100).toFixed(1)}%</strong
									>
									<span>válidas</span>
								</div>
							</div>
							<div class="xp-health-txt">
								<p class="xp-layer-title">Salud del equipo</p>
								<p>
									<b>{TELEMETRY.health.valid}</b> de <b>{TELEMETRY.health.total}</b> comunicaciones con
									posición válida.
								</p>
								<p class="xp-health-exc">
									2 excepciones ({TELEMETRY.health.at}): {TELEMETRY.health.exceptions.join(' · ')}
								</p>
							</div>
							<ul class="xp-battery-check">
								{#each TELEMETRY.batteryCheck as b (b.k)}
									<li>
										<span>{b.k}</span>
										<strong>{b.v}</strong>
										<small>{b.d}</small>
									</li>
								{/each}
								<li class="xp-driving">
									<span>Estilo de manejo</span>
									<strong>Aceleraciones y frenados bruscos</strong>
									<small>Modelo de conducción en validación</small>
								</li>
								<li class="xp-battery-note">
									Lectura indicativa por voltaje; no sustituye una prueba de carga.
								</li>
							</ul>
						</div>
						<div class="xp-tele-next rv" class:on={beat >= 2}>
							<p class="xp-layer-title xp-lab-title">Con los mismos datos · investigación</p>
							<ul>
								{#each TELEMETRY_NEXT as n, i (n.t)}
									<li style="--d:{i * 80}ms"><strong>{n.t}</strong><span>{n.d}</span></li>
								{/each}
							</ul>
						</div>
					</div>
				{:else if scene.id === 'mercado'}
					<video
						use:slowOnce={0.55}
						class="xp-bgvideo xp-bg-trucks"
						src={MEDIA.camiones}
						autoplay
						muted
						loop
						playsinline
						aria-hidden="true"
					></video>
					<div class="xp-bgshade xp-shade-trucks" aria-hidden="true"></div>
					<div class="xp-wide">
						<p class="xp-kicker">A quién sirve</p>
						<h2 class="xp-h2">Primero, operaciones que necesitan visibilidad.</h2>
						<div class="xp-segments">
							{#each SEGMENTS as seg, i (seg.id)}
								<article
									class="xp-seg spot"
									class:beam={seg.primary}
									class:primary={seg.primary}
									class:lit={seg.primary || beat >= 2}
									onpointermove={spotlight}
									style="--d:{i * 120}ms"
								>
									<div class="xp-seg-visual"><MiniVisual kind={seg.visual} /></div>
									<p class="xp-seg-when">{seg.when}</p>
									<h3>{seg.title}</h3>
									<p class="xp-seg-who">{seg.who}</p>
									<div class="xp-seg-link rv" class:on={beat >= 1}>
										<p class="xp-seg-problem">{seg.problem}</p>
										<p class="xp-seg-answer">{seg.answer}</p>
									</div>
								</article>
							{/each}
						</div>
						<p class="xp-channels rv" class:on={beat >= 2}>
							Canales que queremos explorar:
							{#each CHANNELS as ch (ch)}<span>{ch}</span>{/each}
						</p>
					</div>
				{:else if scene.id === 'economia'}
					<div class="xp-wide xp-econ2">
						<div class="xp-econ2-head">
							<p class="xp-kicker">Oferta comercial</p>
							<AnimatedText
								tag="h2"
								className="xp-h2"
								text="Precios definidos. Listos para facturar."
								step={16}
							/>
						</div>
						<figure class="xp-product">
							<img src={MEDIA.kit} alt="Equipos GPS, laptop, tablet y celular con Nexus" />
							<span class="xp-product-shine" aria-hidden="true"></span>
						</figure>
						<div class="xp-plans xp-plans-row">
							{#each PLANS as plan, i (plan.name)}
								<article
									class="xp-plan beam"
									class:featured={plan.featured}
									style="--d:{1400 + i * 120}ms; --beam-delay:{i * -1.3}s"
								>
									<p class="xp-plan-name">{plan.name}</p>
									<p class="xp-plan-price">
										<span use:countUp={plan.monthly}>${plan.monthly}</span>
										<small>/ mes</small>
									</p>
									<p class="xp-plan-setup rv" class:on={beat >= 1}>
										Alta ${plan.setup.toLocaleString('es-MX')}
										<small>equipo GPS, instalación y SIM</small>
									</p>
								</article>
							{/each}
							<article class="xp-plan xp-plan-dual">
								<p class="xp-plan-name">DUAL</p>
								<p class="xp-plan-custom">A la medida</p>
								<p class="xp-plan-setup">Se cotiza según la operación</p>
							</article>
						</div>
						<p class="xp-econ-note rv" class:on={beat >= 1}>
							Precios en MXN más IVA · Plazo mínimo de 3 meses
						</p>
						<ul class="xp-facts rv" class:on={beat >= 2}>
							<li><strong>12 meses</strong> de desarrollo</li>
							<li><strong>Facturación</strong> activa</li>
							<li><strong>Soporte</strong> local en Querétaro</li>
							<li><strong>Capacidad adicional</strong> por validar con pruebas de carga</li>
						</ul>
					</div>
				{:else if scene.id === 'ingenieria'}
					<video
						class="xp-bgvideo xp-bg-helix"
						src={MEDIA.helice}
						autoplay
						muted
						loop
						playsinline
						aria-hidden="true"
					></video>
					<div class="xp-bgshade xp-shade-helix" aria-hidden="true"></div>
					<div class="xp-wide">
						<p class="xp-kicker">Ingeniería y confianza</p>
						<h2 class="xp-h2">Procesamiento orientado a eventos.</h2>
						<div class="xp-flow-wrap rv on" style="--d:300ms">
							<FlowDiagram {reduced} future={beat >= 3} />
						</div>
						<ul class="xp-flow-legend">
							<li><i class="ok"></i>Operando</li>
							<li><i class="partial"></i>Desarrollado, en validación</li>
							<li class:dim={beat < 3}><i class="lab"></i>Investigación</li>
						</ul>
						{#if beat >= 3}
							<div class="xp-research rv on">
								<p class="xp-layer-title xp-lab-title">Laboratorio Geminis · investigación</p>
								<ul>
									{#each RESEARCH_LINES as r, i (r.t)}
										<li style="--d:{i * 90}ms"><strong>{r.t}</strong><span>{r.d}</span></li>
									{/each}
								</ul>
							</div>
						{:else}
							<div class="xp-layers">
								<div class="rv beam" class:on={beat >= 1}>
									<p class="xp-layer-title">Hoy</p>
									<ul>
										{#each CONTROLS as c (c)}<li>{c}</li>{/each}
									</ul>
								</div>
								<div class="rv" class:on={beat >= 2}>
									<p class="xp-layer-title xp-accent-next">Siguientes hitos</p>
									<ul>
										{#each NEXT_STEPS as c (c)}<li>{c}</li>{/each}
									</ul>
								</div>
							</div>
						{/if}
					</div>
				{:else if scene.id === 'horizonte'}
					<div class="xp-bgshade xp-shade-horizon" aria-hidden="true"></div>
					<div class="xp-horizon2">
						<p class="xp-kicker">Horizonte</p>
						<div class="xp-orbit3">
							<video
								class="xp-orbit3-core"
								src={MEDIA.nexusLogo}
								autoplay
								muted
								playsinline
								use:holdLoop={7000}
								aria-label="Nexus"
							></video>
							<svg class="xp-orbit3-ring" viewBox="-100 -50 200 100" aria-hidden="true">
								<ellipse rx="96" ry="40" />
								<ellipse rx="70" ry="28" />
							</svg>
							{#each ORBITS as o, i (o.t)}
								{@const a = orbitT * 0.16 + (i * Math.PI * 2) / ORBITS.length}
								{@const depth = (Math.sin(a) + 1) / 2}
								<div
									class="xp-orbit3-node beam"
									style="--x:{Math.cos(a)}; --y:{Math.sin(a)}; --z:{depth}; z-index:{depth > 0.45
										? 3
										: 1}; --beam-delay:{i * -1.4}s"
								>
									<div class="xp-orbit-visual"><HorizonVisual kind={o.visual} /></div>
									<strong>{o.t}</strong>
									<span class="xp-state">{o.s}</span>
									<small>{o.d}</small>
								</div>
							{/each}
						</div>
						<p class="xp-horizon-line">
							No son productos terminados: son caminos de expansión de una misma capacidad.
						</p>
					</div>
				{:else if scene.id === 'capas'}
					<div class="xp-capas">
						<div class="xp-capas-text">
							<p class="xp-kicker xp-kicker-lab">Visión · inteligencia urbana</p>
							<h2 class="xp-h2 rv on">Querétaro, por capas.</h2>
							<p class="xp-body rv on" style="--d:200ms">
								Lo que Nexus observa, ordenado en celdas H3, puede ayudar a entender cómo se mueve
								la ciudad.
							</p>
							<ul class="xp-capas-list" class:shown={beat >= 1}>
								{#each CITY_LAYERS as l, i (l.id)}
									<li
										class="rv on"
										class:active={beat >= 1 && activeLayer === i}
										style="--d:{400 + i * 110}ms; --rgb:{l.rgb.join(',')}"
									>
										<strong>{l.n}</strong><span>{l.d}</span>
									</li>
								{/each}
							</ul>
							<div class="xp-corridor rv" class:on={beat >= 2}>
								<p class="xp-corridor-t">Primer experimento posible: un corredor vial</p>
								<ol>
									{#each CORRIDOR_PHASES as ph, i (ph)}<li><b>{i + 1}</b>{ph}</li>{/each}
								</ol>
								<p class="xp-corridor-n">
									Resultados agregados, muestras mínimas y sin seguimiento individual.
								</p>
							</div>
						</div>
						<div class="xp-capas-stack">
							<CityModel3D
								layers={CITY_LAYERS}
								bind:active={activeLayer}
								layersOn={beat >= 1}
								{reduced}
							/>
						</div>
					</div>
					<p class="xp-source">
						Visión en investigación · maqueta del Centro Histórico: edificios y calles ©
						OpenStreetMap contributors (ODbL) · celdas H3 r10 reales · capas 2–5 ilustrativas
					</p>
				{:else if scene.id === 'centli'}
					<div class="xp-photo xp-kenburns" class:dim={beat >= 1} aria-hidden="true">
						<img src={IMAGES.centliCampo} alt="" />
					</div>
					<div class="xp-photo xp-photo-swap" class:on={beat >= 2} aria-hidden="true">
						<img src={IMAGES.centliDron} alt="" />
					</div>
					<div class="xp-photo-shade xp-shade-centli" aria-hidden="true"></div>
					<div class="xp-centli2">
						<p class="xp-kicker xp-kicker-gold">Geminis Labs · visión en desarrollo</p>
						<h2 class="xp-centli-name">CENTLI</h2>
						<p class="xp-centli-tag">Inteligencia desde el origen</p>
						<p class="xp-centli-def">
							<em>Centli</em>: mazorca, en náhuatl. Agua, suelo, cultivos y ganado en un solo
							sistema.
						</p>
						<ol class="xp-cycle rv" class:on={beat >= 1}>
							{#each CENTLI_CYCLE as step, i (step.k)}
								<li style="--d:{i * 120}ms">
									<span class="xp-cycle-n">{String(i + 1).padStart(2, '0')}</span>
									<strong>{step.k}</strong>
									<small>{step.d}</small>
								</li>
							{/each}
						</ol>
						<div class="xp-centli-pilot rv" class:on={beat >= 2}>
							<p class="xp-centli-quote">
								La tecnología no reemplaza la experiencia del campo. La hace observable, medible y
								escalable.
							</p>
							<p class="xp-centli-mvp">
								Primer piloto:
								{#each CENTLI_PILOT as p (p)}<span>{p}</span>{/each}
							</p>
						</div>
					</div>
					<p class="xp-source xp-source-light">
						Imágenes conceptuales · Centli no es un producto comercial todavía
					</p>
				{:else if scene.id === 'peticion'}
					<div class="xp-wide xp-ask">
						<p class="xp-kicker">La propuesta</p>
						<AnimatedText
							tag="h2"
							className="xp-ask-title"
							text="Vinculación con compradores calificados"
							step={18}
						/>
						<p class="xp-ask-lead rv on" style="--d:900ms">
							No pedimos que decidan comprar Nexus. Pedimos la oportunidad de demostrar su valor
							frente a quienes sí podrían necesitarlo.
						</p>
						<div class="xp-asks rv" class:on={beat >= 1}>
							{#each ASKS as ask, i (ask.id)}
								<button
									class="xp-ask-card spot beam"
									class:first={i === 0}
									onpointermove={spotlight}
									onclick={() => (ficha = ask)}
									style="--d:{i * 110}ms; --beam-delay:{i * -1.2}s"
								>
									<span class="xp-ask-top">
										<span class="xp-ask-n">{ask.n}</span>
										<svg class="xp-ask-icon" viewBox="0 0 24 24" aria-hidden="true"
											><path d={ASK_ICONS[ask.id]} /></svg
										>
									</span>
									<strong>{ask.title}</strong>
									<span>{ask.short}</span>
								</button>
							{/each}
						</div>
						<p class="xp-ask-next rv" class:on={beat >= 2}>
							<span>Responsable</span><i></i><span>Primera mesa</span><i></i><span
								>Fecha de seguimiento</span
							>
						</p>
					</div>
				{:else if scene.id === 'cierre'}
					<div class="xp-center xp-close">
						<div class="xp-gl-mark xp-gl-mark-lg rv on">
							<span class="xp-gl-halo" aria-hidden="true"></span>
							<img src="/img/geminislabs-nobg.webp" alt="" />
						</div>
						<h2 class="xp-dune xp-dune-xl rv on" style="--d:300ms">GEMINIS LABS</h2>
						<AnimatedText
							tag="p"
							className="xp-lema"
							text="Conectamos humanidad y tecnología"
							delay={700}
							step={22}
						/>
						<p class="xp-built rv on" style="--d:1500ms">Construido en Querétaro</p>
						<p class="xp-contact rv" class:on={beat >= 1}>
							{CONTACT.site} · {CONTACT.email}
						</p>
					</div>
				{/if}
			</section>
		{/key}
	</main>

	<div class="xp-progress" style="--p:{pct}" aria-hidden="true"></div>
	<div class="xp-chrome" class:show={chromeVisible && !overlayOpen()} data-noadvance>
		<span>{String(nav.scene).padStart(2, '0')} · {scene.title}</span>
		<button onclick={() => (menuOpen = true)} aria-label="Índice de escenas">M</button>
		<button onclick={toggleFullscreen} aria-label="Pantalla completa">F</button>
	</div>

	{#if menuOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="xp-overlay"
			onclick={(e) => e.target === e.currentTarget && (menuOpen = false)}
			data-noadvance
		>
			<nav class="xp-menu" aria-label="Escenas">
				<p class="xp-kicker">Escenas</p>
				<ol>
					{#each SCENES as s, i (s.id)}
						<li>
							<button class:current={i === nav.scene} onclick={() => jump(i)}>
								<span>{String(i).padStart(2, '0')}</span>
								{s.title}
							</button>
						</li>
					{/each}
				</ol>
				<p class="xp-menu-keys">
					→ / espacio avanzar · ← regresar · D Nexus en vivo · V video · F pantalla completa · Esc
					cerrar
				</p>
			</nav>
		</div>
	{/if}

	{#if ficha}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="xp-overlay"
			onclick={(e) => e.target === e.currentTarget && (ficha = null)}
			data-noadvance
		>
			<article class="xp-ficha">
				<p class="xp-kicker">{ficha.n} · Ficha</p>
				<h3>{ficha.ficha.title}</h3>
				<p class="xp-ficha-lead">{ficha.ficha.lead}</p>
				<dl>
					{#each ficha.ficha.items as [k, v] (k)}
						<dt>{k}</dt>
						<dd>{v}</dd>
					{/each}
				</dl>
				<button class="xp-ficha-close" onclick={() => (ficha = null)}>Cerrar · Esc</button>
			</article>
		</div>
	{/if}

	{#if videoOpen}
		<div class="xp-overlay xp-video" data-noadvance>
			{#if videoError}
				<p class="xp-body">El video de respaldo aún no está disponible.</p>
			{:else}
				<video
					src={DEMO_VIDEO_SRC}
					controls
					autoplay
					muted
					playsinline
					onerror={() => (videoError = true)}
				></video>
				<p class="xp-footnote">Demostración grabada</p>
			{/if}
			<button class="xp-ficha-close" onclick={() => (videoOpen = false)}>Cerrar · Esc</button>
		</div>
	{/if}
</div>
