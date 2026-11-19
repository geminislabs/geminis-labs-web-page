<script>
	/**
	 * Público de sala de cine en siluetas (SVG generado). Cuatro filas con
	 * parallax: las filas cercanas a la pantalla reciben su luz; las cercanas
	 * al espectador son más grandes y más oscuras.
	 */
	import { onMount } from 'svelte';

	let { reduced = false } = $props();

	// Generador determinista para que el público no cambie entre recargas.
	function rng(seed) {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	const ROWS = [
		{ count: 26, h: 70, fill: '#0b1826', rim: '#7cc4ff', ra: 0.75, k: 0.25, b: 60, hh: 30 },
		{ count: 20, h: 92, fill: '#07111c', rim: '#6ab4f0', ra: 0.5, k: 0.5, b: 40, hh: 40 },
		{ count: 15, h: 122, fill: '#040a12', rim: '#5aa0d8', ra: 0.32, k: 0.85, b: 16, hh: 54 },
		{ count: 11, h: 165, fill: '#010306', rim: '#4a88b8', ra: 0.16, k: 1.3, b: -16, hh: 74 }
	].map((row, r) => {
		const rand = rng(97 + r * 31);
		const people = [];
		const step = 1000 / row.count;
		for (let i = 0; i < row.count + 1; i++) {
			// Algunos asientos vacíos para que no se vea como un patrón.
			if (rand() < 0.12) continue;
			const x = i * step + (rand() - 0.5) * step * 0.5 - step / 2 + (r % 2 ? step / 2 : 0);
			people.push({
				x,
				s: 0.82 + rand() * 0.32,
				dy: (rand() - 0.5) * 0.14,
				tilt: (rand() - 0.5) * 10,
				w: 0.85 + rand() * 0.35,
				hr: 15 + rand() * 4
			});
		}
		return { ...row, people };
	});

	/** Silueta de cabeza y hombros (origen: base al centro, altura 100). */
	function person(p) {
		const sw = 60 * p.w;
		const r = p.hr;
		const cy = 6 + r;
		return `M ${-sw} 100 C ${-sw} 74, ${-sw * 0.82} 62, ${-sw * 0.45} 58
			C -16 56, -10 54, -9 ${cy + r * 0.8} C ${-r} ${cy + r * 0.55}, ${-r} ${cy - r * 0.2}, ${-r * 0.92} ${cy - r * 0.45}
			C ${-r * 0.7} ${cy - r * 1.05}, ${r * 0.7} ${cy - r * 1.05}, ${r * 0.92} ${cy - r * 0.45}
			C ${r} ${cy - r * 0.2}, ${r} ${cy + r * 0.55}, 9 ${cy + r * 0.8} C 10 54, 16 56, ${sw * 0.45} 58
			C ${sw * 0.82} 62, ${sw} 74, ${sw} 100 Z`;
	}

	let host = $state(null);
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
			// Sin mouse, una deriva lenta mantiene vivo el parallax.
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

<div class="aud" bind:this={host} aria-hidden="true">
	{#each ROWS as row, r (r)}
		<svg
			class="aud-row"
			viewBox="0 0 1000 {row.h}"
			preserveAspectRatio="xMidYMax slice"
			style="bottom:{row.b}%; height:{row.hh}%; transform: translate3d({px * -18 * row.k}px, {py *
				-6 *
				row.k}px, 0) scale({1.02 + row.k * 0.04})"
		>
			<defs>
				<linearGradient id="aud-rim{r}" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stop-color={row.rim} stop-opacity={row.ra} />
					<stop offset="0.16" stop-color={row.rim} stop-opacity="0" />
				</linearGradient>
			</defs>
			<rect x="-20" y={row.h * 0.74} width="1040" height={row.h} fill={row.fill} />
			{#each row.people as p, i (i)}
				<path
					d={person(p)}
					fill={row.fill}
					stroke="url(#aud-rim{r})"
					stroke-width={1.6 / ((p.s * row.h) / 118)}
					transform="translate({p.x} {row.h * (0.2 + p.dy)}) rotate({p.tilt} 0 100) scale({(p.s *
						row.h) /
						118})"
				/>
			{/each}
		</svg>
	{/each}
</div>

<style>
	.aud {
		position: relative;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.aud-row {
		position: absolute;
		left: -3%;
		width: 106%;
		overflow: visible;
	}
</style>
