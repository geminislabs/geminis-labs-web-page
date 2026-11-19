<script>
	/** Muro inclinado de capturas reales de la app móvil, desplazándose en columnas. */
	let { images = [] } = $props();

	const COLS = 7;
	let columns = $derived(
		Array.from({ length: COLS }, (_, c) => {
			const list = [];
			for (let k = 0; k < 6; k++) list.push(images[(c + k * 3) % images.length]);
			return list;
		})
	);
</script>

<div class="pw" aria-hidden="true">
	<div class="pw-plane">
		{#each columns as col, c (c)}
			<div class="pw-col" style="--c:{c}">
				<div class="pw-track">
					{#each [...col, ...col] as src, i (i)}
						<div class="pw-phone"><img {src} alt="" loading="eager" /></div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.pw {
		position: absolute;
		inset: 0;
		overflow: hidden;
		perspective: 1600px;
		z-index: 0;
	}
	.pw::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 60% 45% at 50% 55%, rgba(2, 8, 16, 0.5), rgba(2, 8, 16, 0.2) 70%),
			linear-gradient(
				180deg,
				rgba(2, 8, 16, 0.9),
				transparent 30%,
				transparent 70%,
				rgba(2, 8, 16, 0.95)
			);
	}
	.pw-plane {
		position: absolute;
		left: 50%;
		top: 50%;
		display: flex;
		gap: 26px;
		transform: translate(-50%, -50%) rotateX(38deg) rotateZ(-18deg) scale(1.25);
	}
	.pw-col {
		height: 170vh;
		overflow: hidden;
	}
	.pw-track {
		display: flex;
		flex-direction: column;
		gap: 26px;
		animation: pw-scroll calc(60s + var(--c) * 7s) linear infinite;
		animation-direction: var(--dir, normal);
	}
	.pw-col:nth-child(even) .pw-track {
		animation-direction: reverse;
	}
	@keyframes pw-scroll {
		to {
			transform: translateY(-50%);
		}
	}
	.pw-phone {
		width: 180px;
		padding: 7px;
		border-radius: 26px;
		background: #05080f;
		box-shadow:
			0 0 0 1.5px rgba(120, 200, 255, 0.35),
			0 0 40px rgba(40, 160, 255, 0.25);
	}
	.pw-phone img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 20px;
	}
	@media (prefers-reduced-motion: reduce) {
		.pw-track {
			animation: none;
		}
	}
</style>
