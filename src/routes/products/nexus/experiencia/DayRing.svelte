<script>
	/**
	 * Reloj de 24 horas: barras radiales con la velocidad por hora de la unidad
	 * y una manecilla que barre el día. Las barras crecen en orden al entrar.
	 */
	let { speeds = [], center = '', caption = '', unit = 'km/h' } = $props();

	const R0 = 118;
	const R1 = 196;
	let max = $derived(Math.max(1, ...speeds));

	function polar(r, hour) {
		const a = (hour / 24) * Math.PI * 2 - Math.PI / 2;
		return [Math.cos(a) * r, Math.sin(a) * r];
	}

	let bars = $derived(
		speeds.map((v, h) => {
			const len = 6 + (v / max) * (R1 - R0);
			const a0 = h + 0.12;
			const a1 = h + 0.88;
			const [x0, y0] = polar(R0, a0);
			const [x1, y1] = polar(R0 + len, a0);
			const [x2, y2] = polar(R0 + len, a1);
			const [x3, y3] = polar(R0, a1);
			const r = R0 + len;
			return {
				h,
				v,
				d: `M${x0} ${y0} L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${R0} ${R0} 0 0 0 ${x0} ${y0} Z`
			};
		})
	);
</script>

<figure class="dr-ring">
	<svg viewBox="-250 -250 500 500" aria-hidden="true">
		<defs>
			<radialGradient id="ring-glow">
				<stop offset="0.45" stop-color="#4fd1ff" stop-opacity="0.18" />
				<stop offset="1" stop-color="#4fd1ff" stop-opacity="0" />
			</radialGradient>
			<linearGradient id="ring-bar" x1="0" x2="1">
				<stop offset="0" stop-color="#00ff88" />
				<stop offset="1" stop-color="#4fd1ff" />
			</linearGradient>
		</defs>
		<circle r="240" fill="url(#ring-glow)" />
		<circle r={R0 - 8} class="dr-ring-inner" />
		<circle r={R1 + 8} class="dr-ring-outer" />
		{#each Array(96) as _, i (i)}
			{@const [x0, y0] = polar(R1 + 14, i / 4)}
			{@const [x1, y1] = polar(R1 + (i % 4 === 0 ? 26 : 19), i / 4)}
			<line x1={x0} y1={y0} x2={x1} y2={y1} class="dr-tick" class:major={i % 24 === 0} />
		{/each}
		{#each [0, 6, 12, 18] as h (h)}
			{@const [x, y] = polar(R1 + 42, h)}
			<text {x} {y} class="dr-hour">{String(h).padStart(2, '0')}:00</text>
		{/each}
		{#each bars as b (b.h)}
			<path d={b.d} class="dr-bar" class:dr-idle={b.v === 0} style="--d:{100 + b.h * 22}ms" />
		{/each}
		<text y="-6" class="dr-center">{center}</text>
		<text y="24" class="dr-center-sub">distancia en el día</text>
	</svg>
	<figcaption>{caption} · barras: velocidad promedio por hora ({unit})</figcaption>
</figure>

<style>
	.dr-ring {
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	svg {
		width: min(100%, 52vh);
		height: auto;
		overflow: visible;
	}
	.dr-ring-inner {
		fill: rgba(6, 16, 30, 0.85);
		stroke: rgba(79, 209, 255, 0.25);
	}
	.dr-ring-outer {
		fill: none;
		stroke: rgba(148, 181, 208, 0.18);
		stroke-dasharray: 2 6;
	}
	.dr-tick {
		stroke: rgba(148, 181, 208, 0.25);
		stroke-width: 1;
	}
	.dr-tick.major {
		stroke: rgba(234, 243, 252, 0.7);
		stroke-width: 2;
	}
	.dr-hour {
		fill: #94b5d0;
		font:
			600 13px Outfit,
			system-ui,
			sans-serif;
		text-anchor: middle;
		dominant-baseline: middle;
	}
	.dr-bar {
		fill: url(#ring-bar);
		filter: drop-shadow(0 0 6px rgba(0, 255, 136, 0.55));
		transform-box: view-box;
		transform-origin: 50% 50%;
		opacity: 0;
		transform: scale(0.6);
		animation: bar-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
		animation-delay: var(--d);
	}
	.dr-bar.dr-idle {
		fill: rgba(148, 181, 208, 0.22);
		filter: none;
	}
	@keyframes bar-in {
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	.dr-center {
		fill: #eaf3fc;
		font:
			650 46px Outfit,
			system-ui,
			sans-serif;
		text-anchor: middle;
	}
	.dr-center-sub {
		fill: #94b5d0;
		font:
			400 14px Outfit,
			system-ui,
			sans-serif;
		text-anchor: middle;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	figcaption {
		margin-top: 0.4rem;
		font-size: 0.8rem;
		color: #5a7891;
		text-align: center;
	}
	@media (prefers-reduced-motion: reduce) {
		.dr-bar {
			animation: none;
			opacity: 1;
			transform: none;
		}
	}
</style>
