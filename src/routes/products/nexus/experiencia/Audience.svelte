<script>
	/**
	 * Público de sala de cine en siluetas (SVG generado): dos bloques de butacas
	 * con un pasillo al centro, respaldos visibles y personas con distintas
	 * complexiones y peinados. Las filas lejanas reciben la luz de la pantalla;
	 * las cercanas al espectador son más grandes y más oscuras. Parallax por fila.
	 */
	import { onMount } from 'svelte';

	let { reduced = false } = $props();

	function rng(seed) {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	// De la fila más lejana (0) a la más cercana (3).
	const ROWS = [
		{
			seats: 9,
			scale: 0.42,
			aisle: 46,
			fill: '#0c1b2a',
			seat: '#0a1520',
			rim: 0.85,
			k: 0.2,
			b: 62,
			hh: 26
		},
		{
			seats: 8,
			scale: 0.56,
			aisle: 62,
			fill: '#08131e',
			seat: '#071019',
			rim: 0.6,
			k: 0.45,
			b: 44,
			hh: 34
		},
		{
			seats: 6,
			scale: 0.78,
			aisle: 84,
			fill: '#040a11',
			seat: '#03070c',
			rim: 0.38,
			k: 0.85,
			b: 20,
			hh: 48
		},
		{
			seats: 4,
			scale: 1.12,
			aisle: 110,
			fill: '#010305',
			seat: '#010204',
			rim: 0.18,
			k: 1.35,
			b: -12,
			hh: 70
		}
	].map((row, r) => {
		const rand = rng(211 + r * 47);
		const H = 200;
		const unit = 100 * row.scale; // ancho de una butaca
		const people = [];
		const seatsAt = [];
		for (const side of [-1, 1]) {
			for (let i = 0; i < row.seats; i++) {
				const x = 500 + side * (row.aisle + unit * (i + 0.5));
				if (x < -80 || x > 1080) continue;
				seatsAt.push(x);
				if (rand() < 0.13) continue; // butaca vacía
				const hairRoll = rand();
				people.push({
					x: x + (rand() - 0.5) * unit * 0.18,
					s: row.scale * (0.9 + rand() * 0.22),
					lean: (rand() - 0.5) * 9,
					turn: (rand() - 0.5) * 7,
					broad: 0.88 + rand() * 0.3,
					hair:
						hairRoll < 0.22 ? 'long' : hairRoll < 0.32 ? 'bun' : hairRoll < 0.4 ? 'cap' : 'short'
				});
			}
		}
		return { ...row, H, unit, people, seatsAt };
	});

	/** Hombros y cuello (origen: centro de la base, unidades de 100). */
	function body(p) {
		const sw = 50 * p.broad;
		return `M ${-sw} 100 C ${-sw} 78, ${-sw * 0.9} 66, ${-sw * 0.55} 61 C -22 58, -13 56, -11 50
			L -10 42 L 10 42 L 11 50 C 13 56, 22 58, ${sw * 0.55} 61 C ${sw * 0.9} 66, ${sw} 78, ${sw} 100 Z`;
	}

	/** Cabeza ovalada con orejas, girada `turn` unidades. */
	function head(p) {
		const c = p.turn;
		return `M ${c - 14} 26 C ${c - 15} 10, ${c - 8} 2, ${c} 2 C ${c + 8} 2, ${c + 15} 10, ${c + 14} 26
			C ${c + 17} 27, ${c + 17} 34, ${c + 13} 35 C ${c + 11} 43, ${c + 6} 47, ${c} 47
			C ${c - 6} 47, ${c - 11} 43, ${c - 13} 35 C ${c - 17} 34, ${c - 17} 27, ${c - 14} 26 Z`;
	}

	function hair(p) {
		const c = p.turn;
		if (p.hair === 'long')
			return `M ${c - 16} 22 C ${c - 18} 6, ${c + 18} 6, ${c + 16} 22 C ${c + 19} 40, ${c + 22} 54, ${c + 18} 62
				L ${c - 18} 62 C ${c - 22} 54, ${c - 19} 40, ${c - 16} 22 Z`;
		if (p.hair === 'bun') return `M ${c - 6} 2 a 7 7 0 1 1 12 0 a 7 7 0 1 1 -12 0 Z`;
		if (p.hair === 'cap')
			return `M ${c - 16} 18 C ${c - 15} 2, ${c + 15} 2, ${c + 16} 18 L ${c + 26} 20 L ${c + 16} 23 L ${c - 16} 22 Z`;
		return '';
	}

	/** Respaldo de butaca (sobresale detrás de los hombros). */
	function seatBack(x, w) {
		const h = w * 0.62;
		return `M ${x - w * 0.42} 200 L ${x - w * 0.42} ${200 - h + 10} Q ${x - w * 0.42} ${200 - h} ${x - w * 0.32} ${200 - h}
			L ${x + w * 0.32} ${200 - h} Q ${x + w * 0.42} ${200 - h} ${x + w * 0.42} ${200 - h + 10} L ${x + w * 0.42} 200 Z`;
	}

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
	{#each ROWS as row, r (r)}
		<svg
			class="aud-row"
			viewBox="0 0 1000 {row.H}"
			preserveAspectRatio="xMidYMax slice"
			style="bottom:{row.b}%; height:{row.hh}%; transform: translate3d({px * -16 * row.k}px, {py *
				-5 *
				row.k}px, 0)"
		>
			<defs>
				<linearGradient id="aud-rim{r}" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stop-color="#8fd0ff" stop-opacity={row.rim} />
					<stop offset="0.14" stop-color="#8fd0ff" stop-opacity="0" />
				</linearGradient>
			</defs>
			{#each row.seatsAt as x, i (i)}
				<path
					d={seatBack(x, row.unit)}
					fill={row.seat}
					stroke="url(#aud-rim{r})"
					stroke-width="1"
				/>
			{/each}
			{#each row.people as p, i (i)}
				{@const k = (p.s * 200) / 118}
				<g
					transform="translate({p.x} {200 - 100 * k * 0.98}) rotate({p.lean} 0 100) scale({k})"
					fill={row.fill}
					stroke="url(#aud-rim{r})"
					stroke-width={1.4 / k}
				>
					<path d={body(p)} />
					{#if p.hair === 'long'}<path d={hair(p)} />{/if}
					<path d={head(p)} />
					{#if p.hair === 'bun' || p.hair === 'cap'}<path d={hair(p)} />{/if}
				</g>
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
