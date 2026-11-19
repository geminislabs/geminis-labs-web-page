<script>
	/**
	 * Ilustraciones vivas del horizonte (SVG + CSS):
	 *  - teams: integrantes dentro de una zona compartida; uno sale y se avisa.
	 *  - inteligencia: señales de varias fuentes convergen y salen hallazgos.
	 *  - marca: el mismo celular cambia de marca y colores.
	 */
	let { kind = 'teams' } = $props();

	const MEMBERS = [
		{ id: 'A', c: '#00ff88', path: 'M150 70 a 22 14 0 1 0 1 0' },
		{ id: 'L', c: '#4fd1ff', path: 'M175 95 a 16 12 0 1 1 1 0' },
		{ id: 'M', c: '#c38bff', path: 'M130 100 a 14 18 0 1 0 1 0' }
	];
	const SOURCES = [
		{ y: 38, t: 'GPS' },
		{ y: 85, t: 'Celular' },
		{ y: 132, t: 'Sensores' }
	];
	const INSIGHTS = ['Ruta inusual', 'Parada prolongada', 'Patrón repetido'];
	const BRANDS = [
		{ n: 'NEXUS', c: '#3ec128' },
		{ n: 'TU MARCA', c: '#2b7bf0' },
		{ n: 'INTEGRADOR GPS', c: '#e0457b' }
	];
</script>

<div class="hv hv-{kind}" aria-hidden="true">
	{#if kind === 'teams'}
		<svg viewBox="0 0 320 170">
			{#each Array(9) as _, i (i)}
				<line x1={i * 40} y1="0" x2={i * 40 - 30} y2="170" class="grid" />
			{/each}
			<line x1="0" y1="60" x2="320" y2="40" class="grid" />
			<line x1="0" y1="130" x2="320" y2="115" class="grid" />
			<circle cx="155" cy="85" r="58" class="zone" />
			<text x="155" y="20" class="zone-t">Zona del grupo</text>
			{#each MEMBERS as m, i (m.id)}
				<path id="hv-m{i}" d={m.path} fill="none" />
				<g>
					<animateMotion dur="{6 + i * 1.5}s" repeatCount="indefinite">
						<mpath href="#hv-m{i}" />
					</animateMotion>
					<circle r="11" fill="#071422" stroke={m.c} stroke-width="2" />
					<text class="ini" y="4">{m.id}</text>
				</g>
			{/each}
			<g class="leaver">
				<circle r="11" fill="#1c1006" stroke="#ffb35c" stroke-width="2" />
				<text class="ini" y="4">J</text>
			</g>
			<g class="alert">
				<rect x="214" y="122" width="96" height="26" rx="8" />
				<text x="262" y="139">Salió de la zona</text>
			</g>
		</svg>
		<p class="hv-foot">Viaje escolar · 4 integrantes · comparte hasta las 18:00</p>
	{:else if kind === 'inteligencia'}
		<svg viewBox="0 0 320 170">
			{#each SOURCES as src, i (src.t)}
				<path id="hv-s{i}" d="M58 {src.y} C 100 {src.y}, 110 85, 152 85" class="wire" />
				<rect x="6" y={src.y - 11} width="52" height="22" rx="7" class="src" />
				<text x="32" y={src.y + 4} class="src-t">{src.t}</text>
				{#each [0, 1] as k (k)}
					<circle r="2.6" class="pulse">
						<animateMotion dur="1.8s" repeatCount="indefinite" begin="-{i * 0.5 + k * 0.9}s">
							<mpath href="#hv-s{i}" />
						</animateMotion>
					</circle>
				{/each}
			{/each}
			<circle cx="164" cy="85" r="15" class="core" />
			<circle cx="164" cy="85" r="15" class="core-ring" />
			<path d="M180 85 L 200 85" class="wire" />
			{#each INSIGHTS as ins, i (ins)}
				<g class="insight" style="--i:{i}">
					<rect x="204" y={44 + i * 32} width="110" height="24" rx="8" />
					<text x="259" y={60 + i * 32}>{ins}</text>
				</g>
			{/each}
		</svg>
		<p class="hv-foot">Varias señales, una conclusión con evidencia</p>
	{:else}
		<div class="brand-stage">
			<div class="brand-phone">
				{#each BRANDS as b, i (b.n)}
					<div class="brand-face" style="--c:{b.c}; --i:{i}">
						<span class="brand-bar">{b.n}</span>
						<span class="brand-map"><i></i></span>
						<span class="brand-row"></span>
						<span class="brand-row short"></span>
					</div>
				{/each}
			</div>
			<div class="brand-swatches">
				{#each BRANDS as b, i (b.n)}
					<span style="--c:{b.c}; --i:{i}"></span>
				{/each}
			</div>
		</div>
		<p class="hv-foot">La misma plataforma, con la marca de cada integrador</p>
	{/if}
</div>

<style>
	.hv {
		position: relative;
		height: 100%;
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		overflow: hidden;
		background: radial-gradient(ellipse at 50% 45%, rgba(10, 36, 34, 0.95), rgba(3, 10, 12, 0.98));
	}
	svg {
		flex: 1;
		width: 100%;
		min-height: 0;
	}
	.hv-foot {
		margin: 0;
		padding: 0.35rem 0.6rem 0.5rem;
		font-size: 0.72rem;
		color: #8fb9b0;
		text-align: center;
	}
	.grid {
		stroke: rgba(120, 180, 170, 0.1);
		stroke-width: 1;
	}
	.zone {
		fill: rgba(0, 255, 136, 0.07);
		stroke: rgba(0, 255, 136, 0.55);
		stroke-dasharray: 5 5;
		animation: zone 3s ease-in-out infinite;
	}
	@keyframes zone {
		50% {
			fill: rgba(0, 255, 136, 0.13);
		}
	}
	.zone-t {
		fill: #9ff5c4;
		font:
			600 9px Outfit,
			sans-serif;
		text-anchor: middle;
		letter-spacing: 0.08em;
	}
	.ini {
		fill: #eaf3fc;
		font:
			700 10px Outfit,
			sans-serif;
		text-anchor: middle;
	}
	.leaver {
		animation: leave 7s ease-in-out infinite;
	}
	@keyframes leave {
		0%,
		15% {
			transform: translate(170px, 72px);
		}
		55%,
		85% {
			transform: translate(250px, 110px);
		}
		100% {
			transform: translate(170px, 72px);
		}
	}
	.alert {
		opacity: 0;
		animation: alert 7s ease-in-out infinite;
	}
	.alert rect {
		fill: rgba(40, 20, 6, 0.95);
		stroke: #ffb35c;
	}
	.alert text {
		fill: #ffd9b0;
		font:
			600 9.5px Outfit,
			sans-serif;
		text-anchor: middle;
	}
	@keyframes alert {
		0%,
		45%,
		92%,
		100% {
			opacity: 0;
		}
		55%,
		85% {
			opacity: 1;
		}
	}

	.wire {
		fill: none;
		stroke: rgba(195, 139, 255, 0.35);
		stroke-width: 1.4;
	}
	.src {
		fill: #120a26;
		stroke: rgba(195, 139, 255, 0.6);
	}
	.src-t {
		fill: #e6d6ff;
		font:
			600 9px Outfit,
			sans-serif;
		text-anchor: middle;
	}
	.pulse {
		fill: #f0dcff;
		filter: drop-shadow(0 0 4px #c38bff);
	}
	.core {
		fill: #c38bff;
		filter: drop-shadow(0 0 12px #c38bff);
	}
	.core-ring {
		fill: none;
		stroke: #c38bff;
		transform-box: fill-box;
		transform-origin: center;
		animation: ring 1.8s ease-out infinite;
	}
	@keyframes ring {
		to {
			transform: scale(2.2);
			opacity: 0;
		}
	}
	.insight {
		opacity: 0;
		animation: insight 6s ease-in-out infinite;
		animation-delay: calc(var(--i) * 0.8s);
	}
	.insight rect {
		fill: rgba(30, 14, 54, 0.95);
		stroke: rgba(195, 139, 255, 0.7);
	}
	.insight text {
		fill: #f0e6ff;
		font:
			600 9.5px Outfit,
			sans-serif;
		text-anchor: middle;
	}
	@keyframes insight {
		0% {
			opacity: 0;
			transform: translateX(-8px);
		}
		10%,
		70% {
			opacity: 1;
			transform: none;
		}
		85%,
		100% {
			opacity: 0;
		}
	}

	.brand-stage {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.2rem;
	}
	.brand-phone {
		position: relative;
		width: 84px;
		height: 150px;
		border-radius: 16px;
		background: #060b14;
		box-shadow: 0 0 0 2px #2a3550;
		overflow: hidden;
	}
	.brand-face {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		gap: 7px;
		padding: 8px;
		opacity: 0;
		animation: face 9s infinite;
		animation-delay: calc(var(--i) * 3s);
	}
	@keyframes face {
		0%,
		30% {
			opacity: 1;
		}
		36%,
		100% {
			opacity: 0;
		}
	}
	.brand-bar {
		padding: 4px 5px;
		border-radius: 6px;
		background: var(--c);
		color: #fff;
		font:
			800 7px Outfit,
			sans-serif;
		letter-spacing: 0.05em;
		white-space: nowrap;
		overflow: hidden;
	}
	.brand-map {
		position: relative;
		flex: 1;
		border-radius: 8px;
		background:
			linear-gradient(35deg, transparent 45%, rgba(148, 181, 208, 0.3) 46%, transparent 49%),
			linear-gradient(-20deg, transparent 55%, rgba(148, 181, 208, 0.25) 56%, transparent 58%),
			#0f2236;
	}
	.brand-map i {
		position: absolute;
		left: 50%;
		top: 45%;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--c);
		box-shadow: 0 0 10px var(--c);
	}
	.brand-row {
		height: 6px;
		border-radius: 3px;
		background: color-mix(in srgb, var(--c) 55%, #1a2a3c);
	}
	.brand-row.short {
		width: 60%;
	}
	.brand-swatches {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.brand-swatches span {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--c);
		opacity: 0.3;
		animation: swatch 9s infinite;
		animation-delay: calc(var(--i) * 3s);
	}
	@keyframes swatch {
		0%,
		30% {
			opacity: 1;
			box-shadow: 0 0 12px var(--c);
		}
		36%,
		100% {
			opacity: 0.3;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.leaver,
		.alert,
		.insight,
		.brand-face,
		.brand-swatches span,
		.zone,
		.core-ring {
			animation: none;
		}
		.insight,
		.brand-face:first-child {
			opacity: 1;
		}
	}
</style>
