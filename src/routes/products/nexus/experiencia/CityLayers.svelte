<script>
	/**
	 * Querétaro por capas: cinco planos apilados en 3D, cada uno con las celdas
	 * H3 r8 reales del mapa. La capa de movilidad usa la red vial real (OSM);
	 * las demás son ilustrativas (visión, sin datos medidos).
	 */
	import { onMount } from 'svelte';
	import { loadH3, loadNetwork } from './roadNetwork.js';

	let { layers = [], reduced = false } = $props();

	let open = $state(false);
	let canvases = $state([]);

	// Valor ilustrativo determinista por celda (no son mediciones).
	function field(x, y, seed) {
		const a = Math.sin(x * 0.006 + seed) * Math.cos(y * 0.0075 - seed * 1.7);
		const b = Math.sin((x + y) * 0.004 + seed * 2.3);
		return Math.max(0, Math.min(1, 0.5 + 0.35 * a + 0.25 * b));
	}

	function valueFor(kind, c, k) {
		const [x, y] = c.c;
		switch (kind) {
			case 'movilidad':
				return c.w;
			case 'rf':
				return field(x, y, 1.3) * 0.9;
			case 'seguridad':
				return Math.pow(c.w, 1.4) * field(x, y, 4.1) * 1.6;
			case 'comportamiento':
				return field(x, y, 7.7) * (0.4 + 0.6 * c.w);
			default:
				return k % 37 === 0 || (c.w > 0.62 && field(x, y, 2.2) > 0.62)
					? 1
					: field(x, y, 9.9) * 0.25;
		}
	}

	function paint(canvas, layer, h3, net) {
		const S = 640;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = S * dpr;
		canvas.height = S * dpr;
		const ctx = canvas.getContext('2d');
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		// Encuadre: zona urbana central del mapa.
		const x0 = 330;
		const y0 = 300;
		const span = 1420;
		const k = S / span;
		const tx = (x) => (x - x0) * k;
		const ty = (y) => (y - y0) * k;
		ctx.clearRect(0, 0, S, S);
		const [r, g, b] = layer.rgb;
		h3.r8.forEach((c, i) => {
			const v = Math.max(0, Math.min(1, valueFor(layer.id, c, i)));
			ctx.beginPath();
			for (let j = 0; j < c.b.length; j += 2) {
				const px = tx(c.b[j]);
				const py = ty(c.b[j + 1]);
				if (j) ctx.lineTo(px, py);
				else ctx.moveTo(px, py);
			}
			ctx.closePath();
			ctx.fillStyle = `rgba(${r},${g},${b},${0.04 + 0.62 * v})`;
			ctx.fill();
			ctx.strokeStyle = `rgba(${r},${g},${b},0.22)`;
			ctx.lineWidth = 0.6;
			ctx.stroke();
		});
		if (layer.id === 'movilidad' && net) {
			ctx.save();
			ctx.translate(-x0 * k, -y0 * k);
			ctx.scale(k, k);
			ctx.lineCap = 'round';
			for (let c = 4; c >= 0; c--) {
				ctx.strokeStyle = c <= 1 ? 'rgba(200,245,255,0.95)' : 'rgba(140,215,255,0.5)';
				ctx.lineWidth = (c <= 1 ? 2.4 : 1) / k;
				ctx.stroke(net.paths[c]);
			}
			ctx.restore();
		}
	}

	onMount(() => {
		let alive = true;
		Promise.all([loadH3(), loadNetwork().catch(() => null)])
			.then(([h3, net]) => {
				if (!alive) return;
				layers.forEach((layer, i) => canvases[i] && paint(canvases[i], layer, h3, net));
				if (reduced) open = true;
				else setTimeout(() => (open = true), 250);
			})
			.catch(() => (open = true));
		return () => {
			alive = false;
		};
	});
</script>

<div class="cl" class:open aria-hidden="true">
	<div class="cl-stack">
		{#each layers as layer, i (layer.id)}
			<div class="cl-layer" style="--i:{i}; --rgb:{layer.rgb.join(',')}">
				<canvas bind:this={canvases[i]}></canvas>
				<span class="cl-tag">{layer.n}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.cl {
		position: relative;
		width: 100%;
		height: 100%;
		perspective: 1800px;
		perspective-origin: 50% 20%;
	}
	.cl-stack {
		position: absolute;
		left: 50%;
		top: 58%;
		width: min(36vw, 62vh, 560px);
		aspect-ratio: 1;
		translate: -50% -50%;
		transform-style: preserve-3d;
		transform: rotateX(60deg) rotateZ(-38deg);
	}
	.cl-layer {
		position: absolute;
		inset: 0;
		border-radius: 18px;
		background: rgba(4, 8, 20, 0.55);
		box-shadow:
			inset 0 0 0 1px rgba(var(--rgb), 0.55),
			0 0 60px rgba(var(--rgb), 0.18);
		transform: translateZ(calc(var(--i) * 6px));
		transition: transform 1.6s cubic-bezier(0.2, 0.8, 0.2, 1);
		transition-delay: calc(var(--i) * 0.12s);
		overflow: hidden;
	}
	.open .cl-layer {
		transform: translateZ(calc(var(--i) * min(11vh, 92px)));
	}
	/* Barrido de luz por capa. */
	.cl-layer::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			115deg,
			transparent 40%,
			rgba(var(--rgb), 0.28) 50%,
			transparent 60%
		);
		background-size: 260% 260%;
		animation: cl-scan 6s ease-in-out infinite;
		animation-delay: calc(var(--i) * -1.1s);
	}
	@keyframes cl-scan {
		0% {
			background-position: 120% 120%;
		}
		60%,
		100% {
			background-position: -40% -40%;
		}
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	.cl-tag {
		position: absolute;
		left: 10px;
		top: 8px;
		font:
			700 13px Outfit,
			system-ui,
			sans-serif;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgb(var(--rgb));
		text-shadow: 0 0 10px rgba(var(--rgb), 0.8);
	}
	@media (prefers-reduced-motion: reduce) {
		.cl-layer {
			transition: none;
		}
		.cl-layer::after {
			animation: none;
		}
	}
</style>
