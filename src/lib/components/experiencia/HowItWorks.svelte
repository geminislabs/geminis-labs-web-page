<script>
	/**
	 * «Cómo funciona»: el mapa de Nexus sobre calles reales de Querétaro, con la
	 * geocerca de celdas H3, y la cadena Vehículo → Evento → Contexto → Decisión
	 * que se enciende al ritmo de la animación.
	 */
	import { onMount } from 'svelte';
	import NexusSketch from './NexusSketch.svelte';
	import { CHAIN } from './nexusData.js';

	let host = $state(null);
	let near = $state(false);
	let phase = $state(0);
	let reduced = $state(false);

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
		return () => io.disconnect();
	});
</script>

<section class="hw" id="como-funciona" bind:this={host} aria-labelledby="hw-title">
	<div class="hw-map" aria-hidden="true">
		{#if near}<NexusSketch bind:phase {reduced} fullbleed marco={1400} />{/if}
	</div>
	<div class="hw-shade" aria-hidden="true"></div>

	<div class="hw-inner">
		<p class="hw-kicker">Cómo funciona</p>
		<h2 class="hw-title" id="hw-title">Del punto al contexto, en segundos.</h2>
		<p class="hw-sub">Un GPS dice dónde está la unidad. Nexus te dice qué pasó y qué hacer.</p>
		<ol class="hw-chain">
			{#each CHAIN as step, i (step.k)}
				<li class:active={phase === i} class:done={phase > i}>
					<span class="hw-n">0{i + 1}</span>
					<span class="hw-k">{step.k}</span>
					<span class="hw-v">{step.v}</span>
				</li>
			{/each}
		</ol>
	</div>
</section>

<style>
	.hw {
		contain: none;
		padding: 0; /* anula el estilo global de section */
		position: relative;
		height: 100vh;
		min-height: 560px;
		display: flex;
		align-items: center;
		overflow: hidden;
		background: #030912;
		color: #eaf3fc;
		font-family: Outfit, system-ui, sans-serif;
	}
	.hw-map {
		position: absolute;
		inset: 0;
	}
	.hw-shade {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			linear-gradient(
				90deg,
				rgba(3, 9, 18, 0.95) 0%,
				rgba(3, 9, 18, 0.82) 30%,
				rgba(3, 9, 18, 0.1) 54%,
				transparent 70%
			),
			linear-gradient(180deg, #030912 0%, transparent 12%, transparent 88%, #030912 100%);
	}
	.hw-inner {
		position: relative;
		z-index: 1;
		width: min(1200px, 100% - 3rem);
		margin: 0 auto;
		padding: 5rem 0;
	}
	.hw-inner > * {
		max-width: 470px;
	}
	.hw-kicker {
		margin: 0 0 0.7rem;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #00ff88;
	}
	.hw-title {
		margin: 0;
		font-size: clamp(2rem, 3.6vw, 3.1rem);
		line-height: 1.08;
		font-weight: 700;
		color: #eaf3fc;
	}
	.hw-sub {
		margin: 0.9rem 0 1.6rem;
		font-size: 1.1rem;
		color: #94b5d0;
	}
	.hw-chain {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.hw-chain li {
		display: grid;
		grid-template-columns: 2.4rem 1fr;
		grid-template-rows: auto auto;
		column-gap: 0.4rem;
		padding: 0.8rem 1rem;
		border-radius: 14px;
		background: rgba(6, 18, 30, 0.88);
		box-shadow: inset 0 0 0 1px rgba(110, 200, 255, 0.16);
		transition:
			box-shadow 0.5s ease,
			background 0.5s ease,
			opacity 0.5s ease;
		opacity: 0.6;
	}
	.hw-chain li.done {
		opacity: 0.85;
	}
	.hw-chain li.active {
		opacity: 1;
		background: rgba(0, 40, 26, 0.92);
		box-shadow:
			inset 0 0 0 1px rgba(0, 255, 136, 0.65),
			0 0 30px rgba(0, 255, 136, 0.18);
	}
	.hw-n {
		grid-row: 1 / 3;
		align-self: center;
		font-family: 'Audiowide', Outfit, sans-serif;
		color: #00ff88;
	}
	.hw-k {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #94b5d0;
	}
	.hw-v {
		font-size: 1.02rem;
	}
	@media (max-width: 860px) {
		.hw {
			flex-direction: column;
			align-items: stretch;
		}
		.hw-map {
			position: relative;
			order: 2;
			height: 52vh;
		}
		.hw-shade {
			display: none;
		}
		.hw-inner {
			padding: 3.5rem 0 1.5rem;
		}
	}
</style>
