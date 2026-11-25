<script>
	/**
	 * Contexto geoespacial H3 en bucle automático: la malla de celdas, el
	 * acercamiento r6 → r10 y las ventajas; al terminar vuelve al inicio con un
	 * fundido. Celdas H3 reales (librería h3 4.5, precalculadas).
	 */
	import { onMount } from 'svelte';
	import ExperienceWorld from './ExperienceWorld.svelte';
	import { H3_LEVELS, H3_ADVANTAGES } from './nexusData.js';

	let host = $state(null);
	let near = $state(false);
	let beat = $state(0);
	let reduced = $state(false);
	let lite = $state(false);
	let fading = $state(false);

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		lite = window.innerWidth <= 768;
		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					near = true;
					io.disconnect();
				}
			},
			{ rootMargin: '500px' }
		);
		io.observe(host);
		// Bucle automático mientras la sección está en pantalla.
		const DUR = [7000, 11000, 9000];
		let onScreen = false;
		let timer = 0;
		const vis = new IntersectionObserver(([e]) => {
			onScreen = e.isIntersecting;
			clearTimeout(timer);
			if (onScreen && !reduced) schedule();
		});
		vis.observe(host);
		function schedule() {
			timer = setTimeout(() => {
				if (!onScreen) return;
				if (beat === 2) {
					// Regreso a la primera escena con un fundido.
					fading = true;
					setTimeout(() => {
						beat = 0;
						fading = false;
						schedule();
					}, 700);
					return;
				}
				beat += 1;
				schedule();
			}, DUR[beat]);
		}
		return () => {
			io.disconnect();
			vis.disconnect();
			clearTimeout(timer);
		};
	});
</script>

<section class="h3c" id="contexto-h3" bind:this={host} aria-labelledby="h3c-title">
	<div class="h3c-sticky">
		<div class="h3c-fade" class:on={fading} aria-hidden="true"></div>
		<div class="h3c-map" aria-hidden="true">
			{#if near}<ExperienceWorld sceneId="h3" {beat} contained {reduced} {lite} />{/if}
		</div>
		<div class="h3c-shade" aria-hidden="true"></div>

		<div class="h3c-inner">
			<p class="h3c-kicker">Indexación geoespacial H3</p>
			<h2 class="h3c-title" id="h3c-title">Tu ciudad, con contexto geoespacial.</h2>

			{#key beat}
				<div class="h3c-step">
					{#if beat === 0}
						<p class="h3c-body">
							Cada posición se convierte en una celda. 706 celdas H3 de 0.74 km² cubren este mapa y
							se encienden cuando una unidad pasa por ellas.
						</p>
					{:else if beat === 1}
						<p class="h3c-body">Una posición, cinco escalas.</p>
						<ol class="h3c-levels">
							{#each H3_LEVELS as l, i (l.r)}
								<li style="--i:{i}">
									<span class="h3c-r">r{l.r}</span>
									<strong>{l.d}</strong>
									<span>{l.area} · lado {l.edge}</span>
								</li>
							{/each}
						</ol>
						<p class="h3c-note">
							GeoContext calcula r10 y sus padres r9–r6 en cada evento · en validación
						</p>
					{:else}
						<ul class="h3c-adv">
							{#each H3_ADVANTAGES as a, i (a.t)}
								<li style="--i:{i}">
									<strong>{a.t}</strong>
									<span>{a.d}</span>
									<em class:ready={a.st === 'Listo'}>{a.st}</em>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/key}

			<div class="h3c-dots" aria-hidden="true">
				{#each [0, 1, 2] as i (i)}<span class:on={beat === i}></span>{/each}
			</div>
		</div>

		<p class="h3c-src">
			Celdas H3 reales (librería h3 4.5) · densidad de vías © OpenStreetMap contributors · estelas
			ilustrativas
		</p>
	</div>
</section>

<style>
	.h3c {
		display: block;
		contain: none;
		padding: 0; /* anula el estilo global de section */
		position: relative;
		height: 100vh;
		min-height: 600px;
		background: #030912;
		color: #eaf3fc;
		font-family: Outfit, system-ui, sans-serif;
	}
	.h3c-sticky {
		width: 100%;
		position: relative;
		height: 100%;
		overflow: hidden;
		display: flex;
		align-items: center;
	}
	.h3c-fade {
		position: absolute;
		inset: 0;
		z-index: 2;
		background: #030912;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.6s ease;
	}
	.h3c-fade.on {
		opacity: 1;
	}
	.h3c-map {
		position: absolute;
		inset: 0;
	}
	.h3c-shade {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(
			90deg,
			rgba(3, 9, 18, 0.94) 0%,
			rgba(3, 9, 18, 0.78) 32%,
			rgba(3, 9, 18, 0.05) 55%,
			transparent 70%
		);
	}
	.h3c-inner {
		position: relative;
		z-index: 1;
		width: min(1200px, 100% - 3rem);
		margin: 0 auto;
	}
	.h3c-inner > * {
		max-width: 500px;
	}
	.h3c-kicker {
		margin: 0 0 0.7rem;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #00ff88;
	}
	.h3c-title {
		margin: 0 0 1rem;
		font-size: clamp(2rem, 3.6vw, 3.1rem);
		line-height: 1.08;
		font-weight: 700;
		color: #eaf3fc;
	}
	.h3c-step {
		min-height: 330px;
		animation: h3c-in 0.5s ease both;
	}
	@keyframes h3c-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}
	.h3c-body {
		margin: 0 0 0.8rem;
		font-size: 1.1rem;
		color: #94b5d0;
	}
	.h3c-levels,
	.h3c-adv {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.h3c-levels li {
		display: grid;
		grid-template-columns: 3rem 6.2rem 1fr;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.45rem 0.8rem;
		border-radius: 12px;
		background: rgba(4, 16, 22, 0.85);
		box-shadow: inset 0 0 0 1px rgba(0, 255, 150, 0.12);
		opacity: 0.3;
		/* Al ritmo del acercamiento del mapa (1.7 s por nivel). */
		animation: h3c-lit 0.6s ease forwards;
		animation-delay: calc(var(--i) * 1.7s);
	}
	@keyframes h3c-lit {
		to {
			opacity: 1;
			box-shadow: inset 0 0 0 1px rgba(0, 255, 150, 0.6);
		}
	}
	.h3c-r {
		font-family: 'Audiowide', Outfit, sans-serif;
		color: #00ff88;
	}
	.h3c-levels span:last-child {
		font-size: 0.85rem;
		color: #94b5d0;
	}
	.h3c-note {
		margin: 0.7rem 0 0;
		font-size: 0.85rem;
		color: #ffbe5c;
	}
	.h3c-adv li {
		padding: 0.75rem 1rem;
		border-radius: 14px;
		background: rgba(4, 16, 22, 0.88);
		box-shadow: inset 0 0 0 1px rgba(110, 220, 255, 0.2);
		animation: h3c-in 0.5s ease both;
		animation-delay: calc(var(--i) * 0.1s);
	}
	.h3c-adv strong {
		display: block;
	}
	.h3c-adv span {
		display: block;
		margin: 0.2rem 0 0.35rem;
		font-size: 0.88rem;
		color: #94b5d0;
	}
	.h3c-adv em {
		font-style: normal;
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #ffbe5c;
	}
	.h3c-adv em.ready {
		color: #00ff88;
	}
	.h3c-dots {
		display: flex;
		gap: 0.4rem;
		margin-top: 1.2rem;
	}
	.h3c-dots span {
		width: 26px;
		height: 3px;
		border-radius: 2px;
		background: rgba(148, 181, 208, 0.25);
		transition: background 0.4s ease;
	}
	.h3c-dots span.on {
		background: #00ff88;
	}
	.h3c-src {
		position: absolute;
		right: 1.5rem;
		bottom: 1rem;
		z-index: 1;
		margin: 0;
		font-size: 0.72rem;
		color: #5a7891;
	}
	@media (max-width: 860px) {
		.h3c-shade {
			background: linear-gradient(
				180deg,
				rgba(3, 9, 18, 0.94) 0%,
				rgba(3, 9, 18, 0.75) 45%,
				transparent 70%
			);
		}
		.h3c-sticky {
			align-items: flex-start;
			padding-top: 5rem;
		}
		.h3c-step {
			min-height: 0;
		}
		.h3c-src {
			left: 1.5rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.h3c-step,
		.h3c-adv li {
			animation: none;
		}
		.h3c-levels li {
			animation: none;
			opacity: 1;
		}
	}
</style>
