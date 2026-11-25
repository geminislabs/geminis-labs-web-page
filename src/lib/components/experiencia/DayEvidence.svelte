<script>
	/**
	 * Evidencia real: un día de una unidad de pruebas en Nexus. Lo que pasó
	 * (recorrido, tiempos, batería), cómo está el equipo y lo que viene.
	 * Las animaciones arrancan cuando la sección entra en pantalla.
	 */
	import { onMount } from 'svelte';
	import DayRing from './DayRing.svelte';
	import PeakChart from './PeakChart.svelte';
	import { TELEMETRY, TELEMETRY_NEXT } from './telemetria.js';

	let host = $state(null);
	let shown = $state(false);
	let reduced = $state(false);

	const pct = (TELEMETRY.health.valid / TELEMETRY.health.total) * 100;

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					shown = true;
					io.disconnect();
				}
			},
			{ rootMargin: '0px 0px -15% 0px' }
		);
		io.observe(host);
		return () => io.disconnect();
	});

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
</script>

<div class="de" class:shown bind:this={host}>
	<header class="de-head">
		<p class="de-kicker">Evidencia real · unidad de pruebas del equipo</p>
		<h2 class="de-title">Un día real: lo que pasó, cómo está y lo que viene.</h2>
		<p class="de-sub">
			Informe generado en Nexus el {TELEMETRY.period.split('·')[1]?.trim()} · sin ubicaciones
		</p>
	</header>

	{#if shown}
		<div class="de-top">
			<div class="de-ring">
				<DayRing speeds={TELEMETRY.speeds} center="28.8 km" caption={TELEMETRY.period} />
			</div>
			<div class="de-kpis">
				{#each TELEMETRY.kpis.slice(1) as kpi, i (kpi.k)}
					<div class="de-kpi" style="--d:{i * 110}ms">
						<span use:countNumber={{ value: kpi.v, decimals: kpi.d, delay: 200 + i * 110 }}
							>{kpi.v}</span
						><small>{kpi.u}</small>
						<em>{kpi.k}</em>
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
				note="El pico de 14.0 V es el alternador cargando con el motor encendido"
				color="#4fd1ff"
				{reduced}
			/>
		</div>

		<div class="de-health">
			<div class="de-gauge">
				<svg viewBox="0 0 120 120" aria-hidden="true">
					<circle cx="60" cy="60" r="50" class="de-gauge-bg" />
					<circle cx="60" cy="60" r="50" class="de-gauge-val" pathLength="100" style="--v:{pct}" />
				</svg>
				<div><strong>{pct.toFixed(1)}%</strong><span>válidas</span></div>
			</div>
			<div class="de-health-txt">
				<p class="de-label">Salud del equipo</p>
				<p>
					<b>{TELEMETRY.health.valid}</b> de <b>{TELEMETRY.health.total}</b> comunicaciones con posición
					válida.
				</p>
				<p class="de-warn">
					2 excepciones ({TELEMETRY.health.at}): {TELEMETRY.health.exceptions.join(' · ')}
				</p>
			</div>
			<ul class="de-checks">
				{#each TELEMETRY.batteryCheck as b (b.k)}
					<li><span>{b.k}</span><strong>{b.v}</strong><small>{b.d}</small></li>
				{/each}
				<li class="de-driving">
					<span>Estilo de manejo</span>
					<strong>Aceleraciones y frenados bruscos</strong>
					<small>Modelo de conducción en validación</small>
				</li>
				<li class="de-note">Lectura indicativa por voltaje; no sustituye una prueba de carga.</li>
			</ul>
		</div>

		<div class="de-next">
			<p class="de-label de-lab">Con los mismos datos · investigación</p>
			<ul>
				{#each TELEMETRY_NEXT as n (n.t)}
					<li><strong>{n.t}</strong><span>{n.d}</span></li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.de {
		--ink: #eaf3fc;
		--ink-2: #94b5d0;
		--muted: #5a7891;
		--neon: #00ff88;
		--amber: #ffbe5c;
		--lab: #c38bff;
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		color: var(--ink);
		font-family: Outfit, system-ui, sans-serif;
		min-height: 420px;
	}
	.de-head {
		max-width: 760px;
	}
	.de-kicker {
		margin: 0 0 0.6rem;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--neon);
	}
	.de-title {
		margin: 0;
		font-size: clamp(1.8rem, 3.4vw, 2.9rem);
		line-height: 1.1;
		font-weight: 700;
		color: var(--ink);
	}
	.de-sub {
		margin: 0.6rem 0 0;
		color: var(--ink-2);
	}
	.de-top {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr) minmax(0, 1.15fr);
		gap: 1.6rem;
		align-items: center;
	}
	.de-ring :global(svg) {
		max-height: 300px;
	}
	.de-kpis {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.7rem;
	}
	.de-kpi {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem;
		padding: 1rem 1.1rem;
		border-radius: 16px;
		background: rgba(6, 18, 30, 0.85);
		box-shadow: inset 0 0 0 1px rgba(110, 200, 255, 0.18);
		animation: de-in 0.6s ease both;
		animation-delay: var(--d);
	}
	.de-kpi span {
		font-size: clamp(1.8rem, 3vw, 2.4rem);
		font-weight: 700;
	}
	.de-kpi small {
		color: var(--ink-2);
	}
	.de-kpi em {
		flex-basis: 100%;
		font-style: normal;
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.de-health {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) minmax(0, 1.7fr);
		gap: 1.6rem;
		align-items: center;
		padding: 1rem 1.3rem;
		border-radius: 18px;
		background: rgba(4, 18, 28, 0.85);
		box-shadow: inset 0 0 0 1px rgba(0, 255, 150, 0.25);
		animation: de-in 0.7s ease 0.3s both;
	}
	.de-gauge {
		position: relative;
		width: 120px;
		aspect-ratio: 1;
	}
	.de-gauge svg {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}
	.de-gauge-bg,
	.de-gauge-val {
		fill: none;
		stroke-width: 10;
	}
	.de-gauge-bg {
		stroke: rgba(148, 181, 208, 0.15);
	}
	.de-gauge-val {
		stroke: var(--neon);
		stroke-linecap: round;
		stroke-dasharray: var(--v) 100;
		filter: drop-shadow(0 0 6px rgba(0, 255, 150, 0.6));
		animation: de-gauge 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both;
	}
	@keyframes de-gauge {
		from {
			stroke-dasharray: 0 100;
		}
	}
	.de-gauge div {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.de-gauge strong {
		font-size: 1.45rem;
		color: var(--neon);
	}
	.de-gauge span {
		font-size: 0.62rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.de-label {
		margin: 0 0 0.4rem;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--neon);
	}
	.de-health-txt p {
		margin: 0 0 0.3rem;
	}
	.de-health-txt b {
		color: var(--neon);
	}
	.de-warn {
		font-size: 0.85rem;
		color: var(--amber);
	}
	.de-checks {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.7rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.de-checks li {
		display: flex;
		flex-direction: column;
		padding: 0.4rem 0.7rem;
		border-left: 2px solid #4fd1ff;
	}
	.de-checks span {
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.de-checks strong {
		font-size: 1.15rem;
	}
	.de-checks small {
		font-size: 0.78rem;
		color: var(--ink-2);
	}
	.de-checks .de-driving {
		border-left-color: var(--amber);
	}
	.de-checks .de-driving strong {
		font-size: 0.95rem;
	}
	.de-checks .de-driving small {
		color: var(--amber);
	}
	.de-checks .de-note {
		grid-column: 1 / -1;
		border: 0;
		padding: 0;
		font-size: 0.74rem;
		color: var(--muted);
	}
	.de-next {
		padding: 1rem 1.3rem;
		border-radius: 18px;
		background: rgba(18, 8, 34, 0.85);
		box-shadow:
			inset 0 0 0 1px rgba(195, 139, 255, 0.4),
			0 0 50px rgba(195, 139, 255, 0.12);
		animation: de-in 0.7s ease 0.5s both;
	}
	.de-lab {
		color: var(--lab);
	}
	.de-next ul {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 0.9rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.de-next strong {
		display: block;
		font-size: 0.92rem;
		color: #efe2ff;
	}
	.de-next span {
		font-size: 0.8rem;
		color: #b9a6d6;
	}
	@keyframes de-in {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
	}
	@media (max-width: 960px) {
		.de-top,
		.de-health {
			grid-template-columns: 1fr;
		}
		.de-checks {
			grid-template-columns: 1fr 1fr;
		}
		.de-next ul {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.de-kpi,
		.de-health,
		.de-next,
		.de-gauge-val {
			animation: none;
		}
	}
</style>
