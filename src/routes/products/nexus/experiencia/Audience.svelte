<script>
	/**
	 * Público de la sala: fotografía con transparencia de ejecutivos de espaldas,
	 * en dos bloques (el izquierdo espejeado) con un pasillo al centro. Parallax
	 * suave y oscurecido hacia el espectador.
	 */
	import { onMount } from 'svelte';

	let { reduced = false, src = '' } = $props();

	let px = $state(0);
	let py = $state(0);

	onMount(() => {
		if (reduced) return;
		let raf = 0;
		let tx = 0;
		let ty = 0;
		let auto = 0;
		const onMove = (e) => {
			tx = (e.clientX / window.innerWidth - 0.5) * 2;
			ty = (e.clientY / window.innerHeight - 0.5) * 2;
			auto = performance.now() + 4000;
		};
		const tick = (t) => {
			raf = requestAnimationFrame(tick);
			const gx = t > auto ? Math.sin(t / 5200) * 0.6 : tx;
			const gy = t > auto ? Math.cos(t / 6100) * 0.3 : ty;
			px += (gx - px) * 0.04;
			py += (gy - py) * 0.04;
		};
		window.addEventListener('pointermove', onMove);
		raf = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('pointermove', onMove);
		};
	});
</script>

<div class="aud" aria-hidden="true">
	<div
		class="aud-block aud-left"
		style="transform: translate3d({px * -14}px, {py * -5}px, 0) scaleX(-1)"
	>
		<img {src} alt="" />
	</div>
	<div class="aud-block aud-right" style="transform: translate3d({px * -14}px, {py * -5}px, 0)">
		<img {src} alt="" />
	</div>
	<div class="aud-shade"></div>
</div>

<style>
	.aud {
		position: relative;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.aud-block {
		position: absolute;
		bottom: -14%;
		width: 54%;
	}
	.aud-left {
		left: -3%;
	}
	.aud-right {
		right: -3%;
	}
	.aud-block img {
		display: block;
		width: 100%;
		height: auto;
		filter: brightness(0.9) saturate(1.05);
	}
	/* Las filas cercanas al espectador se pierden en la oscuridad. */
	.aud-shade {
		position: absolute;
		inset: 0 -5% -40% -5%;
		background: linear-gradient(180deg, transparent 30%, rgba(1, 3, 6, 0.5) 55%, #010306 80%);
	}
</style>
