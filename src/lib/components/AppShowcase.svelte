<script>
	/**
	 * «La app en tus manos»: capturas reales de la app de Nexus. Un teléfono grande
	 * muestra la pantalla activa, con la anterior y la siguiente detrás; avanza solo
	 * y se puede elegir cualquier pantalla de la lista.
	 */
	import { onMount } from 'svelte';

	const BASE = '/img/products/nexus/app';
	const GROUPS = [
		{
			name: 'Seguimiento',
			items: [
				{ img: 'rastreo', t: 'Rastreo en vivo', d: 'Sabe dónde está, en este momento.' },
				{ img: 'recorrido', t: 'Replay de recorrido', d: 'Reconstruye cualquier trayecto.' },
				{ img: 'geocercas', t: 'Geocercas hexagonales', d: 'Zonas hechas de celdas H3.' },
				{ img: 'telemetria', t: 'Telemetría completa', d: 'Combustible, distancia y tiempo.' }
			]
		},
		{
			name: 'Informes',
			items: [
				{ img: 'informe', t: 'Resumen del día', d: 'Tiempos, consumo y excepciones.' },
				{ img: 'bateria', t: 'Velocidad y batería', d: 'Voltaje del vehículo y del respaldo.' },
				{ img: 'consumo', t: 'Distancia y combustible', d: 'Movimiento contra ralentí, por día.' },
				{ img: 'senal', t: 'Señal y satélites', d: 'La salud del equipo, a la vista.' }
			]
		}
	];
	const ITEMS = GROUPS.flatMap((g) => g.items);
	const STEP = 4500;

	let active = $state(0);
	let paused = $state(false);
	let visible = $state(false);
	let host = $state(null);
	let tick = $state(0);

	const at = (k) => (active + k + ITEMS.length) % ITEMS.length;
	/** Lugar de cada teléfono en el montón: 0 al frente, ±1 detrás a los lados, el resto oculto. */
	function slot(i) {
		const d = (i - active + ITEMS.length) % ITEMS.length;
		if (d === 0) return 'front';
		if (d === 1) return 'right';
		if (d === ITEMS.length - 1) return 'left';
		return 'hidden';
	}

	function pick(i) {
		active = i;
		tick++;
	}

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
			threshold: 0.25
		});
		io.observe(host);
		const timer = setInterval(() => {
			if (!reduced && visible && !paused) pick(at(1));
		}, STEP);
		return () => {
			io.disconnect();
			clearInterval(timer);
		};
	});
</script>

<div
	class="as"
	bind:this={host}
	role="region"
	aria-label="Pantallas de la app"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
>
	<div class="as-list">
		{#each GROUPS as g, gi (g.name)}
			<p class="as-group">{g.name}</p>
			<ul>
				{#each g.items as it, ii (it.img)}
					{@const i = gi * GROUPS[0].items.length + ii}
					<li>
						<button class:on={active === i} onclick={() => pick(i)} aria-pressed={active === i}>
							<strong>{it.t}</strong>
							<span>{it.d}</span>
							{#if active === i && !paused}
								{#key tick}<i class="as-bar" style="--t:{STEP}ms"></i>{/key}
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/each}
	</div>

	<div class="as-stage" aria-live="polite">
		<div class="as-glow" aria-hidden="true"></div>
		<div class="as-deck">
			{#each ITEMS as it, i (it.img)}
				{@const sl = slot(i)}
				<figure
					class="as-phone as-{sl}"
					class:entering={sl === 'front'}
					aria-hidden={sl !== 'front'}
				>
					<img src="{BASE}/{it.img}.webp" alt={sl === 'front' ? `Nexus — ${it.t}` : ''} />
				</figure>
			{/each}
		</div>
		<p class="as-caption">
			<strong>{ITEMS[active].t}</strong>
			<span>{ITEMS[active].d}</span>
		</p>
	</div>
</div>

<style>
	.as {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		gap: 3rem;
		align-items: center;
		margin-top: 2.5rem;
	}
	.as-group {
		margin: 1.2rem 0 0.5rem;
		font-size: 0.74rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #0891b2;
	}
	.as-group:first-child {
		margin-top: 0;
	}
	.as-list ul {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.as-list button {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		width: 100%;
		height: 100%;
		padding: 0.8rem 0.9rem;
		overflow: hidden;
		border: 1px solid rgba(13, 27, 46, 0.08);
		border-radius: 14px;
		background: #fff;
		text-align: left;
		cursor: pointer;
		transition:
			border-color 0.3s ease,
			box-shadow 0.3s ease,
			transform 0.3s ease;
	}
	.as-list button:hover {
		border-color: rgba(8, 145, 178, 0.35);
		transform: translateY(-2px);
	}
	.as-list button.on {
		border-color: rgba(8, 145, 178, 0.6);
		box-shadow: 0 10px 30px rgba(8, 145, 178, 0.15);
	}
	.as-list strong {
		font-size: 0.95rem;
		color: #0d1b2e;
	}
	.as-list span {
		font-size: 0.8rem;
		line-height: 1.35;
		color: #4a6080;
	}
	.as-bar {
		position: absolute;
		left: 0;
		bottom: 0;
		height: 3px;
		width: 100%;
		background: linear-gradient(90deg, #0891b2, #3ec128);
		transform-origin: left;
		animation: as-bar var(--t) linear forwards;
	}
	@keyframes as-bar {
		from {
			transform: scaleX(0);
		}
	}
	.as-stage {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 640px;
		justify-content: center;
	}
	.as-glow {
		position: absolute;
		inset: 10% 15%;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(8, 145, 178, 0.28),
			rgba(62, 193, 40, 0.12) 50%,
			transparent 70%
		);
		filter: blur(30px);
	}
	.as-deck {
		position: relative;
		z-index: 2;
		width: min(290px, 70vw);
		aspect-ratio: 9 / 19.5;
	}
	.as-phone {
		position: absolute;
		inset: 0;
		margin: 0;
		overflow: hidden;
		border: 8px solid #0b1220;
		border-radius: 38px;
		background: #0b1220;
		box-shadow:
			0 30px 70px rgba(13, 27, 46, 0.35),
			inset 0 0 0 1px rgba(255, 255, 255, 0.06);
		transition:
			transform 0.85s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.6s ease,
			filter 0.6s ease;
	}
	.as-phone img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
	}
	.as-front {
		z-index: 3;
		transform: none;
	}
	.as-right {
		z-index: 2;
		opacity: 0.55;
		filter: saturate(0.8);
		transform: translate(62%, -3%) rotate(8deg) scale(0.76);
	}
	.as-left {
		z-index: 2;
		opacity: 0.55;
		filter: saturate(0.8);
		transform: translate(-62%, -3%) rotate(-8deg) scale(0.76);
	}
	.as-hidden {
		z-index: 1;
		opacity: 0;
		transform: translate(0, -2%) scale(0.7);
		pointer-events: none;
	}
	/* El teléfono que pasa al frente sale del montón por un lado y luego se acomoda. */
	.as-phone.entering {
		animation: as-pull 0.95s cubic-bezier(0.22, 1, 0.36, 1);
	}
	@keyframes as-pull {
		0% {
			transform: translate(62%, -3%) rotate(8deg) scale(0.76);
			opacity: 0.55;
		}
		45% {
			transform: translate(118%, -9%) rotate(16deg) scale(0.86);
			opacity: 1;
			z-index: 3;
		}
		100% {
			transform: none;
			opacity: 1;
		}
	}
	.as-caption {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 1.2rem 0 0;
		text-align: center;
	}
	.as-caption strong {
		font-size: 1.05rem;
		color: #0d1b2e;
	}
	.as-caption span {
		font-size: 0.88rem;
		color: #4a6080;
	}
	@media (max-width: 900px) {
		.as {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		.as-stage {
			order: -1;
			min-height: 0;
		}
		.as-left,
		.as-right {
			opacity: 0;
		}
	}
	@media (max-width: 520px) {
		.as-list ul {
			grid-template-columns: 1fr;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.as-phone,
		.as-list button {
			transition: none;
		}
		.as-phone.entering {
			animation: none;
		}
		.as-bar {
			display: none;
		}
	}
</style>
