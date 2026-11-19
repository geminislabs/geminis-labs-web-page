<script>
	/**
	 * Fondo de hexágonos al estilo de la app de Nexus: resplandor teal/verde que
	 * deriva detrás de una malla oscura de hexágonos, visible arriba y abajo,
	 * con el centro negro.
	 */
	const R = 9;
	const W = Math.sqrt(3) * R;
	const H = 1.5 * R;
	const hex = Array.from({ length: 6 }, (_, k) => {
		const a = (Math.PI / 3) * k + Math.PI / 6;
		return `${(W / 2 + Math.cos(a) * R).toFixed(2)},${(R + Math.sin(a) * R).toFixed(2)}`;
	}).join(' ');
	const hex2 = Array.from({ length: 6 }, (_, k) => {
		const a = (Math.PI / 3) * k + Math.PI / 6;
		return `${(W + Math.cos(a) * R).toFixed(2)},${(R + H + Math.sin(a) * R).toFixed(2)}`;
	}).join(' ');
</script>

<div class="hx" aria-hidden="true">
	<div class="hx-glow">
		<span class="b1"></span>
		<span class="b2"></span>
		<span class="b3"></span>
		<span class="b4"></span>
	</div>
	<svg class="hx-grid" width="100%" height="100%">
		<defs>
			<pattern id="hx-pat" width={W} height={H * 2} patternUnits="userSpaceOnUse">
				<polygon points={hex} />
				<polygon points={hex2} />
				<polygon points={hex2} transform="translate({-W} 0)" />
			</pattern>
		</defs>
		<rect width="100%" height="100%" fill="url(#hx-pat)" />
	</svg>
</div>

<style>
	.hx {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
		background: #000;
		-webkit-mask-image: linear-gradient(
			180deg,
			#000 0%,
			rgba(0, 0, 0, 0.35) 22%,
			transparent 38%,
			transparent 62%,
			rgba(0, 0, 0, 0.35) 78%,
			#000 100%
		);
		mask-image: linear-gradient(
			180deg,
			#000 0%,
			rgba(0, 0, 0, 0.35) 22%,
			transparent 38%,
			transparent 62%,
			rgba(0, 0, 0, 0.35) 78%,
			#000 100%
		);
	}
	.hx-glow {
		position: absolute;
		inset: -10%;
		filter: blur(60px);
	}
	.hx-glow span {
		position: absolute;
		width: 55%;
		height: 45%;
		border-radius: 50%;
		opacity: 0.9;
		animation: hx-drift 18s ease-in-out infinite alternate;
	}
	.b1 {
		left: 0;
		top: 0;
		background: #1f6f7a;
	}
	.b2 {
		right: -5%;
		top: -5%;
		background: #2d6a3a;
		animation-delay: -6s !important;
	}
	.b3 {
		left: -5%;
		bottom: -5%;
		background: #20606e;
		animation-delay: -3s !important;
	}
	.b4 {
		right: 0;
		bottom: 0;
		background: #3f7a35;
		animation-delay: -9s !important;
	}
	@keyframes hx-drift {
		to {
			transform: translate(8%, 6%) scale(1.15);
		}
	}
	.hx-grid {
		position: absolute;
		inset: 0;
	}
	.hx-grid polygon {
		fill: none;
		stroke: rgba(0, 0, 0, 0.82);
		stroke-width: 1.5;
	}
	@media (prefers-reduced-motion: reduce) {
		.hx-glow span {
			animation: none;
		}
	}
</style>
