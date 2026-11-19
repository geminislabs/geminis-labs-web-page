<script>
	/**
	 * Tarjeta de cifra con una línea que se dibuja, un punto que late en el pico
	 * y el número que cuenta hasta su valor exacto.
	 */
	import { onMount } from 'svelte';

	let {
		data = [],
		value = 0,
		decimals = 0,
		unit = '',
		label = '',
		note = '',
		reduced = false,
		color = '#4fd1ff'
	} = $props();

	const W = 520;
	const H = 170;
	let shown = $state(0);

	let geometry = $derived.by(() => {
		const min = Math.min(...data);
		const max = Math.max(...data);
		const span = max - min || 1;
		const pts = data.map((v, i) => [
			(i / Math.max(1, data.length - 1)) * W,
			H - 14 - ((v - min) / span) * (H - 40)
		]);
		const line = pts
			.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
			.join(' ');
		const area = `${line} L${W} ${H} L0 ${H} Z`;
		const peak = pts[data.indexOf(max)];
		return { line, area, peak };
	});

	onMount(() => {
		if (reduced) {
			shown = value;
			return;
		}
		const t0 = performance.now() + 100;
		let raf = 0;
		const tick = (t) => {
			const p = Math.max(0, Math.min(1, (t - t0) / 1200));
			shown = value * (1 - Math.pow(1 - p, 3));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<figure class="pk" style="--c:{color}">
	<figcaption>
		<span class="pk-label">{label}</span>
		<span class="pk-value">
			{shown.toLocaleString('es-MX', {
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals
			})}<small>{unit}</small>
		</span>
	</figcaption>
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
		<defs>
			<linearGradient id="pk-fill" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0" stop-color={color} stop-opacity="0.35" />
				<stop offset="1" stop-color={color} stop-opacity="0" />
			</linearGradient>
		</defs>
		<path class="pk-area" d={geometry.area} fill="url(#pk-fill)" />
		<path class="pk-line" d={geometry.line} pathLength="1" />
		<circle class="pk-ping" cx={geometry.peak[0]} cy={geometry.peak[1]} r="6" />
		<circle class="pk-dot" cx={geometry.peak[0]} cy={geometry.peak[1]} r="5" />
	</svg>
	{#if note}<p class="pk-note">{note}</p>{/if}
</figure>

<style>
	.pk {
		margin: 0;
		padding: 1.3rem 1.4rem 1rem;
		border-radius: 20px;
		background: linear-gradient(180deg, rgba(10, 26, 48, 0.85), rgba(6, 14, 28, 0.85));
		box-shadow: inset 0 0 0 1px rgba(148, 181, 208, 0.16);
	}
	figcaption {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	.pk-label {
		font-size: 0.8rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #94b5d0;
	}
	.pk-value {
		font-size: clamp(2rem, 4vw, 3.4rem);
		font-weight: 650;
		font-variant-numeric: tabular-nums;
		color: #eaf3fc;
	}
	.pk-value small {
		margin-left: 0.2em;
		font-size: 0.45em;
		font-weight: 400;
		color: #94b5d0;
	}
	svg {
		display: block;
		width: 100%;
		height: clamp(110px, 18vh, 170px);
		margin-top: 0.6rem;
		overflow: visible;
	}
	.pk-area {
		opacity: 0;
		animation: pk-fade 0.8s ease 0.7s forwards;
	}
	.pk-line {
		fill: none;
		stroke: var(--c);
		stroke-width: 2.5;
		vector-effect: non-scaling-stroke;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		filter: drop-shadow(0 0 6px var(--c));
		animation: pk-draw 1.1s cubic-bezier(0.6, 0, 0.2, 1) 0.1s forwards;
	}
	.pk-dot {
		fill: #fff;
		opacity: 0;
		animation: pk-fade 0.4s ease 1.1s forwards;
	}
	.pk-ping {
		fill: none;
		stroke: var(--c);
		stroke-width: 2;
		opacity: 0;
		transform-box: fill-box;
		transform-origin: center;
		animation: pk-ping 1.8s ease-out 1.9s infinite;
	}
	.pk-note {
		margin: 0.6rem 0 0;
		font-size: 0.82rem;
		color: #5a7891;
	}
	@keyframes pk-draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes pk-fade {
		to {
			opacity: 1;
		}
	}
	@keyframes pk-ping {
		0% {
			opacity: 0.9;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(4);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pk-line {
			stroke-dashoffset: 0;
			animation: none;
		}
		.pk-area,
		.pk-dot {
			opacity: 1;
			animation: none;
		}
		.pk-ping {
			animation: none;
		}
	}
</style>
